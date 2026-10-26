-- consumer: src/lib/permissions/cards.ts, src/app/admin/who-does-what/page.tsx, src/app/admin/who-does-what/actions.ts, scripts/check-card-grants.mjs
--
-- cards-grants-schema (docs/decisions/2026-10-24-cards-grants-in-the-database.md). Lutan's ruling, 2026-10-24: "all security
-- restrictions should be driven by cards only"; "If I assign a card the required access to perform that cards action is to be
-- derived and applied"; "just apply what is required to each card, if someone loses some access I will fix that later."
--
-- THE FAULT (live on production): a card's bundle lived only in cards.ts, and role_permissions was recomputed only when someone
-- saved a role on Who does what with the app handing the bundle in. Any other way of giving a card (0251 inserted into role_cards
-- directly) granted no access. Production: Head of Medical holds 7 cards and 6 cells; the Volunteer holds 3 cards and 3 of the 4
-- cells they need, so My tasks does not work. Dev covered every role, so it never reproduced there.
--
-- WHAT THIS DOES
--   1. card_grants (card, activity, level): what each card requires, seeded from cards.ts exactly as it stood on 2026-10-24
--      (each card's OWN bundle, nothing flattened). card_includes (card, included_card) holds the three `includes` edges
--      (residents, medical_records, book_clinic_visits each include view_residents), so a change to an included card flows to
--      every card that includes it. Admin at 2-step writes both; card_grants is audited like role_permissions.
--   2. Triggers recompute role_permissions IN THE DATABASE as exactly the union of the role's cards' grants (levels flow through
--      card_includes). role_cards changes recompute that role; card_grants / card_includes changes recompute every role. So a
--      card given, taken away or changed applies at once, however the change was made.
--   3. set_role_cards keeps its signature; p_bundle is now IGNORED. Its 0221/0222/0224 photo-approver guards are kept
--      verbatim, except that "does the edited role approve after this call" reads the grants of the cards it is handed
--      instead of the bundle the caller passed.
--   4. role_extras stops counting: cards_effective() and recompute_role_permissions() ignore it. The table is NOT dropped (the
--      app still reads it until the app half lands); dropping it is a later cleanup.
--   5. Every role is recomputed in this file, and a NOTICE per role lists what was added and what was removed (activity names
--      only). Access that came from no card goes away. That is the ruling, and the list is the record of what to give back.
--
-- Fixed roles (Admin, public viewer) are not built from cards and are never touched. The recompute skips them.
-- Nothing a policy, view or function reads changes shape: has_permission() and every policy still read role_permissions.
--
-- Re-runnable: create if not exists / or replace / on conflict do nothing. Applied once, the seed does not overwrite later edits.

-- Snapshot for the loss report, taken before anything below can change a cell.
create temp table pre_0257 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists card_grants (
  id       uuid primary key default gen_random_uuid(),
  card     text not null check (card ~ '^[a-z][a-z0-9_]*$'),
  activity text not null references permission_activities (key),
  level    smallint not null check (level in (1, 2)),
  unique (card, activity)
);

comment on table card_grants is
  'What a card requires: one row per activity at a level (1 read, 2 edit / yes) (0257). A role''s role_permissions is exactly the union of its cards'' rows. Admin at 2-step writes it; every change is audited and applies to every holder at once.';

create table if not exists card_includes (
  card          text not null check (card ~ '^[a-z][a-z0-9_]*$'),
  included_card text not null check (included_card ~ '^[a-z][a-z0-9_]*$'),
  primary key (card, included_card),
  check (card <> included_card)
);

comment on table card_includes is
  'Cards a card brings with it (0257): giving the card gives everything the included card requires.';

alter table card_grants enable row level security;
alter table card_includes enable row level security;

drop policy if exists card_grants_admin_all on card_grants;
create policy card_grants_admin_all on card_grants
  for all using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists card_includes_admin_all on card_includes;
create policy card_includes_admin_all on card_includes
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

do $aal2$
declare
  t text;
begin
  foreach t in array array['card_grants', 'card_includes'] loop
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

revoke all on card_grants, card_includes from anon;
grant select, insert, update, delete on card_grants, card_includes to authenticated, service_role;

drop trigger if exists audit_card_grants on card_grants;
create trigger audit_card_grants
  after insert or update or delete on card_grants
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 2. What a role's cards require, and the recompute
-- ---------------------------------------------------------------------------
-- The cards, with everything they include (transitively).
create or replace function card_closure(p_cards text[])
returns table (card text)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive c (card) as (
    select unnest(coalesce(p_cards, array[]::text[]))
    union
    select i.included_card from public.card_includes i join c on c.card = i.card
  )
  select c.card from c;
$$;

-- What role_permissions should hold for a role: exactly what its cards require, each activity once at the highest level any asks.
-- p_bundle is ignored (it is kept so the signature, and the one caller, do not change) and so are role_extras.
create or replace function cards_effective(p_role uuid, p_bundle jsonb)
returns table (activity text, level smallint)
language sql
stable
security invoker
set search_path = ''
as $$
  select g.activity, max(g.level)::smallint
    from public.card_grants g
   where g.card in (select cl.card from public.card_closure(
           (select coalesce(array_agg(rc.card), array[]::text[]) from public.role_cards rc where rc.role_id = p_role)) cl)
   group by g.activity;
$$;

-- Make role_permissions equal cards_effective(), changing only the rows that differ (so the audit log shows real changes).
create or replace function recompute_role_permissions(p_role uuid, p_bundle jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.roles where id = p_role) then
    raise exception 'No such role.' using errcode = 'no_data_found';
  end if;
  if exists (select 1 from public.roles where id = p_role and kind = 'fixed') then
    raise exception 'Fixed roles have no cards.' using errcode = 'check_violation';
  end if;

  delete from public.role_permissions rp
   where rp.role_id = p_role
     and not exists (select 1 from public.cards_effective(p_role, null) e where e.activity = rp.activity);

  insert into public.role_permissions (role_id, activity, level)
  select p_role, e.activity, e.level from public.cards_effective(p_role, null) e
  on conflict (role_id, activity) do update set level = excluded.level
    where public.role_permissions.level is distinct from excluded.level;
end;
$$;

-- Trigger side. Runs as the owner: the change that fired it was already made by Admin at 2-step (or by a migration), and the
-- result is derived, not chosen. A role that no longer exists, and a fixed role, are skipped.
create or replace function recompute_after_role_cards()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role uuid;
begin
  foreach v_role in array array[coalesce(new.role_id, old.role_id), old.role_id] loop
    if v_role is not null
       and exists (select 1 from public.roles r where r.id = v_role and r.kind <> 'fixed') then
      perform public.recompute_role_permissions(v_role, null);
    end if;
  end loop;
  return null;
end;
$$;

create or replace function recompute_after_card_grants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role uuid;
begin
  for v_role in
    select distinct rc.role_id from public.role_cards rc
      join public.roles r on r.id = rc.role_id and r.kind <> 'fixed'
  loop
    perform public.recompute_role_permissions(v_role, null);
  end loop;
  return null;
end;
$$;

revoke execute on function recompute_after_role_cards(), recompute_after_card_grants() from public, anon, authenticated;

drop trigger if exists role_cards_recompute on role_cards;
create trigger role_cards_recompute after insert or update or delete on role_cards
  for each row execute function recompute_after_role_cards();
drop trigger if exists card_grants_recompute on card_grants;
create trigger card_grants_recompute after insert or update or delete on card_grants
  for each statement execute function recompute_after_card_grants();
drop trigger if exists card_includes_recompute on card_includes;
create trigger card_includes_recompute after insert or update or delete on card_includes
  for each statement execute function recompute_after_card_grants();

revoke all on function card_closure(text[]) from public, anon;
grant execute on function card_closure(text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. set_role_cards: same signature, the bundle is no longer taken from the caller
-- ---------------------------------------------------------------------------
create or replace function set_role_cards(p_role uuid, p_cards text[], p_bundle jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_approver_after boolean;
  v_holders text;
begin
  if exists (select 1 from unnest(p_cards) c group by c having count(*) > 1) then
    raise exception 'A card can be given to a role once.' using errcode = 'unique_violation';
  end if;

  -- Is there an approver once this call lands? The edited role counts by what the cards it is being handed require (card_grants,
  -- with includes), every other role by the cells it holds now (role_permissions is exactly its cards' union).
  v_approver_after :=
    exists (select 1 from public.card_closure(p_cards) cl join public.card_grants g on g.card = cl.card
             where g.activity = 'photos.approve' and g.level >= 1)
    or exists (select 1 from public.role_permissions rp join public.roles ar on ar.id = rp.role_id
                where rp.role_id <> p_role and ar.archived_at is null and rp.activity = 'photos.approve' and rp.level >= 1);

  if not v_approver_after then
    if 'add_photos' = any (coalesce(p_cards, array[]::text[]))
       and not exists (select 1 from public.role_cards rc where rc.role_id = p_role and rc.card = 'add_photos') then
      raise exception 'Give a role the Approve photos card first, so someone can approve these photos.'
        using errcode = 'check_violation';
    end if;

    if exists (select 1 from public.role_permissions rp
                where rp.role_id = p_role and rp.activity = 'photos.approve' and rp.level >= 1) then
      select string_agg(h.name, ', ' order by h.name) into v_holders
        from (
          select r.name from public.role_cards rc join public.roles r on r.id = rc.role_id
           where rc.card = 'add_photos' and rc.role_id <> p_role
          union
          select r.name from public.roles r
           where r.id = p_role and 'add_photos' = any (coalesce(p_cards, array[]::text[]))
        ) h;
      if v_holders is not null then
        raise exception 'This is the last role that can approve photos, and these roles still add resident photos: %. Take Add resident photos off them first, or give another role the Approve photos card.', v_holders
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  delete from public.role_cards rc
   where rc.role_id = p_role and not (rc.card = any (coalesce(p_cards, array[]::text[])));

  insert into public.role_cards (role_id, card, position)
  select p_role, c.card, c.pos
    from unnest(coalesce(p_cards, array[]::text[])) with ordinality as c (card, pos)
  on conflict (role_id, card) do update set position = excluded.position
    where public.role_cards.position is distinct from excluded.position;

  perform public.recompute_role_permissions(p_role, null);
end;
$$;

comment on function set_role_cards(uuid, text[], jsonb) is
  'Give a role exactly these cards, in this order; role_permissions is then exactly the union of what the cards require (card_grants, 0257). p_bundle is IGNORED (kept so the signature does not change); so are role_extras. Admin at 2-step only. Refuses (check_violation) to give add_photos while no non-Admin role holds photos.approve, and to take the last such role''s approval away while a role holds add_photos (0221). A retired role does not count as an approver (0222, 0224).';

-- ---------------------------------------------------------------------------
-- 4. The seed: cards.ts as it stood on 2026-10-24, unedited
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level) values
('administer_medication', 'medical.prescriptions', 1),
    ('administer_medication', 'resident.record', 1),
    ('record_weight', 'medical.weight', 2),
    ('record_weight', 'resident.record', 1),
    ('add_medical_photos', 'photos.resident_add', 2),
    ('add_medical_photos', 'resident.record', 1),
    ('feed_special_diets', 'medical.diet', 1),
    ('feed_special_diets', 'resident.record', 1),
    ('do_maintenance', 'maintenance.jobs', 2),
    ('do_maintenance', 'maintenance.progress', 2),
    ('do_maintenance', 'recurring.do_own', 2),
    ('do_maintenance', 'resident.record', 1),
    ('do_maintenance', 'facility.enclosures', 1),
    ('do_maintenance', 'maintenance.photos', 2),
    ('do_maintenance', 'assistant.ask', 2),
    ('do_stocktaking', 'stock.count', 2),
    ('do_purchasing', 'stock.purchasing', 2),
    ('record_delivery', 'stock.delivery', 2),
    ('view_residents', 'resident.record', 1),
    ('residents', 'resident.record', 2),
    ('residents', 'resident.register', 2),
    ('residents', 'resident.microchip', 2),
    ('residents', 'resident.adoption_news', 2),
    ('residents', 'placement.move', 2),
    ('residents', 'placement.hospital', 2),
    ('residents', 'placement.rehome', 2),
    ('residents', 'placement.death', 2),
    ('residents', 'photos.resident_add', 2),
    ('residents', 'photos.resident_manage', 2),
    ('residents', 'photos.resident_publish', 2),
    ('medical_records', 'medical.visits', 2),
    ('medical_records', 'medical.procedures', 2),
    ('medical_records', 'medical.blood_tests', 2),
    ('medical_records', 'medical.prescriptions', 2),
    ('medical_records', 'medical.immunizations', 2),
    ('medical_records', 'medical.weight', 2),
    ('medical_records', 'medical.diet', 2),
    ('medical_records', 'medical.archive', 2),
    ('book_clinic_visits', 'visit.book', 2),
    ('book_clinic_visits', 'medical.visits', 1),
    ('contacts', 'contacts.browse', 2),
    ('contacts', 'contacts.directory', 2),
    ('contacts', 'contacts.add', 2),
    ('contacts', 'clinics.list', 2),
    ('contacts', 'clinics.doctors', 2),
    ('contacts', 'friends.view', 2),
    ('contacts', 'friends.manage', 2),
    ('recurring_jobs', 'recurring.manage', 2),
    ('recurring_jobs', 'recurring.do_any', 2),
    ('recurring_jobs', 'recurring.do_own', 2),
    ('dashboard', 'reports.dashboard', 2),
    ('dashboard', 'reports.cashflow', 1),
    ('donations_receipts', 'donation.receipt', 2),
    ('bills', 'maintenance.bills', 2),
    ('website', 'website.content', 2),
    ('outreach_notes', 'community.outings', 2),
    ('assistant', 'assistant.ask', 2),
    ('assistant', 'assistant.record', 2),
    ('enclosures', 'facility.enclosures', 1),
    ('add_photos', 'photos.shelter_add', 2),
    ('add_photos', 'resident.record', 1),
    ('approve_photos', 'photos.approve', 2),
    ('approve_photos', 'photos.resident_manage', 2),
    ('approve_photos', 'resident.record', 1),
    ('run_appeals', 'appeal.run', 2),
    ('run_appeals', 'donation.receipt', 2),
    ('meme_library', 'social.library', 2),
    ('my_tasks', 'recurring.do_own', 2)
on conflict (card, activity) do nothing;

insert into card_includes (card, included_card) values
    ('residents', 'view_residents'),
    ('medical_records', 'view_residents'),
    ('book_clinic_visits', 'view_residents')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Recompute every role, and report what each one gained and lost
-- ---------------------------------------------------------------------------
do $report$
declare
  r record;
  v_added text;
  v_removed text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    perform public.recompute_role_permissions(r.id, null);

    select string_agg(rp.activity || ' (' || case rp.level when 2 then 'edit' else 'read' end || ')', ', ' order by rp.activity)
      into v_added
      from public.role_permissions rp
     where rp.role_id = r.id
       and not exists (select 1 from pre_0257 p where p.role_id = r.id and p.activity = rp.activity and p.level >= rp.level);
    select string_agg(p.activity || ' (' || case p.level when 2 then 'edit' else 'read' end || ')', ', ' order by p.activity)
      into v_removed
      from pre_0257 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level >= p.level);

    raise notice 'ROLE %: ADDED % | REMOVED %', r.key, coalesce(v_added, 'nothing'), coalesce(v_removed, 'nothing');
  end loop;
end
$report$;

notify pgrst, 'reload schema';
