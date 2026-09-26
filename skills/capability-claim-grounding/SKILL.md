---
name: "Capability Claim Grounding"
description: "Prove every capability claim in public-facing copy against the build before writing or publishing it. Use when writing or editing marketing site copy, landing pages, feature comparison tables, pricing tiers, structured data / JSON-LD, README feature lists, app store text, a LinkedIn or launch post, or a privacy policy. Also use when asked to 'add more detail' or 'improve SEO' on an existing page, because the existing claims must be checked first. Covers the connectors-that-do-not-exist failure, edition-boundary drift, and why a policy and its code change must ship in one commit."
---

# Capability Claim Grounding

## What This Skill Does

Treats every sentence of public copy as a factual claim about a build, and sources it from the build. It exists because the failure is silent and asymmetric: nobody reviews a marketing page against source code, so a false claim can sit on a homepage for months as the *lead* selling point.

Built from 2026-08-09, when a request for "more feature detail for Google and AI-engine indexing" turned into a correction job. The site claimed in six places, including the homepage and as the lead selling point of the Business edition, that a notes vault "connects to accounting, email, timesheets and bank". Grepping the entire product for `xero|quickbooks|timesheet|bank feed|open banking` returned nothing. Not in Rust, not in Svelte, not in docs, README or CHANGELOG.

## The Core Rule

**A capability claim on a marketing site is a factual claim about a build, so source it from the build.**

Not from memory, not from an older page, not from a plan document, not from what the product is going to do. From shipped code, `CHANGELOG.md`, or the README feature table.

**Attribution is not verification.** Copying a claim from a README into a landing page launders stale text into apparent fact. The 2026-07-27 CLAUDE.md rewrite introduced five new false claims this exact way, all sourced from a stale README that was cited rather than tested.

**Verify what you write at least as hard as what you delete.** Removal feels like the risky operation and authoring feels like summarising. It is the reverse. A deleted false claim harms nobody. A newly written one gets trusted.

## Before Adding Detail, Audit What Is There

When asked to expand, enrich, or SEO-optimise a page, **check the existing claims first**. Publishing more detail on top of false claims only amplifies them. The 08-09 session caught this and became a correction job instead of an expansion job. That was the right inversion.

## The Audit Procedure

### 1. Build the claim inventory

Extract every capability assertion from the page: verbs like connects, integrates, syncs, supports, runs on, sends, imports. Include structured data and metadata, which nobody reads and everybody trusts.

### 2. Grep the product for each claimed capability

One grep per claimed integration or feature, across the whole product, not just source:

```bash
grep -rEi 'xero|quickbooks|timesheet|bank feed|open banking' \
  --include='*.rs' --include='*.ts' --include='*.svelte' --include='*.md' .
```

Zero hits is the finding. Then get the real list from a single authoritative source and cite the line: the real connector list was Shopify, YouTube, Meta Ads, Google Search Console, GitHub, RSS, from `CHANGELOG.md:33`.

### 3. Read the Known Issues section

This is where the contradictions hide. CHANGELOG Known Issues, verbatim: *"Wire cannot send. Wire's registered surface is read, draft, approve, dismiss and channel management. There is no outbound transport of any kind."*

The site said "Wire channels and email in the same place as the work", which reads as working two-way messaging. Rewritten to read-and-draft with drafts waiting in the approvals queue.

**A Known Issue is a claim constraint.** Every entry there should be checked against the copy.

### 4. Check structured data separately

JSON-LD and meta tags are claims with the same legal and reputational weight as body copy, and they get read by machines that will not apply judgement.

`operatingSystem: 'Windows, macOS, Linux'` was false. CHANGELOG: *"Windows only. The build targets the NSIS installer and nothing else."* Now `'Windows'`.

Also: **never justify structured data by a SERP feature without checking the feature still exists.** Google deprecates search-appearance features quietly. FAQ rich results were recommended in 2026 for a feature Google had killed in May.

