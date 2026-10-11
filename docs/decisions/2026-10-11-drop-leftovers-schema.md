# 0184: drop 0175's map-room leftovers, show room descriptions in Thai to every viewer, drop the four old vet views

2026-10-11, `claude/drop-leftovers-schema`. One migration, `0184_drop_leftovers.sql`.

**Why three subjects share one file.** `CLAUDE.md`: only one branch may carry a migration at a time, and if two
streams need schema, their migrations go in one schema PR. Each part is a few lines; a batch slot each would
have cost three PRs for nothing. It is not carelessness.

## A. The map-room leftovers
Dropped: constraint `map_rooms_one_per_kind`, trigger and function `map_rooms_name_from_kind`, and
`map_room_kind_name(text, boolean)`. Every room write is by primary key since `map-rooms-editor`.

**`map_rooms.kind` stays.** The brief said it might go if the grep was clean. It was not:
`src/app/admin/facility-map/actions.ts` still selects `kind` (the plan-history snapshot) and uses it with
`LEGACY_ROOM_NAMES` to restore old snapshots by name. Dropping the column means changing that code; left for a
later item.

## B. Thai for every viewer
New select policy `map_rooms_translations_read` on `translations`. It admits a row only when
**`table_name = 'map_rooms'` and `status = 'approved'`** and the viewer passes `private.has_app_access()`
(the same test `map_rooms_read` uses). Nothing else in `translations` is opened: not drafts, not pending rows,
not any other table. The English it translates is already readable by those people. No app change was needed:
the enclosures page already reads `translations` with the viewer's own login.

## C. The four old vet views
Dropped `vets`, `vet_doctors`, `vet_doctor_clinics`, `vet_appointments` (the 0172 compatibility views); the
one-release wait is served (0.25.0 and 0.26.0 have been cut). Checked: the `docs/` and `scripts/` mentions are
history (`data-migration.md`, the requirements and roles documents describing the old schema, old comments);
none is a restore note or script that reads the views. `scripts/import-appsheet.mjs` uses the old names only as
UUID-seed namespaces, not as tables. `check-doctor-resident-scope.mjs` case N no longer allows the four, and
case J now asserts they do not resolve. That nothing *outside* the repo reads them cannot be verified from here.

## Release-time hazard
`0184` drops objects; redeploying the app cannot undo it. If anything outside the repo still reads the four
vet views, it breaks when this is applied.
