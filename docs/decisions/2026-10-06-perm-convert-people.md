# 2026-10-06 — Converting the people and clinic tables to `has_permission()` (`0147`, R5's fourth slice)

`docs/roles-and-permissions.md` §12 R5, §10 and §15. The fourth of the conversions; it copies the shape in
`2026-10-04-perm-convert-medical.md` (one policy per command, `(select has_permission(…))`, no role named) and
borrows its scope-function idea from `2026-10-04-perm-convert-residents.md`. What follows is only what this slice
added or found.

## The tables

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `contacts` | `contacts.directory` Read **and `sees_all_contacts()`** | `contacts.add` and `sees_all_contacts()` | `contacts.directory` Edit and `sees_all_contacts()` | same as update |
| `shelter_friends` | `friends.manage`, **or** `contacts.directory` Read and `sees_all_contacts()` | `friends.manage` | `friends.manage` | `friends.manage` |
| `vets` | `clinics.list` Read, `clinics.doctors` or `visit.book` | `clinics.list` Edit | `clinics.list` Edit | `clinics.list` Edit |
| `vet_doctors` | `clinics.list` Read, `clinics.doctors` or `visit.book` | `clinics.doctors` **or `visit.book`** | `clinics.doctors` | `clinics.doctors` |
| `vet_doctor_clinics` | as `vet_doctors` | as `vet_doctors`, and the doctor has no login | `clinics.doctors`, and no login | same as update |
| `bulk_appointments` | `visit.book` | `visit.book` | `visit.book` | `visit.book` |

24 policies, `<table>_<command>_perm`. `admin_all_*` and every `vet_*` policy are untouched, as in `0135`: the vet's
clinic-scoped writes on `vet_doctors`, `vet_doctor_clinics` and `bulk_appointments` are exactly what they were, and the
clinics rename stays parked (no table, policy or column was renamed).

## What this slice had to decide that the earlier ones did not

### `contacts` needs a scope function, and `scope_contacts` was the column for it

`0126` took vets and volunteers off `contacts` by dropping their policies and giving each a view (`vet_contacts`,
`volunteer_contacts`, gated on `current_user_role()`). A cell-only policy would have undone that for anything holding
Read on `contacts.directory` and borrowing the volunteer floor, OR-ed beside the view: the same trap as
`sees_all_residents()`. `sees_all_contacts()` asks `roles.scope_contacts = 'full'` and that the role does not borrow the
volunteer floor. Unlike residents, **the scope has a real column** (`full` / `name_phone` / `name_type`), so the
volunteer-floor test is belt and braces on top of it, not the whole answer; it goes with the `legacy_role` bridge.
The Director's draft gives the 2IC (scope `name_type`) Edit on `contacts.directory` and `contacts.add`: she reaches the
table through nothing, as today, and the harness proves it (`c_dir_namephone` and `v_dir_all`, holding every contacts cell,
read and write nothing). Giving her a price-free view of her own is a feature, not this conversion.
The function is allow-listed in `check-volunteer-narrowing.mjs` beside `sees_all_residents()`, as "a refusal, not a right".

**Does this make the live backlog item easier or harder** ("a volunteer reads prices and delivery costs, and a vet reads
the other clinics")? Neither, for the contacts half: contacts has no price column and the vet's view stays `vet_contacts`.
For the clinic half it is slightly easier: `vets`, `vet_doctors` and `vet_doctor_clinics` now read through one cell family
and the `vet_read_*` policies are the only thing left that lets a vet read every clinic, so that fix is one policy per table
the day Vet converts, with nothing role-named beside it.

### `shelter_friends` read is wider than its cell, on purpose

The contacts pages read a contact's Shelter Friend profile "for every signed-in role" (`src/app/contacts/page.tsx`,
`contacts/[id]/page.tsx`): the badge, the chip and a read-only card. Staff hold Read on contacts and **not** `friends.manage`
(known tightening **N3**). Asking `friends.manage` alone would have taken the badge and the card from staff, a visible
change the brief says this stream does not make. So read is `friends.manage` **or** whoever reads the full address book,
and **N3 stays open** until the app stops showing staff the card. Followed in the browser: a staff login still sees the
"Shelter Friend 2" chip and the card, read only ("A manager can change this profile under Management").

### The booking trigger adds doctors, so booking must be able to

