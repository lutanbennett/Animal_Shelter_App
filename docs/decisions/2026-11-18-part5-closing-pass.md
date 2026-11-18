# Part 5 (#ujqr5) is closed by release 0.47.2 (2026-11-18)

**Answer: complete.** Ticked. Nothing is left to decide or build on the item itself.

Evidence, clause by clause:

- **Restrictive policies on production:** `0392` applied in `0.47.2`; `--status --env production` 408 applied, 0 pending (`docs/releases/2026-11-18-0-47-2.md`).
- **NOT NULL:** `0397` in the same applied set.
- **Worker first, then 0392:** the Worker half shipped in `0.47.1`; the release-order guard answered ok for both guarded environments (record line 50).
- **Strict tenancy lint:** 125 of 125 RLS tables carrying `definer_all`, 0 flagged (production and UAT, per the record).
- **The `public_*` views clause (tested, not assumed):** `0391` scopes `public_resident_cards` and `public_shelter_stats` by `current_shelter_id()`; `KNOWN_TODAY` in `scripts/check-tenancy-canary.mjs` is empty. `node scripts/check-tenancy-canary.mjs --strict` run 2026-11-18 against **dev**: planted a second shelter, read 23 anon-reachable objects, **0 findings, 0 known, 0 unstable**. `check-public-views.mjs` (CI job `public-views`) proves anon read/write rights and sends the shelter header.
- **Worker version endpoint** (the guard's one finding): owned by sibling stream `release-order-measures-worker`; no PR for it was found at the time of writing, so not counted here and not a reason to hold Part 5.

## Found, not part of Part 5
The nightly canary workflow has failed on both scheduled runs (16 and 17 Nov) with exit 2: `SUPABASE_ACCESS_TOKEN is required ... NOT CHECKED`. The secret is empty, so the nightly has measured nothing. Filed as `#cnrnt`; setting the secret is a step only Lutan can do. The by-hand run above is why the clause is still evidenced.

Limits: the canary was run on dev, not production; production evidence is the release record.
