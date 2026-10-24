# The hard-coded-security ratchet counts code that decides access, not mentions of it

**2026-10-24, after `main` went red the minute #913 (the check) and #915 (`cards-grants-app`) were both on it.**

## What happened

`scripts/check-hard-coded-security.mjs` counted every line that *named* a mechanism. #915 added
`tileBlock()` in `src/lib/home/tiles.ts`, which evaluates the existing rules (`OUTSIDE_REGISTRY`, `routes.ts`)
only to **report which one refused a held card**, plus a comment listing the rule names. It created no rule and
grants and denies nothing. The check read it as `roles-opens-app` 34/33, `roles-scope-clinical` 10/9 and
`outside-registry` 9/5, and CI went red for every PR, including #916, which adds none of those patterns.

## The perverse incentive (why this is not just a tidy-up)

As written, the check **punished the behaviour the rule wants.** A stream could keep CI green by *not* writing the
diagnostics that make hidden security visible, and the only way to see a hidden rule is to name it. Lutan: *"I can't
fix it if I can't see it."* **A guard that punishes the behaviour it wants is worse than no guard, because it is
obeyed.** Do not re-tighten it so that comments or reporting code count again.

## What changed

1. **Comments are blanked before matching.** A rule name in a comment is documentation.
2. **Diagnostics are allow-listed by function** in `docs/hard-coded-security-registry.json` (`diagnostics`), each with
   its reason written in the entry. Today there is one: `tileBlock` in `src/lib/home/tiles.ts`. The check fails if a
   listed function disappears, so an exemption cannot outlive its function. It is **by function, not by file or
   directory**: a rule added elsewhere in `tiles.ts`, or anywhere in `src/lib/permissions/`, is still counted.
3. **Baselines re-measured downward.** Seven fell; two kinds of fall, kept apart on purpose:
   - **Genuine removal:** `card-tile-silent-drop` 2 → 1. #915 really deleted one of the two silent drops
     (`if (!covered) return null`). Not a baseline of convenience.
   - **Method change:** `roles-opens-app` 33 → 30, `roles-scope-clinical` 9 → 8, `roles-scope-people` 9 → 6,
     `can-use-bills` 12 → 11, `outside-registry` 5 → 4, `opens-any-in` 12 → 10. These were comment mentions, not
     code; no rule was removed. Lowering them leaves no slack for a new reference to hide in.

No baseline was raised. `page-rules` (45, the measured figure; the planner's 55 came from a crude grep),
`jobs-of-role` and `curated-home` are unchanged.

## Proven, not assumed

On this branch a new code reference (`p.role.opensApp`) failed `roles-opens-app` 31/30, and a new `OUTSIDE_REGISTRY`
use outside `tileBlock` failed `outside-registry` 5/4. Both were reverted.

## Still true

It counts only mechanisms somebody has already named; a new *kind* of rule is still on the author. Existing debt is
unchanged and is not permission to add more.
