# 2026-11-06 — Correct a blood test's result text on a closed record (backlog #k9m3t)

Stream `blood-test-result-text`. **No migration, no new card, no new activity.** `0320:66` permits an UPDATE of `results` and
`drive_file_id` on `blood_tests` once a resident has died; `BloodTestList` drew nothing for it. Found, not fixed, by #1324.

## Step zero
No control or action edited a result at all (`BloodTestList.tsx` only displayed `results`); no earlier decision built it
(`2026-11-08-deceased-record-widen-app.md`, since renamed to `2026-11-06-…` by #1342, lists it as "found, not fixed").

## The activity
`blood_tests_update_perm` asks `medical.blood_tests` (edit): `0264_inert_security_leftovers.sql:94`. The attach/remove actions in
the same file ask the same one. The new action `editClosedBloodTestResult` (`residents/[id]/blood-tests/actions.ts`) and the
control's gate (`readOnly && canManage`, `canManage = can(perms, "medical.blood_tests")`) therefore agree.

## What it does
A "Correct result" button per row, only on a closed record, opens a textarea holding the current text. Save sends exactly
`{ results }` (blank clears it to null), matched on the text that was read so two people cannot overwrite each other. The action
refuses unless the resident is recorded deceased: a living record has no such control and keeps its own flow.

**Replace, not append** (unlike the notes controls): the point is correcting a typo in a result, which an append cannot do.

## Deliberately not drawn
Delete, any other add, any other column, files on a blood test: `0320` still refuses them.

## Verified on dev
Dead resident **Chico (R-0001)** had no blood test, so one was logged through the late-result form and then edited:
text changed and persisted. A login holding only `view_medical` sees no button and a direct PATCH of the row as that login
matched no rows (database refusal). Thai strings are unreviewed by a Thai speaker.

## Release note
Production is level (326 applied), so a note is added.
