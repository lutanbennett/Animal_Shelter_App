# 2026-10-02 — `label_drive_file_id` on medication **and** diet_types (`0129`)

Schema half of backlog "Medication label photos, a card-by-card stocktake on
phones, and Stocktake only for the people who do it", part (1). Parts (2) and
(3) and all UI are the feature halves and are not touched here.

- **Both tables, one migration.** The item asked whether `diet_types` should
  get the column so the Diets tab can use the same card later. It does: the
  column costs one line now, and adding it later would be a second schema PR,
  which the one-migration-in-flight rule makes block a whole batch's slot.
  **Nothing reads `diet_types.label_drive_file_id` yet, and the feature half of
  this item does not plan to** (medications only) — it is there on purpose, not
  forgotten. The column comment says so.
- **Shape copies the existing Drive columns.** A bare `text` Drive file id,
  nullable, no foreign key (Drive is not in the database), no default, no
  back-fill — like `shelter_friends.logo_drive_file_id` (0076) and
  `residents.profile_photo_drive_file_id` (0001). Name as the item gave it.
- **Not public.** No `public_*` view selects it and `is_public_drive_file`
  (0084) is untouched, so a label is served only to a signed-in caller whose own
  RLS can read the row.
- **No SQL change to serve it.** The photo proxy's non-public half is a list of
  tables in `src/app/api/photos/[fileId]/route.ts`
  (docs/decisions/2026-09-25-photo-proxy-asks-who-is-asking.md), not a function.
  **Hand-over for the feature half:** add `medication` to that list, or a label
  404s. Until then it is harmless, since nothing writes one.
- **Access is inherited.** Neither table has column grants or a `select *`
  view; the harness asserts no public view names the column. Writes stay with
  management and admin.
- **Down-migration:** none; an unread nullable column is left in place.
