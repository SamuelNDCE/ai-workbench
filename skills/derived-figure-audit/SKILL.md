---
name: "Derived Figure Audit"
description: "Audit every number in a technical document against its stated primitives before it ships or gets pitched. Use when asked to check, audit, review, sanity-check or 'look over' a whitepaper, spec sheet, cost model, panel set, engineering deck, screenplay breakdown or any document whose numbers are derived from other numbers. Also use after raising or changing any input parameter, because stale labels and half-finished edits are the dominant defect. Covers physics-ceiling checks, same-quantity-derived-twice, deriving from the deliverable rather than the sources, and when to escalate instead of silently fixing."
---

# Derived Figure Audit

## What This Skill Does

Takes a document full of derived numbers and proves each one, rather than reading it for plausibility. It exists because the defects that survive are never the obviously wrong ones. They are internally consistent, well-formatted, and wrong.

Track record it is built from: a two-order-of-magnitude error in a headline cost line that had survived a deliberate design decision to introduce it (2026-08-06 KERAUNOS REV F), and seven real defects across a 52-page PDF that had been read many times (2026-08-07). In both cases the document's own arithmetic was fine. The inputs were not.

## The Method

### 1. Extract the primitives first

Find the small set of stated inputs everything else hangs off. In a cost model that is usually a handful: a velocity, a mass, a track length, a $/kg. Write them down before reading anything else.

Then recompute every derived number from those primitives yourself, in a script, not in your head. Save the script next to the document. The REV F audit wrote `selene_rev_f_audit.py` and it is the reason the finding was defensible rather than an assertion.

### 2. Check each primitive against a physical or market ceiling

This is the step that finds the expensive defects, and it is the step that gets skipped because the arithmetic all reconciles.

The REV F sheet stated 6.7 MWh of SMES storage in 18 t. Every downstream number derived from that correctly. But 6.7 MWh / 18 t is 372 Wh/kg, and SMES specific energy is capped by the Virial theorem near 10 to 20 kJ/kg. That is 67x to 134x over a hard ceiling, confirmed across four independent sources. Real mass 1,206 to 2,412 t, and delivery alone exceeded the entire project budget.

So: for each primitive, ask what physical law, published benchmark, or market price bounds it, and go find that bound in a real source. A number can be arithmetically perfect and physically impossible.

Related trap, from the same audit: the sheet's own change note recorded that storage moved **from flywheels to SMES**. That was the wrong direction by a factor of ~20 in specific energy. **When a document records a decision to change something, check the direction of the change, not just the current value.**

### 3. Grep for the same quantity derived twice

The single most productive search. Any quantity that appears in more than one place will eventually disagree with itself.

Real instances found:

- `Build: L = 5.0 km` labelling a formula that substitutes 10,000 m. A stale label that survived a 5 km to 10 km raise.
- The same 10 km track derived twice under two different names, using a = 282 and a = 285 m/s².
- E = 0.79 kWh/kg quoted for v = 2.43 to 2.66 km/s in one phase and for v = 2.38 km/s in another. Both wrong, and wrong in different directions.
- `grows to ~50 km (3 g)` on one panel while another panel said "~48 km puts ESCAPE at 6 g; 3 g crew-rated ~96 km". The document contradicted itself.
- One row quoting ~73,000 t/yr where the rest of the sheet said ~72,000.

Method: build a list of every distinct physical quantity in the document, then grep each one's value and unit across all sources. Disagreement is the finding. You do not need to know which one is right to report it.

### 4. Audit the deliverable, not the sources

Grep the extracted text of the thing that actually ships. If the deliverable is a PDF, run `pdftotext` and audit that.

The 2026-08-07 audit found the last defect, a wrong annex cover, only because it audited PDF text. That cover was generated in `keraunos_pdf_build.py`, and every previous grep over the HTML sources had missed it. Build scripts emit copy too.

### 5. Enumerate the whole domain, never the reported instances

When you find a classification bug, run the predicate over every row and prove the count.

The SZIEIC override table fixed beats 1 and 9 because those were the two that got noticed, and left beat 7 broken for four days. The accompanying comment said "two beats span two setups", which froze the wrong count into the source as an authoritative-sounding statement. Three beats did.

**Then encode the invariant as a check, in the same commit.** A comment rots into a false claim the moment a third case appears. A check re-derives the answer every build:

