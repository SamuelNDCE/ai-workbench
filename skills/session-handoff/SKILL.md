---
name: "Session Handoff"
description: "Write a self-contained handoff file to a handoff folder so the current work can be resumed cold in a new session tomorrow or by another session right now. Use whenever the user says they want to continue/finish something tomorrow or later, or asks to hand this off to another session, or when a session is about to end with work unfinished. Also use in reverse to resume: when they mention or @-references an existing handoff file, read it and continue from it."
---

# Session Handoff

One file, written to the handoff folder, that lets a cold session pick up exactly where this one stopped. Two directions: **write** a handoff, or **resume** one.

## Triggers (fire without being asked)

Write a handoff on any of: "let's finish this tomorrow", "continue this tomorrow", "carry on with this later", "pick this up in the morning", "hand this off", "hand this to another session", "make a handoff", "/handoff", or any phrasing that defers the current work to a later or parallel session.

Resume on: "resume the X handoff", "continue from the handoff", or an `@` mention / paste of any file in your handoff folder.

If the trigger phrase names a *different* task than the one in progress ("tomorrow I want to start Y"), that is a **future task**, not a handoff. Write it to the PARA inbox instead and say so. Do not fabricate a handoff for work that has not started.

## Write procedure

**1. Do not ask questions first.** Everything needed is already in the session. Write the file, then show the resume line. Only ask if the session genuinely covered several unrelated workstreams and it is unclear which one is being deferred.

**2. Path.** `$HANDOFF_DIR/YYYY-MM-DD-<slug>.md` (set `HANDOFF_DIR` to any folder outside your repos; default `~/.ai-handoffs`), slug being 2 to 4 lowercase hyphenated words naming the work, not the date. Get the date from the environment context, never guess it.

**3. Content.** Use the template below verbatim. It is ordered so a cold session reads top down and can start acting by line 20.

**4. Write only what is verified.** Any file path, command or symbol in a handoff must have been actually seen or run this session. A cold session cannot tell a guess from a fact, and will burn its first ten minutes chasing a path that does not exist. Mark anything unconfirmed as `ASSUMED:`.

**4a. A claim that something does NOT exist needs the same proof as a claim that it does.** Run the `ls` or `Glob` before writing "X does not exist yet", "that file is missing", "there is no such config". This rule exists because it was already broken once: the 2026-08-02 handoff asserted `wiki/system/skill-patterns.md` did not exist and told the next session to create it. It existed, 8KB, actively maintained. A cold session following that instruction would have overwritten a live tracker with a fresh template and lost the lot. Negative claims are the dangerous ones precisely because they read as harmless, and they license the next session to *create* rather than to look.

**5. Optional reindex.** If you search your notes with `qmd`, run `qmd update && qmd embed` once after writing so the handoff is findable the next day. Skip this step if you do not.


**6. Close out with the reply.** Print the resume line as a copy-pasteable block and the file path. Nothing else. They asked to stop for the day, so do not start new work after writing it.

## Template

```markdown
---
type: handoff
status: open
created: YYYY-MM-DD
project: <repo or project name>
---

# Handoff: <title>

**Resume with:** `Resume the <slug> handoff.` (or @ this file)

## One-line state
<Where the work stands, in one sentence.>

## Next action
<The single first thing the next session should do. One concrete step, not a list.>

## Then
1. <next steps in order>
2. ...

## Context the next session needs
- <decisions made and why, so they are not relitigated>
- <constraints, rejected approaches>

## Files touched
- `path/to/file.ts:120` <what changed / what is half done>

## Verified commands
```bash
<commands actually run this session, with what they do>
```

## Gotchas hit
- <traps already paid for, so they are not paid for twice>

## Open questions for the user
- <only genuine blockers, empty if none>

Related: [[<project note>]] · [[samuel]]
```

Drop any section that is empty rather than writing "N/A".

## Resume procedure

1. Read the handoff file in full before touching anything.
2. Verify the state it claims: the branch, the files, whether the "next action" is still needed. The tree may have moved since, and this repo's Stop hook commits every turn, so what was uncommitted then is committed now.
3. Say in one line what you are picking up, then do the next action. Do not re-plan work the handoff already decided.
4. When the work finishes, set `status: done` in the frontmatter. When it is partly done and deferred again, rewrite the same file rather than making a second one, and note the date moved.

## Hygiene

- Handoffs live outside any repo working tree, so an auto-commit hook cannot sweep a copy into history and the file survives outside any one project.
- Never put a secret, token or `.env` value in a handoff. Reference the variable name, not the value.
- No em dashes.
