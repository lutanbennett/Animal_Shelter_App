# 2026-10-04 — Converting the medical tables to `has_permission()` (`0135`, R5's first slice)

`docs/roles-and-permissions.md` §12 R5 and §10. **This is the first time the seeded matrix is
load-bearing in the database**, and the pattern the next three conversions
(`perm-convert-residents`, `-people`, `-stock-and-lists`) copy. Read this file before writing
any of them.

## The tables

| Table | Activity | Select | Insert / Update |
|---|---|---|---|
| `vet_appointments` | `medical.visits` | read | edit |
| `procedures` | `medical.procedures` | read | edit |
| `blood_tests` | `medical.blood_tests` | read | edit |
| `prescriptions` | `medical.prescriptions` | read | edit |
| `immunization_records` | `medical.immunizations` | read | edit |
| `weight` | `medical.weight` | read | edit |
| `resident_diets` | `medical.diet` | read | edit |

## The policy shape (copy this)

One policy per command, named `<table>_<command>_perm`, never naming a role:

```sql
create policy weight_select_perm on weight for select to authenticated
  using ((select has_permission('medical.weight', 'read')) and (select sees_all_clinical()));
create policy weight_insert_perm on weight for insert to authenticated
  with check ((select has_permission('medical.weight')) and (select sees_all_clinical()));
create policy weight_update_perm on weight for update to authenticated
  using ((select has_permission('medical.weight')) and (select sees_all_clinical()))
  with check ((select has_permission('medical.weight')) and (select sees_all_clinical()));
```

- **`(select has_permission(…))` is a syntax requirement, not a tidy-up.** Wrapped, Postgres plans
  it once per statement as an init-plan. The plan of `select id from prescriptions where archived_at
  is null` as staff shows `(InitPlan 2).col1 AND (InitPlan 3).col1`, one for each function, and the
  scan filter is otherwise unchanged. Unwrapped it is correct and slow, and the slowness would not
  show on dev's row counts. `check-perm-convert-medical.mjs` fails on a `_perm` policy that calls it
  bare.
- **`sees_all_clinical()` is the scope question this conversion needed**, written here as a new
  `security definer` function over `roles.scope_clinical` (true for a live role whose scope is
  `any`; false for no role, an archived person, an archived role and any `own_clinic` role).
  `has_permission()` answers for every role, vet included, and a vet's Edit cell is `E°`: an
  Edit that only reaches the clinic's own residents. A policy that asked only the cell would hand
  a vet the whole shelter's record, OR-ed beside the vet's own clinic policy. The residents
  conversion needs the matching `sees_all_residents()` over `scope_residents` (§10 names it,
  illustratively); write it the same way.