```python
conflict = [s["shot"] for s in shots
            if bool(CAM.get(s["shot"])) != (s["setup"] != "C")]
```

**Then prove the check discriminates.** A guard added after the data is already clean reports 0 and tells you nothing. Force the bug back in and confirm it names exactly the right rows. A guard that has never once failed is decorative.

### 6. Anything derived must be computed where it is used

Two rules from figure and layout work that generalise:

- **Anything derived from a heading must be computed from that heading in the same code that draws it.** If one element of a figure comes from real data and its neighbour comes from a hardcoded guess, the figure is lying at the seam.
- **A constant that encodes a geometric or regime assumption must be re-checked whenever the regime changes.** `W_CORR = 12.0` was correct for a 5 m berm and nonsense afterwards.
- **Page numbers are derived.** Anything quoting a page number is derived too, and a rebuild invalidates it silently. Never write a page number down as a fact without re-deriving it after the next build.

```bash
pdftotext deliverable.pdf - | awk 'BEGIN{p=1} /\f/{p++} /SECTION MARKER/{print p, $1, $2}'
```

### 7. For minimisations and optimisations, state the bound

Before solving any minimisation, state what stops the objective going to negative infinity, and name the specific constraint that does it. If no constraint bounds it, the model is wrong, not the answer.

## Escalate, Do Not Silently Fix

Fix defects that are locally contained. **Escalate anything that moves a headline figure the user pitches with.**

The 2026-08-07 audit found lunar escape velocity stated three ways: 2,376 / 2,380 / 2,385 m/s. The physically correct value is 2,376.1, verified. But the entire economic chain hung off 2,385: 0.94 kWh/kg wall-plug, 8,378 t/MW/yr, 72,889 t/yr, $5.80 to $6.78/kg. Recomputing from the correct constant moved throughput +0.8% and $/kg -2%, across roughly 25 edits in three files and a build script.

That was left for the user, because those are numbers he pitches with. Correct call. A silent 2% change to a figure already in a public deck is worse than a flagged one.

Escalate rather than fix when the change would:

- move a number that has already been published, pitched, or quoted externally
- cascade across more than a handful of files
- change a headline $/kg, throughput, price, or capability figure
- require re-deriving a chain you cannot fully see

Report the recomputed value, the delta, and the edit surface. Let him decide.

## Record What Verified Correct

Non-obvious, and it pays for itself. Write down the checks that passed, with the arithmetic, so the next session does not re-audit them.

From the 08-07 audit, recorded as verified: the Panel F cost breakdown sums exactly ($1,885M + $800 to 1,500M + $1,494M = $4.179 to 4.879B, precisely the stated $/kg over 720,000 t); the SMES footnote arithmetic; Panel H's bore ladder being fully self-consistent because shot mass scales with bay area not bore; the Δv chart correctly labelling kinetic energy as muzzle energy.

Also record **near-misses that are not defects**, with why. Two apparent contradictions in the KERAUNOS roadmap were a development ladder versus a deployment sequence, and an Earth demonstrator's g-target versus SELENE's. Reading two numbering schemes as one thing is the obvious trap, so the note now says so explicitly. Without that, every future audit re-flags them.

## Presentation Defects Count

Not every finding is arithmetic. The REV F audit's first workstream was entirely presentational and entirely real:

- `$2.3 to 2.8B` sitting next to `$3.85/kg` implied the latter was the band's midpoint. It was the 94th percentile.
- A "50 to 500x cheaper" tile compared an amortized $/kg against a delivery price. Not like-for-like, because the amortized figure cannot launch what is not already on the Moon.

A number that is true and framed to be misread is a defect. Check that every comparison is like-for-like and every point estimate is identified as point, midpoint, or bound.

## Output

Report in four groups:

1. **Fixed**, with file:line and the before/after value
2. **Verified correct**, with the reproducing arithmetic
3. **Not a defect**, with why, so it stops getting re-flagged
4. **Escalated**, with recomputed value, delta, and edit surface

Then log to the relevant `wiki/logs/` category and, if a new class of defect appeared, write the lesson to `wiki/Mistakes & Fixes/`.

## Related

`verify-dont-trust` for the general verification discipline. `capability-claim-grounding` for the copy-side equivalent, where the claim is about a product rather than a number.
