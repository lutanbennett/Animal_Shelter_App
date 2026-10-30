# can_see_drive_file() now answers for memes, donation receipts and the deceased-resident files

2026-10-30, stream `can-see-drive-file-fold-schema`. Migration `0286`.

## What changed
`can_see_drive_file()` (rebuilt from `0218`, its latest body; `0276` only changed a policy it follows) gained four branches:
`memes.drive_file_id`, `donation_receipts.drive_file_id`, `residents.deceased_summary_drive_file_id`,
`residents.deceased_index_drive_file_id`. `/api/photos/[fileId]` and `/api/documents/[fileId]` lost their app-code checks
(`isMemeTheCallerMaySee`, `hasRow`) and now ask the one question, as `/api/videos/[fileId]` already did.

## Activities per kind (none chosen, none granted)
The function is `security invoker`, so each branch is answered by that table's own RLS as the caller, exactly what the old
selects relied on: memes `social.library` read (`0264`), donation receipts `donation.receipt` (`0244`), residents rows the
resident read policy. `is_public_drive_file()` was not touched.

## Why both halves are in one PR
The route edits are deletions of checks the function now answers: harmless to code that does not know about the migration, useless
without it. **Deploy order matters:** apply `0286` to production before the routes ship, or a receipt, meme or deceased file 404s.

## What the proof covers
`scripts/check-can-see-drive-file.mjs` now treats the four kinds as part of the old path (the separate selects) and compares them
with the RPC for every role, anon, service_role and a role-less login over 431 ids: 0 disagreements. So a login that could open a
kind still can, and one that could not still gets false, which the routes turn into the unchanged indistinguishable 404. It
compares at database level; the routes were not driven over HTTP.
