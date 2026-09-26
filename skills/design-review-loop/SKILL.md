---
name: design-review-loop
description: The working loop for UI, design and website work with the user. Do a large batch of changes autonomously, self-check them including visual verification, then hand back a single numbered walkthrough that tells him exactly what to look at and in what order. Use whenever doing multi-change UI work, redesigns, new pages or components, website building, or any batch of visual changes that will end in him reviewing it. Also use when they say "do all the tasks", "we'll do one big review", or asks for a list of things to look at.
---

# Design review loop

the user's stated working pattern, 2026-08-14, verbatim intent:

> "You should basically do a ton of changes. You check your own work and make sure you don't leave
> any glitched designs where words don't fit in or shit like that. But then I will do a major
> review, which will cover a bunch of things so you can continue your work. And you kind of have
> your own little loop, but then you'll come to me every once in a while."

They explicitly asked for this to be the default for "designing work, UI like this, and websites and
shit like that".

## The loop

**1. Batch, do not drip.** Work through the whole list of changes before coming back. Do not stop
after each one for approval. Interrupting them per change is the thing this loop exists to prevent.

**2. Self-check every change before it counts as done.** Not "it compiles". See the checklist below.

**3. Come back with a numbered walkthrough, not a summary.** One item per thing to look at, in the
order they should look at it, each saying where to click and what specifically to judge. They review
once, covering everything.

**4. They review in one pass, you continue.** Their feedback covers the whole batch, then the loop
restarts.

## When to break the loop and ask early

Only these. Everything else waits for the review.

- A decision that changes what gets built, where guessing wrong wastes the batch.
- Something destructive or hard to reverse.
- A blocker that stops the rest of the batch.

## Self-check before handing back

Compiling is not checking. This is the part that makes the loop work, because a batch full of
glitches costs them more than doing it one at a time would have.

**Visual, and this is the half that gets skipped:**

- **Actually look at every section you changed.** Invoke `ui-change-visual-verify`. Screenshot it.
- **Text overflow.** Long strings, long names, long URLs. They called this out by name: "words don't
  fit in". Check the longest realistic content, not the placeholder.
- **Empty, loading and error states**, not just the happy path.
- **Both themes, and every colour mode.** They have said before that a problem was true "even with the
  other color modes".
- **Narrow widths.** Things that fit at full width and break at 1000px.
- **Global selectors capturing new markup.** Grep the stylesheet for bare element selectors and any
  id you just used. This has bitten before.
- **Undefined CSS custom properties.** They fail silently and look plausible. Verify every token
  you reference actually exists.

**Functional:**

- The project's real build command, the one that genuinely compiles the thing.
- Full test suite, and say the numbers.
- Nothing left running. Kill dev servers and watchers.

**Honesty:**

- Anything you could not verify gets said plainly in the walkthrough, not omitted.

## The handback format

```
## Walk through these in order

1. **<Thing>**: <where to go>. Look at <the specific thing to judge>.
2. **<Thing>**: ...

## What I could not verify
- <thing>, because <reason>

## Decisions I need from you
- <only real ones, cut the section if empty>
```

Rules for the list: ordered so each builds on the last, one screen or surface per item, and each
item names what to judge rather than just what changed. "Look at the connector hub" is useless.
"Open the hub from the bottom-right button and check the connector names do not wrap at 1000px" is
the format.

## Anti-patterns

- Handing back a prose summary instead of a numbered list. They asked for "literally one by one".
- Reporting done on something never looked at. Say it was not visually verified instead.
- Asking mid-batch about something that could have waited.
- A walkthrough item per file changed. Group by surface they can actually look at.

Related skills: `ui-change-visual-verify` for the screenshot discipline, `impeccable` for the design
work itself, `verify-dont-trust` for not taking your own word for it.
