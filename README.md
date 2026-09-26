# AI Workbench

The skills, rules and habits I actually use to build with AI coding agents, ranked by how much I use them. Works with **Claude Code, Codex and Hermes**, and with any other agent that reads `SKILL.md` folders and an `AGENTS.md` file.

Every skill is a plain markdown folder: a `SKILL.md` with a `name` and `description`, plus any supporting files. No build step, no dependencies.

## Install (2 minutes)

You need `git` and either Git Bash (macOS, Linux, Windows) or PowerShell (Windows).

**1. Get it.**

```bash
git clone https://github.com/SamuelNDCE/ai-workbench.git
```

**2. Install the skills into your agent.** Pick your agent: `claude`, `codex`, `hermes`, or `all`.

macOS, Linux, Git Bash:

```bash
./ai-workbench/scripts/install.sh claude
```

Windows PowerShell:

```powershell
.\ai-workbench\scripts\install.ps1 -Agent claude
```

That installs every skill. To install only some, list them after the agent name:

```bash
./ai-workbench/scripts/install.sh codex session-handoff verify-dont-trust
```

```powershell
.\ai-workbench\scripts\install.ps1 -Agent codex -Skills session-handoff,verify-dont-trust
```

**3. Restart your agent** (or start a new session). Skill lists load at session start.

**4. Check it worked.** Ask the agent "what skills do you have?" or run `./ai-workbench/scripts/install.sh --list` to see the names available.

To install into one project instead of your whole machine, add `--dest <project>/.claude/skills` (bash) or `-Dest <project>\.claude\skills` (PowerShell).

### Where each agent keeps things

| | Claude Code | Codex | Hermes |
|:---|:---|:---|:---|
| **Skills folder** | `~/.claude/skills/<name>/SKILL.md` | `~/.codex/skills/<name>/SKILL.md` | `~/.hermes/skills/` (also scans folders you list under `skills.external_dirs` in its config) |
| **Standing instructions file** | `CLAUDE.md` | `AGENTS.md` | `AGENTS.md` (also detects `CLAUDE.md`) |
| **Skill format** | `SKILL.md` with `name` and `description` frontmatter | same | same (follows the agentskills.io open standard) |
| **MCP servers** | supported | configured in `~/.codex/config.toml` | not checked |
| **Hooks** | supported (the hooks below are Claude Code hooks) | not checked | not checked |
| **Install with** | `install.sh claude` | `install.sh codex` | `install.sh hermes` |

How this was checked, 2026-09-26: the Codex row from a local Codex install (a `skills/` folder of `SKILL.md` folders, `AGENTS.md`, and `mcp_servers` in `config.toml`), the Hermes row from its official docs for skills and context files. "Not checked" means I have not verified it, not that it is missing.

If your Hermes lives somewhere else, set `HERMES_HOME` before installing. The same goes for `CLAUDE_HOME` and `CODEX_HOME`.

### One instructions file for every agent

Write your rules once in `AGENTS.md`, then make Claude Code read it too. Create a `CLAUDE.md` containing one line:

```
@AGENTS.md
```

Now Codex and Hermes read `AGENTS.md` directly, and Claude Code pulls it in through `CLAUDE.md`. One file to maintain.

### What will and will not carry over

The skills are instructions in markdown, so they work in any agent that can read a file and follow it. Two name tools that only exist in Claude Code: `repo-hygiene` (a GitHub MCP tool name) and `windows-process-restart` (a task-stop tool). In another agent those steps become "do the equivalent with whatever you have". A few others mention `CLAUDE.md` or `~/.claude/skills/` in passing (`capability-claim-grounding`, `dictation-garble-catcher`, `superbraindump`): read those as `AGENTS.md` and your agent's skills folder.

## The skills, most used to least used

Counts are how many times each skill was invoked by name in my Claude Code session transcripts touched in the last 45 days (to 2026-09-26). Skills that fire from a hook or a slash command can be undercounted, and Codex and Hermes usage is not in these numbers. "Here" means the skill is in this repo's `skills/` folder.

