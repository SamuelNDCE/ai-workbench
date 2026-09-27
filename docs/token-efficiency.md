# Token efficiency: how I do the same work for less

This is how I keep token spend down without doing less. Every number here is one I measured, and each
says where it came from. Where something is a rule of thumb or a guess, it says so.

Tokens are spent in three places, and each needs a different fix:

| Where the tokens go | What it looks like | Fix |
|:---|:---|:---|
| **Fixed cost** | Loaded into every session before you type a word: your instructions file, the skill list, plugins | Measure it, then trim |
| **Per-turn cost** | Tool output, file reads, web results, screenshots | Read the cheap way first, and read only what you need |
| **Multipliers** | Sub-agents, model choice, long sessions | Name the model, keep fan-out small, hand off instead of dragging history |

## Start by measuring

Two scripts in this repo, no dependencies, read-only:

```bash
node scripts/measure-context.cjs
```

```bash
node scripts/usage-report.cjs --days 45 --since 2026-09-07
```

The first reports what loads into every session. The second counts skill use, sub-agent dispatches and
how many of those named a model, from your own transcripts. Both work in bash and PowerShell.

**My numbers on 2026-09-26.** Token figures are characters divided by 4, a rough rule of thumb for
English text and not a tokenizer.

| What loads | Size | About | When |
|:---|---:|---:|:---|
| Global instructions file | 64,417 chars, 587 lines | 16,100 tokens | Every session |
| Skill descriptions, 79 skills | 32,315 chars (average 409, longest 936) | 8,100 tokens | Every session |
| Skill bodies, 79 skills | 475,155 chars | 118,800 tokens | **Only when a skill is invoked** |
| Plugins | 9 enabled, 13 switched off | | Each enabled one adds its skills to the list |

Two things stand out. First, the skill design is doing its job: bodies are about 15 times larger than
descriptions, and only the descriptions are paid for up front. Second, **my global instructions file is
the biggest fixed cost I have, and it is too big.** It grew because each mistake earned a paragraph.
Trimming each rule to a line and moving worked examples into the notes that record them is the first
optimisation I have not done yet. If you take one thing from this page, measure yours before you write
another rule into it.

## Fixed costs: cut what loads every session

**1. Keep the global file to rules that hold everywhere.** A rule for one project goes in that
project's `PROJECT.md`, which a hook injects once per session per project (a 40,000 character cap, and
it names any section it had to drop). Reference material goes into a skill, so it loads only when
relevant. One block of about 7 KB that used to sit in my global file now lives in a skill for exactly
this reason.

**2. Write skill descriptions as tight trigger sentences.** The description is the only part every
session pays for, and it is also all the model sees when deciding whether to load the skill. Say what
it does and when to use it, in a sentence or two. My longest is 936 characters, which is too long: the
average of 409 is a better target to stay under.

**3. Switch off plugins you do not use.** 13 of my 22 are off. Each enabled plugin adds its skills and
commands to the list every session pays for.

**4. Give every injection a budget.** My two note-injecting hooks are capped: the lessons hook shows
at most 20 lessons at 150 characters each, and the related-notes hook shows at most 4 notes at 180
characters of snippet. A hook that injects without a cap turns a helpful reminder into a per-turn tax.
See [`hooks/`](../hooks/README.md).

**5. Inject once, not every prompt.** The `PROJECT.md` loader remembers what it has already shown this
session and prints nothing on later prompts.

## Per-turn costs: read the cheap way first

**6. Search wide, read narrow.** Measured on my own web tools with a tokenizer (2026-08-16, using
cl100k_base as a proxy for Claude's, so absolute counts are a few percent off and the ratios are the
point):

| Job | Tokens |
|:---|---:|
| Search, 1 query, 10 results | 566 |
| Read 1 page, capped at 2,000 characters | 655 |
| Read 1 page, capped at 6,000 characters | 1,909 |
| Load a JavaScript page in a real browser | 1,755 |
| Page snapshot from a real browser | 2,289 |
| A 4-step browser interaction, one call | 155 |
| Search, 5 queries at once | 2,833 |
| Search, 20 queries at once | 11,734 |

A whole 10-result search costs less than a third of one page read. If a snippet already answers the
question, opening the page costs about three and a half times more for the same answer. Check snippets
first.

**7. Fanning out queries saves time, not tokens.** Tokens per query stay flat at 560 to 587 whether you
send 1 or 20, while wall-clock time per query falls about 16 times. To save tokens you need the levers
below.

**8. Pull the levers on results.** Cost is linear in results, so trim them: lowering `num_results`
took 3 queries from 2,796 to 949 tokens (10 to 3 results each). Capping the snippet length cut cost per
result from 57 tokens to 44 at 80 characters and 37 at 40. A search tool that ignores your `num_results`
above a certain point (the default backend here returns about 10 whatever you ask) makes raising it a
waste.

**9. A screenshot costs about 70 times a text read** once the downstream vision tokens are counted
(my estimate, not a benchmark). Take one only when the visual is the question: layout, a chart, a
rendering bug. "What does this page say" is never a screenshot.

**10. Batch steps into one call.** A four-step browser interaction in one call returned 155 tokens of
result. Four separate calls pay the round trip four times.

