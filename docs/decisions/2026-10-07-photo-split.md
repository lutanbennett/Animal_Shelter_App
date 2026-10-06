# 2026-10-07 — The photo split (`0152`): the last role-named policies, and publishing made its own cell

`docs/roles-and-permissions.md` §15 (A3, A5) and the Security item on a vet's Medical-only folder. Seven
conversions started with `0135`; this is the last. After it **no policy in the database names a role**:
`node scripts/check-policy-role-names.mjs --final` ends `GREEN (the end state)`, and `OWNERS` in that script is empty.
It copies the shape in `2026-10-04-perm-convert-medical.md` (one policy per command, `<table>_<command>_perm`,
`(select has_permission(…))`).

## The activity `attachments` had to be given

The six conversions before this translated a question that already existed. `attachments` has none: one table
carries five kinds of file. So, as `0144` did for `placement_history`, each policy asks the activity of the row's
own `owner_type`:

| `owner_type` | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `resident` | `resident.record` read, and `sees_all_residents()` | `photos.resident_add` | **`photos.resident_manage`** | **`photos.resident_manage`** |
| `blood_test` | `medical.blood_tests` read | `medical.blood_tests` | same | same |
| `procedure` | `medical.procedures` read | `medical.procedures` | same | same |
| `maintenance` | `maintenance.photos` | same | same | same |
| `project` | `projects.photos` | same | same | same |

(The two medical rows also ask `sees_all_clinical()`.) `maintenance_photos` asks `maintenance.photos` and
`project_photos` asks `projects.photos`, all four commands each (Edit includes remove, as for `adoption_updates`).
The "new activity" the brief expected, `photos.resident_manage`, **already existed** in the catalogue (`0132`) and on
dev: the work was making the database ask it, not inventing it.

## A3 — adding a photo and managing one are different cells

`delete_resident_photo()` and `set_resident_profile_photo()` now ask `photos.resident_manage` (and
`sees_all_residents()`) instead of listing admin, management and staff. Refiling is an UPDATE on `attachments` and
asks the same cell. **The volunteer half of A3 had already closed**: `0134` took the volunteer out of both functions
and out of `record_attachment()`, and `0140` gave configured roles a cell route. So no volunteer lost anything in
this PR; the finding's "a volunteer can delete someone's photo" was true of the paper and of the code before `0134`,
not of the database today. Stated so nobody hunts for a behaviour change that is not there.

In the app, `movePhotoToFolder` asks `photos.resident_manage`, **except** that a role that only adds (a vet) may
still refile a photo *into* Medical. That is protective (it takes a photo off the website) and is what the action's
own comment already allowed a vet to do.

## A5 — publishing is not a side effect of filing

`0101` and `0103` publish every non-Medical resident photo, so the folder IS the publish decision. The app already
sent a role without `photos.resident_publish` to the Medical folder only (`photoCategoriesFor`). The database did
not, and this is the Security item: `record_attachment()` checked the role and never the folder (`0140` added a
medical-only check but only for a login that arrived by its cell, so a vet, on the legacy list, was exempt), and the
vet's own insert and update policies never looked at it.

`can_publish_resident_photos()` = holds `photos.resident_publish` **and** `scope_photos` is not `medical_only`.
Enforced at both doors:

- **a restrictive policy** (`attachments_insert_folder_guard`, `attachments_update_folder_guard`) on every direct
  insert and update, whatever permissive policy let the role in, the `vet_*` ones included;
- **`record_attachment()`**, which is security definer and so bypasses policies, for everyone, not only a login
  that arrived by its cell. An adopter's photo (its own dated folder) is the same: refused to a role that cannot
  publish.

**A side effect, recorded rather than avoided:** because the guard looks at the row's *new* folder, a role that can
manage photos but not publish can edit only Medical-folder rows (captioning a Shelter photo is refused). No such role
exists on the agreed draft (Management and Staff both hold publish there), and a Shelter photo's caption is public,
so refusing it is the safe side. A vet's caption edit on a Shelter-folder row was allowed before and is refused now,
for the same reason.

### The UI half, and where it stopped

The brief's warning: a correctly permissioned surprise is still a surprise. The upload form now says, under the
folder picker, whether the folder puts the photo on the public website ("can appear … on this resident's Adopt
page", every folder but Medical) or never does (Medical), in English and Thai. **Not built:** per-photo "shown on the
website" state in the gallery, and a "publish" action separate from the folder. That is a product change (it needs a
column and a decision about the 0101 rule) and is filed on the backlog branch, not half-built here.

