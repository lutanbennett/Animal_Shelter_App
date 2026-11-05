# Three guards on the resident record (0319, 0320) — #f214a, #k2p8w, and (D) of #314hq

Proof: `node scripts/check-resident-record-guards.mjs` (dev, `begin … rollback`, prints `HARNESS-OK`).

## 0319 — profile photo: Medical, video and approval, in both functions

`set_resident_profile_photo()` and `delete_resident_photo()`'s fallback now apply the same four tests: owned by the resident, not
the Medical folder, a picture (not a video), and `attachments.approval = 'public_ok'` (0318). The fallback promotes the newest
eligible picture (`uploaded_at desc`), as decided in `2026-11-06-deceased-photo-fallback-guard.md`.

- **Medical is not caught by the approval test.** `attachments_approval_stamp()` approves a Medical file on insert (its own branch),
  so a Medical file is `public_ok`. The explicit Medical test is what stops it; approval alone would not have.
- **Behaviour change to know about:** setting a photo that is not yet approved as the profile picture is now refused with
  "Only a photo approved for the public site can be the profile photo." Nothing in `src/` was changed; the app already surfaces
  the RPC's message. Cards are unchanged (`photos.resident_manage`).

## 0320 — what may be written to a closed (deceased) record

Same shape as 0310. UPDATEs that change only named columns pass: `notes` on `placement_history`, `weight`, `prescriptions`,
`procedures` and `immunization_records` (the last also `updated_at`); `results` and `drive_file_id` on `blood_tests`.

**The design question: how a late blood test is an INSERT.** The trigger gained one rule: `INSERT` into `blood_tests` is allowed on a
closed record. Nothing else can be inserted (no placement, weight, prescription, immunization, procedure, visit), and **DELETE is
refused on every table, blood tests included**. A new row cannot be a column list, so the opening is the table; the card checks and
row policies on `blood_tests` still decide who may write. Chosen over allowing INSERT whenever a "late" flag is set, because no flag
can be trusted from the client and the lock is meant to be a fact about the database.

**Still refused, on purpose:** every other column; notes together with any other column in one UPDATE; files attached to a blood test
(`enforce_deceased_lock_attachment` unchanged, so a late result carries its file through `blood_tests.drive_file_id`, not an
attachment row).

## Outstanding — the app half of (D) is NOT built

The columns are open, the screens do not offer them. A person still cannot, on a dead resident's page, add a note to a
placement, weight, prescription, immunization or procedure, or add a blood test; those controls are drawn off `isDeceased`.
A later stream must gate each new control by the card its action asks (`CLAUDE.md`, buttons follow cards).

## Found, not changed

- `#k2p8w` is on the `backlog` branch, not yet on `main`'s `docs/backlog.md`, so it could not be ticked in this PR (for the planner).
