#!/usr/bin/env node
/**
 * Measure what your agent setup loads into EVERY session, before you type anything.
 *
 * That fixed cost is paid on every session and every sub-agent that inherits it, so it is the first
 * place to look when trimming tokens. This script reports:
 *   - the size of your global instructions file (CLAUDE.md)
 *   - how many skills you have, how big their descriptions are (listed every session) and how big
 *     their bodies are (loaded only when a skill is invoked)
 *   - how many plugins are enabled and how many are switched off
 *
 * Usage:   node scripts/measure-context.cjs
 * Options: --json          machine-readable output
 *          --claude-home   override the config folder (default: $CLAUDE_HOME or ~/.claude)
 *
 * Token figures are chars / 4. That is a rough rule of thumb for English text, not a tokenizer, so
 * treat them as an order of magnitude. Read-only. No dependencies. Exits when done.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const HOME = val("--claude-home") || process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const tok = (chars) => Math.round(chars / 4);

function readSafe(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return null; }
}

/** Split a SKILL.md into its frontmatter description and its body. */
function parseSkill(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { desc: "", body: text.length };
  const d = m[1].match(/^description:\s*(?:>-?|\|-?)?\s*([\s\S]*?)(?=\n[a-zA-Z_-]+:|\s*$)/m);
  return { desc: d ? d[1].replace(/\s+/g, " ").trim() : "", body: text.length - m[0].length };
}

const result = { claudeHome: HOME };

// 1. Global instructions file.
const instr = readSafe(path.join(HOME, "CLAUDE.md"));
if (instr !== null) {
  result.instructions = { file: "CLAUDE.md", chars: instr.length, lines: instr.split("\n").length, approxTokens: tok(instr.length) };
}

// 2. Skills in the user skills folder.
const skillsDir = path.join(HOME, "skills");
const skills = [];
try {
  for (const e of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!e.isDirectory() && !e.isSymbolicLink()) continue;
    const text = readSafe(path.join(skillsDir, e.name, "SKILL.md"));
    if (text === null) continue;
    const p = parseSkill(text);
    skills.push({ name: e.name, descChars: p.desc.length, bodyChars: p.body });
  }
} catch { /* no skills folder */ }

if (skills.length) {
  const descTotal = skills.reduce((a, s) => a + s.descChars, 0);
  const bodyTotal = skills.reduce((a, s) => a + s.bodyChars, 0);
  const byDesc = [...skills].sort((a, b) => b.descChars - a.descChars).slice(0, 3);
  const byBody = [...skills].sort((a, b) => b.bodyChars - a.bodyChars).slice(0, 3);
  result.skills = {
    count: skills.length,
    listedEverySession: { chars: descTotal, approxTokens: tok(descTotal), avgDescChars: Math.round(descTotal / skills.length) },
    loadedOnlyWhenUsed: { chars: bodyTotal, approxTokens: tok(bodyTotal) },
    longestDescriptions: byDesc.map((s) => [s.name, s.descChars]),
    largestBodies: byBody.map((s) => [s.name, s.bodyChars]),
  };
}

// 3. Plugins.
const settings = readSafe(path.join(HOME, "settings.json"));
if (settings !== null) {
  try {
    const ep = JSON.parse(settings).enabledPlugins || {};
    const vals = Object.values(ep);
    result.plugins = { enabled: vals.filter(Boolean).length, off: vals.filter((v) => !v).length };
  } catch { /* unreadable settings */ }
}

if (flag("--json")) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const n = (x) => x.toLocaleString("en-GB");
console.log(`\nContext loaded before your first message (config folder: ${HOME})\n`);
if (result.instructions) {
  const i = result.instructions;
  console.log(`Global instructions   ${n(i.chars)} chars, ${n(i.lines)} lines, about ${n(i.approxTokens)} tokens, every session`);
} else {
  console.log("Global instructions   none found");
}
if (result.skills) {
  const s = result.skills;
  console.log(`Skills                ${s.count} skills`);
  console.log(`  descriptions        ${n(s.listedEverySession.chars)} chars, about ${n(s.listedEverySession.approxTokens)} tokens, listed every session (average ${s.listedEverySession.avgDescChars} chars each)`);
  console.log(`  bodies              ${n(s.loadedOnlyWhenUsed.chars)} chars, about ${n(s.loadedOnlyWhenUsed.approxTokens)} tokens, loaded ONLY when a skill is invoked`);
  console.log(`  longest descriptions ${s.longestDescriptions.map(([a, b]) => `${a} (${b})`).join(", ")}`);
} else {
  console.log("Skills                none found");
}
if (result.plugins) {
  console.log(`Plugins               ${result.plugins.enabled} enabled, ${result.plugins.off} switched off`);
}
console.log("\nTokens are chars / 4: a rough rule of thumb, not a tokenizer.");
console.log("Skills that come from plugins are not counted here; each enabled plugin adds its own to the listing.\n");
process.exit(0);
