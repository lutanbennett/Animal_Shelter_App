# 2026-11-06 — Closed-record sentences re-read against 0310 and 0320 (backlog #k3q7w)

Stream `closed-record-sentences`. No migration. Thai is unreviewed by a Thai speaker.

**Step zero:** the gap was still there. `#f6p2d`'s fix (`recordClosed`) was correct and is untouched; the banner is a *second* string.

**Banner #1344 saw:** `DeceasedBanner.tsx:75` draws `t.residents.deceased.banner.readOnly` (en.ts / th.ts, `deceased.banner.readOnly`).
It is not the string `#f6p2d` rewrote (`deceased.recordClosed`).

## What 0310 / 0320 permit
`0310`: UPDATE of `clinic_visits.cost` and `notes` only. `0320:4-10`: UPDATE of `notes` on placement_history, weight, prescriptions,
procedures, immunization_records; UPDATE of `blood_tests.results` and `drive_file_id` (`0320:66`); INSERT on `blood_tests`. INSERT/DELETE
elsewhere, and attachments, stay locked.

## Verdicts
| Sentence | Where | Verdict |
|---|---|---|
| `banner.readOnly` "Nothing can be edited, uploaded or recorded" | en/th dictionaries | **overstated — fixed** |
| `deceased.whatHappens.items[3]` "read-only — no edits, photos or new medical records" | record-a-death page (before death) | **overstated — fixed** |
| `deceased.pageSubtitle` "file becomes read-only" | record-a-death page | **overstated — softened** |
| `deceased.editLimited` "everything else in the record is closed" | edit page | **overstated — fixed** |
| `deceased.recordClosed` | add/edit pages | already correct (`#f6p2d`) — left |
| `clinicVisits deceasedNote` | visit page | already correct — left |
| `closedRecordNote.explain` | note control | already correct — left |
| `PhotoGallery.tsx:242` comment | code comment | correct for photos (0026) — left |
| `BloodTestList.tsx:47`, `ProcedureList.tsx:52` "files can be opened, not changed" | code comments | correct (attachments stay locked) — left |

## Action controls in the three components (item 8)
- `BloodTestList.tsx` Correct result → `medical.blood_tests` (`blood_tests_update_perm`, 0264:94), gated by its caller.
- `ProcedureList.tsx` closed-note control → `medical.procedures`, gated by `canAddClosedNote`.
- `PhotoGallery.tsx` delete/promote/move → shown only when not `readOnly`; per-activity `can…` props exist.
- Found, not fixed: none established.
