# 2026-10-04 — Narrowing the volunteer (`0134`, R1's database half)

`docs/roles-and-permissions.md` §12 R1. Nobody holds the role (Lutan, 2026-10-04: no
volunteer logins on test or production), so this took access from no one and needed no
announcement. It matters because the 2IC and both Heads borrow the volunteer's database
rights through `roles.legacy_role`: a right left here is a right all four roles have.

## What was found: it was not five

§12 names five function role lists. Reading every function body on dev (not grepping the
migration files, which lag the live bodies) found **six** that say `'volunteer'` in public
and one more in `private`:

| Function | Role list | What `0134` did |
|---|---|---|
| `record_stocktake()` | admin, management, staff, volunteer | volunteer removed |
| `delete_resident_photo()` | admin, management, staff, volunteer | volunteer removed |
| `set_resident_profile_photo()` | admin, management, staff, volunteer | volunteer removed |
| `record_attachment()` | admin, management, staff, vet, volunteer | volunteer removed |
| `record_recurring_job()` | admin, management, staff, vet, volunteer | volunteer removed |
| `reassign_recurring_job()` | admin, management; and `user_roles.role in (…, 'volunteer')` | **left.** The volunteer is only who a date may be handed to ("someone who can still sign in"); it grants the volunteer nothing |
| `private.has_app_access()` | roles that may sign in | **left.** It is the sign-in gate, not a right; the volunteer still signs in |

`scripts/check-volunteer-narrowing.mjs` sweeps `pg_proc` for any function that names the
volunteer and fails on any beyond those two, so a sixth cannot be added unseen.

## What was found beyond the list: five views

Five owner-rights views excluded only vets (`current_user_role() is distinct from 'vet'`
unless the vet's clinic treats the resident), so a volunteer read straight through them
after the policies were gone: `translation_queue` (every translatable field, resident
bios included), `immunization_compliance`, `immunization_duplicate_check`,
`current_placement` (carer and notes) and `resident_current_state` (the carer, hospital
state and dates). They were the same shape as the five functions: a right surviving its own
removal, invisible while nobody holds the role. Each now also excludes the volunteer.

## What the volunteer keeps

Who a resident is and where it lives, and the enclosures: `resident_who_and_where` (id,
name, Thai name, code, species, sex, profile photo, status, enclosure and zone with their
Thai names), `enclosures` and `zones`, and three cells (`resident.record` read,
`facility.enclosures` read, `facility.map`). Not breed, age, bio, notes, flags, microchip,
group origin, carer, or any date. A policy can hide a row but not a column, so this is a
view, as `0126` did for contacts: owner rights, a fixed column list, gated on the role, no
grant to `anon`.

## Beyond the §12 list, and why

- **Dropped too:** `group_origins`, `translations`, `assistant_actions` (both policies),
  `vets`, `vet_doctors`, `vet_doctor_clinics`, `shelter_friends`, `frequency`, and the reference lists
  (`blood_test_types`, `procedure_types`, `immunization_types`, `medication`, `diet_types`).
  §12 names "the medical tables" and others; Lutan's answer was "just who and where", and
  none of these is who or where. Closing `shelter_friends` closes the volunteer half of N3.
- **Altered, not dropped:** eight policies that name the volunteer among other roles
  (`adoption_updates`, `item_unit_conversions`, `stock_counts`, `stock_receipts` and the four
  recurring-job reads) keep their name and lose the volunteer.
- **`volunteer_contacts`** stays as a view but is no longer granted. §12 lists contacts among
  the policies to drop, but `0126` had already dropped that policy; what remained was the
  name-and-phone view, which Lutan's answer also takes away. A role given the `name_phone`
  scope later needs one `grant`.
- **The volunteer's seeded cells shrink from 24 to 3** in the same file, and §4's volunteer
  column with them. §12 does not name this, but without it the cells say a volunteer can
  count stock while the database refuses, which is exactly what the parity check exists to
  catch, and `has_permission()` would answer yes to the three new roles' borrowed rights.
  The deletions are audit-logged with no actor, honestly: a migration changed rights.
- **Left, deliberately:** `is_known_drive_file()` (a boolean for the unauthenticated photo
  proxy, no row data) and the helpers `attachment_resident_id()` and `resident_is_deceased()`
  (an id or a boolean). A volunteer can call them; none returns anything §5 withholds.

## Which known tightenings closed

- **C9** (a volunteer reads delivery costs, stock counts, the medication and diet prices):
  closed. Its three entries were removed from the probes' `known` lists in this PR, or the
  check would have gone red for the opposite reason.
- **N3** (`shelter_friends` read by staff and volunteer): the volunteer half closed; the
  entry now names staff only.
- No other row of §3 C names the volunteer.

## What the parity check reports, before and after

Before: 245 probe runs, 1,916 MATCH, 44 KNOWN TIGHTENING, 0 MISMATCH. After `0134` and the
paper's §4 edit: 1,920 MATCH, 40 KNOWN TIGHTENING, 0 MISMATCH (the same 1,960 answers: four known cells closed, the three C9 ones and the volunteer's N3). The volunteer's
column moved on 21 activities (adoption news, the move, the seven medical reads, three photo
acts, maintenance jobs and photos, projects and their photos, clinics, contacts, the
stocktake, recurring jobs done, the assistant), each intended, each now `–`. Two probes
changed shape: a volunteer's read of a resident goes through `resident_who_and_where`
(the `byRole` mechanism contacts already used), and `placement_history` read is expected
to be refused to a volunteer although the cell says Read, because the cell is the scope.

**Layer 2** (the app's predicates) goes red by design until the app half lands: eleven
predicates still say the volunteer may do what the cells now refuse. They are listed in
`APP_PENDING` in `check-permission-parity.mjs`, which treats them like layer 1's `known`
list: reported, not a failure, and a failure the moment one stops differing. **That list is
`volunteer-read-only`'s checklist.**

## What the script covers, and what it does not

`scripts/check-volunteer-narrowing.mjs` runs 55 rights under a volunteer's own JWT: 44 reads
(tables and views), 6 writes, and the 5 functions, plus the volunteer's three kept rights,
the view's exact column list, and two structural sweeps (only `volunteer_read_enclosures`
and `volunteer_read_zones` name the volunteer; only the two functions above still say it).
For each, **staff or management must still be allowed**, so narrowing one role cannot
silently break another. It reuses the parity check's technique (a login per role, the
statement under that login's JWT and `authenticated` role, each probe in a rolled-back
subtransaction) rather than extending its probe list, because most of what was removed is
not an activity in §4. The parity check covers the activities; the two agree because `0134`
deletes the cells in the same file.

It was run red first (before the apply: the volunteer was allowed everywhere), and three
removed rights were put back inside the rolled-back transaction, one a policy, one a
function, one a view; each turned it red.

It cannot show: that a *future* table with a permissive policy stays closed to the
volunteer (a new table is written against `has_permission()`, §12), a right reached through
Storage or Drive (not the database), or the app's own predicates (that is layer 2 above).
One view (`immunization_duplicate_check`) had no rows on dev to give management and staff a
control (the script prints which); the volunteer's refusal there is a policy fact, not a row fact.