## Parity, §11: the delta

`check-permission-parity.mjs`, before and after the migration: **1,910 match / 24 known tightenings / 21 mismatch /
5 harness faults**, the same figures and the same 21 mismatch lines (diffed line for line, not the count). Every
mismatch is the vet, on purpose (`director-draft-apply`). The brief quoted 1,913 / 26 / 21; the live baseline on
`main` is 1,910 / 24 / 21, so use that one. The 5 harness faults are broken probes (null medication, diet type and
a stock-receipt row), not mine.

Two probes were added for `photos.resident_publish` (A5 now has a statement that separates it from add) and for
`set_resident_profile_photo` under `photos.resident_manage`, and the probe note saying publish had no statement was
removed: **1,926 match** with them, 16 new answers all matching, same 21 mismatches. Neither A3 nor A5 was a
tracked "known tightening" entry (they were paper findings, not parity rows), so none clears from that list.

## What the harness covers

`scripts/check-perm-convert-photos.mjs`: real rows, each login's own JWT, always rolled back, **457 checks, all held**.
Sixteen principals (admin, management, staff, volunteer, no role, a vet, ten configured roles, each holding a
different combination of add / manage / publish / `medical_only`). Eight statements per principal on a resident photo,
the other four owner types on `attachments`, both photo tables, and the three functions (`record_attachment` into
Medical, into Shelter and as an adopter's photo; `delete_resident_photo`; `set_resident_profile_photo`). The case that
matters most is `record_attachment` into Shelter as a vet, **refused**, and the same vet's direct `insert` and
`update` into Shelter, refused by the guard. A refused read, update or delete must be zero rows, and the script fails
if one errors instead (a fixture fault, not a policy answer).

It was not run red against the unconverted tables (they no longer exist in that form on dev). Two things show it can
fail: the sweeps count the `*_perm` policies (12), the guards (2) and any role-named policy anywhere in the database;
and the older harnesses below went red on the exact behaviours this changed.

## Older harnesses this moved, and ones it did not

Re-baselined, each commented `RE-BASELINED 2026-10-07`:

- `check-medical-jobs`: a vet filing a photo outside Medical is now refused (the Security item, closed).
- `check-maintenance-role`, `check-2ic-role`: the draft gives the Head of Maintenance and the 2IC `maintenance.photos`,
  `0141` had deliberately not (the whiteboard says jobs and progress). Until now the role-named policies hid the
  cell, so it did nothing; the policy follows the cell now, and they can add and read a job's photos. **That is the
  agreed draft working as written, but it is a behaviour change for those two roles** and the Director may not have
  meant it; it is the one thing in this PR worth a human's eye. Removing the cell from the draft is a data change, no
  migration.

Still red, **not caused by this change** (photo tables are not involved): `check-maintenance-role`'s `bundle` line
(the draft's cells exceed `jobs.ts`), `check-medical-role` / `check-medical-jobs` / `check-2ic-role` on "medication"
and "diet_types as staff" (zero rows), and `check-medical-jobs`' `cells` line. Named so they are not mistaken for it.

## What was left, on purpose

- `admin_all_*` (R6) and the `vet_*` attachment policies (Vet is last). A vet can still **delete** a resident photo
  row in their own clinic by a direct request (`vet_delete_attachments`); it is not refiled or published by it.
- The vet's `record_attachment()` role list: the vet has no cell rows yet, so the cell cannot replace the list.
- `assertPhotoWriteAccess` (blood-test and procedure file routes) is unchanged in the app; the database now asks
  the medical cell for those two owner types, and the app route still asks `photos.resident_add`. The app half is
  `foundation 3`, so **foundation 3 is not ticked**: this PR is the last database piece of the conversions, not the
  app sweep, and `check-permission-parity` still lists `assertPhotoWriteAccess` as "not paired".
- `photos_medical_only()` stays (the guard asks it).

## What this closed, in three weeks

Seven conversions (`0135`, `0144`, `0145`, `0147`, `0148`, `0149`, `0150`) and this one (`0152`) took every table off
a role name and onto the cells. Nothing in `pg_policies` names `'management'::app_role` or `'staff'::app_role`, so the
role-named policies are gone; what `perm-drop-enum` still has to clear is the `legacy_role` bridge in the scope functions
and the security-definer function role lists, which this PR leaves as they were.
