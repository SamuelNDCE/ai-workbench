# Standing rules

A starter set of the rules I keep in my own global instructions file, with the personal and
machine-specific ones removed. Copy it to `AGENTS.md`, delete what does not fit you, and add your
own. For Claude Code, create a `CLAUDE.md` containing the single line `@AGENTS.md`.

**Every rule here exists because something specific went wrong.** That is what keeps the file short
enough to be followed. If you cannot name the failure a rule prevents, it is probably noise. Add a
line the day a mistake happens, not in advance.

## Working style

- **Reason before acting.** Ask: is there a simpler way, what is the blast radius, is the complexity
  justified? Raise concerns before executing. Do not act speculatively or add unrequested scope.
- **Do it yourself before asking me.** Exhaust your own options first: a different tool, a CLI
  instead of an MCP call, reading the code instead of asking what it does, checking the live API
  instead of asking which value is right. A refusal from a permission boundary is the evidence a
  task needs me. Your guess that it would refuse is not. Retry once and try a second tool first.
  When you do have to ask, batch every outstanding question into one message and keep working on
  everything that does not depend on the answer.
- **Answer in chat first.** A comparison, a ranking, a plan or a status goes in the reply. Build a
  file only when the shape of the data is the point (a trend, a network, something I will return to).

## Facts and verification

- **Never guess.** Any statement of fact or recommendation gets verified from a primary or current
  source before you say it. Law, pricing, API surfaces, model names and product UI go stale fast,
  and feeling sure is exactly when this rule gets skipped. If you cannot verify, say so and mark
  which parts are verified and which are assumed.
- **Read the page that governs the decision, not an adjacent one.** Before advising on a hard-to-
  reverse step (a delete, a one-way config choice), find the exact source for that step. If you
  only found a nearby one, say the advice is extrapolated.
- **For a chain of steps, read where the chain ends.** A correct next click does not prove the path
  it belongs to is safe. Look up the chain's end state before recommending its first step.
- **Never treat a self-report as proof.** A subagent saying "done", an API returning success, or
  an immediate read of what you just wrote are not verification. Check by a different path.

## Cost and models

- **Every subagent dispatch names its model.** The main thread plans and makes hard judgement calls.
  Research, execution and review run on the cheaper model. Do not let a subagent inherit the
  expensive one by leaving the field out.
- **Keep fan-out small.** Three or four independent branches usually answer what sixteen agents were
  sent to answer. Fold the "re-check your most important numbers" step into the researcher's own
  prompt instead of doubling the agent count with a separate verifier.
- **At most two multi-agent runs at once.**
- **Pace:** slow and sequential by default. If I say "fast", use subagents more readily. It resets
  after each task.

## Execution hygiene

- **Stop every dev server, watcher and background shell the moment its task is done.**
- **No sleep-polling.** Run long commands in the background and wait for the completion signal.
- **Any script that can block gets a loading indicator and a hard timeout.** A `try/catch` does not
  help: a wedged call does not throw, it never returns. Verify the timeout fires with a
  deliberately hanging test, because a fast test passes on the broken path too.
- **Batch independent reads** into one parallel call.
- **Never hardcode a machine-specific absolute path** into tracked config or production code.
- **Never put a volatile number in an instruction file.** State how to obtain the count, not the
  count. If one must be written down, date-stamp it.

## Git

- Commit deliberately: name the paths, no `git add -A`, no force-push, no `--no-verify`.
- **Never push unless I ask in that session.** Verify a push landed with
  `git branch -r --contains <sha>`, not the push command's exit code.
- **Never end a turn with a secret written into a tracked file.**
- Every new repo is private by default.
- After any scripted commit, check the message with `git log --format='%s' -1`. Quoting damage
  gives a successful exit code and a wrong message.

## Windows shell (delete if you are not on Windows)

- Never pass a multi-line inline string through Git Bash (`node -e`, unquoted heredocs). Write a
  real script file instead.
- Match the syntax to the tool you are actually calling: `<<'EOF'` heredocs in bash, `@'...'@` in
  PowerShell with the closing delimiter at column 0.
- **Commands you hand to a person are checked in their shell first.** Windows PowerShell 5.1 has no
  `&&`, `||`, ternary or `??`. One command per block, and run it once before handing it over.

## Projects

- Every project has a `PROJECT.md` at its root (see `templates/PROJECT.md`), loaded by a hook. A UI
  project also has a `DESIGN.md`. Update both in the same commit as the change they describe.
- Per-project rules go in that project's `PROJECT.md`, not here. This file stays cross-project.

## Skills

- **The same kind of task done three times becomes a skill**, not a note.
- **A skill that exists but is switched off counts as not created.** Confirm it actually loads.
- A skill named in this file may not be installed in the current project. Check before relying on it.

## Memory

- Write down anything expensive to rediscover the moment you find it: a path, a working command, a
  gotcha, a decision, a fix. Save narrative summaries at the end of the task.
- When work stops midway, write a handoff file a cold session can resume from, and resume from it
  after verifying its claims still hold.