- **Delete is not written.** The cells have no delete act (§11: the screens archive; a hard delete
  is Admin's), so a converted table gets select, insert and update only and `admin_all_*` keeps
  delete. That is why no role but Admin can hard-delete from these tables after this change.

## What was dropped and what was left

- **Dropped:** every `management_*` and `staff_*` policy on the seven tables (the migration finds
  them in `pg_policies` rather than naming them, so a re-run and a table with a policy this note
  missed both come out right).
- **Left on purpose:** `admin_all_*` (Admin is R6's; it says yes to `has_permission()` anyway and keeps
  hard delete), and `vet_*` (Vet is "Last", §12; its clinic limits become scopes one for one then).
  Permissive policies are OR-ed, so each table now answers Admin, or a vet (own clinic, unchanged), or
  anyone whose cell and scope allow it.
- Those left policies still call `current_user_role()` bare (finding D). That is the remaining
  per-row cost on these tables and it goes when Vet and Admin convert.

## What changed for anyone (and what did not)

- Management and staff read, insert and update the seven tables exactly as before.
- **C5 closed for management and staff.** `weight` had a `FOR ALL` policy for each, so both could
  hard-delete a weight row from a hand-built request. The app never does (it archives). The vet half
  of C5 and all of C4 are `vet_*` policies and stay.
- **A role with a cell now gets the table.** The cell is what the policy asks. A configured role
  (the Heads, the 2IC) that borrows the volunteer and is given `medical.prescriptions` Read reads
  `prescriptions` without a policy of its own: that is R2's database half, already done for the
  tables here.
- **But it does not read the lists those tables point to.** `medication`, `frequency`,
  `procedure_types`, `blood_test_types`, `immunization_types` and `diet_types` still name roles (they are
  `-stock-and-lists`'s) and the volunteer lost them in `0134`. A role that borrows the volunteer and
  holds `medical.procedures` Edit can therefore not look up a procedure type to record one: seen
  while writing the harness: inserts as such a role errored on five tables until the type ids were handed in
  from outside its own login (the error text was not captured, so the cause is the lookup by inference, and
  the fix passing is the evidence). This is §12's "narrower than its job, never wider",
  and it is the reason the Head of Medical's medication list needs the names it joins on
  (§12 R2) when `-stock-and-lists` converts. It does not bite today: nobody holds such a role.
- **Writes to `vet_appointments` ask `medical.visits`, not `visit.book`.** Today booking a visit and
  writing it up are one right and the six roles hold both or neither; the split in §4 is a later piece.
  A role given only `visit.book` is refused, never over-granted.
- **Archiving rides the edit policy**, as it did before (N4 is the vet half). A role holding
  `medical.weight` Edit but not `medical.archive` could archive a record. Splitting them needs a trigger
  (a `with check` cannot see the old row); no such role exists, so it is recorded here and not built.

## Which known tightenings closed

- **C5** (`weight`: management, staff, vet delete outright): closed for **management and staff**. Their
  two entries (in-scope and out-of-scope probe) were removed from the `known` list in
  `scripts/lib/permission-probes.mjs` in this PR, or the check would have gone red as STALE; the entry now
  names the vet only.
- **C4, N4, C10 and the rest:** untouched. They name vets or tables that are not converted.

## The parity check, before and after (§11 asks for both)

- **Before** (against the old policies, `0134` applied, nothing of `0135`): `RESULT: GREEN`. The run's
  totals were not captured as numbers at the time; `0134`'s record (1,920 match / 40 known) is the
  catalogue it ran against and nothing else had changed.
- **After** (`0135` applied): **1,924 match, 36 known tightening, 0 mismatch, GREEN.** The first run after
  the apply was RED with exactly two STALE entries, C5 for management and for staff on `weight`, which is
  the predicted result and the proof the check notices a closing. Four known entries closed (two roles,
  two probes), which is the whole delta between 1,920/40 and 1,924/36.

## What the new script covers

`scripts/check-perm-convert-medical.mjs`: real rows, each login's own JWT, in a transaction that is
always rolled back. For each of the seven tables, read / update / insert / delete as: admin, management,
staff, volunteer, a login with no role, a vet (own clinic's resident and another clinic's), and three
configured roles created inside the transaction that all borrow the volunteer as `legacy_role`: one with
Read cells, one with Edit cells, one with Edit cells and `scope_clinical = own_clinic`. 241 checks, all
held. The cases are the ones §10 asks for: a role that reads and cannot write (the Read role), one that
writes, one that sees nothing (volunteer, no role, the scoped role), and the volunteer, whose rights
`0134` just removed and which an OR-ed policy could have handed back. Two sweeps: no policy on these
tables names management or staff, and every `_perm` policy wraps the call in `select`.

It was not run red against an unconverted table: the policies it asserts did not exist before the apply,
so a before-run would only repeat "no `_perm` policies". What shows it can fail is the sweep that counts
them and the first-run RED of the parity check, not a separate mutation.

`scripts/check-role-write-policies.mjs` also had to learn the new shape: it read role names out of each
policy's text, so a converted table looked as if no role could write (14 failures). It now also reads a
`has_permission('<activity>')` policy as granting the roles whose seeded cell reaches it, and honours
`sees_all_clinical()`. The next three conversions need no further change to it.

## §10's measurement: before and after the first converted table

`scripts/measure-permission-baseline.mjs`, unchanged, run twice before and twice after, dev, five runs each
with the first discarded, median of four, a rolled-back transaction under each login's own JWT.
**Only the `prescriptions` query reads a converted table**; the residents list and the placements query go
through `resident_list_view` over `residents`, which is `-residents`'s, so they are the control.

| login | query | rows | before: exec ms (plan ms, shared hit) | after: exec ms (plan ms, shared hit) |
|---|---|---|---|---|
| staff | medication list: prescriptions | 13 | 2.19 / 2.10 (0.29 / 0.26, 181) | 2.37 / 2.58 (0.29 / 0.27, 175) |
| volunteer | medication list: prescriptions | 0 | 1.14 / 1.16 (0.29 / 0.27, 55) | 1.00 / 1.04 (0.26 / 0.27, 34) |
| staff | residents list (control) | 86 | 12.36 / 12.64 (0.98 / 1.03, 1487) | 12.33 / 12.74 (0.96 / 0.97, 1487) |
| volunteer | residents list (control) | 0 | 5.36 / 5.22 (0.95 / 0.92, 347) | 5.34 / 8.16 (0.94 / 1.14, 347) |
| staff | placements (control) | 86 | 11.88 / 12.07 (0.96 / 0.94, 1486) | 12.05 / 12.70 (0.92 / 0.97, 1486) |
| volunteer | placements (control) | 0 | 5.34 / 5.33 (0.94 / 0.94, 346) | 5.27 / 5.83 (0.93 / 0.97, 346) |

Each cell is the two runs, in order. **Read it as: no regression, and no more.** The converted query's
staff time moved from about 2.1 to about 2.4 to 2.6 ms, inside the run-to-run spread the control rows show
(12.36 to 12.74, 5.2 to 8.2); buffers did not rise and fell slightly (181 to 175, 55 to 34). Dev has 13
current prescriptions, so this says the init-plan is planned and cheap, not that a table of ten thousand
rows is. The mechanism, not the timing, is what scales: the plan shows the two function calls as init-plans
that run once, so the cost added is two calls per statement whatever the row count. **L9 (the live lookup, not
the token hook) stands on this evidence;** nothing here says it needs revisiting.

## What this does not cover

- A page was not driven in a browser for a signed-in role (the harness has no browser). The seven tables'
  pages are in the test plan's manual list.
- The production apply is Lutan's, from the main checkout, after the merge: `--dry-run` then apply.