**Found by `check-doctor-multi-clinic.mjs`, not by reasoning.** `vet_appointments_link_doctor()` is `security invoker` and
*finds or adds* the clinic's doctor when a booking or an edit carries a typed name (`0125`). Staff used to write
`vet_doctors` outright, so it worked. Converted with `clinics.doctors` alone, a staff login booking a visit with a doctor
not yet on file, or moving a visit to another clinic, would have failed. So **insert** on `vet_doctors` and
`vet_doctor_clinics` also answers `visit.book` (the doctor's link is made by an insert trigger of its own). Update, delete
and merge stay `clinics.doctors`. Consequence for the parity table: **C7 closes for staff on update and merge and stays
open for staff on insert**, and for vets entirely (their own policies).

### `merge_vet_doctors()` gets one line, because a filtered delete is silent

With insert now open to `visit.book`, staff could run the merge function (it only checks the caller is *some* role), and
every step would succeed except the last, `delete from vet_doctors where id = p_from`, which RLS filters to zero rows
without an error: links copied, visits repointed, the old doctor still listed. `0147` re-creates the function (0125's
body, byte for byte) with `if not found then raise exception … insufficient_privilege` after the delete, so the whole merge
rolls back. Management and admin are unaffected; the harness asserts staff are now refused (`-4`) and management still merges.
The parity probe for `merge_vet_doctors` went red on this before it was added, the one case of the check finding a real hole.

### `bulk_appointments` and `shelter_friends` activities

`bulk_appointments` is the clinic booking (`schedule_bulk_appointments()`, security invoker, called by `/vet-visits/new` and
the assistant), so it asks `visit.book`. It is Yes/No, so Edit includes delete (A8), as `adoption_updates` did: the old
`ALL` policies allowed delete and the app never does. `shelter_friends` already has an activity, `friends.manage`
(Yes/No). Neither needed inventing; neither is a finding.

## Findings in what was there

- **`contacts` had only three policies** (admin, management, staff): 0126 had already removed the others, so the conversion
  replaces two, as the checker said. The brief's "`contacts` (2)" is right.
- **`staff_rw_contacts` carried no `with check`**, so it fell back to `using`; the new insert policy asks `contacts.add`,
  the cell the app asks (Management → Contacts → Add), not the directory cell.
- **A role holding only `contacts.add` can insert and cannot read the row back.** PostgREST `insert … select` therefore
  fails for it. Staff hold both, so nobody is affected today; the same shape as `recurring.manage` without `do_own`
  (`0145`). Recorded, not built.
- **A role holding `clinics.doctors` and no clinic read cell** now reads `vets` and `vet_doctors` through the doctors cell, so
  the doctors screen does not render an empty clinic list. That is the one read here wider than a single cell, and it grants
  nothing a holder of the doctors cell could not already change.

## What was dropped and what was left

- **Dropped:** `management_rw_*` and `staff_*` on the six tables (12 policies), found in `pg_policies`.
- **Left on purpose:** `admin_all_*` (R6), every `vet_*` policy (Vet is last; the clinics rename is parked).
- **Not this slice:** the six conversions are `-people` (here), `-stock-and-lists`, `-settings`, `-work` and the photo split
  (`attachments`, `maintenance_photos`, `project_photos`). The item's old "three database conversions" was already stale;
  the status line now says six.

## Which known tightenings closed

- **C6** (`contacts`: staff could update and delete any contact): **closed**, two answers (update, delete).
- **C7** (`vet_doctors`, `vet_doctor_clinics`, `merge_vet_doctors()`): **closed for staff on update and merge** (two
  answers); staff **insert** and every vet answer stay known, for the reasons above.
- **N3**, **C10**: untouched (N3 deliberately, C10 is the vet's own policies).

The first parity run after the apply was RED with exactly five STALE entries (the predicted closings plus the staff insert,
which the booking trigger then put back), which is the proof the check notices a closing.

## The parity check, before and after (§11)

**The dev database was not at the seed when this started.** `0147`'s predecessors recorded GREEN; today the Director's first
draft of the role matrix is loaded on dev (`#380`, `2026-10-05`, `scripts/load-role-draft.mjs`), so
`check-permission-parity` and `check-permission-tables` are RED before any change of mine (vet 13 cells to 2, the volunteer
holds `recurring.do_own`, and so on). I did not revert it: it is the Director's, deliberately on test, and a revert is not
mine to make. So this slice's numbers are measured against that state, and what it proves is the **delta**:

- **Before** (`0146` applied, nothing of `0147`): **1,903 match / 30 known / 27 mismatch.** All 27 are the draft's
  (26 `has_permission()` reads of cells the draft removed from the vet and the volunteer, plus the volunteer's
  `record_recurring_job`).
- **After** (`0147` applied): **1,907 match / 26 known / 27 mismatch**, the same 27. Four known entries closed (C6 ×2,
  C7 staff ×2), which is the whole delta. 245 probe runs, 1,960 answers, both times.

When the draft is signed or reverted, parity should read GREEN with the baseline recomputed. `check-policy-role-names` is
GREEN with the six tables removed from `OWNERS`; `check-permission-catalogue` passes. `check-2ic-role` (3 failures) and
`check-volunteer-narrowing` (one: the volunteer may now record a recurring job) are also the draft's, not this change's.

## What the new script covers

`scripts/check-perm-convert-people.mjs`: real rows, each login's own JWT, always rolled back. Six tables, four commands,
eighteen principals: admin, management, staff, volunteer, no role, a vet linked to a doctor at its own clinic, and twelve
configured roles (one with no cell; the contacts cells alone and together; one with every contacts cell but scope
`name_phone`; one with every contacts cell on the **volunteer floor**; `friends.manage`; `clinics.list` Read and Edit;
`clinics.doctors`; `visit.book`). 436 checks, all held, plus sweeps (no policy names management or staff; every new policy
wraps `has_permission()` in `select`; every contacts policy asks `sees_all_contacts()`; 24 `_perm` policies).

It was not run red against unconverted tables (the policies it asserts did not exist before the apply). The two things that
show it discriminates: the volunteer-floor role and the `name_phone` role, which hold the same cells as `c_dir_all` and are
refused where it is allowed; and the existing `check-doctor-multi-clinic.mjs` (below), which went red on a true fault.
Two of that script's assertions changed because of this conversion, both for the intended reason: a staff attempt to set a
doctor's login is now refused as zero rows visible and not as an error from the login trigger (accepted either way), and
a staff merge of two doctors is now asserted refused (management asserted to merge).

## §10's measurement: before and after

`scripts/measure-permission-baseline.mjs` gained two queries (`contacts list`, `clinics list`, the shapes `/contacts` and
the vet-visit form send). "Before" restores the six old policies inside the rolled-back transaction (`MEASURE_PRE_SQL`),
dev, median of four, twice each way (the pairs agreed to within 0.1 ms).

| login | query | rows | before: exec ms (shared hit) | after: exec ms (shared hit) |
|---|---|---|---|---|
| staff | contacts list | 8 | 0.23 (17) | 0.61 to 0.69 (10) |
| staff | clinics list (vets + doctors) | 12 | 1.91 to 1.94 (265) | 1.00 to 1.10 (28) |
| volunteer | contacts list | 0 | 0.57 (49) | 0.62 to 0.64 (23) |
| volunteer | clinics list | 0 | 0.73 to 0.80 (65) | 1.44 to 1.81 (51) |

Read as two things. **The clinics list got nearly twice as fast for staff and read a tenth of the buffers**: the old
`staff_rw_vet_doctors` called `current_user_role()` bare per row, the new policy asks once per statement (finding D paying
out, as `0144` found for residents). **The contacts list got about 0.4 ms slower for staff** with fewer buffers: two
init-plans (`has_permission` and `sees_all_contacts`), a fixed cost, not a per-row one, on an 8-row table. The volunteer's
refused read costs about 0.7 to 1 ms more on the clinics list for the same reason (three init-plans to say no). Dev has 8
contacts and 12 clinic rows, so this says the init-plan is planned and cheap, not that a large table is; the mechanism, not
the timing, scales. **L9 stands.**

## Driven in a browser (what `0144`'s handover could not)

A disposable staff and a disposable volunteer account (made by script; credentials in this worktree's gitignored
`.env.local` as `DRYRUN_PEOPLE_*`, left in dev) against `next dev` on :3008:

- **Staff, `/contacts`:** eight contacts, the type chips, the "Shelter Friend" badge and chip (N3 intact), no add or edit
  controls beyond what the page offers staff today. **`/contacts/<a Shelter Friend>`:** the contact's details and the friend
  card, read only. **`/vets`:** the clinic roster with doctors, visits and residents. No server errors in the log.
- **Volunteer, `/contacts` and `/vets`:** both land on "You don't have access to this page", as before.
- Not driven: booking a visit as staff with a new typed doctor (the fault the multi-clinic harness caught is asserted
  there, not on screen), a Management add, edit and delete of a contact, and a vet login. They are in the test plan's manual
  list.

## What this does not cover

- **A configured role that borrows staff and holds Edit cells reaches these tables with no policy of its own**: closed for
  these six by this migration and proved by the harness's staff-floor roles; no login holds such a role.
- Production apply is Lutan's, from the main checkout: `--dry-run`, then apply `0147`. `-- consumer: none`: no app code reads
  anything new, so there is no ordering constraint against a deploy.
- **`0147` was applied to dev three times before this PR.** It is unmerged and only on dev; each change (the booking insert,
  the merge guard, `clinics.doctors` on the `vets` read) was folded into the same file and its SQL re-run against dev from
  the file, so dev holds the final file. The file is re-runnable by construction (it drops every `_perm` policy it owns
  and recreates it). Not edited after a merge.
