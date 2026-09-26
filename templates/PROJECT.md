# <project name>

> **What this file is.** The operational rules for this repo: the things that decide what you are
> allowed to do right now. A hook loads it at the start of every session (see
> `hooks/project-doc-hook.cjs`), so it applies whether or not anyone opened it.
>
> **Test for whether a fact belongs here:** would it change what I am allowed to do right now? If
> yes, it lives here. History and narrative live somewhere else. Nothing is duplicated between the two.

One or two sentences: what this project is and who uses it.

## Deploy

- **How it ships:** the real command or the real pipeline, not a guess.
- **What must be true first:** tests green, a specific branch, a version bump, a clean tree.
- **What gates it:** anything that blocks a deploy (a failing check, a missing approval).
- **How to confirm it landed:** the check that proves it is live. A push exit code is not proof.

## Verify before claiming it works

The exact commands that stand in for "does it actually work", in the order to run them.

```bash
# example, replace with this project's real ones
npm test
npm run build
```

Say what a pass looks like, and what does not count (for example: a type check alone).

## Environment

| Variable | Needed for | Where it comes from |
|:---|:---|:---|
| `EXAMPLE_KEY` | what breaks without it | how to get it (never the value) |

## Hard rules

Rules specific to this project that have already cost something. One line each, with the reason.

- Example: never run migrations against production from a laptop, because <the incident>.

## Where things are

| Thing | Path |
|:---|:---|
| Entry point | `src/...` |
| Config | `...` |
| Tests | `...` |

## Current state, <date>

Anything time-sensitive, dated. Do not write counts or sizes here as if they were permanent: state
how to get the number, or date-stamp it.
