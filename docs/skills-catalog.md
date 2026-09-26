# Skills catalog

Every skill in this repo, what it does, how it works, when I reach for it, and why it saves tokens or
time. Then the skills I use that come from other people.

Everything here was written from the skill files themselves, then checked against them. Use counts are
invocations by name in my Claude Code transcripts touched in the 45 days to 2026-09-26, counted with
[`scripts/usage-report.cjs`](../scripts/usage-report.cjs). A skill fired from a hook or a slash command
can be undercounted, and a 0 does not mean a skill is bad: several are insurance (leak clean-up, full
audits) that you want to exist and rarely call.

**How to read "Why it is efficient".** Where a skill's file gives a number or a real failure, I quote
it. Where it does not, the line starts "Structural saving:" and describes what the skill avoids, with
no invented figure.

**How to install one.** `./scripts/install.sh claude <skill-name>` (or `install.ps1 -Agent claude
-Skills <skill-name>` on Windows). See the [README](../README.md#install-2-minutes).

## Contents

| Group | Skills |
|:---|:---|
| Turning a ramble into a clear task | `superbraindump`, `braindump`, `braindump-auto`, `dictation-garble-catcher` |
| Keeping work alive across sessions | `session-handoff`, `large-task-session-split` |
| Checking work before calling it done | `verify-dont-trust`, `worktree-task-pack-verification`, `derived-figure-audit`, `capability-claim-grounding`, `design-review-loop`, `ui-change-visual-verify`, `project-design-doc`, `personal-dashboard-style` |
| Secrets, repos and safe deletion | `pre-push-secret-scan`, `full-account-security-audit`, `public-repo-leak-retraction`, `repo-hygiene`, `repo-index-drift-check`, `safe-section-deletion`, `skill-overlap-audit` |
| Windows and background processes | `windows-shell-tool-selection`, `windows-process-restart`, `zombie-process-sweep` |
| Team operations | `discord-todo-ops` |
| From other people | `brainstorming`, `systematic-debugging`, `writing-plans`, `subagent-driven-development`, `karpathy-guidelines`, `claude-api`, `artifact-design`, `security-review`, `supabase`, `supabase-postgres-best-practices`, `run`, `update-config` |

## Turning a ramble into a clear task

Half of my skill use is getting a clear instruction into a session. These four are why.

### `superbraindump`
**Uses (45 days to 2026-09-26):** 56
**What it does:** The heavy tier of the prompt fixer for large, tangled or high-stakes dumps. It builds a rigorous prompt, confirms it, then executes it.
**How it works:**
- Deep extraction per distinct ask: goal, context, constraints (including ones implied by tone), success criteria, ambiguities, and separate asks.
- Rewrite with Goal / Context / Constraints / Output format / Edge cases / Done when. Success criteria must be checkable.
- Resolve ambiguity in the prompt with a stated assumption instead of deferring it.
- Multiple asks become separate prompt blocks, and it asks which to run first.
- Show the prompts and assumptions, then wait for approval. Hard gate. Then execute in the confirmed order and verify any push landed.
**When I reach for it:** `/superbraindump`, "this is a big messy one", "help me think through all of this", "turn this into a real spec", or automatically when a dump bundles asks, runs long, spans repos, or is high-stakes. Second most used skill at 56 uses in 45 days.
**Why it is efficient:** Structural saving: bundled asks are separated and ambiguity is resolved before execution, which avoids running a large task on a blurry goal. The file also says not to pad, since a complex dump can collapse into a short prompt.
**Watch out:** It adds an approval round trip, which is intentional for high-stakes work.

### `braindump`
**Uses (45 days to 2026-09-26):** 31
**What it does:** Turns a messy, rambling message into a short structured prompt, shows it for approval, then runs it. It is the everyday tier for a single contained ask.
**How it works:**
- Step 1: read the whole dump and pull out goal, context, constraints, success criteria and ambiguities. Ignore filler and self-corrections.
- Step 2: rewrite as Goal / Context / Constraints / Done when. Empty sections are omitted. The result must be shorter than the dump.
- Step 3: show the prompt and list any assumptions, then wait for "go", a tweak, or a correction. This is a hard gate.
- Step 4: on approval, execute in the same session. If it commits or pushes, check `git status` and confirm the push reached the remote.
- No side effects (no file writes, no logging) until approval. At most one clarifying question.
**When I reach for it:** `/braindump`, "fix this prompt", "clean this up", "prompt engineer this for me", or any raw ramble that does not clearly need the heavier tier. If the dump turns out to be complex, it switches to `superbraindump`. Used 31 times in 45 days.
**Why it is efficient:** Structural saving: the user does not hand-write a prompt, and the approval gate catches a wrong assumption before any work runs, which avoids redoing work.
**Watch out:** The approval step adds one round trip. For low-risk asks where that is not wanted, the auto variant exists.

### `braindump-auto`
**Uses (45 days to 2026-09-26):** 5
**What it does:** Same extraction and rewrite as `braindump`, but it runs the cleaned-up prompt immediately with no approval step.
**How it works:**
- Steps 1 and 2 are identical to `braindump`: extract the signal, rewrite as Goal / Context / Constraints / Done when.
- Step 3: state the refined prompt and the assumptions, then execute in the same turn.
- Normal safety rules still apply. Sends, purchases, deletions and other gated actions still need their own permission.
- At most one clarifying question, and only if execution is impossible without it.
- If the dump turns out complex, bundled or high-stakes, it stops and suggests `superbraindump`.
**When I reach for it:** `/braindump-auto`, "braindump auto", "braindump autoexit", "braindump and just run it", "skip the confirmation and braindump this". Used 5 times in 45 days.
**Why it is efficient:** Structural saving: removes the confirmation round trip for low-stakes single-topic asks, while still listing assumptions inline so nothing is hidden.
**Watch out:** A wrong assumption runs before you see it. The file says not to use it for hard-to-reverse or high-stakes asks.

### `dictation-garble-catcher`
**Uses (45 days to 2026-09-26):** 36
**What it does:** Spots a word in a voice-dictated prompt that does not fit the sentence but sounds like a known project name, and confirms the likely intended term instead of acting on the wrong one.
**How it works:**
- Scan the dump for terms that do not fit their sentence.
- A candidate must fit neither the meaning nor the topic, and be phonetically close to a known proper noun from project context.
- If a plausible match exists, state the correction openly and proceed on it, for example "(reading X as Y. Tell me if wrong)".
- If no confident match exists, ask instead of guessing.
- Never rewrite a term silently.
- Runs in the same read-through as `braindump`, not as a separate turn.
**When I reach for it:** Any raw dump that reads as voice-dictated and contains an odd word that might be a mishear of a business, product or repo name. Used 36 times in 45 days.
**Why it is efficient:** Structural saving: it avoids running a whole task on a mistranscribed name, and the visible correction lets a wrong guess be caught in one line.
**Watch out:** Only works against proper nouns already present in the project context.

## Keeping work alive across sessions

A long session drifts. A fresh one with a good file does not.

### `session-handoff`
**Uses (45 days to 2026-09-26):** 91
**What it does:** Writes one self-contained file so work can be resumed cold in a later or parallel session, and reads such a file to resume.
**How it works:**
- Fires without being asked on phrases like "let's finish this tomorrow", "hand this off", "/handoff".
- Writes to `$HANDOFF_DIR/YYYY-MM-DD-<slug>.md` (default `~/.ai-handoffs`) using a fixed template: one-line state, single next action, then steps, context, files touched, verified commands, gotchas, open questions.
- Writes only what was verified this session. Unconfirmed items are marked `ASSUMED:`.
- A "does not exist" claim needs the same proof as an "exists" claim. The file cites a handoff that wrongly said a live tracker did not exist.
- Resume: read the file fully, verify the state, say in one line what is being picked up, do the next action, and set `status: done` when finished.
- Never put secrets in a handoff. No questions first.
**When I reach for it:** Any deferral of work to later or another session, and when a handoff file is mentioned or pasted. Top-used skill in the set at 91 uses in 45 days.
**Why it is efficient:** The file says a cold session should be able to start acting by about line 20. Verified-only content stops the next session burning its first ten minutes on a path that does not exist.
**Watch out:** The template links a personal notes system. The optional reindex step assumes `qmd`.

### `large-task-session-split`
**Uses (45 days to 2026-09-26):** 0
**What it does:** For a large multi-part task, drafts a plan split into independent pieces and hands each piece to its own separate session to run in parallel.
**How it works:**
- Draft the plan in one stable session first: goal, files, constraints, done-when for each piece.
- Check the pieces are actually independent. Two pieces touching the same file or dependency must be merged or handled centrally.
- Isolate each piece in its own git worktree.
- Give each session a self-contained kickoff prompt covering only its piece.
- Merge centrally, do not trust each session's "done", and run the full gate on the merged result.
**When I reach for it:** A task with several independent pieces that is big enough to risk context rot in one session. Not for a single feature or a chain of dependent steps. Not used in the 45-day window.
**Why it is efficient:** The file says one long session accumulates history until quality degrades, and sub-agents inside one session still share its context budget. Separate sessions start clean and run in parallel.
**Watch out:** Assumes you can start several sessions and use git worktrees.

## Checking work before calling it done

None of these produce anything new. They stop wrong work being reported as finished.

### `verify-dont-trust`
**Uses (45 days to 2026-09-26):** 4
**What it does:** Makes a self-report or a just-returned API response count as a claim, not proof, and requires a second independent check before marking anything done.
**How it works:**
- "Merged cleanly": run `git show -1 --format=%P <commit>` (2 or more parents means a real merge) and `git merge-base --is-ancestor`.
- API writes: re-fetch the object by its own ID. A missing row in a list view is not proof of failure, since lists can lag.
- Dispatched task "done": check `git status --porcelain` and `git log -1 --format=%cd`, and whether the process is alive. Finish real uncommitted work instead of re-running it.
- Temporary test seeds: `git diff` after reverting to confirm only the real change remains.
**When I reach for it:** Before closing out a subagent task, after any API write, and for any "merged cleanly" claim. Used 4 times in 45 days.
**Why it is efficient:** The file cites a subagent that claimed a clean merge but made a single-parent commit that never reached the target, which would have silently regressed another feature. The check takes one command.

### `worktree-task-pack-verification`
**Uses (45 days to 2026-09-26):** 0
**What it does:** A verification routine for numbered task packs dispatched across isolated git worktrees and then merged back.
**How it works:**
- One independent verification agent per worktree, not the agent that did the work.
- Check for silent stalls with `git status --porcelain` and `git log -1 --format="%cd"`. Finish stalled-but-complete work instead of re-running it.
- Apply the `verify-dont-trust` merge checks to every task.
- Run the full build and test gate on the merged tree for every affected stack, not just per worktree.
- Regenerate lockfile conflicts from the manifest instead of hand-merging.
- If several verifiers report the same gap, investigate immediately.
**When I reach for it:** Whenever a numbered task pack (T1, T2, T3) is dispatched to run in parallel worktrees. Not used in the 45-day window.
**Why it is efficient:** The file lists three real failures it prevents: finished work left uncommitted, a false "merged cleanly" claim, and two branches that compile alone but collide on merge.
**Watch out:** Assumes multi-worktree dispatch and, in its example, a Rust plus npm stack.

### `derived-figure-audit`
**Uses (45 days to 2026-09-26):** 0
**What it does:** Audits every number in a technical document by recomputing it from the document's stated inputs, instead of reading for plausibility.
**How it works:**
- Extract the small set of primitive inputs, then recompute every derived number in a saved script.
- Check each primitive against a physical or market ceiling from a real source.
- Grep for the same quantity derived twice. Any disagreement is a finding.
- Audit the deliverable (for a PDF, the extracted text), not just the sources.
- When a classification bug is found, run the check over every row, then encode it as a build check and prove it fails when the bug is forced back in.
- Escalate instead of fixing when a change would move a headline figure that was already pitched or published.
**When I reach for it:** Reviewing a whitepaper, spec sheet, cost model, engineering deck or any document with derived numbers, and after changing an input parameter. Not used in the 45-day window.
**Why it is efficient:** The file cites a hundred-fold-scale error in a headline cost line that a normal read missed, and seven real defects found in a 52-page PDF that had been read many times. Recomputing from primitives finds errors that internally consistent arithmetic hides.
**Watch out:** The worked examples are from one physics and engineering project. Report format also assumes a wiki log location.

### `capability-claim-grounding`
**Uses (45 days to 2026-09-26):** 13
**What it does:** Checks every capability claim in public copy (site text, pricing tables, JSON-LD, README lists, privacy policy) against the actual build before it is written or published.
**How it works:**
- Build an inventory of every claim, including structured data and metadata.
- Grep the whole product for each claimed feature. Zero hits is the finding. Then cite one authoritative list, such as the changelog.
- Read the Known Issues section. Each entry is a constraint on the copy.
- Rebuild comparison tables row by row from the source table. Do not spot-fix.
- Separate subjects that share vocabulary (a product versus a service) before correcting.
- Render counts from data instead of typing them. Record deliberate omissions in a code comment.
- Verify on the built static HTML, not the dev server, then confirm the deploy shipped.
**When I reach for it:** Writing or editing landing pages, feature tables, pricing tiers, JSON-LD, README feature lists, store text, launch posts, or a privacy policy. Also when asked to "add more detail" or "improve SEO", because existing claims must be checked first.
**Why it is efficient:** The file describes a case where a homepage claimed accounting, email, timesheet and bank connections in six places, and a grep of the whole product for those terms returned nothing. One grep per claim finds this before publishing instead of after months of a false lead selling point.
**Watch out:** Some steps assume a Vercel-style deploy and a wiki log location that are specific to the author's setup.

### `design-review-loop`
**Uses (45 days to 2026-09-26):** 24
**What it does:** Sets the working pattern for UI and website work: do a large batch of changes on your own, self-check them, then hand back one numbered walkthrough for a single review.
**How it works:**
- Batch the whole list of changes. Do not stop for approval after each one.
- Self-check every change: screenshot each changed section, test text overflow, empty/loading/error states, both themes, narrow widths.
- Grep the stylesheet for bare element selectors and undefined CSS custom properties.
- Run the project's real build and the full test suite, and state the numbers. Stop dev servers.
- Hand back a numbered walkthrough, one surface per item, each naming what to judge. Add "What I could not verify" and "Decisions I need".
- Ask early only for build-changing decisions, destructive actions, or blockers.
**When I reach for it:** Multi-change UI work, redesigns, new pages or components, website builds, and phrases like "do all the tasks" or "we'll do one big review". Used 24 times in 45 days.
**Why it is efficient:** It replaces per-change approval round trips with one review pass. The file says a batch full of glitches costs more than doing changes one at a time, which is why the self-check is required first.
**Watch out:** Relies on a screenshot tool for the visual half, and on `ui-change-visual-verify` for the detail.

### `ui-change-visual-verify`
**Uses (45 days to 2026-09-26):** 4
**What it does:** Requires a screenshot check of every UI section changed before it is called done, and targets one failure code review misses: global element and id selectors silently capturing new components.
**How it works:**
- Before adding a component, grep the stylesheet for bare element selectors and for the id you plan to use. Zero hits is safe.
- Loop per section: change one section, screenshot at desktop width, actually look, fix and re-shoot, then check mobile.
- Look for invisible text, overlap near fixed headers, orphaned grid items, missing paragraph spacing, stacked dead space.
- Confirm CSS collisions at computed-style level, for example a breadcrumb `nav` should read `static`.
- Never run a production build against a live dev server directory. It corrupts output and the error shows up in the dev server.
- Report defects found and fixed, not only the final state.
**When I reach for it:** After adding any page, section or component to an existing styled site, when text goes invisible or elements overlap, and before reporting visual work complete. Used 4 times in 45 days.
**Why it is efficient:** The file cites two bugs that shipped despite a clean diff, both caused by selectors written months earlier (a fixed `nav` rule and a reused `#product` id giving white text on white). Grepping first finds them before rendering.
**Watch out:** Tooling notes are written for one browser CLI on Windows and one dev server port check.

### `project-design-doc`
**Uses (45 days to 2026-09-26):** 4
**What it does:** Keeps one design spec per project (colors, type, motion, layout, voice) and follows it on every later design request instead of re-deriving it.
**How it works:**
- One file per project, for example `docs/design-spec.md`.
- If none exists, create it from what the codebase already does. Cite the file and line each convention came from. Do not invent new conventions.
- On later design requests, read the spec first and follow it.
- When a convention changes, apply the change and update the spec in the same step.
- If a request is ambiguous against the spec, surface the conflict rather than picking a side.
**When I reach for it:** Any design request for an existing project, and whenever a design decision should become a standing convention. Used 4 times in 45 days.
**Why it is efficient:** Structural saving: conventions are looked up rather than re-asked or re-derived, and recorded motion values are actual numbers rather than approximations.
**Watch out:** It is a memory aid, not enforcement. A one-off override is allowed.

### `personal-dashboard-style`
**Uses (45 days to 2026-09-26):** 0
**What it does:** Gives generated HTML reports and dashboards one consistent look, so a new visual style is not invented each time.
**How it works:**
- Dark theme with a fixed palette: navy background `#0a0d18`, teal accent `#22d3ee`, purple accent `#7c3aed`.
- Each color keeps the same role every time (teal for primary metrics and links, purple for secondary).
- Save to a `ui/` folder as `<date>-<topic>.html`.
- Open the file directly rather than only stating the path.
- Always pair it with a 2 to 3 line text summary.
**When I reach for it:** A real dataset (10+ rows), a multi-item comparison, or a dashboard-shaped request. Not for a simple answer that reads fine as prose. Not used in the 45-day window.
**Why it is efficient:** Structural saving: the palette, path and filename pattern are fixed, so no design decisions are re-made per report.
**Watch out:** Superseded in my own workflow. I now use a plain dark shell and spend colour only on categories, each colour meaning one thing, always with a text label as well. Kept here as an example of a fixed style, not as my current one.

## Secrets, repos and safe deletion

### `pre-push-secret-scan`
**Uses (45 days to 2026-09-26):** 20
**What it does:** A seconds-long scan of the diff about to be pushed for API keys, tokens, webhook URLs and credentials.
**How it works:**
- Grep the diff (`git diff origin/<branch>..HEAD` or staged changes) for known key shapes: Anthropic, OpenAI, GitHub, AWS, Shopify, Google, Slack, Discord webhooks, Hugging Face, private key headers, JWT shape.
- Add a generic pass for `key|secret|password|token = "..."`, filtering placeholders and `.example` files.
- Any hit: stop and decide if it is real or a labeled fixture.
- If real: remove it, rotate the credential if it was ever pushed, and consider a history rewrite because a follow-up commit does not remove it from history.
- For `.env`, confirm it is gitignored and never tracked.
**When I reach for it:** Right before pushing any commit, every push. Used 20 times in 45 days.
**Why it is efficient:** The file cites a real earlier mistake, a Discord webhook URL committed to a public repo. Scanning only the outgoing diff keeps it fast, and the wider sweep is left to the full audit.
**Watch out:** Pattern based, so it catches known shapes, not every secret.

### `full-account-security-audit`
**Uses (45 days to 2026-09-26):** 1
**What it does:** A slow, thorough, periodic sweep for leaked secrets across every local repo, every GitHub repo, full git history, local `.env` files, and GitHub secret-scanning alerts.
**How it works:**
- Scope: all owned local repos, all GitHub repos, full history, `.env` and credential files, and the secret-scanning alerts API.
- Run a pattern battery (Anthropic, OpenAI, GitHub, AWS, Shopify, Google, Slack, Discord webhook, Hugging Face, private key headers, JWT shape) plus a generic key/password/token pass.
- Local pass: `git log --all -p` through the battery. Remote pass: clone and scan, or `gh api repos/{owner}/{repo}/secret-scanning/alerts`.
- A 404 or disabled response on private free-tier repos is not read as "clean".
- History-add check for credential-shaped filenames across all branches.
- Report first. Do not fix silently, and do not enable settings without approval.
**When I reach for it:** On demand or quarterly, not on every push. Used once in 45 days.
**Why it is efficient:** The file says this had been done by hand three times, and this turns it into one invocation with a fixed checklist and an explicit "nothing silently skipped" rule.
**Watch out:** Needs the `gh` CLI. Secret scanning may be unavailable on some private repos.

### `public-repo-leak-retraction`
**Uses (45 days to 2026-09-26):** 1
**What it does:** Removes something that already reached a public repo (a secret, business or client detail) from files and from all git history, then verifies no trace remains.
**How it works:**
- Find every occurrence in diffs and in commit messages: `git log --all -p | grep -i` and the `--format` variant.
- Fix the working tree first with a normal commit and push.
- Rewrite history with `git filter-repo` using `--replace-text` and `--replace-message` (not `filter-branch`).
- filter-repo removes the `origin` remote, so re-add it and force-push.
- Verify by re-grepping full history, run twice, then confirm on the remote with `gh api "search/code?q=..."`.
**When I reach for it:** After a leak has happened. It is reactive cleanup, not pre-publish prep. Used once in 45 days.
**Why it is efficient:** It names the easy miss, commit messages that repeat the scrubbed term, and requires a second verification pass so a partial scrub is not reported as clean.
**Watch out:** It force-pushes and rewrites commit SHAs, so it needs explicit confirmation. Anyone with an existing clone still has the old data, and search-index lag can hide a remaining hit.

### `repo-hygiene`
**Uses (45 days to 2026-09-26):** 4
**What it does:** Cleans up proven-junk stray files, flags large regenerable caches without deleting them, and makes every new repo private by default.
**How it works:**
- Rule 1: create new repos private unless public is explicitly requested. Making a repo public needs confirmation in chat every time.
- Rule 2: auto-delete only files that are 0 bytes and whose name is clearly a code fragment (a known Git-Bash multi-line string bug). Anything with content is reported, never deleted.
- Rule 3: flag `target/`, `node_modules/`, `.venv/`, `dist/`, `build/`, `__pycache__/` with sizes, only when source is committed, and ask before deleting.
- Never build cleanup around a broad "looks old" heuristic.
**When I reach for it:** Disk bloat, "clean up old files", a messy `git status`, or before creating a new repo. Used 4 times in 45 days.
**Why it is efficient:** The file records 315 untracked junk files and a single 4.76GB build cache in one repo. The strict two-condition rule means cleanup is fast and cannot delete real work.
**Watch out:** The junk-file signature is specific to a Git-Bash-on-Windows bug. The PowerShell snippets are Windows-only.

### `repo-index-drift-check`
**Uses (45 days to 2026-09-26):** 0
**What it does:** Checks a hub or index repo's stated counts and descriptions against what the linked repos actually contain right now.
**How it works:**
- Parse the index's claims (counts, descriptions).
- Verify each linked repo independently, for example counting `SKILL.md` files via `gh api repos/{owner}/{repo}/git/trees/main?recursive=1` and reading `gh repo view --json description`.
- Diff claimed against actual and report each mismatch.
- Fix at the source too, since the linked repo's own README may also have drifted.
- Re-run after any change to a linked repo.
**When I reach for it:** Periodically on any README that summarizes other repos, especially after a linked repo changes. Not used in the 45-day window.
**Why it is efficient:** The file gives a precedent where the true count went 285, then 289, then 287 in one afternoon. Counting from the source stops stale numbers being repeated as fact.
**Watch out:** Needs the `gh` CLI and network access.

### `safe-section-deletion`
**Uses (45 days to 2026-09-26):** 2
**What it does:** Before deleting an HTML section, id, component or named block, greps the codebase for references and only deletes once none remain.
**How it works:**
- List what could reference the target: anchor links, imports, routes and nav links, CSS classes.
- Grep each form, for example `grep -rn "#section-id" .` and the component or route name. Check both href use and raw strings.
- Zero references means safe. Any hit must be updated or confirmed dead first.
- For real code symbols, prefer a call-graph impact tool over grep, since grep can over- and under-count.
- Say so if something outside the repo might link to it.
**When I reach for it:** Any request to remove a section, id, component or block that other content could link to or import. Used 2 times in 45 days.
**Why it is efficient:** Structural saving: one grep pass avoids shipping a broken anchor, import or route that would only be found later.
**Watch out:** A repo-wide grep cannot see external links or bookmarks.

### `skill-overlap-audit`
**Uses (45 days to 2026-09-26):** 0
**What it does:** Scans a skills library for near-duplicate or overlapping skills and recommends which to merge or retire.
**How it works:**
- Extract name and one-line description for every skill.
- Group by textual similarity, not only exact match.
- Decide which is canonical by checking which one other skills reference (`grep -rl "<skill-name>"`).
- Diff the actual file contents before recommending removal. Diverging bodies may be intentional variants.
- Flag any skill that marks itself deprecated.
- Report first. Removal is a separate explicit action.
**When I reach for it:** Periodically on a skill collection past a few dozen skills, or right after adding a batch. Not used in the 45-day window.
**Why it is efficient:** The file cites two real removals found this way, including a 95%+ identical duplicate that nothing referenced while 16 skills referenced the original.
**Watch out:** Similarity is judged by reading, so borderline pairs still need a human call.

## Windows and background processes

Written after the same shell mistakes happened more than once.

### `windows-shell-tool-selection`
**Uses (45 days to 2026-09-26):** 1
**What it does:** A cheat-sheet for choosing between Bash and PowerShell on Windows and avoiding the syntax traps between them.
**How it works:**
- PowerShell 5.1 has no `&&`, `||`, ternary, `??` or `?.`. Use `A; if ($?) { B }`.
- A multi-step PowerShell chain fails at parse time, so nothing may have run. Split suspect chains.
- Do not use `2>&1` on native executables in 5.1.
- Never pass multi-line `node -e` through Git-Bash. Use a heredoc or a temp file.
- The closing `'@` of a here-string must be at column 0.
- Pass `-Encoding utf8` explicitly with `Set-Content` or `Add-Content`.
- Table: git/npm/docker either shell, heredocs and text processing in Bash, registry/services/CIM in PowerShell.
**When I reach for it:** Before writing any non-trivial command on a Windows machine that has both shells. Used once in 45 days.
**Why it is efficient:** Structural saving: choosing the shell before writing the command avoids failures that exit successfully but do the wrong thing.
**Watch out:** Specific to Windows PowerShell 5.1. PowerShell 7 behaves differently.

### `windows-process-restart`
**Uses (45 days to 2026-09-26):** 1
**What it does:** Safely stops and restarts Windows background Node or supervised processes with proof the restart worked.
**How it works:**
- List real processes with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` and match on `CommandLine`.
- For a supervisor and child pair, kill only the child so the supervisor respawns it with new code.
- Verify a new PID exists, re-check after a few seconds for a crash loop, and for watchers check the state file timestamp refreshes.
- Run `node --check` on every changed file first, since a syntax error causes a crash loop.
- Never `Stop-Process` by name `node`. Confirm before killing anything serving live traffic.
**When I reach for it:** Restarting a supervised bot, a `run.js`-style watcher, or any long-running background process after a code change. Used once in 45 days.
**Why it is efficient:** The file says the stop tool's success message was untrustworthy on three logged occasions, so PID-level verification avoids reporting a restart that did not happen. Killing only the child avoids taking the whole service down.
**Watch out:** Windows and PowerShell only, with machine-specific notes about a Tauri app lock.

### `zombie-process-sweep`
**Uses (45 days to 2026-09-26):** 1
**What it does:** Finds and safely kills orphaned dev servers and watchers left running at the end of a session.
**How it works:**
- List real processes with `Get-CimInstance Win32_Process` and match on `CommandLine`.
- Identify supervisor versus child. Kill only the child if a live reload is the goal.
- Kill only what can be tied to this session, or is clearly orphaned and matches a known dev-server command shape (`next dev`, `vite`, `npm run dev`, `tauri dev`).
- Never use a broad "looks old" heuristic. A dead-parent check alone caused false positives on live processes.
- Verify with `Get-Process -Id <pid>` and check the port is actually free.
**When I reach for it:** End of any session that started a background server or watcher, and when a dev server seems hung. Used once in 45 days.
**Why it is efficient:** The file says the "dev server hanging" failure recurred several times, silently holding a port or CPU. A fixed, narrow signature avoids both leftovers and killing live processes.
**Watch out:** Windows and PowerShell commands only.

## Team operations

### `discord-todo-ops`
**Uses (45 days to 2026-09-26):** 0
**What it does:** Wraps a Discord-backed shared team todo list into one skill: scripts add and edit tasks, while Discord itself handles claiming and completing.
**How it works:**
- Add a task with `node .../add-todo.js "task text" --by "<agent label>"`.
- Edit a task with `edit-todo.js`, matching by id or text substring. It rewrites the task text and its Discord post.
- If the task was already accepted, editing should push an update to that person's progress channel.
- Complete is a human reaction in Discord. Claim is a Discord slash command. Neither is scripted.
- For anything else against the bot, write a disposable script following the bot project's own conventions.
**When I reach for it:** Adding, editing or checking status on a shared team todo list backed by a Discord bot. Not used in the 45-day window.
**Why it is efficient:** Structural saving: one place holds the exact script forms, so they are not re-derived each time. The human-only complete and claim steps keep the audit trail of who did what honest.
**Watch out:** Needs a specific Discord bot project with those scripts. It is not usable without that setup.

## Skills I use that come from other people

These are not in this repo. Built-in skills have no file I could read, so those entries stay short and describe only what the skill's own listing says.

### `brainstorming`  (source: Superpowers plugin)
Upstream: https://github.com/obra/superpowers
**Uses (45 days to 2026-09-26):** 39
**What it does:** Runs a design conversation before any creative or feature work. No code is written until a design is presented and approved.
**How it works:**
- Explores project context first: files, docs, recent commits.
- Asks clarifying questions one at a time, then proposes 2 to 3 approaches with trade-offs and a recommendation.
- Presents the design in sections and gets approval after each. A hard gate blocks any implementation until then.
- Writes the approved design to a spec file, runs a self-review for placeholders, contradictions, scope and ambiguity, then asks the user to review it.
- Ends by invoking writing-plans. It names no other implementation skill as a next step.
**Why it is efficient:** The skill says unexamined assumptions in "simple" projects cause the most wasted work, and it applies YAGNI to cut unneeded features before any code exists. Structural saving: fixing a design on paper is cheaper than rewriting code. No figures are stated in the skill.

### `systematic-debugging`  (source: Superpowers plugin)
Upstream: https://github.com/obra/superpowers
**Uses (45 days to 2026-09-26):** 21
**What it does:** Forces root cause investigation before any fix is proposed. Covers test failures, bugs, build failures, performance and integration problems.
**How it works:**
- Phase 1: read errors fully, reproduce, check recent changes, and add diagnostic logging at each component boundary in multi-component systems.
- Phase 2: find a working example and list every difference from the broken code.
- Phase 3: state one hypothesis, test it with the smallest possible change, one variable at a time.
- Phase 4: write a failing test, make a single fix, verify. After 3 failed fixes, stop and question the architecture.
- Includes a red flags list and a rationalizations table to catch guess-and-check habits.
**Why it is efficient:** The skill states systematic debugging is faster than guess-and-check thrashing, and that changing several things at once makes it impossible to tell what worked. The 3-fix cap stops repeated patching of a wrong design. No numbers are given.

### `writing-plans`  (source: Superpowers plugin)
Upstream: https://github.com/obra/superpowers
**Uses (45 days to 2026-09-26):** 14
**What it does:** Turns a spec into a step-by-step implementation plan written for an engineer with no context. Plans are saved as a file with a required header.
**How it works:**
- Maps files to create or modify before defining tasks, with one clear responsibility per file.
- Each step is one 2 to 5 minute action: write failing test, run it, implement, run again, commit.
- Each task lists files, plus the interfaces it consumes and produces, so tasks can be read on their own.
- Bans placeholders such as "TBD", "add error handling" or "similar to Task N". Code steps must show the code.
- Ends with a self-review for spec coverage, placeholders and type consistency, then offers subagent-driven or inline execution.
**Why it is efficient:** Structural saving: a plan with exact paths, code and interfaces lets a fresh subagent implement one task without reading the whole plan or the session history. The skill states no figures.

### `subagent-driven-development`  (source: Superpowers plugin)
Upstream: https://github.com/obra/superpowers
**Uses (45 days to 2026-09-26):** 6
**What it does:** Executes a written plan by dispatching a fresh implementer subagent per task. Each task gets a spec and quality review, and a broad review runs at the end.
**How it works:**
- Works in an isolated worktree and keeps a ledger file per plan, so progress survives context compaction.
- Hands subagents files (task brief, report file, review package) instead of pasting text into prompts.
- Per-task fix loop is capped at 5 rounds. Rounds 1 to 3 resume the implementer, rounds 4 to 5 use a fresh, more capable model.
- Picks the least powerful model that fits each role, and requires the model to be set explicitly on every dispatch.
- Runs one final whole-branch review on the most capable model, then one fix wave for any findings.
**Why it is efficient:** The skill says pasted content stays in the controller's context and is re-read every turn, so it passes files instead. It also says an omitted model inherits the expensive session model, and that the ledger prevents costly re-dispatch of finished tasks. One real session is described as having a 42k character dispatch that was 99% pasted history.

### `karpathy-guidelines`  (source: claude-super-skill-library)
Upstream: https://github.com/SamuelNDCE/claude-super-skill-library (skills/misc-utilities/karpathy-guidelines)
**Uses (45 days to 2026-09-26):** 19
**What it does:** Behavioral rules to reduce over-engineering when writing, reviewing or refactoring code. It biases toward minimal, surgical changes with a checkable result.
**How it works:**
- Think before coding: state assumptions, present multiple interpretations, push back if a simpler approach exists.
- A laziness ladder: skip if not needed, then stdlib, native platform feature, installed dependency, one line, and only then minimal new code.
- Surgical changes: every changed line must trace to the request. Mention unrelated dead code, do not delete it.
- Verify: turn tasks into verifiable goals and leave one runnable check for non-trivial logic.
- Never simplify away input validation, data-loss error handling, security or accessibility basics. Output is code first, then at most three short lines.
**Why it is efficient:** The skill states the best code is code never written, and that the shortest working diff wins. It also notes 200 lines that could be 50 should be rewritten. No measured figures are given.

### `claude-api`  (source: Claude Code built in)
**Uses (45 days to 2026-09-26):** 16
**What it does:** Reference for the Claude API and Anthropic SDK: model ids, pricing, params, streaming, tool use, MCP, agents, caching, token counting and model migration.
**How it works:**
- Per its listing description, it triggers when a prompt names Claude or Anthropic, asks about LLM pricing, model choice or limits, or is an LLM-shaped task with no provider stated.
- It says to read the skill before opening the target file, even for a one-liner.
- It skips when another provider is being worked on, checked by a grep for other provider names in the project.
**Why it is efficient:** Structural saving: the description says never to answer LLM pricing or model questions from memory, so it replaces guessing with a current reference.

### `artifact-design`  (source: Claude Code built in)
**Uses (45 days to 2026-09-26):** 13
**What it does:** Design guidance and fundamentals for Artifacts (published pages).
**How it works:**
- Per its listing description, it must be loaded before writing any artifact, including a Markdown one.
- The listing says Markdown is never a shortcut past the design pass.
**Why it is efficient:** Structural saving: one load gives the page contract and design rules up front, so the artifact is not redone.

### `security-review`  (source: Claude Code built in)
**Uses (45 days to 2026-09-26):** 10
**What it does:** Completes a security review of the pending changes on the current branch.
**How it works:**
- Per its listing description, it reviews the pending changes on the current branch.
**Why it is efficient:** Structural saving: it scopes the review to the branch diff rather than the whole repo.

### `supabase`  (source: Supabase)
Upstream: Supabase's own skill, not linked here
**Uses (45 days to 2026-09-26):** 8
**What it does:** Guidance for any task involving Supabase: database, auth, edge functions, realtime, storage, CLI, MCP, migrations, security and debugging.
**How it works:**
- Verify against the current changelog and docs before implementing, since features change often.
- Verify every fix with a test query, and stop and rethink after 2 to 3 failed attempts.
- Security checklist: enable RLS on exposed tables, never use user_metadata for authorization, keep service keys out of clients, use security_invoker on views, avoid SECURITY DEFINER for permission errors.
- Discover CLI commands with --help and use MCP execute_sql for schema iteration, generating a migration when ready.
- Fetch the monitoring and debugging docs before diagnosing any Supabase error.
**Why it is efficient:** Structural saving: it sends the agent to current docs and named security traps first, avoiding fixes built from stale memory. The skill states no figures.

### `supabase-postgres-best-practices`  (source: Supabase)
Upstream: Supabase's own skill, not linked here
**Uses (45 days to 2026-09-26):** 9
**What it does:** Postgres best practices from Supabase, loaded before writing or changing schema, migrations, RLS, indexes, functions or queries. Covers slow query diagnosis too.
**How it works:**
- Rules are grouped in 8 priority categories, from query performance, connection management and security and RLS (critical) down to advanced features (low).
- Each rule lives in its own reference file, read on demand.
- Each rule file has an explanation, incorrect versus correct SQL, and sometimes EXPLAIN output.
**Why it is efficient:** Structural saving: only the relevant rule files are read rather than a whole guide. The abstract says rules are prioritized by impact, so critical ones come first.

### `run`  (source: Claude Code built in)
**Uses (45 days to 2026-09-26):** 7
**What it does:** Launches and drives the project's app to see a change working in the real app, not just tests.
**How it works:**
- Per its listing description, it first looks for a project skill that already covers launching the app.
- Otherwise it falls back to built-in patterns per project type: CLI, server, TUI, Electron, browser-driven, library.
**Why it is efficient:** Structural saving: it reuses an existing project launch skill when one exists instead of rediscovering how to start the app.

### `update-config`  (source: Claude Code built in)
**Uses (45 days to 2026-09-26):** 6
**What it does:** Configures the Claude Code harness through settings.json: hooks, permissions, environment variables and hook troubleshooting.
**How it works:**
- Per its listing description, automated behaviors ("from now on when X") need hooks in settings.json because the harness runs them, not Claude.
- It also covers permissions and env vars, and points simple settings like theme or model to the /config command.
**Why it is efficient:** Structural saving: it routes "whenever X" requests to a hook that actually runs, rather than a memory note that cannot enforce anything.