### 5. Rebuild comparison tables against the source table, row by row

Do not spot-fix a feature matrix. Rebuild it. The 08-09 comparison table had:

- a row marked unavailable on the lower tier when it ships on every tier
- a row conflating two distinct capabilities, getting both wrong
- four real lower-tier features missing entirely, which **undersold** the product

Note that last one. Claim grounding is not only about removing overclaims. An unverified table understates as often as it overstates, and that costs sales.

### 6. Separate the subjects that share vocabulary

The single most dangerous step, and it nearly got lost.

Two other "accounting" mentions on the same homepage were about the **AI integration service**, bespoke consulting work that genuinely can connect anything. Those were true and were left alone. It was the *product's built-in* connector list that was limited to six.

**Before correcting a claim, identify which subject it is about.** A site that sells both a product and a service will use the same nouns for both. A sweep that does not distinguish them will delete true claims about one while fixing false claims about the other. Write the distinction into a code comment so the next pass does not re-sweep them.

Related: the site elsewhere described the product as both a product and a service, in schema and in copy, which is the same confusion at the level of the entity type.

### 7. Make prose-versus-data drift structurally impossible

Where copy quotes a count derived from data, render the count, do not type it.

A section subheading said "the bottom five" while four rows qualified. Fixed by rendering `BUSINESS_ONLY_COUNT`, computed as `COMPARISON.filter(r => !r.personal).length`. Prose and data can no longer disagree.

Apply this anywhere copy quotes a number that lives in a data structure.

### 8. Record deliberate omissions in code

Three editions exist. The site deliberately sells two. That is a decision, not an oversight: there is no public download, the JSON-LD offer is `PreOrder`, and the word "Free" would collide with a dozen "free consultation" CTAs on the same pages.

An undocumented deliberate omission looks exactly like a bug to the next session, which will "fix" it. Write the reasoning into a code comment above the data structure.

## Policies Are Claims With Legal Weight

A privacy policy is a statement of fact people are legally entitled to rely on.

**Any change to where user data goes must update the privacy policy in the same commit as the code change.** Not the next commit, not "before launch". The moment the route ships, the policy is false.

**And the policy may only describe what is already true.** When hardening produces both a code change and a script someone still has to run, the policy describes only the shipped half. A policy that ships ahead of the change is a false claim with a deadline attached.

## Images Are Claims Too

Never use AI-generated imagery depicting specific, recognisable products on a live commerce site, even as decorative background. It reads as inventory. Use genuinely abstract compositions, or real photography of products actually sold. When in doubt whether an image counts as a product claim, assume it does.

## Do Not Forget The Files Nothing Imports

After any substantial content change, explicitly re-read the files no build step touches, because nothing will ever flag them:

`public/llms.txt` · `robots.txt` · the sitemap · `README.md` · app store listings · social profile bios · pinned posts

## Verification Before Publishing

Check the **built static HTML**, not the dev server, and not your own diff:

```bash
grep -rEi 'timesheet|bank feed' out/ ; echo "exit $?"
grep -o '"operatingSystem":"[^"]*"' out/index.html
```

Do not start a dev server for this, and leave nothing running. The 08-09 session verified against the built output specifically to avoid both.

Then confirm the deploy actually shipped. See `vercel-git-deploy`, because a fast-forward merge can skip the production build entirely and leave every correction unpublished.

## Output

Report as: claim, where it appears (file:line, and count if it repeats), what the build actually says (with the citing line), and the correction. Separate genuine corrections from claims you checked and left alone, so the next pass does not re-open them.

Log to `wiki/logs/perpetual-technologies.md` or the relevant category. If a new class of false claim appeared, write the lesson to `wiki/Mistakes & Fixes/`.

## Related

`verify-dont-trust` · `vercel-git-deploy` for proving the correction shipped · `derived-figure-audit` for the numbers-side equivalent, where the claim is arithmetic rather than a capability.
