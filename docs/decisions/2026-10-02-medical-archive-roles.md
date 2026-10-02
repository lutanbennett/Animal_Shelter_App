# 2026-10-02 — Archive on medical records: admin, management and staff; not vets

Backlog DB-6, app side of soft delete (`claude/soft-delete-app-side`), on top of
`0124` (`docs/decisions/2026-10-02-medical-soft-delete.md`).

## There was no delete button to swap

The item said "swap the delete buttons on those four record types for Archive".
None of weight, prescriptions, vet visits or immunization records has a delete
action anywhere in the app: every row offers Edit (and End today on
prescriptions), and nothing in `src/` issues a `.delete()` against any of the
four tables. The only way to remove one was the database. So Archive is not a
replacement for anyone: it is a **new capability for every role that gets it**,
and the per-role question is "who may remove a medical record from view", not
"who keeps what they had".

## Who is offered it

| Role | Archive / Restore | Why |
|---|---|---|
| admin, management, staff | all four kinds | RLS lets them `UPDATE` all four (`management_*` twins from `0039`). A mistyped reading or a prescription on the wrong resident is theirs to fix, and an archive is recoverable and audited (`0121`), which a delete never was. Staff could never delete a prescription or visit; they can now archive one, deliberately. |
| vet | **none** | See below. |
| volunteer | none | Reads only; the database would refuse. |
| anyone, on a deceased resident | none | The record is closed (`0026`), the database would refuse. |

`canArchiveMedical` (`src/lib/medical-archive/kinds.ts`) is the one rule; the
resident pages use it to decide whether to render the control and the actions
use it to refuse. The database remains the backstop.

### Why a vet is not offered it, though `0110` would allow it

`0110` lets a vet update their **own clinic's** visits and the prescriptions on
them, and refuses another clinic's (a vet archiving another clinic's visit
touches 0 rows; `scripts/check-medical-archive-roles.mjs` asserts it). So the
buttons *could* have matched the policy. They are withheld because the archive is
**one-way for a vet**: `0124` drops an archived visit from
`current_vet_resident_ids()`, so a vet who archives a resident's only visit with
that clinic loses sight of the resident, and the `UPDATE` policy that would
restore it requires that scope. The harness found this: a vet's restore of their
own archived visit changes 0 rows. A button whose undo disappears with it is the
"medical record vanishing from a vet's view" the item warned about. A vet who
entered something by mistake asks the shelter, which can archive it and restore
it. If vets are ever to archive, `0124`'s scope function has to keep their
archived visits visible to them first; that is a schema change, not an app one.

Weight and immunization records are not scoped to a clinic at all (`0001`'s
`vet_rw_*` policies were never replaced), so no "own clinic only" rule exists to
follow for them; a vet is simply not offered Archive on any of the four.

## One vocabulary, as contacts

Archive with an optional reason, Restore, a greyed list below the live one, and a
Show archived link that appears only when something is archived and says how many
are hidden. The strings are `t.recordArchive` (English and Thai), written to read
the same as `t.contacts.archive`. The toggle is `?archived=1` on the section page,
so it survives a refresh and can be shared, as the contacts list's does.

The live lists are untouched: they still rely on `0124`'s readers and
`.is("archived_at", null)`. Show archived is a **second query**
(`archived_at is not null`), not a filter turned off, so a reader that leaks an
archived row would still show up as a bug in the live list rather than being
hidden by the component.

## What the actions do and do not do

- `archiveMedicalRecord` / `restoreMedicalRecord`
  (`src/app/residents/[id]/archive-actions.ts`) issue one `UPDATE` each and
  **write no audit row**: `0121`'s trigger owns that, so an archive is one audit
  row with the before-image (asserted by `scripts/check-medical-soft-delete.mjs`
  and again by the roles harness).
- Archive only touches a live row, so a second click or tab cannot overwrite who
  archived it and when. Restore only touches an archived one.
- Restore clears all three archive columns in one update (the consistency check).
  If a live weight or dose has since taken the day, the partial unique index
  refuses and the message says so (23505), as `0124` anticipated.
- Attachments are still deleted, not archived; `0124` left them out on purpose.

## Left alone

Vet visits' linked records (a weight or prescription on an archived visit) are not
archived along with it. They stay live and their own lists still show them; the
visit simply is not in the visit list. Cascading would hide records without anyone
asking, and `0124` already chose not to guard the link. If staff find it surprising
in use, that is a follow-up with its own decision.
