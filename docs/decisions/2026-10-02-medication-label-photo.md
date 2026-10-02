# 2026-10-02 — Medication label photo: the feature half of part (1)

Builds on `0129` (`docs/decisions/2026-10-02-medication-label-column.md`).
Parts (2) the phone cards and (3) who sees Stocktake are not in this change.

- **Copies the Shelter Friend logo path, not the item's shorthand.** The item
  says "return `{ok, error}`"; the existing upload actions actually return
  `ActionResult<{ success: string }>` (`{ ok: true, success }` or
  `{ ok: false, error }`), so `uploadMedicationLabel` / `removeMedicationLabel`
  do the same. Same checks in the same order: management role, file present,
  type, 15 MB (`MAX_UPLOAD_BYTES`, the readable `fileTooLarge` string, also
  checked in the browser first by `runUploadAction`), magic-byte check, Drive
  upload, `confirmUploaded` read-back, then the row update with `.select()` so
  success is only reported when a row changed; the old photo goes to Drive's
  trash only after that. The limit is **not** raised.
- **Drive folder `Medications/Labels`** under the root, beside `Website/…`.
- **Not public, and the proxy knows it.** `medication` was added to the
  non-public half of `/api/photos/[fileId]`'s table list, so a label is served
  only to a caller whose own RLS can read the medication row, `private,
  no-store`. No `public_*` view selects the column and `is_public_drive_file`
  is untouched (checked in the test plan).
- **Size.** Thumbnails ask the proxy for `?w=160` (a 64 px box on the
  sheet/table, 96 px on the delivery form); the original is only served if
  Drive has no rendition yet. No larger size is offered: matching a box needs
  recognition, not reading, and the phone card in part (2) can ask for 400.
- **Three places, one component** (`MedicationLabelThumb`): the Medications
  table, the stocktake sheet's medication rows, and the delivery form (beside
  the item picker once a medication with a photo is chosen). A medication with
  no photo renders nothing, so nothing shifts for existing rows.
- **Diets tab is not wired.** The column exists (0129) but nothing reads it.
  The upload action, proxy list entry, three screens and strings are all
  medication-specific; doing diets as well roughly doubles the surface for a
  feature nobody asked to use yet, and part (2)'s cards are what would make a
  diet photo useful. When the Diets card work arrives it adds `diet_types` to
  the proxy list and reuses the component. Until then a `diet_types` label
  would 404 at the proxy, which is harmless because nothing writes one.
- **Phones.** The Medications page sits behind `LargerScreenNotice`; on a
  phone the "Show the page anyway" button reveals it, and the file input
  (`accept="image/*"`) then offers the camera. Not changed here.
