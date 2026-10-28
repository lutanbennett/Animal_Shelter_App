# A register of assessed advisories, read by the PR `audit` job (2026-10-28)

Lutan asked for this on 2026-10-28 ("Item B - schedule it"). It was offered and declined on 2026-10-25
(`2026-10-25-audit-on-releases-not-every-pr.md`, *The residual risk*) because the job was meant to run
rarely. #1041 made the scoping work, `0.40.10` was the first cut it ran on, and it went red; a cut always
changes `package.json`, so it would be red on every cut.

## What was built

- `docs/advisory-register.json`: `accepted` entries (id, date assessed, `reviewBy`, decision file, why)
  and `resolved` entries (ids that were assessed and then fixed).
- `scripts/audit-register.mjs` (`npm run audit:register`): runs `npm audit --omit=dev --json`, takes every
  high or critical advisory, and **fails on any id not in `accepted`**.
- ci.yml's PR `audit` job runs `audit:register` instead of `audit:prod`. That one word is the only change to
  the workflow. `continue-on-error`, the timeout and the retry are untouched.

## Why this is not hiding the red (the `CLAUDE.md` rule)

The rule forbids changing the job's failure handling to make a red go away. This changes what counts as red:
an advisory nobody has assessed is still red, and an entry needs a decision file. Lutan confirmed the
distinction on 2026-10-28.

## The catch, and how each entry stays honest

A registered advisory stops being looked at, so an entry that only says "we looked once" is worse than the red.
Each `accepted` entry therefore carries **checkable** claims:

- `mustStayAbsent`: a pattern searched in named paths on every run. If it matches, the entry fails with the
  file and line. For `GHSA-5j98-mcp5-4vw2` (glob CLI): no `glob -c/--cmd`, `npx glob`, `.bin/glob` or
  `node-minify` in `package.json`, `scripts/` or `worker/`.
- `mustBeAbsentFromBuild`: the same for the built bundle. **Only checked when `.open-next` exists.** In CI it
  does not, so the run prints "not checked"; the release step, which builds, is where it bites. Stated, not hidden.
- `reviewBy`: 90 days. After that the entry fails until a person re-reads it and moves the date.
- An entry whose advisory is no longer reported prints a note to delete it. It does not fail, so an upstream fix
  does not turn the check red.

**Limits.** The patterns are patterns: a glob invocation built from pieces would not match. And `resolved` ids are
deliberately **not** accepted: if one returns, it is a regression and the check reports it as one.

## Not touched

`advisories.yml` and `npm run audit:prod` are unchanged, so the daily run and the release step still fail on
anything high, registered or not. The two paths disagree by design. Only the PR job is read through the register.

## The seven assessments

Only `2026-10-28-glob-cli-advisory-not-reachable.md` describes an advisory still reported, so it is the one
`accepted` entry. The other six cover advisories since fixed (next 16.3.8, next 16.4.2, the adapter upgrade) and
are `resolved`. I did not assess any advisory that was not already decided: the open `0.40.10` advisory is the glob
one, which was.
