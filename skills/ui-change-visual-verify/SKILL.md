---
name: ui-change-visual-verify
description: Screenshot-verify every section you changed before calling a UI change done, and check the specific failure that CSS review cannot catch - global element and id selectors silently capturing a new component. Use after adding any page, section or component to an existing styled site, when text goes invisible or elements overlap, when told a page looks "bland" or "broken", and before reporting any visual work complete.
---

# UI Change Visual Verify

## The rule

**A UI change is not done when it compiles. It is done when you have looked at a picture of it.**

Build success, passing types and a correct-looking diff all say nothing about whether text is
readable or elements overlap. Those are properties of rendered pixels, and the only way to know
them is to render the pixels and look.

## Why this exists: global selectors capture new components silently

Both bugs below shipped in one session on a mature, heavily-commented codebase. Neither was
visible in the diff, because **neither was caused by the code in the diff.** They were caused by
selectors written months earlier that the new markup happened to match.

### Element selectors

```css
nav { position: fixed; top: 0; z-index: 100; }   /* the site header */
```

A breadcrumb trail is correctly marked up as `<nav>`. Adding one gave it `position: fixed` and
pinned it over the site header, on top of the logo. The breadcrumb component was correct. The
site header CSS was correct. The combination was broken.

Fix the selector, not the new component:

```css
nav:not(.breadcrumbs) { position: fixed; ... }
```

Check `nav::after` and friends too. Every bare element selector leaks, not just the base rule.

### Id selectors

```css
#product { background: #ffffff; }
#product .nv-text p { color: #4a5568; }   /* note: scoped to .nv-text */
```

A new page reused `id="product"` for its own section. It inherited the white background but
NOT the text colour, because the colour rule was scoped to a class the new markup did not use.
Result: white text on white background, completely invisible, on three pages at once.

**An id is a global selector, not a local name.** Prefix section ids per page (`svc-problems`,
`svc-approach`) so a new section inherits nothing it did not ask for.

### The general shape

Before adding a component, grep the stylesheet for what will match it:

```bash
grep -nE '^(nav|section|header|footer|main|aside|article|ul|ol) *[{,]' styles.css
grep -nE '^#(the-id-you-are-about-to-use)' styles.css
```

Zero hits means safe. Any hit is a rule you have just opted into without meaning to.

## The loop

Per section changed, not per page and not per PR:

1. **Change one section.**
2. **Screenshot it** at desktop width, scrolled so the section fills the frame.
3. **Look at the image.** Actually look. Check: overlapping text, invisible text, orphaned grid
   items, paragraphs with no gap between them, content colliding with a fixed header.
4. **If bad, fix and re-shoot.** Do not proceed to the next section carrying a known defect.
5. **Re-check at mobile width** once the desktop version is clean.
6. Only then move on.

### What to look for, since "it renders" is not the bar

- **Invisible text.** Anywhere a light band and a dark-band text colour meet.
- **Overlap.** Especially anything near a `position: fixed` header.
- **Orphans.** 4 cards in a 3-column grid, 5 in a 4-column grid. Either change the count or
  span the last item. A lone card in a wide empty row reads as a bug, because it is one.
- **Missing paragraph spacing.** Many resets zero out `p` margins; consecutive paragraphs then
  butt together and read as one block with a stray line break.
- **Dead space.** A hero with bottom padding followed by a section with top padding stacks both.

## Tooling notes (agent-browser on Windows)

These cost real time to rediscover.

- **`open <url>` can hang past any timeout** while still successfully launching the browser and
  navigating. Check for the process; the session is usually alive and every other command works.
  Navigate with `eval "location.href='...'"` instead and avoid `open` entirely.
- **`eval` shares one global scope across calls.** `const e = ...` in one call makes the next
  call using `const e` throw `Identifier 'e' has already been declared`, and the command
  "succeeds" enough that a following screenshot silently captures the wrong scroll position.
  Wrap every eval in `(function(){ ... })()` and use `var`.
- **Scroll to a section by id**, do not scroll by pixel counts that go stale the moment content
  changes: `(function(){var t=document.getElementById('x'); window.scrollTo(0,t.offsetTop-60); return 'ok';})()`
- Verify a fix at the computed-style level as well as visually when the bug was a CSS collision:
  `getComputedStyle(document.querySelector('.breadcrumbs')).position` should read `static`.

## Never run a production build against a live dev server directory

`next build` (and equivalents) while `next dev` is running on the same directory corrupts the
build output. The symptom is a runtime error naming a missing chunk, e.g.
`Cannot find module './331.js'`, and it appears **in the dev server**, so it looks like the code
change broke the page.

Recovery: stop the dev server, delete the build directory, restart dev.

```bash
# check first, every time
Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
```

During a screenshot loop you do not need a production build at all. The dev server hot-reloads
CSS and markup, so change, reload, shoot. Build once at the end, after dev is stopped.

## Reporting

Report defects found and fixed during the loop, not just the final state. "Checked and clean"
after three rounds of fixes is a different and more trustworthy claim than "looks good", and it
tells the next person which failure modes this page has already had.

## Related

`verify-dont-trust` for the general principle. `zombie-process-sweep` for stopping the dev
server afterwards if it was not explicitly requested to stay up.
