-- consumer: none (the next stream reads these rows: src/app/admin/who-does-what/CardBoard.tsx)
--
-- features (docs/decisions/2026-10-24-features-table-and-card-features.md): the schema half of "group Who does what's
-- Available cards by FEATURE, with the features and each card's feature held as data". Nothing reads these rows yet, and
-- NOTHING here changes what anyone can do.
--
-- WHAT IS HERE
--   features        the 13 areas of docs/features.md, seeded with those names exactly as they stand: key (stable handle),
--                   English name, Thai name (empty until someone supplies it), position. Names and order are DATA.
--   card_features   which feature each card mainly serves. The card DEFINITIONS stay in code (src/lib/permissions/cards.ts),
--                   as role_cards' do, so this holds the card key as text, not a foreign key. One row per card.
--
-- NOT YET SORTED is not a row. A card is unsorted when it has no card_features row, or its feature_id is null. That covers
-- a card added to cards.ts later (it has no row, so it lands in the section instead of vanishing) and a card whose feature
-- was deleted (feature_id goes to null: on delete set null). A seeded "unsorted" feature would be a 14th area Admin could
-- rename, reorder or delete, and cards could be filed under it by mistake.
--
-- WRITES: Admin at 2-step only, as role_cards (0194). Neither table is readable by anyone else. AUDITED: record_audit().
-- The two names must be added to AUDITED_TABLES in src/lib/audit/recent-changes.ts by the app half, or their rows show unlabelled.
--
-- TO REVERT (no down file, additive): drop table card_features, features.
--
-- Re-runnable: create-if-not-exists, and the seeds insert only what is missing (a rename or move made on screen is kept).

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists features (
  id       uuid primary key default gen_random_uuid(),
  key      text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name     text not null check (btrim(name) <> '' and char_length(name) <= 80),
  name_th  text check (name_th is null or (btrim(name_th) <> '' and char_length(name_th) <= 80)),
  position integer not null default 0
);

comment on table features is
  'The areas of the system (0255), seeded from docs/features.md. Names and order are data Admin edits; key is a stable handle for code and the security rebuild.';

create table if not exists card_features (
  id         uuid primary key default gen_random_uuid(),
  card       text not null unique check (card ~ '^[a-z][a-z0-9_]*$'),
  feature_id uuid references features (id) on delete set null
);

comment on table card_features is
  'The feature each card mainly serves (0255). No row, or a null feature_id, means Not yet sorted. Card keys are those of src/lib/permissions/cards.ts.';

create index if not exists card_features_feature_idx on card_features (feature_id);

-- ---------------------------------------------------------------------------
-- 2. Who may write: Admin, at 2-step (the pattern of role_cards)
-- ---------------------------------------------------------------------------
alter table features enable row level security;
alter table card_features enable row level security;

drop policy if exists features_admin_all on features;
create policy features_admin_all on features
  for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists card_features_admin_all on card_features;
create policy card_features_admin_all on card_features
  for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

do $aal2$
declare
  t text;
begin
  foreach t in array array['features', 'card_features'] loop
    execute format('drop policy if exists %I on %I', t || '_insert_requires_aal2', t);
    execute format($p$create policy %I on %I as restrictive for insert with check ((select auth.jwt() ->> 'aal') = 'aal2')$p$,
                   t || '_insert_requires_aal2', t);
    execute format('drop policy if exists %I on %I', t || '_update_requires_aal2', t);
    execute format($p$create policy %I on %I as restrictive for update using ((select auth.jwt() ->> 'aal') = 'aal2') with check ((select auth.jwt() ->> 'aal') = 'aal2')$p$,
                   t || '_update_requires_aal2', t);
    execute format('drop policy if exists %I on %I', t || '_delete_requires_aal2', t);
    execute format($p$create policy %I on %I as restrictive for delete using ((select auth.jwt() ->> 'aal') = 'aal2')$p$,
                   t || '_delete_requires_aal2', t);
  end loop;
end
$aal2$;

revoke all on features, card_features from anon;
grant select, insert, update, delete on features, card_features to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Seed: the 13 features, as docs/features.md names them (2026-10-23)
-- ---------------------------------------------------------------------------
insert into features (key, name, position) values
  ('resident_information',   'Resident information',              1),
  ('housing_and_moves',      'Housing and moves',                 2),
  ('medical_information',    'Medical information',               3),
  ('feeding_and_diets',      'Feeding and diets',                 4),
  ('stock_and_purchasing',   'Stock and purchasing',              5),
  ('maintenance_and_projects', 'Maintenance and projects',        6),
  ('finances_and_reports',   'Finances and reports',              7),
  ('photos_videos_social',   'Photos, videos and social media',   8),
  ('people_and_contacts',    'People and contacts',               9),
  ('fundraising_outreach',   'Fundraising and outreach',         10),
  ('website_public_pages',   'Website and public pages',         11),
  ('staff_tasks_assistant',  'Staff tasks and the assistant',    12),
  ('settings_administration', 'Settings and administration',     13)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Seed: one feature per card (the 28 of cards.ts). Guesses are listed in the decision file.
-- ---------------------------------------------------------------------------
insert into card_features (card, feature_id)
select m.card, f.id
  from (values
    ('view_residents',        'resident_information'),
    ('residents',             'resident_information'),
    ('enclosures',            'housing_and_moves'),
    ('medical_records',       'medical_information'),
    ('book_clinic_visits',    'medical_information'),
    ('administer_medication', 'medical_information'),
    ('record_weight',         'medical_information'),
    ('feed_special_diets',    'feeding_and_diets'),
    ('do_stocktaking',        'stock_and_purchasing'),
    ('do_purchasing',         'stock_and_purchasing'),
    ('record_delivery',       'stock_and_purchasing'),
    ('do_maintenance',        'maintenance_and_projects'),
    ('bills',                 'finances_and_reports'),
    ('donations_receipts',    'finances_and_reports'),
    ('dashboard',             'finances_and_reports'),
    ('add_photos',            'photos_videos_social'),
    ('add_medical_photos',    'photos_videos_social'),
    ('approve_photos',        'photos_videos_social'),
    ('meme_library',          'photos_videos_social'),
    ('contacts',              'people_and_contacts'),
    ('run_appeals',           'fundraising_outreach'),
    ('outreach_notes',        'fundraising_outreach'),
    ('website',               'website_public_pages'),
    ('recurring_jobs',        'staff_tasks_assistant'),
    ('my_tasks',              'staff_tasks_assistant'),
    ('assistant',             'staff_tasks_assistant'),
    ('operations_landing',    'settings_administration'),
    ('management_landing',    'settings_administration')
  ) as m (card, feature_key)
  join features f on f.key = m.feature_key
on conflict (card) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Audit: after the seed, so the seed is not logged (as 0194 did)
-- ---------------------------------------------------------------------------
drop trigger if exists audit_features on features;
create trigger audit_features after insert or update or delete on features
  for each row execute function record_audit();
drop trigger if exists audit_card_features on card_features;
create trigger audit_card_features after insert or update or delete on card_features
  for each row execute function record_audit();

notify pgrst, 'reload schema';
