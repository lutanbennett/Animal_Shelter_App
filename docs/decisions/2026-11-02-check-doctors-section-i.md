# check-doctors section I: stale assertion, not the doctor-test red (2026-11-02)

Ran `timeout 60 node scripts/check-doctors.mjs` against **dev** (`qxkmhwybjggxvsfxsxbd`), 2026-11-02.

Before the edit it printed, for the `behaviour` part:
`FAIL I current_user_clinic_ids for the doctor: {}` (P0001, inline block line 140).

## What section I matches on

`scripts/check-doctors.mjs` section I links a login to a doctor and clinic, then asserts
`current_user_clinic_ids() is distinct from array[v_clinic]` for that login fails, and that management gets `{}`.

`current_user_clinic_ids()` is defined in `supabase/migrations/0264_inert_security_leftovers.sql:629`:
`select '{}'::uuid[];` — a constant, for every caller. 0266 and 0273 keep it (src/lib/clinics/scope.ts still calls it).

## Verdict

**Neither a card-state red nor an app fault: the assertion was stale.** The function reads no cards, no role and
no table, so Doctor's card set cannot change its answer. Lutan's one-card-at-a-time testing cannot cause this red,
and nothing is hard-coded: a constant `{}` grants nothing. The expectation dated from 0127 (the clinics came from
the linked doctor), which 0264 retired.

Fix (script only, I own it this batch, proved by the migration line above): section I now expects `{}` for the linked
doctor login. This asserts today's designed behaviour, not a way to hide a red. After it, the `behaviour` part
prints `HARNESS-OK` through to the end.

## Not reached: the `rls` part still fails (separate, for the planner to file)

`rls: ERROR 42501: new row violates row-level security policy for table "doctors"` from
`clinic_visits_link_doctor()` when the management login books a visit with a new doctor name. It is a different part
of the script, unrelated to section I. Not established whether it is an expected card-state red (a card that adds
doctors switched off during testing) or a stale harness: needs someone to read which activity the `doctors`
insert policy asks and compare it with the cards the harness's management login holds. Not touched here.

## Left behind on dev

None. `check-doctors.mjs` does not call `giveCards()`; it runs in rolled-back transactions. I did not run
the roles listing, so no before/after count: the helper was never used. No `harness_cards_*` role was created by me.

## Not established

Production: NOT ESTABLISHED (not needed for the verdict; 0264 is in the migration files, and the function body is
the same everywhere 0264 is applied). For the planner, to confirm production has it:
`node scripts/check-production.mjs` (production env file is absent in this worktree).
