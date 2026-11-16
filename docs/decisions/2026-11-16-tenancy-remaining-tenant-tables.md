# Tenancy part 2: the 46 tenant tables the cut never reached, 0389

`#n9grp` and the schema half of `#s50n8`, under `#ykefa`. Migration `0389_shelter_id_remaining_tenant_tables.sql`, applied to dev only (project `qxkmhwybjggxvsfxsxbd`, 2026-11-16).

## Verification (method: `pg_class`/`pg_attribute`/`pg_trigger` read from live dev through the Management API)
- **All 19 named tables exist and none had `shelter_id`.** The list is right as far as it goes.
- **19 is NOT the right number. It is 46.** Dev had 124 public tables, 48 with the column (after 0383/0384/0387, `shelter_hosts` included) and 76 without. Taking the 76 away from part 1's triage lists (9 not tenant, 21 ambiguous, all 30 of which exist without the column except `shelter_hosts`) leaves 46 tenant tables: the 19 plus **27 from group (C) "the rest"** that 0384 never reached: `assistant_actions`, `attachments`, `audit_log`, `enclosures`, `facility_maps`, `maintenance`, `maintenance_assignees`, `maintenance_photos`, `map_room_placements`, `map_rooms`, `meme_residents`, `memes`, `pending_photos`, `project_folders`, `project_photos`, `recurring_job_assignees`, `recurring_job_occurrence_assignees`, `recurring_job_occurrences`, `recurring_jobs`, `reel_residents`, `reels`, `retention_runs`, `site_content`, `site_content_photos`, `site_pages`, `video_uploads`, `write_requests`, `zones`.
- **The arithmetic closes:** 47 tenant tables carried the column before (48 less `shelter_hosts`, which is not tenant) + 46 = **93**, the triage's tenant count. After 0389: 95 tables with the column, 29 without = 21 ambiguous + 8 not-tenant (the 9 less `shelter_hosts`).
- Each of the 46 is tenant because part 1's triage says "everything else" is tenant; none is on the ambiguous or not-tenant lists.

## Per-table verdict
All 46 get a nullable `shelter_id uuid references shelters(id)`, no policy, default, backfill or NOT NULL. None is recorded as not needing one.

## Unique keys widened (nulls not distinct, so today's guarantee is exact while every shelter_id is null)
`medication_name_key (name)`, `diets_name_key (name)`, `diets_one_standard (is_standard) where is_standard`, `rounds_key_key (key)`, `rounds_sort_order_key (sort_order)`, `impact_baselines_key_unique (key)`, `public_stat_switches_key_unique (key)`, `website_drafts_target_row_key_key (target, row_key)`, `premises_name_uniq (lower(btrim(name)))`, `maintenance_job_code_key (job_code)`, `zones_name_key (name)`, `site_pages_slug_key (slug)`, `facility_maps_one_overview ((true)) where kind='overview'`, `project_folders_root_name_key (lower(name)) where parent_folder_id is null`; each gains `shelter_id` as its first column. No foreign key points at any of them (checked: none outside `(id)`), and no app code upserts on them (`onConflict` grep over `src`, `worker`, `scripts`); the `on conflict` clauses in old migrations are history.
**Left alone on purpose:** `doctors_user_id_key` (a login is one doctor: global is right), the `drive_file_id` keys on `memes`, `reels`, `pending_photos` (a Drive file id is globally unique), `facility_maps_one_per_zone` and other keys scoped by a parent id (the parent is already per shelter).
**Not decided: `resident_note_sources`.** Its primary key is `(source_table, source_column)`, a catalogue of which columns feed resident notes. It gained the column but the key cannot take a nullable column. Whether it is shared or per shelter is a decision for part 5; named, not guessed.
**Also named, not fixed:** `site_content` is a singleton (its audit rows use the fixed id `00000000-0000-0000-0000-000000000001`), so a second shelter has no row to own; part 5 has to decide. `place_sort_order_last` and `stamp_stock_counted_at` triggers on `medication` and similar still order across all shelters, which is harmless while there is one.

## The trigger count is not six
Method: every non-internal public trigger (`pg_trigger`), its function source searched for `insert into <table>` where the table is one that carries (or now carries) the column.
Triggers whose function **inserts** into a column-bearing tenant table:
- `record_audit` (about 40 `audit_*` triggers) → `audit_log`. **Changed in 0389** to copy `shelter_id` from the audited row's own image. Proven on dev: a `contacts` update with a shelter set wrote an `audit_log` row with that shelter.
- `site_content_hidden_pages_audit`, `site_content_stocktaking_audit` → `audit_log`. **Changed in 0389** to copy `new.shelter_id`.
- `clinic_visits_link_doctor` → `doctors`, `doctor_clinics`. **Changed in 0389** to copy the visit's `shelter_id`.
- `diet_rounds_default_trigger` → calls `reset_diet_rounds` → `resident_diet_rounds`. Already correct since 0383.
Triggers that write ambiguous tables and so are **not** touched: `queue_translations` → `translations`, `record_label_sources` → `label_sources`/`label_drafts`.
Not inserters (update or delete only, no stamp needed): `close_prior_placement`, `doctors_propagate_name`, `doctors_sync_link_keys`, `handle_deceased_placement`, `prescriptions_carry_dose`, `project_folders_after_move`, `shares_cleanup`.
**Restated: five insert-writing trigger functions today (four changed here, one already right) plus two that write ambiguous tables.** The source search is a text match; a dynamic `execute format('insert ...')` would be missed, and non-trigger functions are not counted.

## Refused / out of scope
The 21 ambiguous tables, `public_resident_cards`, `public_shelter_stats` (`#vleak`) and every policy. **`public_stat_switches` DID get a `shelter_id`, so `#vleak` can filter `public_shelter_stats` on it.** Its key is now `(shelter_id, key)`.

## Admin
Nothing here touches the Admin bypass or gives Admin a card.
