# How I use Claude Code, in detail

The [README](../README.md) has the short version. This is the longer one: each technique, how to
reproduce it, and the failure that earned it. Everything here was checked against my own setup on
2026-09-26.

The files that make it reproducible are in this repo: [`hooks/`](../hooks) for the two hooks,
[`templates/AGENTS.md`](../templates/AGENTS.md) for a starter rules file and
[`templates/PROJECT.md`](../templates/PROJECT.md) for the per-project file.

## What the numbers say

Counted from my Claude Code transcripts that were touched in the 45 days to 2026-09-26. The count
includes sessions across every project on the machine, so it is a rough picture of habit, not a
controlled measurement.

| What | Number |
|:---|--:|
| Transcript files in the window | 919 |
| Sub-agent dispatches (the `Agent` tool) | 641 |
| Workflow runs (the `Workflow` tool) | 383 |
| Dispatches that named a model, before 2026-09-07 (the rule date) | 129 of 307 (42%) |
| Dispatches that named a model, since 2026-09-07 | 240 of 334 (72%) |
| Dispatches that named the cheaper model, since 2026-09-07 | 235 of 334 (70%) |
| Dispatches that left the model out, since 2026-09-07 | 94 of 334 (28%) |

**Reading that honestly:** writing the rule down moved "named a model" from 42% to 72%. It did not
reach 100%. A rule in an instructions file is a nudge, not a lock, which is the argument for putting
anything that really must hold into a hook. Workflow runs pick the model inside their own script,
so their inner agents are not in these numbers.