| # | Skill | Uses | What it does | Where |
|--:|:---|--:|:---|:---|
| 1 | `session-handoff` | 91 | Writes a self-contained file so a cold session can resume tomorrow, or another session can take over now. Also resumes from one. | **Here** |
| 2 | `superbraindump` | 56 | For a big, tangled, multi-part ramble: turns it into a rigorous prompt, confirms it, runs it. One of the skills I reach for when I cannot be bothered to write a prompt. | **Here** |
| 3 | `brainstorming` | 39 | Explores what you actually want before any building starts. | [Superpowers](https://github.com/obra/superpowers) |
| 4 | `dictation-garble-catcher` | 36 | Catches a voice-dictation mishear that sounds like a real project term and confirms it instead of running with the wrong word. | **Here** |
| 5 | `braindump` | 31 | The lighter version of #2: messy ramble in, clean prompt out, quick confirm, run. | **Here** |
| 6 | `design-review-loop` | 24 | Do a big batch of UI changes alone, check them yourself, then hand back one numbered walkthrough of what to look at. | **Here** |
| 7 | `systematic-debugging` | 21 | A structured approach before proposing any fix. | [Superpowers](https://github.com/obra/superpowers) |
| 8 | `pre-push-secret-scan` | 20 | A fast key, token and webhook scan before every `git push`. | **Here** |
| 9 | `karpathy-guidelines` | 19 | Guardrails against over-engineering and unrequested scope. | [Library](https://github.com/SamuelNDCE/claude-super-skill-library/blob/main/skills/misc-utilities/karpathy-guidelines/SKILL.md) |
| 10 | `claude-api` | 16 | Current reference for the Anthropic API and SDKs. | Built into Claude Code |
| 11 | `writing-plans` | 14 | Turns a spec into a step-by-step plan before touching code. | [Superpowers](https://github.com/obra/superpowers) |
| 12 | `capability-claim-grounding` | 13 | Proves every claim in public copy (a feature, a price, a comparison) against the real build before it is written. | **Here** |
| 13 | `artifact-design` | 13 | Design fundamentals for a published HTML page. | Built into Claude Code |
| 14 | `security-review` | 10 | Security review of the pending changes on a branch. | Built into Claude Code |
| 15 | `supabase-postgres-best-practices` | 9 | Postgres schema, RLS, index and query rules. | Supabase's own skill |
| 16 | `supabase` | 8 | Anything touching Supabase: auth, RLS, edge functions, migrations. | Supabase's own skill |
| 17 | `run` | 7 | Launch and drive the app to see a change actually working. | Built into Claude Code |
| 18 | `update-config` | 6 | Change agent settings, hooks and permissions safely. | Built into Claude Code |
| 19 | `subagent-driven-development` | 6 | Execute independent plan tasks with sub-agents in one session. | [Superpowers](https://github.com/obra/superpowers) |
| 20 | `braindump-auto` | 5 | Same as `braindump` but skips the confirmation step. | **Here** |
| 21 | `verify-dont-trust` | 4 | Never accept a self-report as proof: re-check by a different route before marking anything done. | **Here** |
| 22 | `ui-change-visual-verify` | 4 | Screenshot every section you changed. Catches global selectors silently restyling a new component. | **Here** |
| 23 | `project-design-doc` | 4 | A persistent per-project design spec that is followed automatically. | **Here** |
| 24 | `repo-hygiene` | 4 | Cleans proven-junk files and makes every new repo private by default. | **Here** |
| 25 | `safe-section-deletion` | 3 | Search the whole codebase for references before deleting a section or symbol. | **Here** |
| 26 | `zombie-process-sweep` | 1 | Finds and kills orphaned dev servers and watchers at the end of a session. | **Here** |
| 27 | `windows-shell-tool-selection` | 1 | When to use Bash versus PowerShell on Windows, and the syntax traps between them. | **Here** |
| 28 | `derived-figure-audit` | 0 | Re-derives every computed figure in a document from its source so the numbers agree. | **Here** |
| 28 | `full-account-security-audit` | 0 | Periodic full audit: every repo, full history, `.env` files, secret-scanning alerts. | **Here** |
| 28 | `public-repo-leak-retraction` | 0 | Cleanup when a secret already got out: scrub, rewrite history, force-push, verify. | **Here** |
| 28 | `large-task-session-split` | 0 | Split a big task into independent pieces, one fresh session each. | **Here** |
| 28 | `worktree-task-pack-verification` | 0 | One git worktree and one independent verifier per piece, full gate before any merge. | **Here** |
| 28 | `windows-process-restart` | 0 | Safely restart a supervised Windows background process with real verification. | **Here** |
| 28 | `skill-overlap-audit` | 0 | Finds near-duplicate skills in a library. | **Here** |
| 28 | `repo-index-drift-check` | 0 | Checks a hub repo's claimed counts against what the linked repos contain now. | **Here** |
| 28 | `personal-dashboard-style` | 0 | A fixed dark HTML report style instead of a new look each time. | **Here** |
| 28 | `discord-todo-ops` | 0 | Wraps a Discord reaction-based shared todo list into one skill. | **Here** |

Rows marked 0 were not invoked in this window. Some are insurance skills you want to exist and never call often (leak retraction, full audits), and some I have simply outgrown. They stay because they still work.

**Used a lot, not published here:** a private set of skills for my own note-keeping setup, plus a few project-specific deploy skills. They are tied to my own machine, so they are not in this repo.

### Install a whole theme at once

The older bundle installer still works. Each bundle installs skills that belong together:

```bash
./ai-workbench/scripts/install-group.sh "everyday workflow"
```

Run it with no arguments to print every bundle name. It installs into `./.claude/skills` unless you pass a destination as the second argument.

## How I use Claude Code now

What I actually do, as of 2026-09-26. None of it depends on Claude Code specifically, but the hooks do.

**Standing rules live in a short global `CLAUDE.md`, and each project has its own `PROJECT.md`.** The global file holds rules earned from specific failures, each short enough to get followed. The per-project file holds what changes what you are allowed to do right now: how to deploy and what must be true first, which environment variables must exist, what to verify before claiming something works. A hook injects the project's file into every session, so it applies whether or not anyone remembered to open it. Every new project gets its `PROJECT.md` (and a `DESIGN.md` if it has a UI) before real work starts, and both are updated in the same commit as the change they describe.

**The model tier is chosen at dispatch, and every dispatch names it.** The main thread plans and makes the hard judgement calls. Execution, research and review agents run on the cheaper model, and I do not let a sub-agent inherit the expensive one by omission, because omission is how a research run quietly becomes very expensive. Keep the fan-out small: three or four independent branches usually answer what sixteen agents were sent to answer, and at most two multi-agent runs at once.

**Memory that survives the session.** Skills, hooks and a folder of plain markdown notes form one loop: write down anything expensive to rediscover the moment you find it, and have a hook bring the relevant notes back at the start of the next session. The details of my own version are private.

**Handoffs instead of long sessions.** When work stops midway, `session-handoff` writes a file a cold session can pick up. A long session drifts, and a fresh one with a good handoff does not.

**Check before you claim.** A fact gets verified from a primary source before I say it, especially in fast-moving areas like pricing, APIs, model names and law. Before advising on a one-way step (a delete, a config choice, a game event), I find the exact page that governs that step, not an adjacent one that mentions it. For a chain of steps, I read where the chain ends, not just what the next click does. A session does not grade its own work: something separate checks it.

**Answer in chat first.** A comparison, a ranking, a plan, a status: chat. A file only when the shape of the data is the point (a trend, a network, something someone will return to). When I do build an HTML page, anything that carries meaning gets a consistent colour and a text label as well, so it survives greyscale, a screenshot and colour blindness.

**Web tools, cheapest first.** A plain fetch for static pages, a real browser only for pages that need JavaScript, a screenshot only when the look itself is the question. A screenshot costs roughly seventy times a text read.

**Commands I hand to a person are checked against their shell first.** If someone is on Windows PowerShell 5.1, there is no `&&`. One command per block, run once before handing it over.

**Pace is a spoken setting.** Slow and sequential by default. Saying "fast" lets sub-agents be used more readily, and it resets after each task.

**Three strikes and it becomes a skill.** The same kind of task done three times across sessions gets a skill, not a note, so the next session picks it up without being told. A skill that exists but is switched off counts as not created, so I check that it actually loads.

## Setup beyond skills

### MCP servers

MCP is a shared standard, so the same servers can be used from any agent that supports it. Not all are on at once.

- **GitNexus:** call-graph code intelligence: impact analysis, symbol context, safe renames. Check the index age before trusting it.
- **GitHub, Supabase, Stripe, Vercel, Figma, Shopify Dev, Grafana:** the service each one names, without shelling out for everything.
- **Context7:** current library docs on demand instead of answering from stale training data.
- **Desktop Commander:** persistent shells, long processes, structured local files.
- **My own two web servers:** one for search and static page reads, one that drives a real browser for JavaScript pages and screenshots. Private for now.

Two lessons. A server being configured is not the same as it being reachable, so confirm a tool actually resolves before building on it. And a config file will happily list a server that has been dead for months.

### Hooks (Claude Code)

A hook is a command the agent runs at a fixed point, with no prompting and no remembering. Mine:

- **On every prompt:** search the notes for anything relevant and inject it; load the project's `PROJECT.md`; spot video links so they are ingested rather than skimmed.
- **On session start:** load a short list of rules from past mistakes, so the same one is not made twice.
- **On stop, after every turn:** commit changes to files git already tracks. It never adds new files and it **never pushes**. New files enter history on purpose, and pushing is something I ask for. This is a change from an earlier version that staged everything and pushed: that swept a scraped file into a production merge.

Because that commit is unattended, a secret written into a tracked file is still committed, so secret hygiene has to happen before the turn ends. That is why the pre-push scan exists.

Keep every hook fast with an explicit timeout, because a hook sits on the critical path of every session. Write hooks for the things you keep forgetting, not the things you already do reliably.

### Slash commands

`/fix-linter` (work through linter output systematically), `/review-recent` (review only what changed recently), `/visual-plan` (turn a text plan into a visual one).

### Plugins

[Superpowers](https://github.com/obra/superpowers) (the process layer), [Impeccable](https://github.com/pbakaus/impeccable) (interface design review), [taste-skill](https://github.com/leonxlnx/taste-skill) (opinionated visual directions), [claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) (vault ingestion and linting), plus `claude-md-management`, `hookify` and `security-guidance`.

### CLI tools

`gh`, `git-filter-repo`, `ffmpeg` (frame extraction so a screen recording can be reviewed), and `npx gitnexus analyze` to rebuild the code index when it drifts.

## Part of a larger collection

See [toolkit](https://github.com/SamuelNDCE/toolkit) for the index of published tools and [claude-super-skill-library](https://github.com/SamuelNDCE/claude-super-skill-library) for the larger curated skill collection. This repo was called `claude-workbench` until 2026-09-26. GitHub redirects the old address, so old links still work.

## License

MIT. See [LICENSE](LICENSE).
