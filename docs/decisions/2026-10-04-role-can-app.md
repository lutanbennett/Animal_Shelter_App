# 2026-10-04: recurring-job eligibility asks `role_can()`; the shape the other three rules copy

`role-can-app`, the app half of "Recurring-job eligibility asks about another
person's role" (the function was `0133`, #333). No migration.

## What changed

- `canDoJob(role, linkPath, eligibility)` takes the database's answer instead of
  deciding the stock pages from a role string. `rolesForJob` and `jobIsRestricted`
  take it too, so the form's picker, the "only … are listed" sentence, the
  stranded-assignee warning, the save check and My tasks all read one answer.
- `Eligibility` is plain data: need key (`stock.count:edit`) → the roles that
  hold it, for the roles that were asked. A role or a need that was not asked
  is absent and reads as **cannot**: a missing answer never grants.
- `loadEligibility(supabase, roles)` (`eligibility-load.ts`) is the RPC half: one
  `role_can()` call per role and cell, in parallel, failing closed with an `error`
  the caller shows. The rota page asks about every assignable role; the actions
  ask about the roles of the people being assigned; **My tasks asks about the
  reader's own role only.**
- `STOCK_COUNT_ROLES` and `STOCK_DELIVERY_ROLES` are deleted (the two lists this
  PR took; the residents sweep took none, they are in different files).
  `/stocktake` and `/deliveries` are no longer written in `eligibility.ts` at all:
  the rules are generated from the route registry (`permissions/routes.ts`), so
  the page's guard, the menu and this rule share one entry. That also moved
  `/management/purchasing` (registered by `2ic-purchasing-phone`) from
  "is a manager" to `stock.purchasing`; the seed gives it to the same two roles,
  so the answer is unchanged.
- `check-permission-catalogue.mjs` no longer asserts the deleted constants; D now
  asserts eligibility asks only about catalogue activities and covers both stock
  pages. `check-recurring-job-eligibility.mjs` builds the answers role_can would
  give from the seeded cells (role_can's own parity with `has_permission()` is
  `check-role-can.mjs`) and holds the new `canDoJob` to the truth tables written
  **before** the conversion, now in `scripts/fixtures/legacy-predicates.json` as
  `canDoJob(<link>)` rows, which `check-permission-parity.mjs` also pairs
  with their activity. Parity was green before and after.

## `can()` versus `role_can()`

`can()` answers about the caller. `role_can()` answers about a role. Guarding the
rota page is a `can()` question (may *this person* set up rotas) and stays
`requireManagementUser()`; populating its picker is a `role_can()` question
(may *that role* do the job). Do not use the wider function for the narrower
job: it is how a caller would get answers about roles that are not theirs.

## The RPC's caller boundary is unchanged, and the app respects it

`0133` answers a caller with `recurring.manage`, anyone about their own role, and
the service role; everyone else is refused. The app adds no call outside that:
the page and actions run as Management/Admin; My tasks is a volunteer's page and
passes `[role]`, so it asks only the permitted question. There is still no "list
a role's cells" call. If `loadEligibility` is ever given a roster by a caller who
may not ask, it errors loudly, which is what the refusal was for.

## Handover: the three rules left in `eligibility.ts`

`permissions-sweep-rest` should **not write new rule code**. The shape is "a
page is registered, and eligibility follows":

| Rule today | Becomes |
|---|---|
| `/maintenance`, `canWriteMaintenance` | the route entry for `/maintenance` (`maintenance.jobs`, level `edit`); delete the rule and the import |
| `/management`, `isManager` | each registered Management page names its own activity (the Purchasing one already does). A page not yet registered keeps falling back to the `/management` rule, so delete that rule only when the last Management page the rota can link to is registered; then an unregistered `/management/…` link means "anyone" unless a decision says otherwise (write it down: today it means managers) |
| `/admin`, `role === "admin"` | the same for `/admin` pages, once an Admin page has an activity to register under. Check the catalogue for one first; if there is none the rule stays, since `role_can` answers yes for admin before reading any cell and a rule that only admin passes cannot be expressed as an activity nobody holds |

Mechanics: add the entry to `ROUTES`, delete the `allows` rule, and
`JOB_NEEDS` picks the new cell up with no edit here. Then run the parity check
(its `canDoJob(<link>)` rows already cover `/management`, `/admin`,
`/maintenance`, `/residents`), `check-recurring-job-eligibility.mjs`, and
`check-permission-catalogue.mjs`. One call per role and cell is the cost of
this shape: 4 assignable roles × N cells on the rota page, in parallel. If N
grows large, add a plural variant of the function in a schema PR; do not
loosen the caller check to get there.