The most-invoked skills over the same window are ranked in the [README](../README.md#the-skills-most-used-to-least-used).
The top of the list is telling: `session-handoff` (91), `superbraindump` (56),
`dictation-garble-catcher` (36) and `braindump` (31). More than half of my skill use is about
getting a clear instruction into a session and getting the state out of one, not about any
particular kind of coding.

## The techniques

### 1. Rules go in two layers: a global file and a per-project file that a hook loads

**Do this:** keep one global instructions file for rules that hold everywhere, and keep it as small as you can. Give each
project its own `PROJECT.md` for rules that change what you may do in that project: how it deploys,
what must be true first, what to verify, which environment variables it needs. Load it with
[`hooks/project-doc-hook.cjs`](../hooks/project-doc-hook.cjs) rather than a line saying "read it".

**Why a hook:** a rule in an instructions file only works if it is followed. A note ages out of the
context, and a skill only fires when the model judges it relevant. A rule that gates a deploy fails
silently and lands in production. The hook removes the judgement call.

**The test for where a fact goes:** would it change what I am allowed to do right now? If yes, it is
operational and goes in `PROJECT.md`. If it is history or reasoning, it goes elsewhere. Nothing is
written in both places.

**The rule that keeps the global file short:** a rule set for one project goes in that project's
file, never the global one.

**An honest caveat:** my own global file is about 64,000 characters, roughly 16,000 tokens, loaded into every
session. That is too big, and it is the largest fixed cost I have. The rule above is what I aim for, not what
I have achieved. [docs/token-efficiency.md](token-efficiency.md) shows how to measure yours and what I am
doing about mine.

Start from [`templates/PROJECT.md`](../templates/PROJECT.md).

### 2. Every rule is earned by a specific failure

Each line in my global file names the mistake behind it. That keeps each rule specific enough to be
followed, and it makes the rule easy to challenge later: if the failure cannot recur, the rule can
go. Add a rule the day something goes wrong, not in advance. Three examples from my own file:

- **The checkpoint hook used to stage everything and push.** It swept a scraped 109 KB HTML file
  into a production merge. It now stages tracked files only and never pushes (see
  [`hooks/README.md`](../hooks/README.md)).
- **A verification rule.** I acted on advice from a general summary of a game event chain. The
  specific page for that event said the opposite. The rule: find the exact source that governs the
  decision, not one that merely mentions it.
- **A machine path baked into tracked config broke three separate projects.** The rule: read paths
  from environment variables or resolve them relative to the project.

### 3. The model is named at dispatch, every time

**Do this:** the main thread plans and makes the hard calls. Research, execution and review
sub-agents run on the cheaper model, and every dispatch names it explicitly.

**Why explicitly:** a sub-agent that omits the field inherits the main session's model. If that is
the expensive one, a research run quietly becomes very expensive. This is the failure that set the
rule: one large research session ran 16 agents on the expensive model where 3 or 4 on the cheaper
one would have done.

**In a multi-stage run** (build, review, fix), the middle stage runs on the cheaper model too.
Reviewers do not get a bigger model by default.

**Keep the fan-out small.** Ask what the smallest set of genuinely independent branches is. Put the
"re-check your most important numbers, there is no separate verifier, you are it" step in the
researcher's own prompt instead of adding a second agent to do it. At most two multi-agent runs at
once.

The adherence numbers are in the table above: this rule is followed most of the time, not always.

### 4. Hand off instead of running a long session

`session-handoff` is my most-used skill by a wide margin (91 uses). A long session drifts: early
decisions get compressed away and the model starts contradicting them. When work stops midway, the
skill writes a self-contained file with the state, what is verified, what is not, and the next
action. A fresh session reads it, checks its claims still hold, and continues.

**Two details that matter:** the resume step verifies the file's claims before acting on them,
because a handoff describes a moment that has already passed. And a deferral of *different* work
("tomorrow I want to build Y") is a future task, not a handoff.

For a big task, [`large-task-session-split`](../skills/large-task-session-split/SKILL.md) goes
further: split it into independent pieces and give each a fresh session.

### 5. I dictate, so a skill turns the ramble into a prompt

A lot of what I send is spoken. `braindump` turns a messy paragraph into a clean structured prompt,
confirms it, then runs it. `superbraindump` does the same for large, multi-part or high-stakes
dumps. `braindump-auto` skips the confirmation for cases where I trust the result.

`dictation-garble-catcher` is the companion: a mishear that sounds like a real project term (a
proper noun that is phonetically close) gets confirmed instead of silently followed. It has a
similar use count to `braindump` because the two are used together.

You do not need to dictate for this to help. Any stream-of-consciousness message benefits.

### 6. Check before you claim

- **Facts get a primary source first.** Especially law, pricing, API surfaces, model names and
  product UI, because feeling sure is exactly when the check gets skipped.
- **For a hard-to-reverse step,** find the page that governs that exact step, not a nearby one. If
  you cannot find it, say the advice is extrapolated.
- **For a chain of steps,** read where the chain ends before recommending its first move. A same-
  turn tooltip proves one click is right, not that the path it belongs to is safe.
- **A session does not grade its own work.** [`verify-dont-trust`](../skills/verify-dont-trust/SKILL.md)
  says a subagent's "done", a fresh API response and an immediate read-back are not proof. Check by
  a different path before marking anything finished.
- **A local gate that stands in for CI has to run CI's own steps.** Read the workflow files instead
  of copying a checklist from memory.

### 7. Hooks for what breaks when it depends on memory

Mine: load `PROJECT.md`, checkpoint tracked files after every turn, and (privately) inject notes
and past lessons. Rules for writing your own are in [`hooks/README.md`](../hooks/README.md):
explicit timeout, always exit 0, stay silent when there is nothing to say.

**Test that a timeout actually fires,** with a deliberately hanging command. A fast test passes on
the broken path too. A helper once ran its work synchronously with no timeout in one code path, so
every caller believed it was protected and none were.

### 8. Read the cheap way first

For the web: a plain fetch for static pages, a real browser only when the page needs JavaScript, a
screenshot only when the look itself is the question. A screenshot costs about seventy times a text
read once the vision tokens are counted. Fan several search queries into one call instead of running
them one at a time.

For code: query a code graph or a call-graph index for architecture and blast-radius questions
first, and only then read files. Check how old the index is before trusting it.

### 9. Answer in chat, and reserve files for shapes

I asked for a comparison of 20 video editors "so I can evaluate" and got a scatter plot, a bar
chart and a sortable table. It was too much. Now a comparison, ranking, plan or status goes in the
reply, as one table with plain-English rows and the status as a word inside the cell. A file is for
a trend over time, a network, something I will return to or show someone else.

When I do build a page, anything that carries meaning gets a consistent colour and a text label, so
it survives greyscale, a screenshot and colour blindness. Colour is a second channel on top of the
words, never a replacement for them.

### 10. Three of the same task becomes a skill

When I do the same kind of task three times across sessions, it becomes a skill instead of a note,
so the next session picks it up without being told. Two checks stop this from decaying:

- **A skill that exists but is switched off counts as not created.** Confirm it actually loads.
- **A skill named in a rules file may not be installed in the current project.** Check before
  relying on it, or you get a silent no-op.

### 11. Windows shell discipline

I work on Windows, and most of my shell mistakes were the same few.

- **Never pass a multi-line inline string through Git Bash** (`node -e`, unquoted heredocs). It
  splits into stray files and still exits 0. Write a real script file, or use PowerShell here-strings.
- **Match the syntax to the tool being called.** `<<'EOF'` for bash, `@'...'@` with the closing
  delimiter at column 0 for PowerShell. Mixing them corrupts silently.
- **Commands handed to a person are checked in their shell first.** Windows PowerShell 5.1 has no
  `&&`, `||`, ternary or `??`. I had handed over a chained command three times before this became a
  written rule. One command per block, and run it once before handing it over.
- **After any scripted commit,** check the message with `git log --format='%s' -1`.

See [`windows-shell-tool-selection`](../skills/windows-shell-tool-selection/SKILL.md).

### 12. Stop what you started

Every dev server, watcher and background shell is stopped as soon as its task is done
([`zombie-process-sweep`](../skills/zombie-process-sweep/SKILL.md)). Long commands run in the
background and I wait for the completion signal, never a sleep loop. Commands expected to take more
than about 20 seconds run in the background while I read the next task's context.

### 13. When something is retired, update every reference the same turn

When a service, tool or vendor is dropped, the instruction to me is to update, not just note it. Grep
for the old name across the rules file, project docs, configs and scripts. Mark it retired with the
date and what replaced it, instead of deleting the name, so a future session does not reintroduce
it. Change live references to the replacement. If a reference cannot be fixed in the session, say so
rather than leaving it silently stale.

A changelog line that only records a deletion sends the next reader hunting for a tool that is not
coming back. Write "X retired, use Y instead, here is the difference" or do not write the line.

## What is not here

The notes system that hooks inject from, the skills tied to it, and the parts of my setup that name
my own machine, accounts or collaborators are private. The pattern is the same as the public
half: write down what is expensive to rediscover the moment you find it, and have a hook bring the
relevant notes back at the start of the next session.
