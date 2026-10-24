# Production checks for the held faults and the card-access gap (2026-10-24)

Stream `claude/prod-checks-held-faults`. Scripts only: no migration, nothing in `src/`.

## What was added to `scripts/lib/readonly-checks.mjs`

`role-cards-coverage`, `cards-union`, `fault-residents-lifecycle`, `fault-clinic-visit-save`, `fault-maintenance-delete`.
Each is one SELECT, passes `assertSelectOnly`, runs inside `begin read only`, and returns role keys, card keys and
activity names only. The lint test covers all of them unchanged.

## The temporary shape (read this before touching it)

The database holds no copy of what a card requires; that is the fault. So `role-cards-coverage` and `cards-union`
carry the expected grants into the SQL as a literal `values` list built at load by `scripts/lib/card-bundles.mjs`, which
transpiles `cards.ts` and `jobs.ts` in memory (the `typescript` package is already a dependency). It is still one
SELECT with no caller-supplied SQL, and every value is re-checked to be a plain key before it can enter the text.

**It is temporary.** `claude/cards-grants-schema` adds a `card_grants` table. Once that is applied, both checks should
join that table, and `card-bundles.mjs` is deleted. Recorded as a follow-up on the urgent backlog item.

After the card-grants release, `role-cards-coverage` must print nothing.

## Fault checks

Each asks who holds what the fault blocks. `fault-residents-lifecycle` flags a role that holds the Residents card or a
placement cell but not `facility.enclosures` at read. `fault-clinic-visit-save` flags a role that holds Book clinic
visits, Medical records or `visit.book` without `clinics.list`. `fault-maintenance-delete` lists every holder of Do
Maintenance, because no delete control exists for any of them.

## `dev-signin.mjs --remove admin`

The admin login was held by two test clinic visits and two bulk batches it created (one labelled `ZZ-polish-test`).
Chosen: a new `--clear-held` flag, off by default, that deletes only rows in `clinic_visits` and `bulk_appointments`
created by that login, and only when no other table holds it. Both are leaf tables, so nothing else is deleted with
them. Without the flag it still refuses and names the rows. If any other table holds the login it refuses and names it,
because that would be real data, not test residue.
