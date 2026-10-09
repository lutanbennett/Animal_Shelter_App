# `has_permission()` gets no statement-level cache (measured 2026-10-09)

**Decision: no cache.** Every policy now asks `has_permission()` (Admin converted in `0153`, the vet
in `0167`; `check-policy-role-names.mjs` finds no policy naming a role), which was the condition the
backlog item set for re-measuring. The numbers below say the live lookup costs at most about 2 to 3 ms
of database time on the heaviest statement the app sends, against a page whose round trips to
Supabase are each tens of milliseconds. A cache would save a fraction of that and add a way for a
permission to be answered stale. L9 (the live lookup, `docs/roles-and-permissions.md` §10) stands.

## What was measured

`node scripts/measure-permission-baseline.mjs`, dev, unchanged policies (no `MEASURE_PRE_SQL`), each
login's own JWT in a rolled-back transaction, five runs, median of the last four; run twice, and the
two runs agreed to within 0.15 ms on every line. The script gained two queries for this, the
statements with the most init-plans that a page actually sends, and two columns: how many init-plans
the plan holds and the sum of their own times.

| login | query | rows | exec ms | planning ms | shared hit | init-plans | their ms (upper bound) |
|---|---|---|---|---|---|---|---|
| staff | residents list | 92 | 2.50 to 2.59 | 1.03 | 52 | 7 | 1.84 to 1.90 |
| staff | medication list: prescriptions | 13 | 3.10 to 3.13 | 0.33 | 103 | 12 | 2.89 to 2.92 |
| staff | contacts list | 7 | 0.57 | 0.04 | 11 | 2 | 0.53 |
| staff | clinics list | 11 | 0.92 to 0.95 | 0.11 | 19 | 9 | 0.85 to 0.87 |
| staff | medication list: placements | 92 | 2.50 | 1.00 to 1.02 | 51 | 7 | 1.95 to 1.98 |
| staff | projects: categories (new) | 12 | 0.94 to 1.03 | 0.50 | 128 | 29 | 0.66 to 0.76 |
| staff | photo route: attachment (new) | 1 | 1.51 to 1.58 | 0.18 | 30 | 19 | 2.19 to 2.30 |
| volunteer | residents list | 0 | 0.90 to 0.93 | 0.99 | 16 | 7 | 0.78 to 0.82 |
| volunteer | medication list: prescriptions | 0 | 0.62 | 0.31 | 12 | 12 | 0.55 |
| volunteer | clinics list | 0 | 1.20 | 0.12 | 22 | 9 | 1.15 to 1.16 |
| volunteer | projects: categories | 0 | 0.46 to 0.50 | 0.47 to 0.49 | 8 | 29 | 0.36 to 0.39 |
| volunteer | photo route: attachment | 0 | 2.60 to 2.64 | 0.18 | 69 | 19 | 4.91 to 5.02 |

(The harness volunteer is assigned to no resident, so it reads none; that is the volunteer's scope,
not a fault. "Their ms" sums each init-plan's own time, so one nested inside another is counted
twice: it can exceed exec ms, as on the volunteer's photo route.)

**Against `0145`'s figures** (staff residents list 5.73 ms / 839 buffers after converting enclosures
and zones): today 2.5 ms / 52. The plan is the same shape (the view still joins `residents`,
`enclosures` and `zones` twice); the drop is a warmer, quieter dev instance and the shared-hit count
now being the top node's on a warm run, so read the two as "not worse", not as a gain to bank.

**Where the init-plans are.** Explaining `select *` from every table and view in `public` as staff:
the most init-plans in one statement is `project_folder_summary` (34; 29 for the columns `/projects`
asks for), then `prescription_round_status` (13), `attachments` and `resident_list_view` (10 each);
nothing else above 8. One warm `has_permission()` call costs about 26 µs (2,000 calls in a loop as
staff); a `current_setting()` read, the cheapest thing a cache could be, about 0.4 µs.

## Why the numbers say no

- **The cost is fixed per statement, not per row.** Every policy wraps the call as
  `(select has_permission(…))`, so it is planned once per table in the statement whatever the table's
  size. Production's larger tables do not make it grow; only more converted tables in one statement do.
- **The ceiling is small.** The heaviest statement any page sends (`/projects`, 29 init-plans) spends
  under 1 ms in them; the worst measured share is the staff prescriptions list, about 2.9 ms. A cache
  read is still a function call per init-plan, so at best it saves the ~25 µs lookup each: about 0.7 ms
  on `/projects`, nothing a person could see.
- **The repeated one is the photo route**, which asks `attachments` once per image shown, 19
  init-plans and about 1.5 to 2.6 ms each. A page of 30 photos is about 50 to 80 ms of database time
  spread across 30 parallel requests, each of which also fetches the image from Google Drive (hundreds
  of ms). Worth knowing; not worth a cache.
- **A cache has a real cost**: a permission changed by Admin mid-transaction would be answered from the
  cache, and every write path that changes `role_permissions`, `user_roles` or `roles` would need to
  invalidate it. The live lookup has neither problem.

## When to look again

Rerun `node scripts/measure-permission-baseline.mjs` (it prints the init-plan count now) if a single
statement grows past about 60 init-plans, or if a per-item route like the photo route is called many
more times per page than today. Below that, do not build a cache because a new conversion adds a table.
