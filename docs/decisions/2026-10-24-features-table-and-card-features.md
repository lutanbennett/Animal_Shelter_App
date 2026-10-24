# 2026-10-24: a `features` table, and a feature for every card (0255)

Schema half of the backlog item *Who does what: group the Available cards column into sections by FEATURE*. Lutan, 2026-10-24: *"Yes build it now as it will help me in completing the PDF."* Seeded with the 13 names of `docs/features.md` as they stand; his mark-up becomes screen edits, not a rebuild. **The app half (the grouped column and the Features panel) is not built.** Nothing reads these rows yet and nothing a role can do changes.

## Shape

- `features` (id, `key` stable handle, `name`, `name_th` null until supplied, `position`): the 13, in the document's order. Names and order are data.
- `card_features` (id, `card` unique, `feature_id` nullable, `on delete set null`): one row per card. `card` is text, not a foreign key, because card definitions live in `src/lib/permissions/cards.ts`, as `role_cards.card` does.
- Writes: Admin at 2-step only (the `role_cards` policies); no one else can read either. Audited with `record_audit()`. **The app half must add `features` and `card_features` to `AUDITED_TABLES`** (`src/lib/audit/recent-changes.ts`) or their rows show unlabelled; this stream was barred from `src/`.
- Proof: `node scripts/check-features-schema.mjs` (live rows against `docs/features.md` and `cards.ts`, then a rolled-back transaction).

## Not yet sorted is the absence of a feature, not a row

A card is unsorted when it has no `card_features` row or a null `feature_id`. A card added to `cards.ts` later has no row, so the screen must put it under *Not yet sorted* by default rather than lose it. Deleting a feature nulls its cards the same way. A seeded "unsorted" row was rejected: it would be a 14th area Admin could rename, reorder or delete, and a card could be filed under it by mistake.

## Card to feature (all 28 cards of `cards.ts`)

| Feature | Cards |
|---|---|
| 1 Resident information | view_residents, residents |
| 2 Housing and moves | enclosures |
| 3 Medical information | medical_records, book_clinic_visits, administer_medication, record_weight |
| 4 Feeding and diets | feed_special_diets |
| 5 Stock and purchasing | do_stocktaking, do_purchasing, record_delivery |
| 6 Maintenance and projects | do_maintenance |
| 7 Finances and reports | bills, donations_receipts, dashboard |
| 8 Photos, videos and social media | add_photos, add_medical_photos, approve_photos, meme_library |
| 9 People and contacts | contacts |
| 10 Fundraising and outreach | run_appeals, outreach_notes |
| 11 Website and public pages | website |
| 12 Staff tasks and the assistant | recurring_jobs, my_tasks, assistant |
| 13 Settings and administration | operations_landing, management_landing |

The brief said 26 cards; `cards.ts` has 28 (8 jobs and 20 others), including the two landing pages. All are mapped.

## Where Claude had to guess (for Lutan to correct on screen)

- **donations_receipts**: `docs/features.md` lists it under both Finances (7) and Fundraising (10). Put in 7: it records money received.
- **add_medical_photos**: could be Medical (3) or Photos (8). Put in 8; the document lists it there.
- **operations_landing, management_landing**: navigation pages with no permissions of their own, named in no feature. Put in 13 (the only area with no real cards) so they are not left out; they may belong in no feature at all.
- **dashboard**: 7, as the document lists it.
- **do_maintenance**: 6; it also reads Housing (2) and Staff tasks (12).
- **view_residents / residents**: both in 1, though `view_residents` is only the read floor.
