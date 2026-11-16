# Tenancy part 2, group (A): `shelter_id` on the animals' tables (`#s50n8`, under `#ykefa`)

Migration `0383_shelter_id_animals.sql`. Nullable `shelter_id uuid references shelters(id)` on 13 tables; no default, no policy, no backfill, no
`not null`. Nothing in `src/` reads any of it. **`#s50n8` is NOT ticked: this is one of four streams (A, B, C1, C2).**

## The (A) list, and the criterion

**Criterion: does a row in this table belong to one animal, or to the care of one animal?** Enumerated from the live dev schema
(`pg_class`, 123 public tables; 120 on production plus the three `0381`/`0382` tables).

Included (13): `residents`, `placement_history`, `clinic_visits`, `blood_tests`, `procedures`, `immunization_records`, `prescriptions`,
`prescription_rounds`, `resident_diets`, `resident_diet_rounds`, `weight`, `adoption_updates` (one animal's post-adoption follow-up, `resident_id`
not null), `resident_note_tags` (a link from one animal's note to another animal).

**Reported, not chosen (left out of the migration):**
- `attachments`, `video_uploads`: polymorphic owner (`owner_type`/`owner_kind`), only sometimes an animal. Group (C), media.
- `meme_residents`, `reel_residents`: link a meme or reel (marketing media) to an animal. Group (C) media; arguably (A). A decision.
- `resident_note_sources`: configuration (source table/column names), not a row of an animal.
- `diets`, `medication`, `rounds`, `clinics`, `doctors`, `doctor_clinics`, `bulk_appointments`: care reference data or clinic organisations, not a
  row of one animal. `diets`, `diet_ingredients`, `diet_types` etc. are in Part 1's ambiguous group already; `rounds` is a lookup with global
  unique keys (`key`, `sort_order`).
- `animal_reports` (public reports of animals that are not ours yet), `community_dog_outings`, `community_outing_photos`: not one of our animals.
- `zones`, `enclosures`, `map_*`: places, group (C).

## The two helpers

`current_shelter_id()` reads `request.headers ->> 'x-shelter-id'` and returns it only if it is a uuid, else null. **The Worker half (`#v0302`,
stream `tenancy-worker-shelter-header`) is in flight beside this and owns the header name; `x-shelter-id` carrying the uuid
`resolve_shelter_host()` returns is this file's assumption, and the sender must match it or this function changes in one line.** A signed-in
user's shelter (their `user_roles` row) is NOT read yet, because `user_roles` has no `shelter_id` until group (C1); that arrives as a
`create or replace`. `is_trusted_caller()` is true unless the JWT role is `anon` or `authenticated`.

Both are security **invoker** (they read only request settings), so they are not definer functions the catalogue lint must allow-list.
**Execute is granted to `authenticated` and `service_role` only, NOT anon**: `check-migration-grants.mjs` allows anon only the public-site
functions, and no policy calls these yet. **Part 5 grants anon in the same file as the first policy that needs it, and adds the names to
`ANON_FUNCTIONS` there.**

## The six triggers: which table each writes to

| Function | Writes to | Owner |
|---|---|---|
| `queue_translations` | `translations` | ambiguous group, not mine |
| `record_audit` | `audit_log` | group (C) |
| `record_label_sources` | `label_sources`, `label_drafts` | ambiguous group, not mine |
| `reset_diet_rounds` | `resident_diet_rounds` | **(A): done** — copies `d.shelter_id` from the parent `resident_diets` row |
| `reset_frequency_rounds` | `frequency_rounds` | **no longer exists**: dropped by `0288_drop_frequency_machinery.sql` |
| `reset_prescription_rounds` | `prescription_rounds` | **no longer exists**: dropped by `0288`. The table remains and is in (A), written only by forms |

So the item's "three `reset_*_rounds`" is stale: only one is live. **Each `create or replace` of the other three belongs to the stream that
owns the target table**, and each must copy `NEW.shelter_id` explicitly, since a trusted caller has no shelter.

## The unique keys

Of the item's 19, **one is in (A): `residents.resident_code`**, made `unique nulls not distinct (shelter_id, resident_code)`. `NULLS NOT
DISTINCT` is the point: a plain composite treats every null shelter as different and silently allows duplicates until the backfill, so this
keeps today's guarantee exactly now and becomes per-shelter as soon as rows carry a shelter. Nothing in `src/`, `scripts/` or `worker/` uses
`on conflict (resident_code)` (grep). **`residents_microchip_number_key` is untouched, global, on Lutan's instruction of 2026-11-15
("Across all shelters").** The other 17 are on tables outside (A) (`rounds` is a lookup, reported above); `roles_one_admin_idx` and `roles.key`
are (C2). Other unique indexes on (A) tables are per-resident (resident ids are globally unique uuids) and are not among the 19.

## Found, not fixed

`node scripts/check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer` reports **1 flagged: `table:public.donation_tax_ids`
(`0381`) has no `definer_all` policy.** Not this migration's table; belongs to the `donation-tax-id` stream.
