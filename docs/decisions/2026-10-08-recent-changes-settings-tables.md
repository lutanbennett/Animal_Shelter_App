# Recent changes: the four settings tables, and what each can undo

2026-10-08, `claude/recent-changes-table-names`.

`audit_log` is fed by a `record_audit()` trigger on eleven tables (checked on dev:
`information_schema.triggers`). Settings → Recent changes knew seven. The other four —
`roles`, `role_permissions` (0132), `impact_baselines` (0156), `facility_maps` (0165) —
showed no table name, could not be filtered, and an edit read *Files can't be undone here*.

## Measured on dev before and after

Same 1,066 audit rows, run through the real `toEntry`/`undoKind` and both dictionaries, from
`origin/main` and from this branch:

| | before | after |
|---|---|---|
| rows with no table label (en and th) | 106 | 0 |
| rows the table filter cannot pick | 106 | 0 |
| non-file edits saying *Files can't be undone* | 5 | 0 |
| settings-table deletes offering **Undo** | 36 | 0 |

The last row was not in the backlog item. The old `undoKind` sent every delete that was not a
resident or a file to `reinsert`, so a deleted `role_permissions` row offered an Undo that would
have put the permission back. (The write would also need an admin at 2-step, which the Undo
page does not check, so it could have succeeded.)

## One answer per table, not one answer for all

- **Impact figures — edits undoable here.** A figure is a typed number and date; putting the
  old pair back is the same write Settings → Website makes, under the same `website.content`
  policy. There is no delete (0156 grants none). Checked in a rolled-back harness on dev as an
  admin under RLS: one row back to its Before values, the stamp trigger set `set_by` to the
  admin, and the undo wrote its own audit row under the admin's login.
- **Roles and permissions — never undone here.** There is no permission editor in the app yet;
  every one of the 101 dev rows was written with no login (migrations). A permission is not a
  record to restore from a before-image: putting one back can let someone in or lock someone
  out, and the place to change it is a deliberate edit, with its guards, not a log. When a
  Settings matrix arrives, it gets its own undo or none — still not this page's.
- **Facility plans — use the plan's own Undo.** Undo the replace on Settings → Facility map
  also puts the picture back and appends to the plan's history file in storage. Writing the row
  from here would leave the picture and that history out of step.
- **Anything else** (a table added to the trigger list later) says *This kind of change can't
  be undone here*, never the file reason.

The permissions check comes before the archive check, because `roles` has `archived_at` and the
archive message tells you to press a Restore button roles do not have.

## Names

Impact figure / ตัวเลขผลงาน, Facility plan / แผนผัง, Role / บทบาท, Permission / สิทธิ์ — not the
table names. A role shows its name; an impact figure its label; a permission row its activity
key (`website.content`), because no translated activity names exist yet. That last one is
technical and is a follow-up for whenever the Settings matrix gives activities names.

## Keeping it closed

`AUDITED_TABLES` carries a comment: every table with the trigger belongs in it. A table missing
from it now falls to the plain "not undone here" reason and a blank label, not a wrong one.
