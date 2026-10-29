# A per-card check for the resident photo table (2026-10-29)

Stream `photo-card-check`. Fills the gap #1063 named when it retired `check-perm-convert-photos.mjs`.
No migration. New file `scripts/check-photo-cards.mjs`; none of the five existing photo checks could carry
the question (they guard the public views, approval, pending rows, bills and appeals, not who may read or
write `attachments` rows), so this is a sixth, but it replaces the retired one rather than adding to it.

## What it asks

For each of eight logins, each holding **exactly one card** (or none), under the login's own JWT in a
rolled-back transaction on dev: may it read a Medical-folder photo, read any other resident photo, insert a
Medical photo, insert a Shelter photo, delete a photo? Expected answers come from the cells the card actually
left on the login (`role_permissions`), against the activity each policy asks (0276, 0278, `insert_perm`,
`delete_perm`). The Medical **read** is also pinned to `view_medical`, `medical_records`, `add_medical_photos`
(Lutan, 2026-10-27 and 2026-10-28), so gaining or losing it is a decision, not drift. A no-card login must get nothing.

Never keyed on a role: the disposable role exists only to carry the card, as in `check-role-write-policies`.
Admin is not asked.

## Measured on dev, 2026-10-29

`M` reads Medical, `R` reads other folders, `m` files Medical, `s` files Shelter, `d` deletes:
view_residents `-R---`; residents `-R--d`; add_photos `-----`; add_medical_photos `M-m--`; approve_photos `-R--d`;
view_medical `MR---`; medical_records `MR---`; none `-----`. Green.

## Needs another card (reported, not hidden)

Filing needs `photos.resident_add` **and** (`photos.medical_add` for Medical, `photos.resident_publish` for
other folders). No card applies both halves on its own: `residents` holds `resident_add` but neither
`medical_add` nor `resident_publish` (in `card_grants` on dev), and `add_medical_photos` holds
`resident_add` and `medical_add` but not `resident_publish`. So **no single card can file a photo anywhere** on dev.

## Found, not fixed

- That last point may be intended (Residents publishing may come from `cards.ts` bundles rather than
  `card_grants`) or a fault: a card that applies `photos.resident_add` but cannot file into any folder is a
  card that does nothing, which `CLAUDE.md` forbids. Not established which; worth a look by a card stream.
- `add_photos` (`photos.shelter_add`) reads and writes nothing on this table alone; it files through
  `record_attachment`, which this check does not drive.
- `maintenance`/`stock` etc. attachment owner types are not asked; only `resident`.

## Also done

The three stale references to retired scripts: the comment in `src/lib/permissions/jobs.ts`, the §11 section
of `docs/roles-and-permissions.md` (marked retired, kept as history), and the allow-list line in
`scripts/check-activity-lists.mjs`.
