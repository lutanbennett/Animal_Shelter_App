-- consumer: none yet (the role-home-app stream, a later batch, will read it from src/lib/home/ and
-- src/app/admin/who-does-what/; that stream does not exist at this commit)
--
-- Tile groups on a role's home, schema half (docs/decisions/2026-10-21-bills-inbox-and-role-groups-schema.md).
-- Decided 2026-10-20 (Lutan), option (b): groups are data Admin builds per role. A group is a "doorway" tile
-- (Operations, Management, ...) that opens a page of the cards inside it.
--
--   role_groups          a group on one role: name, Thai name, icon (a key the app maps to an icon), position.
--   role_cards.group_id  nullable: null = the card sits on the home directly (every card today), else inside
--                        that group. On delete set null, so removing a group puts its cards back on the home.
--
-- A GROUP GRANTS NOTHING. It is presentation: no cell, no bundle; set_role_cards() and the recompute do not
-- read it and role_permissions is untouched. A group shows the role's own cards, so it can never open a page
-- the role cannot use.
--
-- SEED: every non-fixed role gets an Operations and/or a Management group when it holds a card whose page
-- lives in that section today (sectionOf() in src/lib/permissions/routes.ts: /operations/*, /management/*),
-- i.e. the landings it reaches from a card today. NO CARD IS MOVED INTO A GROUP: every group_id stays null,
-- so no role's home changes on the day this lands; the role-home-app stream or the Director decides what goes
-- inside. set_role_cards() keeps group_id across a save (its upsert updates position only).
--
-- Same rules as role_cards (0194): Admin only, writes at the authenticator-app step; fixed roles take none.
-- Re-runnable: if not exists / or replace; the seed inserts only groups a role does not already have.
create table if not exists role_groups (
  id       uuid primary key default gen_random_uuid(),
  role_id  uuid not null references roles (id) on delete cascade,
  name     text not null check (btrim(name) <> ''),
  name_th  text not null check (btrim(name_th) <> ''),
  icon     text not null check (icon ~ '^[a-z][a-z0-9_]*$'),
  position integer not null default 0,
  unique (role_id, name)
);

comment on table role_groups is
  'A doorway tile on a role''s home that opens a page of the cards inside it (0241). Presentation only: grants nothing.';

create index if not exists role_groups_role_idx on role_groups (role_id);

alter table role_cards add column if not exists group_id uuid references role_groups (id) on delete set null;
comment on column role_cards.group_id is
  'The group this card sits in on the role''s home (0241); null = on the home directly. Grants nothing.';
create index if not exists role_cards_group_idx on role_cards (group_id);

-- A card's group must belong to the card's own role.
create or replace function role_cards_group_same_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.group_id is not null
     and not exists (select 1 from public.role_groups g where g.id = new.group_id and g.role_id = new.role_id) then
    raise exception 'role_cards: group % does not belong to this card''s role', new.group_id;
  end if;
  return new;
end;
$$;
revoke execute on function role_cards_group_same_role() from public, anon, authenticated;

drop trigger if exists role_cards_group_same_role on role_cards;
create trigger role_cards_group_same_role before insert or update of group_id, role_id on role_cards
  for each row execute function role_cards_group_same_role();

-- Fixed roles take no groups, as they take no cards (role_cards_guard, 0194).
drop trigger if exists role_groups_guard on role_groups;
create trigger role_groups_guard before insert or update on role_groups
  for each row execute function role_cards_guard();

alter table role_groups enable row level security;
drop policy if exists role_groups_admin_all on role_groups;
create policy role_groups_admin_all on role_groups
  for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists role_groups_insert_requires_aal2 on role_groups;
create policy role_groups_insert_requires_aal2 on role_groups as restrictive for insert
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists role_groups_update_requires_aal2 on role_groups;
create policy role_groups_update_requires_aal2 on role_groups as restrictive for update
  using ((select auth.jwt() ->> 'aal') = 'aal2') with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists role_groups_delete_requires_aal2 on role_groups;
create policy role_groups_delete_requires_aal2 on role_groups as restrictive for delete
  using ((select auth.jwt() ->> 'aal') = 'aal2');

revoke all on role_groups from anon;
grant select, insert, update, delete on role_groups to authenticated, service_role;

-- Seed. Card -> section from each card's `opens` (src/lib/permissions/cards.ts, jobs.ts) at this commit.
insert into role_groups (role_id, name, name_th, icon, position)
select distinct rc.role_id, s.name, s.name_th, s.icon, s.position
  from role_cards rc
  join roles r on r.id = rc.role_id and r.kind <> 'fixed'
  join (values
    ('administer_medication', 'operations'),
    ('contacts',              'management'),
    ('recurring_jobs',        'management'),
    ('dashboard',             'management'),
    ('donations_receipts',    'management'),
    ('run_appeals',           'management'),
    ('do_purchasing',         'management')
  ) as m(card, section) on m.card = rc.card
  join (values
    ('operations', 'Operations', 'งานประจำวัน', 'operations', 0),
    ('management', 'Management', 'การจัดการ',   'management', 1)
  ) as s(key, name, name_th, icon, position) on s.key = m.section
on conflict (role_id, name) do nothing;
