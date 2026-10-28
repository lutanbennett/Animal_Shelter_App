# Card re-pass: `medical_records` ("Manage medical"), 2026-10-28

**Stream:** `claude/card-repass-manage-medical`. **What:** the 14 walkthrough steps of `medical_records` driven as a login holding only that card, after `0276` and `0278`. Rows are in `docs/card-access-faults.md` under one new heading. Nothing was fixed and no card was proposed.

**Step zero held:** last driven 2026-10-27 (`claude/card-rerun-manage-medical`); `0276` and `0278` are later and both name this card. **Rows they moved:** `0276` added `card_grants (medical_records, photos.resident_medical, read)`; `0278` added `(medical_records, photos.medical_add, yes)`. Step count by exact heading: 14.

**Result.** Driven and working: steps 0, 1, 3, 4, 6, 8 and 11 (procedure, blood test, immunization, diet, send to hospital and return). Not re-driven because neither migration touches what they ask: 5, 7, 9, 10 (driven 2026-10-27). Step 2 is a `TODO`. Step 12 could not be read back (a card-only login has no clinic). **Step 13 contradicts its own text:** `/medical/photos` now opens, by design of `0278`, so the walkthrough is stale and the generated file was not edited.

**Over-grants:** none new. The whole-list download through `view_residents` is the known one, already ruled on (#1050).

**Action controls and the activity each asks** (read from the code, not the label): Save procedure, blood test, immunization, diet: `medical.*` at edit through their actions; Send to hospital and Return: `placement.hospital` (`src/lib/placements/hospital.ts`); resident Edit form: `resident.record` write, correctly not drawn for this card; uploader: `photos.medical_add`. **Found, not fixed:** none ungated. Two pieces of copy name roles or are untrue for this card (profile-photo sentence on the Photos page; "Only staff and admins" on Edit) and are in the log.

**Not proven:** filing into Medical and reading an existing Medical photo (Drive upload not driven, no Medical photos on the test resident).
