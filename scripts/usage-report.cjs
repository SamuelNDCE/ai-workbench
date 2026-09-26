#!/usr/bin/env node
/**
 * Count how you actually use Claude Code, from your own session transcripts.
 *
 * Reports, for transcripts touched in the last N days:
 *   - how many times each skill was invoked by name (the ranking in the README comes from this)
 *   - how many sub-agent dispatches there were, and how many NAMED a model versus left it out
 *     (a dispatch that omits the model inherits the main session's, which is the expensive
 *      way to lose money quietly)
 *   - how many Workflow runs there were
 *
 * Usage:   node scripts/usage-report.cjs [--days 45] [--json] [--since 2026-09-07]
 * Options: --days N       window in days, by transcript file modification time (default 45)
 *          --since DATE   also split sub-agent dispatches into before and after this date
 *          --json         machine-readable output
 *          --claude-home  override the config folder (default: $CLAUDE_HOME or ~/.claude)
 *
 * Method and limits, so nobody reads more into it than is there:
 *   - A transcript is included if its FILE was modified inside the window. A long-lived session
 *     that started earlier is counted in full, so the window is approximate.
 *   - Only invocations through the Skill tool are counted. A skill that fires from a hook or a
 *     slash command can be undercounted.
 *   - Sub-agents launched INSIDE a Workflow script choose their model in that script, so they are
 *     not in the dispatch numbers.
 *
 * Read-only. No dependencies. Exits when done.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const DAYS = Number(val("--days") || 45);
const SINCE = val("--since") ? Date.parse(val("--since")) : null;
const HOME = val("--claude-home") || process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const root = path.join(HOME, "projects");
const cutoff = Date.now() - DAYS * 86400000;

const skills = new Map();
const agentAll = new Map(), agentBefore = new Map(), agentAfter = new Map();
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
let files = 0, agents = 0, workflows = 0;

let projects = [];
try { projects = fs.readdirSync(root); } catch {
  console.error(`No transcripts found at ${root}. Set --claude-home if your config lives elsewhere.`);
  process.exit(1);
}

for (const proj of projects) {
  const dir = path.join(root, proj);
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch { continue; }
  for (const f of entries) {
    if (!f.endsWith(".jsonl")) continue;
    const fp = path.join(dir, f);
    let st;
    try { st = fs.statSync(fp); } catch { continue; }
    if (st.mtimeMs < cutoff) continue;
    files++;
    let data;
    try { data = fs.readFileSync(fp, "utf8"); } catch { continue; }
    for (const line of data.split("\n")) {
      if (!line.includes('"tool_use"')) continue; // cheap prefilter before parsing
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      const content = o && o.message && o.message.content;
      if (!Array.isArray(content)) continue;
      for (const b of content) {
        if (b.type !== "tool_use") continue;
        if (b.name === "Skill" && b.input && b.input.skill) {
          bump(skills, b.input.skill);
        } else if (b.name === "Agent" || b.name === "Task") {
          agents++;
          const model = (b.input && b.input.model) || "(omitted)";
          bump(agentAll, model);
          if (SINCE) bump(Date.parse(o.timestamp || 0) >= SINCE ? agentAfter : agentBefore, model);
        } else if (b.name === "Workflow") {
          workflows++;
        }
      }
    }
  }
}

const ranked = [...skills.entries()].sort((a, b) => b[1] - a[1]);
const obj = (m) => Object.fromEntries(m);
const report = {
  days: DAYS, transcriptFiles: files, subAgentDispatches: agents, workflowRuns: workflows,
  dispatchesByModel: obj(agentAll),
  ...(SINCE ? { beforeSince: obj(agentBefore), sinceDate: obj(agentAfter) } : {}),
  skills: ranked,
};

if (flag("--json")) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const pct = (m, k) => {
  const t = [...m.values()].reduce((a, b) => a + b, 0);
  return t ? `${m.get(k) || 0} of ${t} (${Math.round(((m.get(k) || 0) / t) * 100)}%)` : "n/a";
};
console.log(`\nUsage over the last ${DAYS} days (${files} transcript files, by file modification time)\n`);
console.log(`Sub-agent dispatches   ${agents}`);
console.log(`Workflow runs          ${workflows}`);
if (agents) {
  console.log(`Left the model out     ${pct(agentAll, "(omitted)")}  <- these inherited the main session's model`);
  console.log(`By model               ${[...agentAll.entries()].map(([k, v]) => `${k}: ${v}`).join(", ")}`);
}
if (SINCE) {
  console.log(`\nSplit at ${val("--since")}`);
  console.log(`  before               omitted ${pct(agentBefore, "(omitted)")}`);
  console.log(`  since                omitted ${pct(agentAfter, "(omitted)")}`);
}
console.log("\nSkills, most used first");
for (const [name, count] of ranked.slice(0, 40)) console.log(`  ${String(count).padStart(4)}  ${name}`);
if (ranked.length > 40) console.log(`  ... and ${ranked.length - 40} more (use --json for all)`);
console.log("");
process.exit(0);