**11. Send big tool output to a file, then search the file.** On 2026-09-26 I fetched two documentation
pages in one call. The result was 77,308 characters, which the tool saved to disk instead of returning.
I searched that file for the one variable I needed and read roughly 600 characters, instead of reading
the lot. Use `grep` with context, `head`, or a `Read` with an offset and limit. Never read a whole file
to find one line.

**12. Use a code graph for relationship questions and `grep` for location questions.** I measured this
in my own codebase (2026-08-18, in bytes rather than tokens). For "what calls this and what breaks if I
change it", a call-graph query returned 4,481 bytes against 31,011 for a broad grep, about 6.9 times
less, over three real symbols. For "where is `X` defined", a targeted grep won by about 15 times (65
bytes against 1,079). A blanket "always use the graph" rule makes the second case worse.

**13. Load a tool's schema only when you are about to call it.** In Claude Code, deferred tools are
listed by name and cost nothing until you fetch their schema. Fetch them in one batched call right
before use, not one at a time and not "just in case".

**14. Batch independent reads into one parallel call**, and never re-run a slow command whose output is
already in front of you. Save expensive output to a scratch file if you will need it again.

**15. Answer in chat, not in a file.** Building an HTML page for a comparison that fits in a table
costs generation tokens and a context switch, and the reader usually did not want it. A page earns its
place when the shape of the data is the point: a trend, a network, something you will return to.

**16. Run long commands in the background and wait for the completion signal.** Each poll is a turn.
Never sleep-loop.

## Multipliers: the expensive part

**17a. Tier by price, not by habit.** Pick a cheap model, roughly under $10 to $15 per million output
tokens on whatever provider you use, and default to it for the vast majority of work: routine
execution, research, code review, day-to-day sub-agent dispatches. That tier is enough for almost
everything a coding agent does. Reserve a flagship, more expensive model (on Claude, that is Opus or
Fable rather than Sonnet or Haiku) for the small slice that actually needs it: a security review, a
hard architecture call, or planning and judgement the main thread itself does. This is a policy, not a
measurement: I have not benchmarked quality against price here, so treat the split as a starting point
and adjust it against your own results.

**17. Name the model on every sub-agent dispatch.** A dispatch that leaves the model out inherits the
main session's model. If that is your most expensive one, a research run quietly becomes very
expensive. Research, execution and review run on the cheaper model, and the main thread plans and
makes the hard calls. The Superpowers `subagent-driven-development` skill says the same and requires
the model to be set explicitly on every dispatch.

My own adherence, from `usage-report.cjs`: naming a model went from 42% to 72% of dispatches after I
wrote the rule down, and about 28% still leave it out. A rule in a file is a nudge. See the table in
[how-i-use-claude-code.md](how-i-use-claude-code.md#what-the-numbers-say).

**18. Keep fan-out small.** One large research session ran 16 agents where 3 or 4 would have answered
the question. Ask what the smallest set of genuinely independent branches is. Fold "re-check your most
important numbers, there is no separate verifier" into the researcher's own prompt instead of adding a
second agent. At most two multi-agent runs at once.

**19. Hand sub-agents files, not pasted text.** Anything pasted into your own context is re-read every
later turn. The same skill cites a real dispatch that reached 42,000 characters, 99% of it pasted
history. Write the brief to a file and point the sub-agent at it.

**20. Delegate broad searches and keep the conclusion.** An exploration agent that sweeps many files and
reports back one answer keeps the file dumps out of your main context. Use one when answering means
reading across several places. Do not use one for a single lookup where you already know the file.

**21. Hand off instead of running long.** A long session drags everything it has read into every later
turn, and drifts as early decisions get compressed away. When work stops midway, write a self-contained
handoff file and resume from it in a fresh session. `session-handoff` is my most-used skill by a wide
margin. See the [skills catalog](skills-catalog.md#keeping-work-alive-across-sessions).

**22. Get the prompt right once.** A messy prompt costs a clarifying round trip, or worse, a whole task
run on a blurry goal. The `braindump` family turns a ramble into a clear prompt in one pass, and
`dictation-garble-catcher` catches a misheard word before it is acted on. These are structural savings.
I have no measurement of them, and I would not invent one.

## Do this in ten minutes

1. Run `node scripts/measure-context.cjs`. Note the instructions size and the skill description total.
2. Open your instructions file. For each rule, ask: does it hold in every project? If not, move it to
   that project's `PROJECT.md`. Is it reference rather than a rule? Move it into a skill.
3. Switch off plugins you have not used this month.
4. Run `node scripts/usage-report.cjs --days 30`. If a large share of dispatches left the model out,
   add the rule, then add a hook if it must hold.
5. Cap any hook that injects text, and make it silent when it has nothing to add.
6. Next time you need one fact from a big page or file, save it to disk and search it.

## What I would not claim

- **Prompt caching.** It can make repeated context cheaper, and I have not measured what it does to my
  fixed costs, so none of the figures here assume it.
- **Savings from the prompt-fixing skills or from verification skills.** They avoid rework, which is
  real but I have not measured it.
- **The web token counts are a proxy.** They use a GPT tokenizer, not Claude's. The ratios between
  tools hold. The absolute counts will be a few percent off.
- **Counts drift.** Transcripts keep growing, so a rerun of `usage-report.cjs` a few hours later gave
  slightly higher totals than my first pass. Date-stamp any figure you write down.
