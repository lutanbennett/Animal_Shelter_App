# public-views: skip a view only a foreign unmerged branch created (2026-10-16)

**Problem.** `check-public-views.mjs` runs against the shared dev database but reads its
`PUBLIC_VIEWS` list from the branch under test. Schema-first means a migration is applied to dev
before its PR merges, so for that window every other branch fails on the new view
(`0210_appeals.sql`, #667, made #668 red).

**Chosen: option (a), narrowed.** An unlisted `public_*` view that answers anon is classified by
`scripts/lib/public-view-owner.mjs`:

- a `create [or replace] [materialized] view public_x` in migrations on `HEAD` or `origin/main`
  means this branch or main owns it: **FAIL**, as before;
- found only on another `origin/*` branch: **WARN, skip**, naming the branch;
- found nowhere, or git cannot answer (no remote branches, odd name): **FAIL**.

The brief suggested reading `origin/main` alone. That cannot work: the foreign migration is on
neither `main` nor this branch, so "not on main" is identical for a foreign branch's view and one
nobody's migration explains. Positive proof from the foreign branch's own migration is what
separates them, so CI's `public-views` job now checks out with `fetch-depth: 0`.

**What stays red.** An own-branch view added without listing, a view on `main`, an out-of-band
view with no migration, and any case where the lookup fails. `scripts/check-public-view-owner.mjs`
builds a throwaway repo and asserts each, including that no remote branches means fail, not skip.

**Accepted gap.** A skipped view is not write-checked (PATCH/DELETE) by this run; its own PR's
run, which lists it, does that before merge. A foreign branch that never lists its view is caught
there, not here.
