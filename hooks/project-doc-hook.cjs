#!/usr/bin/env node
/**
 * SessionStart + UserPromptSubmit hook: load the current project's PROJECT.md
 * automatically, so per-project operational rules (how to deploy, what gates a
 * deploy, what to verify, which env vars must exist) are in context before any
 * work starts, instead of depending on someone remembering to go and read them.
 *
 * WHY A HOOK AND NOT A LINE IN CLAUDE.md. A rule in the instructions file only
 * works if it is followed, and two things stop that: a note ages out of the
 * context window, and a skill only fires when the model judges it relevant. A rule
 * that gates a deploy cannot be on the honour system, because the failure is
 * silent and lands in production. The hook removes the judgement call: the file is
 * simply present.
 *
 * Registered on BOTH events on purpose:
 *   - SessionStart covers the normal case, opening a session inside a project.
 *   - UserPromptSubmit covers `cd` into another project mid-session, which
 *     SessionStart cannot see because it fires once, before any directory change.
 * Deduplicated per (session, project) with a temp state file, so each project's
 * file loads once per session rather than on every prompt.
 *
 * Output goes to stdout, which Claude Code injects as additional context.
 * Never throws and never blocks: a broken hook must not be able to stop work.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const TIMEOUT_MS = 3000;
/* Generous on purpose. Truncating a deploy rule to save tokens defeats the hook,
   and an absent rule reads exactly like a rule that was never written. The cost is
   paid once per session, not per prompt. If a file nears this size it is carrying
   narrative: trim the file rather than raising the cap. */
const MAX_CHARS = 40000;
/* How far up to look for PROJECT.md. Deep enough for a monorepo package, shallow
   enough not to wander into the home directory. */
const MAX_DEPTH = 6;

const STATE_DIR = path.join(os.tmpdir(), "claude-project-doc");

/** Walk up from `start` looking for PROJECT.md. Returns {file, root} or null. */
function findProjectDoc(start) {
  let dir = start;
  for (let i = 0; i < MAX_DEPTH; i++) {
    const candidate = path.join(dir, "PROJECT.md");
    if (fs.existsSync(candidate)) return { file: candidate, root: dir };
    /* Stop at the repo boundary. Walking past a .git root would start pulling in
       a sibling project's rules, which is worse than finding nothing. */
    if (fs.existsSync(path.join(dir, ".git"))) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/** Nearest ancestor containing .git, or null. Used only for the missing-file nudge. */
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < MAX_DEPTH; i++) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/** True the first time this (session, key) pair is seen. */
function claimOnce(sessionId, key) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const safe = Buffer.from(`${sessionId}::${key}`).toString("base64url").slice(0, 120);
    const marker = path.join(STATE_DIR, `${safe}.seen`);
    if (fs.existsSync(marker)) return false;
    fs.writeFileSync(marker, "");
    return true;
  } catch {
    /* If state cannot be written, prefer injecting again over going silent: a
       duplicate is noise, a miss is the bug this hook exists to prevent. */
    return true;
  }
}

function main(rawInput) {
  let payload = {};
  try { payload = JSON.parse(rawInput); } catch { /* SessionStart may send nothing */ }

  const cwd = payload.cwd || process.cwd();
  if (!cwd || !fs.existsSync(cwd)) return;

  const sessionId = payload.session_id || payload.sessionId || "nosession";
  const found = findProjectDoc(cwd);

  if (!found) {
    /* No PROJECT.md. Only worth saying inside an actual repo: a scratch folder is
       not a project and should stay quiet. */
    const repo = findRepoRoot(cwd);
    if (!repo) return;
    if (!claimOnce(sessionId, `missing:${repo}`)) return;
    process.stdout.write(
      `PROJECT.md: none found in ${path.basename(repo)}. Every project carries one. ` +
      `Create it from what the repo actually does (its real deploy scripts and env vars, ` +
      `starting from templates/PROJECT.md), before relying on any assumed deploy rule.\n`
    );
    return;
  }

  if (!claimOnce(sessionId, `doc:${found.file}`)) return;

  let body = "";
  try { body = fs.readFileSync(found.file, "utf8"); } catch { return; }
  if (!body.trim()) return;

  /* Name the sections that were dropped, not just the fact of dropping. "Truncated"
     alone is unactionable: the reader cannot tell a lost footnote from a lost
     "Hard rules" section, and those are not the same event. */
  let truncated = false;
  let lostSections = [];
  if (body.length > MAX_CHARS) {
    const dropped = body.slice(MAX_CHARS);
    lostSections = (dropped.match(/^##+ .+$/gm) || []).map((h) => h.replace(/^#+\s*/, ""));
    body = body.slice(0, MAX_CHARS);
    truncated = true;
  }

  const out = [
    `PROJECT.md for ${path.basename(found.root)} (loaded automatically, these rules apply to this project):`,
    "",
    body.trimEnd(),
  ];
  if (truncated) {
    const named = lostSections.length
      ? ` These sections did NOT load and you have not seen them: ${lostSections.join(", ")}.`
      : "";
    out.push(
      "",
      `[TRUNCATED at ${MAX_CHARS} chars, so part of this file was not injected.${named} ` +
      `Read ${found.file} in full before relying on any rule.]`
    );
  }
  process.stdout.write(out.join("\n") + "\n");
}

/* Hard stop, so a slow disk can never hold up a prompt. unref() lets the process
   exit normally the moment the work is done. */
const globalTimeout = setTimeout(() => process.exit(0), TIMEOUT_MS);
globalTimeout.unref();

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try { main(raw); } catch { /* never block a turn */ }
  process.exit(0);
});
process.stdin.on("error", () => { try { main(""); } catch { /* ignore */ } process.exit(0); });
