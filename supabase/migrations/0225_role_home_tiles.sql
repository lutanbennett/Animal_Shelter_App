-- consumer: none
--
-- Role home tiles, schema half (docs/decisions/2026-10-19-role-home-tiles-schema.md). Lutan, 2026-10-12: choose which pages
-- appear as tiles on each role's home. This file adds the table and seeds it from what every role's home draws today.
-- NOTHING READS IT YET: the Settings panel and the home are the app half, so nothing a user sees changes.
--
--   role_home_tiles (role_id, path, position)   one row per tile, in the order the home shows them. path is a route in
--                                               src/lib/permissions/routes.ts (or /residents, /bills, /assistant, which sit outside it).
--
-- Writes: Admin, at 2-step (aal2), the pattern of role_cards (0194). Audited with record_audit(), after the seed.
-- Seed: today a role's home is its role_cards in order, one tile each, the page being the card's `opens` (or `opensAny` when the
-- role's clinical scope is not own_clinic). Admin has no cards, so no rows. A page two held cards share is one tile (a card another
-- held card includes, such as View residents under Residents, draws none of its own): the first position wins.
-- The card -> page map below is a copy of src/lib/permissions/cards.ts; scripts/check-role-home-tiles.mjs fails if they differ.
-- Roles with no cards (a custom role not yet given any) keep the derived home; they get no rows.
--
-- To revert: drop table role_home_tiles. Re-runnable: create-if-not-exists, and the seed does nothing once the table has rows.

create table if not exists role_home_tiles (
  id       uuid primary key default gen_random_uuid(),
  role_id  uuid not null references roles (id) on delete cascade,
  path     text not null check (path ~ '^/[a-z0-9/_-]*$'),
  position integer not null default 0,
  unique (role_id, path)
);

comment on table role_home_tiles is
  'Which pages a role shows as tiles on its home, in order (0225). path is a route in src/lib/permissions/routes.ts. A role with no rows keeps the derived home. Written by Admin at 2-step; audited.';

create index if not exists role_home_tiles_role_idx on role_home_tiles (role_id);

-- Fixed roles take no tiles, as they take no cards or cells.
create or replace function role_home_tiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.roles where id = new.role_id and kind = 'fixed') then
    raise exception 'Fixed roles have no home tiles: Admin has Settings, and the public viewer has no home.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function role_home_tiles_guard() from public, anon, authenticated;

drop trigger if exists role_home_tiles_guard on role_home_tiles;
create trigger role_home_tiles_guard before insert or update on role_home_tiles
  for each row execute function role_home_tiles_guard();

alter table role_home_tiles enable row level security;

drop policy if exists role_home_tiles_admin_all on role_home_tiles;
create policy role_home_tiles_admin_all on role_home_tiles
  for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists role_home_tiles_insert_requires_aal2 on role_home_tiles;
create policy role_home_tiles_insert_requires_aal2 on role_home_tiles
  as restrictive for insert with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists role_home_tiles_update_requires_aal2 on role_home_tiles;
create policy role_home_tiles_update_requires_aal2 on role_home_tiles
  as restrictive for update using ((select auth.jwt() ->> 'aal') = 'aal2') with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists role_home_tiles_delete_requires_aal2 on role_home_tiles;
create policy role_home_tiles_delete_requires_aal2 on role_home_tiles
  as restrictive for delete using ((select auth.jwt() ->> 'aal') = 'aal2');

revoke all on role_home_tiles from anon;
grant select, insert, update, delete on role_home_tiles to authenticated, service_role;

-- Seed: once, from role_cards. Runs before the audit trigger exists, so it is not logged.
do $seed$
begin
  if exists (select 1 from role_home_tiles) then
    return;
  end if;

  insert into role_home_tiles (role_id, path, position)
  select role_id, path, (row_number() over (partition by role_id order by pos))::integer - 1
  from (
    select distinct on (rc.role_id, t.path) rc.role_id, t.path, rc.position as pos
    from role_cards rc
    join roles r on r.id = rc.role_id and r.kind <> 'fixed'
    join (values
      ('view_residents',        '/residents',                  '/residents'),
      ('residents',             '/residents',                  '/residents'),
      ('medical_records',       '/residents',                  '/residents'),
      ('book_clinic_visits',    '/appointments',               '/upcoming-visits'),
      ('contacts',              '/management/contacts',        '/management/contacts'),
      ('recurring_jobs',        '/management/recurring-jobs',  '/management/recurring-jobs'),
      ('dashboard',             '/management/dashboard',       '/management/dashboard'),
      ('donations_receipts',    '/management/donations',       '/management/donations'),
      ('bills',                 '/bills',                      '/bills'),
      ('website',               '/admin/website',              '/admin/website'),
      ('outreach_notes',        '/outreach',                   '/outreach'),
      ('assistant',             '/assistant',                  '/assistant'),
      ('enclosures',            '/enclosures',                 '/enclosures'),
      ('add_photos',            '/photos/add',                 '/photos/add'),
      ('approve_photos',        '/photos/approve',             '/photos/approve'),
      ('run_appeals',           '/management/appeals',         '/management/appeals'),
      ('meme_library',          '/memes',                      '/memes'),
      ('administer_medication', '/operations/medication-list', '/operations/medication-list'),
      ('record_weight',         '/medical/weight',             '/medical/weight'),
      ('add_medical_photos',    '/medical/photos',             '/medical/photos'),
      ('feed_special_diets',    '/medical/diets',              '/medical/diets'),
      ('do_maintenance',        '/maintenance',                '/maintenance'),
      ('do_stocktaking',        '/stocktake',                  '/stocktake'),
      ('do_purchasing',         '/management/purchasing',      '/management/purchasing'),
      ('record_delivery',       '/deliveries',                 '/deliveries')
    ) as m(card, own_clinic_path, any_path) on m.card = rc.card
    cross join lateral (
      select case when r.scope_clinical = 'own_clinic' then m.own_clinic_path else m.any_path end as path
    ) t
    order by rc.role_id, t.path, rc.position
  ) x(role_id, path, pos);
end
$seed$;

drop trigger if exists audit_role_home_tiles on role_home_tiles;
create trigger audit_role_home_tiles after insert or update or delete on role_home_tiles
  for each row execute function record_audit();

notify pgrst, 'reload schema';
