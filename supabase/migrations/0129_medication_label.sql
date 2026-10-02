-- consumer: src/app/management/medications/actions.ts, src/app/management/medications/MedicationsTable.tsx, src/app/stocktake/StocktakeSheet.tsx, src/app/api/photos/[fileId]/route.ts
--
-- A label photo on medication, and on diet_types (backlog, "Medication label
-- photos, a card-by-card stocktake on phones, and Stocktake only for the
-- people who do it", part 1; schema half — the upload action, thumbnail,
-- stocktake card and the photo proxy are the feature half and read this).
--
--   label_drive_file_id   text, null = no photo. The Drive file id of a photo
--                         of the box or bottle label, so a person holding the
--                         item can match it at a glance when counting or when a
--                         delivery arrives. Same shape as the other Drive-backed
--                         columns (shelter_friends.logo_drive_file_id 0076,
--                         residents.profile_photo_drive_file_id 0001): a bare
--                         text id, no foreign key (Drive is not in the
--                         database), no default.
--
-- ## Both tables, one migration
--
-- The item says the Diets tab can use the same card later and that the column
-- costs one. Deciding later would be a second schema PR, which the one-
-- migration-in-flight rule makes block a whole batch's slot. So diet_types gets
-- it now. NOTHING READS diet_types.label_drive_file_id YET and nothing is
-- planned to in the feature half of this item (medications only); it is here on
-- purpose, not forgotten.
--
-- ## Serving it
--
-- The photo proxy (/api/photos/<fileId>) asks the caller's own RLS whether a row
-- holds the id (docs/decisions/2026-09-25-photo-proxy-asks-who-is-asking.md).
-- That list lives in route.ts, not in SQL, so there is no function to redefine
-- here; the feature half adds medication (and later diet_types) to it. Until it
-- does, a label would 404 — harmless, because nothing writes one yet. The id is
-- not public: no public_* view selects it and is_public_drive_file (0084) is not
-- touched, so a label is served only to a signed-in caller who can read the row.
--
-- ## Nothing changes for anyone
--
-- Additive and nullable; no trigger, no default, no back-fill. A column
-- inherits its table's RLS and grants; neither table has column-level grants or
-- a select-* view, so write access stays exactly who can already edit medication
-- / diet_types (management and admin) and no view exposes the column.

alter table medication add column if not exists label_drive_file_id text;
alter table diet_types add column if not exists label_drive_file_id text;

comment on column medication.label_drive_file_id is
  'Drive file id of a photo of the medication''s box/bottle label, shown beside the name when counting stock and recording a delivery. Null = no photo. Served through /api/photos/<id>; not public.';
comment on column diet_types.label_drive_file_id is
  'Drive file id of a photo of the food''s bag/tin label. Null = no photo. Added alongside medication.label_drive_file_id (0129) so the Diets tab can use the same card later; nothing reads it yet.';
