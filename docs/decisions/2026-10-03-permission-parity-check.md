# 2026-10-03 — The permission parity check (`scripts/check-permission-parity.mjs`)

§11 of `docs/roles-and-permissions.md`, step F1's proof. Scripts and docs only: no
migration, nothing under `src/`, nothing that reaches a user. It is the thing every
`perm-convert-*` stream runs before and after touching a policy, so this records what
it measures, what it deliberately does not, and the four things it found beyond §3 C.

## Three outcomes, not two

| Outcome | Meaning | Fails the run? |
|---|---|---|
| **MATCH** | the database does what the default cell says | no |
| **KNOWN TIGHTENING** | the database allows more than the default, and the probe's `known` list names it with its row id | no |
| **MISMATCH** | any other difference, either direction | yes |
| **STALE** | a `known` entry the database no longer differs on | yes |

The last row is the rule from `2026-10-02-check-scripts-assert-live-not-replay.md`: the
list can neither hide a regression nor rot. Proved by running it (test plan, "the
deliberate failures"): flipping a cell turned a run red with a MISMATCH *and* a STALE
for the entry that flip had made untrue.

The distinction is in the script for the reason `check-test-plan.mjs` learned: a check
that goes red on day one for something expected is filtered, and then it catches
nothing.

## What it compares

For 245 probe runs and 8 principals (the six roles, a login with no role, an archived
person): 1,960 answers. 110 of the runs read `has_permission()` itself, so a seeded
cell edited in the database goes red even while the policies do not read it yet; the
other 135 exercise real tables and functions under the principal's own JWT, each in a
sub-transaction that is rolled back, so probes do not spoil each other's fixtures.
The expected value is read from the paper's §4 table at run time, not from the
migration (as `check-permission-tables.mjs` does).

- **Every probe is also run as Admin, and Admin must be allowed.** If it is refused the
  probe or its fixture is broken, and the run says so as a *harness fault* instead of
  recording a finding. It caught a dozen broken probes while this was written (missing fixtures, a wrong column, a trigger that wanted a parent row).
- **"No role" is a real column**, and so is the archived person. Section Z asserts that
  a missing cell, an unknown activity, an archived role and a person with no role all
  answer no, for all 55 activities at both levels (330 answers), with a positive
  control (staff is answered yes to `stock.delivery`) so the check cannot pass by
  answering no to everything. A configured role that has been *archived* is probed
  through `has_permission()` alone: today's policies read the enum and would still let
  that person in, which is exactly what conversion closes.
- **Scoped activities run twice** — a resident inside a vet's clinic and one outside —
  and a vet is expected to be refused outside whatever the cell says.
- **A hard delete is not an act the matrix has**, so delete probes expect Admin only;
  that is how C2, C4 and C5 appear.

## Layer 2: the app's predicates

Nine predicates are paired with the activity that guards the same thing and asserted
for seven roles including no role (63 answers). Their truth table is written to
`scripts/fixtures/legacy-predicates.json` (`--write-fixture`); once a predicate is
deleted the check carries on from the fixture, and while it exists it must still agree
with the fixture. Five predicates are named as unpaired with a reason each (`hasAppAccess`,
`isShelterRole`, `canReadRecurringJobs`, `canDoJob`, `assertPhotoWriteAccess`).

## Layer 3, the routes: **not built, and why**

§11 specifies "every route in the registry". **There is no route registry yet.** It is
a deliverable of the catalogue/`can()` stream (§12 F2, piece 4 of the foundation-3
item). Building a stand-in here would be a second list that quietly persists, which
is the thing the probe handover below also avoids. When the registry lands, layer 3
is one more loop over it in this script, using the pure guard functions. **The backlog
status line says it is outstanding; §11 is not wholly satisfied until it is.**

## The probes live here, not in the catalogue

§11 puts the probes in the catalogue file. `permissions-catalogue` (a parallel stream)
owns that file and agreed the shape — `probes: { level: "read" | "edit"; sql: string }[]`,
Yes/No activities using `edit` only — and ships it with every `probes: []` empty. Their
file was not on `main` when this was written, so the probes are in
`scripts/lib/permission-probes.mjs` and **must move into the catalogue in a follow-up**,
after which that module is deleted, not kept as a second copy. Two things in the module
do not fit their shape and have to be settled then:

- **Probes on a Yes/No activity at level `read`** (C9, C10, N1–N3 are reads of a table
  a Yes/No activity owns). Their shape allows `edit` only. Either the field gains `read`
  for Yes/No activities, or these move to a `reads` list in the check.
- `scoped`, `expect`, `known`, `byRole`, `refusedBy`, `fn` are this script's, not §11's.

## The twelve tightenings (§3 C)

Ten appear as known tightenings, each with the roles it was observed for:

| Id | Observed |
|---|---|
| C1 | management, staff write `enclosures`/`zones` |
| C2 | management, staff delete a resident outright |
| C3 | vet writes `immunization_types` |
| C4 | vet deletes visits, procedures, blood tests, prescriptions, immunizations in scope |
| C5 | management, staff, vet delete weights outright |
| C6 | staff update and delete contacts |
| C7 | staff and vet insert, update and merge doctors |
| C9 | volunteer reads prices on `stock_receipts`, `medication`, `diet_types` |
| C10 | vet reads `enclosures`, `zones`, `vets`, `shelter_friends`, `diet_types` |
| C11 | vet records a recurring job |

Two are **not** differences, measured (and printed on every run): **C8** (staff update
`stock_receipts`: delivery is Yes/No and staff hold Yes, so the default allows it too)
and **C12** (`resident_list_view`'s write grants are inert: the view is not updatable,
so every statement fails for every role, Admin included — revoking them changes nothing
anyone can see).

A caveat on C9/C10: they are about *columns* and the probes read a price column by id,
which is a row-level proxy. Whether a converted policy hides the column or the row is a
conversion decision.

## Four things the check found that §3 C does not list

All listed as `known` with ids `N1`–`N4`, so the check is green, and **flagged here as
findings, not as accepted**. Decide each one when the table converts.

- **N1** staff and vet read `medication.cost_per_unit` (staff has no `stock.medications`
  cell). The row read is legitimate — a prescription form needs the name — so the open
  question is the price column, same as C9.
- **N2** staff read `diet_types.cost_per_unit`. Same shape.
- **N3** staff and volunteer can read `shelter_friends`; the cell is Management only
  (vet is already C10).
- **N4** a vet can archive a weight, prescription, immunization or visit by updating
  `archived_at` directly, though the screens do not offer Remove to a vet and
  `canArchiveMedical` says admin, management, staff. `src/lib/medical-archive/kinds.ts`
  already records why the screens withhold it (0124: archiving a vet's only visit drops
  the resident from `current_vet_resident_ids()` and the vet cannot undo it). The
  database does not hold the line. This is the one worth a second look.

None of these were closed here; closing is a policy change, which is `perm-convert-*`'s.

## What is not probed (stated by the run, not inferred)

Nine activities have no database statement that tells them apart, with a reason each in
`NO_DB_PROBE`: `photos.resident_publish` (finding A5 — publishing is a side effect of
filing a photo), `facility.map`, `stock.purchasing`, `stock.usage`, `reports.dashboard`,
`translations.manage`, `assistant.ask`, `assistant.record`, `audit.undo`, and
`system.status` (its table is not granted to `authenticated` at all; the page uses the
service role). A new activity that is neither probed nor listed there fails the run.

## The §10 baseline: before the first converted table

`node scripts/measure-permission-baseline.mjs` (dev, rolled back; median of four warm
runs, after one discarded; the policies still call `current_user_role()`):

| Login | Query | Rows | Exec ms | Planning ms | Shared hit |
|---|---|---|---|---|---|
| staff | residents list | 85 | 7.3 | 1.0 | 717 |
| staff | medication list: prescriptions | 14 | 2.7 | 0.3 | 250 |
| staff | medication list: placements | 85 | 6.9 | 1.0 | 716 |
| volunteer | residents list | 85 | 3.6 | 1.0 | 367 |
| volunteer | medication list: prescriptions | 14 | 1.2 | 0.3 | 140 |
| volunteer | medication list: placements | 85 | 3.7 | 1.1 | 366 |

These are the **before** numbers §10 asks for; the first `perm-convert-*` PR reruns the
same script unchanged and puts both in its test plan. Caveats worth reading before
comparing: dev has 85 residents and 14 live prescriptions, so absolute times are small
and the *ratio* is the thing to compare; staff costs about twice a volunteer because
staff's policy set evaluates more per row, so the after-comparison should be per login,
not between them; and the medication list is allowed to a volunteer by the database
though the page refuses it (C9), which is why it is measured for both.

## Running it

```
node scripts/check-permission-parity.mjs             # all layers; exit 1 on a mismatch, stale entry or fault
node scripts/check-permission-parity.mjs --verbose   # also list every match
node scripts/check-permission-parity.mjs --write-fixture   # regenerate legacy-predicates.json
PARITY_FLIP=volunteer:stock.delivery:2 node scripts/check-permission-parity.mjs      # expectation flipped: must go red
PARITY_FLIP_DB=vet:medical.weight:0 node scripts/check-permission-parity.mjs         # a seeded cell flipped in the txn: must go red
```

Not in CI yet: it needs the dev database credentials, as every `check-*.mjs` that runs
against dev does. §11 says "in CI once the tables exist"; wiring is a release-manager
call on credentials, not a change to this script.
