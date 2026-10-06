# 2026-10-06 — Converting the six lookup tables to `has_permission()` (`0148`, R5's fifth slice)

`docs/roles-and-permissions.md` §12 R5, §9 rule 4 and §15. The fifth of the six conversions; it copies the shape in
`2026-10-04-perm-convert-medical.md` (one policy per command, `(select has_permission(…))`, no role named) and reports
the way `2026-10-06-perm-convert-people.md` does. What follows is only what this slice added or found.

## The tables

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `medication` | `stock.medications` Read **or** `reference.add_while_recording` | `stock.medications` Edit or the add cell | `stock.medications` Edit | same |
| `diet_types` | `stock.diets` Read **or** `resident.register` | `stock.diets` Edit | `stock.diets` Edit | same |
| `frequency` | `medical.prescriptions` Read and `sees_all_clinical()` (`0136`'s test, kept) **or** `reference.types` Read | the add cell or `reference.types` Edit | `reference.types` Edit | same |
| `procedure_types` | `medical.procedures` Read, `reference.types` Read **or** the add cell | the add cell or `reference.types` Edit | `reference.types` Edit | same |
| `blood_test_types` | `medical.blood_tests` Read **or** `reference.types` Read | `reference.types` Edit | `reference.types` Edit | same |
| `immunization_types` | `medical.immunizations` Read **or** `reference.types` Read | `reference.types` Edit | `reference.types` Edit | same |

24 policies, `<table>_<command>_perm` (`frequency_select_perm` is `0136`'s name, re-created). `admin_all_*` and every
`vet_*` policy are untouched, as in `0135` and `0147`, so the vet keeps what it had on all six tables (C3 on
`immunization_types`, C10 on `diet_types`). Eighteen role-named policies dropped, found in `pg_policies`: `management_rw_*`,
`management_read_*`, `management_insert_*`, `staff_read_*`, `staff_insert_*`.

## What this slice had to decide that the earlier ones did not

### A lookup's read is not one cell, and not the cell you would guess

The brief's warning was that a read chosen too narrow breaks pages for every role. The risk here ran the other way as well:
**the obvious cell is wrong for the two tables that carry prices.** `medication` (`cost_per_unit`) and `diet_types` (the
price and daily quantities) are read, today, by exactly two logins, management and staff. The tempting read is the cell of
the screen that uses the table, `medical.prescriptions` for the prescription form's medicine picker and `medical.diet` for
the diet picker. In the Director's draft the **2IC holds both, and the Head of Medical holds `medical.prescriptions` Read**,
and both sit on the volunteer floor and read names and stock through price-free views built for them
(`stock_medications`, `stock_diet_types` in `0143`; `medication_list_medications` in `0136`). A policy asking those cells
would hand each of them the whole price list through a table read, which is the C9 shape `0134` closed.

So the two price tables ask the cells that **management and staff hold and no role built since does**:
`reference.add_while_recording` (staff and management; "add a missing medication from a form", which cannot be done
without seeing the list it is missing from) and `resident.register` (the intake form's diet picker), plus the price cells
themselves (`stock.medications`, `stock.diets`), which are meant to see prices. `check-perm-convert-stock-and-lists.mjs` has
a role on the volunteer floor holding the 2IC's medical cells and the stock cells, and it reads neither table. A sweep also
asserts that no `medication` or `diet_types` policy names a `medical.*` cell, so the shortcut cannot come back unnoticed.

**Does this make the live backlog item easier or harder** ("a volunteer reads prices and delivery costs")? Neither for the
volunteer, who already reads neither table. **It does not close N1 or N2** (staff still read prices, through the add cell and
the register cell), and it does not open them wider: the same two roles read the same columns. What it does is make the
eventual fix a one-line one: give the picker a price-free view, then drop the add cell and the register cell from the two
read policies, and staff read nothing off the table. **That is the thing to do, and it is an app change first**
(`src/lib/prescriptions/options.ts`, `src/lib/diets/options.ts` and the intake form read the table directly), so it is on
the backlog and not here.

### Four of the type lists open to a role that records against them, and one carries a price

`procedure_types`, `blood_test_types`, `immunization_types` and `frequency` hold names and a schedule, nothing sensitive,
with **one exception: `immunization_types.cost`**, a per-dose price. Reading the list is read through the cell that records
against it (`medical.immunizations` Read for the immunization picker, and so on), because a role that may record a
vaccination has to pick a vaccine. In the draft **the 2IC holds `medical.immunizations` Edit** (and `medical.prescriptions`
and `medical.diet` and `medical.weight`; that is the Director's draft and a question for her, not for this stream), so under
this conversion **she reads the immunization types including `cost`**. Today she reads nothing on that table (`0134` dropped
the volunteer's). This is a read widened for one draft role, by the cell she was given; it is said here, and in the test
plan, and filed on the `backlog` branch with its two fixes (a price-free view for the picker, or take the cell from her). I
did not hide the column behind a guard function, as `sees_all_contacts()` does for the address book, because the draft is
unsigned: if the Director means the 2IC to record immunizations she needs the picker, and if she does not, the cell is what
is wrong.

### `frequency` needed its read policy changed, and nothing else about it

`frequency` already had `frequency_select_perm` (`0136`, for the Head of Medical's medication list). The old
`management_read_frequency` and `staff_read_frequency` were redundant beside it, so converting the reads meant only dropping
them. **But the writes exposed a real defect in leaving it alone:** a role holding `reference.types` Edit and not
`medical.prescriptions` could not update a frequency, because an UPDATE with a WHERE has to *see* the row first, and the only
select policy asked `medical.prescriptions`. Today that is invisible because only Admin edits the list (`admin_all_frequency`),
but it is the same trap `0147` recorded for `contacts.add` and `0145` for `recurring.manage` without `do_own`, and this time
it costs one `or`. The migration drops `frequency_select_perm` and re-creates it with its test unchanged plus
`reference.types` Read. **Do not anticipate the prescription-schedule redesign:** `dose_quantity` moving to
`prescription_rounds`, the three round ticks and the retirement of `frequency` as a table are untouched, and when they land this
policy goes with the table.

### Management loses a hand-built write on `frequency`, and nothing else

`management_rw_frequency` (`0043`) let management update and delete a frequency. Nothing in the app does: the frequency
list is Admin's screen, guarded by `reference.types`, which no stored role holds. So update and delete on `frequency` now ask
`reference.types` Edit, and management is refused. The same reasoning left **management's medication and diet writes
exactly as they were**: the Management → Medications and Diets pages are the `stock.medications` and `stock.diets` Edit cells
and management holds both. Insert on `frequency` and `procedure_types` is the add cell, held by management and staff: that
is **A1**, a right, and unchanged. Nothing here is a visible change.

### The boundary with `0145`, checked

`0145` swept `item_unit_conversions`, `stock_receipts` and `stock_counts`, and the brief asked whether it touched these six.
**It did not**: all 18 policies the checker named were still there on dev. `frequency` alone had been touched, by `0136`
(its select). The merge functions (`merge_medication`, `merge_frequency`, `merge_procedure_type`, `merge_blood_test_type`) are
`security invoker` and already raise "Not authorized to remove the duplicate …" when their final delete is filtered to zero
rows, so, unlike `merge_vet_doctors()` in `0147`, **no function needed a guard**. `set_standard_diet()` checks its own role
list (`admin`, `management`), which is outside this slice. The purchasing forecasts the 2IC uses
(`stock_medication_forecast`, `stock_diet_forecast`) are security definer and do not read these policies.

## Which known tightenings closed

**None, and none opened.** N1 (`stock.medications` Read: staff and vet read `cost_per_unit`), N2 (`stock.diets` Read: staff
read diet prices), C3 (the vet writes `immunization_types`) and C10 (the vet reads `diet_types`) are all still the same
answers, for the reasons above. The only answers that moved are not probed: management's hand-built update and delete on
`frequency`. The parity probes for these tables already agreed, which is why the delta is zero.

## The parity check, before and after (§11)

The dev database still holds the Director's first draft of the role matrix (`#380`, `scripts/load-role-draft.mjs`), so
`check-permission-parity` and `check-permission-tables` are RED before any change of mine. I did not revert it: it is the
Director's, deliberately on test, and a revert is not mine to make. What this slice proves is the **delta**:

- **Before** (`0147` applied, nothing of `0148`): **1,907 match / 26 known / 27 mismatch.** All 27 are the draft's.
- **After** (`0148` applied): **1,907 match / 26 known / 27 mismatch**, the same 27 (the mismatch lines diff identically).
  Zero known entries closed, none opened. 245 probe runs, 1,960 answers, both times.

`check-policy-role-names` is GREEN with the six tables removed from `OWNERS` (10 tables, 20 policies remain: settings, the
photo split, work). `check-permission-catalogue` passes. `check-permission-tables` fails at `A cells vet: got 2, wanted 13`,
`check-2ic-role` (3 failures) and `check-volunteer-narrowing` (five lines, all `recurring_job*` and
`record_recurring_job`) fail on the draft too, and `check-medical-role` and `check-perm-convert-orphans` fail on the draft's
changes to the Head of Medical's and the vet's cells (their tables, not these). One failing line does name one of these six
tables, `frequency as hom: allowed — got 0`, and it is the draft's too: the draft removed `medical.prescriptions` from the Head of
Medical (the bundle line in the same run lists her cells without it), so `frequency_select_perm`, which this slice only added
an `or` to, correctly refuses her. No other failing line names one. `check-safety-stock` and `check-medication-label` assert dev's data and a view's text, not a policy.

## What the new script covers

`scripts/check-perm-convert-stock-and-lists.mjs`: real rows, each login's own JWT, always rolled back. Six tables, four
commands, twenty principals: admin, management, staff, volunteer, no role, a vet, and fourteen configured roles (no cell;
`stock.medications` Read and Edit; the add cell alone; `stock.diets` Read and Edit; `resident.register` alone;
`reference.types` Read and Edit; `medical.procedures`, `medical.blood_tests`, `medical.immunizations` and
`medical.prescriptions` Read alone; and one **on the volunteer floor** holding the 2IC's medical and stock cells). 484
checks, all held, plus four sweeps (no policy names management or staff; every new policy wraps `has_permission()` in `select`;
neither price table asks a `medical.*` cell; 24 `_perm` policies).

It was not run red against the unconverted tables (the policies it asserts did not exist before the apply). The first run
**did** disagree with my own expectations on four cases, which is the nearest thing to a red: I had written that the
volunteer-floor role would read none of the six tables, and it reads the four type lists, which is the immunization-cost
finding above, found by the harness and not by reading the draft.

## What this does not cover

- **A configured role that holds a write cell and not the read cell** (for example `stock.medications` Edit alone) works,
  because Edit includes Read; a role holding **only the add cell** can insert and read the row back (the add cell is in
  the select), so, unlike `contacts.add` in `0147`, nothing needs a second cell.
- **The Management → Medications and Diets pages, the prescription and procedure forms and the purchasing page** are
  driven in the test plan, not asserted by the script beyond the policies underneath them.
- **Production apply is Lutan's**, from the main checkout: `--dry-run`, then apply `0148`. `-- consumer: none`: no app code
  reads anything new, so there is no ordering constraint against a deploy.
- **`0148` was applied to dev once by the runner, then its file was changed once** (`frequency_select_perm` gained
  `reference.types` Read) and the file's SQL re-run against dev, as `0147` did. It is unmerged and re-runnable by
  construction, and dev holds the final file.
