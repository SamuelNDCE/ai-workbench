# Hooks

Claude Code hooks I run on every machine. A hook is a command the agent runs at a fixed point, with no prompting and no remembering, so it covers the rules that fail when they depend on someone remembering them.

| Hook | Event | What it does |
|:---|:---|:---|
| [`project-doc-hook.cjs`](project-doc-hook.cjs) | SessionStart and UserPromptSubmit | Finds the project's `PROJECT.md` and injects it, once per session per project. Says so once if a repo has none. |
| Stop checkpoint (inline, below) | Stop | Commits changes to files git already tracks. Never adds new files, never pushes. |

Both are Claude Code hooks. Codex and Hermes are not checked.

## Install

Copy the script somewhere stable, then merge this into `~/.claude/settings.json` (or a project's `.claude/settings.json`). Use absolute paths if `~` does not expand in your shell.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/helpers/project-doc-hook.cjs",
            "timeout": 5,
            "statusMessage": "Loading this project's PROJECT.md..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/helpers/project-doc-hook.cjs",
            "timeout": 5,
            "statusMessage": "Loading this project's PROJECT.md..."
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0; if [ -n \"$(git status --porcelain --untracked-files=no)\" ]; then git add -u && git commit -q -m \"claude: auto-checkpoint $(date '+%Y-%m-%d %H:%M:%S')\"; fi; exit 0",
            "shell": "bash",
            "timeout": 120,
            "statusMessage": "Checkpointing locally...",
            "async": true
          }
        ]
      }
    ]
  }
}
```

Restart Claude Code after editing settings.

## Check it works

From inside a repo that has a `PROJECT.md`:

```bash
echo '{"session_id":"test1"}' | node hooks/project-doc-hook.cjs
```

It prints the file once. Run it again with the same `session_id` and it prints nothing, which is the once-per-session dedup working. Use a new `session_id` to see it print again.

## Why each choice

**`PROJECT.md` on both events.** SessionStart fires once, before any directory change, so it cannot see a `cd` into a different project halfway through. UserPromptSubmit catches that case. The temp-file dedup stops it repeating on every prompt.

**A 40,000 character cap, and the dropped sections are named.** An earlier cap of 8,000 silently dropped the `Hard rules` section of the larger project files, and a missing rule looks exactly like a rule nobody wrote. If a file nears the cap it is carrying narrative: trim the file, do not raise the cap.

**The checkpoint hook stages with `git add -u`, not `git add -A`.** `-u` only stages changes to files git already tracks, so a scratch file or a `.env` can never be swept into a commit. The dirty check uses `--untracked-files=no` to match: without it the hook fires on a repo whose only change is untracked, stages nothing, and fails on an empty commit every turn. The trade-off is that a brand-new file is not checkpointed until you `git add` it on purpose. That is intended: new files entering history should be a decision.

**The checkpoint hook never pushes.** An earlier version staged everything and pushed. It swept a scraped 109 KB HTML file into a production merge. Pushing is now something you ask for.

**The checkpoint hook is narrower, not airtight.** A secret written into an already-tracked file is still committed unattended, so secret hygiene has to happen before the turn ends. That is what [`pre-push-secret-scan`](../skills/pre-push-secret-scan/SKILL.md) is for.

**The checkpoint hook has no repo exclusion.** It commits tracked changes in whichever repo the shell's working directory is in when the turn ends. The shell's directory persists between commands, so a single `cd` into another repo to run a build makes that repo a checkpoint target for the rest of the session. Prefer `git -C <repo> ...` and a `cd` inside a single command over a bare `cd` that leaks.

**`async: true` on the checkpoint.** It runs after the turn and cannot be skipped per turn, but it does not hold the next prompt up.

## Rules for writing your own

- **Give every hook an explicit `timeout`.** A hook sits on the critical path of every session, and a wedged one freezes it. A `try/catch` does not help: a hung call does not throw, it never returns.
- **Exit 0 always.** A broken hook must not be able to stop work.
- **Stay silent when there is nothing to say.** A hook that talks every turn trains you to ignore it.
- **Write hooks for the things you keep forgetting**, not the things you already do reliably.
