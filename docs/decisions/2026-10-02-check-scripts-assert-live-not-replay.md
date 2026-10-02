# 2026-10-02 — check-shelter-today asserts against the live schema; 26 other harnesses still replay a migration

**Context.** `scripts/check-shelter-today.mjs` failed on dev with `permission denied
for function current_vet_resident_ids`. Nothing was wrong with `0073` or the
database. The harness ran `0073_shelter_today.sql` inside its rollback transaction
to build its fixture, which recreated `public_shelter_stats` reading the public
`resident_current_state`; since `0108`, anon may not execute that function, so the
replayed view was one the real database no longer contains.

**Decision.** The harness no longer replays the migration. It runs its assertions
against the live functions and views (0073 must already be applied on dev, as it is).
Passes end to end on dev, including the anon step. The narrower fix, replaying only
the functions under test, was not needed and would have kept the same coupling to a
historical snapshot.

**Pattern elsewhere.** 26 scripts in `scripts/check-*.mjs` read a migration file with
`readFileSync` and replay it in their harness. Most test one migration's own new
objects, where replay is the point, but any that read a view or function a later
migration changed carry the same latent trap. Not fixed here; filed on the `backlog`
branch for a sweep.
