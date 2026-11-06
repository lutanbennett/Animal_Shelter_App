# 2026-11-08 — Deceased record widening, app half (backlog #314hq part D, #f6p2d)

Stream `deceased-record-widen-app`. **No migration.** `0320` (PR #1318, applied to dev) is the authority on what a closed record
accepts; this change only draws controls for it. Nothing here is keyed by a role; every activity below is a card's.

## What `0320` permits (read first) and what was drawn
`0320` opens an UPDATE that changes **only** `notes` (placement_history, weight, prescriptions, procedures, immunization_records)
and one INSERT, on `blood_tests`. So:

| Control drawn | Where | Activity the control asks | Where that activity is read from |
|---|---|---|---|
| Add a note, placement | Housing tab, `housing.tsx` | `resident.record` (edit) | `placement_history_update_perm`, `0264_inert_security_leftovers.sql:139` |
| Add a note, weight | Weight tab, `weight.tsx` | `medical.weight` | weight policy, `0195_security_schema_fold.sql:116`; `weight/actions.ts:77` |
| Add a note, prescription | Prescriptions tab | `medical.prescriptions` | `0264…sql:101`; `prescriptions/actions.ts:91` |
| Add a note, immunization | Immunizations tab | `medical.immunizations` | `immunization_records_update_perm`, `0264…sql:108` |
| Add a note, procedure | Procedures tab, via `ProcedureList.tsx` | `medical.procedures` | `0195…sql:88`; `procedures/actions.ts:30` |
| Log blood test (late result) | Blood Tests tab and `/blood-tests/new` | `medical.blood_tests` | `blood-tests/new/actions.ts:30` (the page's `requirePermission`, same activity) |

The five note controls share `src/lib/closed-record/notes.ts` (table, activity, section per kind), which the server action
`closed-note-actions.ts` also reads, so the control and the action cannot disagree. The action sends exactly `{ notes }`, appends
after the existing text and matches the row on the notes it read, and refuses unless the resident is recorded deceased.
Admin sees all through `perms.isAdmin` in `can.ts`, untouched.

**Note shape (the question the brief left open):** one small "Add a note" control **per row**, not one box per section, because
the note belongs to a row (`notes` is a column of that row) and the visit page already works per entry. Immunization rows did not
show their notes at all; the list now selects and shows `notes` so the added note is visible.

## Deliberately NOT drawn (`0320` still refuses these)
No delete anywhere; no add placement, weight, prescription, immunization, procedure or visit; no edit form of any entry (an
UPDATE of any other column is refused); no file upload to a late blood test (attachments stay locked by
`enforce_deceased_lock_attachment`: the late-result form hides the file zone and says so); no edit of an existing blood test's
`results` text (`0320` allows it, but the brief named only a *late blood test*, so `BloodTestList` stays read-only on a dead
resident; a candidate follow-up). `/medical/weight` ("Weigh another") stays closed. `photos.tsx` and `PhotoGallery.tsx` untouched.

## The sentence family
- `vetVisits.record.deceasedNote` ("You can still add the bill…"): now "Whoever is allowed to can still add…", which describes what
  is possible rather than what *you* may do (closes `#f6p2d`). Thai changed to match.
- `residents.deceased.recordClosed` ("…can no longer be changed"): was false for notes and late blood tests; now says what cannot be
  added or changed here and that notes and late blood results can be added from the resident's page.
- `weight.closed` / medical weight page: **stays true** (no weight can be *added*; only a note on an existing one), so unchanged,
  contrary to the brief's expectation.
- `closed` on the photo strings, microchip, `editLimited`, `readOnly` photos: still true, unchanged. The old blood-test
  new-page block that rendered `recordClosed` is replaced by the late-result form.
- New strings: `closedRecordNote.*`, `bloodTests.lateResultNoFiles`. **Thai is unreviewed by a Thai speaker** (also in the test plan).

## Production caveat and release note
Production has `0318`–`0321` pending (read by the planner 2026-11-06), so `0320` is not live for the shelter. The §7 release-note
line is `n/a: needs 0320 applied to production`; the note belongs in the PR that closes that step. **Drafted wording for whoever
applies it:** *"When a resident has died you can now add a note to their placements, weights, prescriptions, immunizations and
procedures, and record a blood test result that arrives afterwards. Nothing else on the record can be changed."*

## Hard-coded security
No role named. `check-hard-coded-security.mjs` is unaffected.

## Found, not fixed
`BloodTestList` hides editing a result's text on a dead resident though `0320` allows it. Not requested, so not drawn.
