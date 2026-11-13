# Two card checks report again (2026-11-14, `#q8mzp`)

Stream `card-checks-report`. Scripts only: no migration, no change to `0365`, nothing under `supabase/migrations/`.

## `check-card-grants.mjs` part 2

**What it asserted:** the two photo-approver refusals by their English sentences (`Give a role the Approve photos card
first%`, `This is the last role that can approve photos%`). **The database was right, the check was wrong:** `0365` keyed both
(`role_cards.needs_an_approver_first`, `role_cards.last_approver`) as part of `#3nuwy`. The item named one failure because the
check stops at the first; **both lines (164 and 179) needed changing**, and the second would have been the next red.

**Assertion shape.** It now asserts the exact key. Options weighed: (1) a key-shaped pattern only, which would pass the *wrong*
key (the first guard raising `last_approver` would go unnoticed) and so lose the one thing the assertion is for, telling two
refusals apart; (2) the literal key. Chosen: the literal key. Whether a key has wording in `en.ts`/`th.ts` is already a build
failure in `check-sql-refusal-keys.mjs`, so this check need not read the dictionary. **What the next rename does:** this check goes
red naming the new key, and the fix is one word in each of the two lines. That is the right signal, not the old trap (a silent
change of wording): a rename is a deliberate act that should touch its consumers. A comment beside the assertions says so.

## `check-who-does-what.mjs`

**Why it could not run:** it looked for a root `project_folders` row for `'Events'`; dev holds only `Shelter Projects`.
**The planner's candidate (create the root inside the harness) is not possible:** `project_folders_before_write` raises
*New folders must be created inside a category* for any parentless insert, and only migration `0034` seeds roots. Working
round it (disabling the trigger in the harness) would test a different database from the one the app runs on. **But the
check never needed `'Events'`:** the trigger gives a child its parent's category. It now takes any root, preferring `Events`.
It runs on dev; nothing is planted that survives (the harness rolls back).

**First run, 2026-11-14 about 06:37 (dev):** 385 boxes measured: 316 obeyed, 3 wrong, 1 sticky, 4 shared, 61 inert; 9 probe
faults. **The two `animal_report.manage` probes ran and are OBEYED for all seven non-Admin logins: no finding on that card.**
The check still exits red, for findings that were hidden while it could not run (full list in the PR body, for the planner):
`suppliers.directory` read allowed where the box says no (3 logins, unlisted), `recurring.do_own` sticky, doctor's
`clinicRule` entries overlisted (the expected doctor-cells state), and probe faults on `photos.resident_manage`,
`text.approve` and `shop.manage` (a fixture needing approval of public text). None is caused by this change.
