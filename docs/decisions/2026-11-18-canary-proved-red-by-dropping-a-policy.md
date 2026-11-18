# The canary goes red when a restrictive policy is dropped (#cnred)

**Correction first.** `#cnred`'s headline ("has never been shown able to go red") was wrong. `--prove-red leak-table`
and `leak-attachments` existed and were run red on 2026-11-16 (`docs/test-plans/tenancy-canary-diff.md`,
`docs/decisions/2026-11-16-tenancy-canary-diff.md`). What was owed was the *item's own method*, dropping a restrictive
policy, which needed Part 5 (`0392`, released in `0.47.2`). Do not file this again.

## What was added
`--prove-red drop-restrictive` in `scripts/check-tenancy-canary.mjs`, `phase: "pre"`, inside the transaction that always
rolls back: it drops `shelter_scope_select` on `public.residents` (name read from `0392` line 26: `'shelter_scope_' || cmd`),
grants select to anon, and adds a permissive `using (true)` policy. Nothing is left on dev.

## The open question, answered honestly
`anon` holds **no** select grant on `residents`, so dropping the restrictive policy alone changes nothing: there is nothing to
read. The mode therefore also grants and adds a permissive policy, so **the proof is "restrictive policy dropped AND grant
present", which is weaker than the item implies.**

**Weaker still, measured:** the existing `--prove-red leak-table` (grant + permissive policy, restrictive policy LEFT IN
PLACE) also exits 1 on the same object. So in the canary's session the restrictive policy did not hide shelter B's planted
resident, most likely because the Management API session has no JWT role claim and `is_trusted_caller()` lets it through.
Consequence: this run shows the canary reacts to a resident becoming visible; **it does not isolate the restrictive policy as
the thing that was protecting it.** A proof that does would need the read to run as a caller `is_trusted_caller()` rejects.
For the planner to file if wanted; not done here.

## Output
Red: `FAIL residents: anon output changed after planting shelter B (ece4a39a.../19 -> 775e2de0.../20)`, exit 1.
Clean afterwards: `0 new leak finding(s)`, exit 0. The `LIMITS:` line and header no longer say Part 5 is absent.

## Found, not fixed
`check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer` reports `1 flagged` (`table:public.scheduled_writer_runs`
missing `definer_all`), not 0. This stream changed no schema; it is a pre-existing dev state.
