-- consumer: src/lib/permissions/cards.ts, src/lib/audit/recent-changes.ts, src/lib/audit/undo.ts, scripts/check-cards-schema.mjs
--
-- role-cards (docs/decisions/2026-10-13-cards-are-what-a-role-is-given.md): the schema half of "give a role cards, and
-- each card brings the permissions under it". The Who does what page and the home screen are the next two streams;
-- NOTHING here changes what anyone can do.
--
-- WHAT IS HERE
--   role_cards       which cards a role has, in order (data). The card DEFINITIONS stay in code
--                    (src/lib/permissions/cards.ts); the database holds no copy of a bundle.
--   role_extras      single activities a role holds that no card gives, each with the reason. Today's cells that fit no
--                    card are kept here, so moving to cards changes nothing on the day it lands.
--   cards_effective(role, bundle)            what role_permissions SHOULD be: the bundle plus the role's extras.
--   recompute_role_permissions(role, bundle) makes role_permissions equal that, touching only the rows that differ.
--   set_role_cards(role, cards, bundle)      the one call that changes a role's cards: rewrites role_cards, then recomputes.
--   The bundle is handed in by the app (cards.ts computes it, includes and all) because the definitions are code.
--   A caller with the wrong bundle can write no more than an Admin at 2-step could already write to role_permissions
--   directly: the same RLS applies (the functions are SECURITY INVOKER), and check-cards-schema.mjs fails on any drift.
--
-- ENFORCEMENT DOES NOT MOVE. role_permissions is still the table has_permission(), every policy and can() read. No
-- policy, view or function that reads it is touched.
--
-- WRITES: Admin at 2-step only (the policies of role_permissions, 0132 / 0153). AUDITED: record_audit() on both tables, and
-- the recompute writes only rows that change, so a card change shows in Recent changes as the cell changes it caused.
--
-- THE SEED (below) gives each role the cards its cells already fully give, and keeps every other cell as an extra:
--   head_of_medical, head_of_maintenance, second_in_command   their jobs (JOBS_OF_ROLE), in that order
--   management                                                  Recurring jobs and Residents (its curated four tiles)
--   every other role (doctor, volunteer, the retired staff)     the cards its cells fully cover, less any another covers
--   admin, public_viewer                                        nothing
-- It does not touch role_permissions at all. It then proves, for every role, that the union of the cards' bundles and the
-- extras equals today's role_permissions exactly, and RAISES (rolling the file back) if one cell differs. The extras are
-- the report: select r.key, e.activity, e.level, e.why from role_extras e join roles r on r.id = e.role_id.
--
-- The snapshot below is the bundles as cards.ts had them on 2026-10-13, used only to seed. After this file the code is the
-- source and check-cards-schema.mjs compares it with the database.
--
-- TO REVERT (no down file: the change is additive and role_permissions is correct at every point, so nothing is lost by
-- leaving it): drop function set_role_cards, recompute_role_permissions, cards_effective, role_cards_guard; drop table
-- role_cards, role_extras; delete the two names from AUDITED_TABLES. Nothing but cards.ts reads them.
--
-- Re-runnable: tables and functions are create-if-not-exists / or replace, and the seed does nothing once role_cards has rows.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists role_cards (
  id       uuid primary key default gen_random_uuid(),
  role_id  uuid not null references roles (id) on delete cascade,
  card     text not null check (card ~ '^[a-z][a-z0-9_]*$'),
  position integer not null default 0,
  unique (role_id, card)
);

comment on table role_cards is
  'Which cards a role has, in the order its home shows them (0194). The definitions are in src/lib/permissions/cards.ts; role_permissions is the union of the cards'' bundles plus role_extras, written by set_role_cards().';

create table if not exists role_extras (
  id       uuid primary key default gen_random_uuid(),
  role_id  uuid not null references roles (id) on delete cascade,
  activity text not null references permission_activities (key),
  level    smallint not null check (level in (1, 2)),
  why      text not null check (btrim(why) <> ''),
  unique (role_id, activity)
);

comment on table role_extras is
  'A single activity a role holds that no card gives (0194), with why. Part of the union that role_permissions is. Whoever holds the facility map or rooms keeps them here.';

create index if not exists role_cards_role_idx on role_cards (role_id);
create index if not exists role_extras_role_idx on role_extras (role_id);

-- Fixed roles take no cards and no extras, as they take no cells (role_permissions_guard, 0132).
create or replace function role_cards_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.roles where id = new.role_id and kind = 'fixed') then
    raise exception 'Fixed roles have no cards: Admin is a rule, not data, and the public viewer is not a column.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function role_cards_guard() from public, anon, authenticated;

drop trigger if exists role_cards_guard on role_cards;
create trigger role_cards_guard before insert or update on role_cards
  for each row execute function role_cards_guard();
drop trigger if exists role_extras_guard on role_extras;
create trigger role_extras_guard before insert or update on role_extras
  for each row execute function role_cards_guard();

-- ---------------------------------------------------------------------------
-- 2. Who may write: Admin, at 2-step (the pattern of role_permissions)
-- ---------------------------------------------------------------------------
alter table role_cards enable row level security;
alter table role_extras enable row level security;

drop policy if exists role_cards_admin_all on role_cards;
create policy role_cards_admin_all on role_cards
  for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists role_extras_admin_all on role_extras;
create policy role_extras_admin_all on role_extras
  for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

do $aal2$
declare
  t text;
begin
  foreach t in array array['role_cards', 'role_extras'] loop
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

revoke all on role_cards, role_extras from anon;
grant select, insert, update, delete on role_cards, role_extras to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. The recompute
-- ---------------------------------------------------------------------------
-- What role_permissions should hold for a role: the bundle (a jsonb array of {activity, level 1|2}) and the role's
-- extras, each activity once at the highest level either asks.
create or replace function cards_effective(p_role uuid, p_bundle jsonb)
returns table (activity text, level smallint)
language sql
stable
security invoker
set search_path = ''
as $$
  select u.activity, max(u.level)::smallint
    from (
      select e ->> 'activity' as activity, (e ->> 'level')::smallint as level
        from jsonb_array_elements(coalesce(p_bundle, '[]'::jsonb)) e
      union all
      select x.activity, x.level from public.role_extras x where x.role_id = p_role
    ) u
   group by u.activity;
$$;

-- Make role_permissions equal cards_effective(), changing only the rows that differ, so the audit log shows the cells that
-- really moved and a re-run changes nothing. Removing a card keeps whatever another card or an extra still gives, because
-- the bundle handed in is already the union of the cards that remain.
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
     and not exists (select 1 from public.cards_effective(p_role, p_bundle) e where e.activity = rp.activity);

  insert into public.role_permissions (role_id, activity, level)
  select p_role, e.activity, e.level from public.cards_effective(p_role, p_bundle) e
  on conflict (role_id, activity) do update set level = excluded.level
    where public.role_permissions.level is distinct from excluded.level;
end;
$$;

-- The one call that changes a role's cards. p_cards is the whole list, in order; p_bundle is the union of their bundles.
create or replace function set_role_cards(p_role uuid, p_cards text[], p_bundle jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (select 1 from unnest(p_cards) c group by c having count(*) > 1) then
    raise exception 'A card can be given to a role once.' using errcode = 'unique_violation';
  end if;

  delete from public.role_cards rc
   where rc.role_id = p_role and not (rc.card = any (coalesce(p_cards, array[]::text[])));

  insert into public.role_cards (role_id, card, position)
  select p_role, c.card, c.pos
    from unnest(coalesce(p_cards, array[]::text[])) with ordinality as c (card, pos)
  on conflict (role_id, card) do update set position = excluded.position
    where public.role_cards.position is distinct from excluded.position;

  perform public.recompute_role_permissions(p_role, p_bundle);
end;
$$;

revoke all on function cards_effective(uuid, jsonb), recompute_role_permissions(uuid, jsonb), set_role_cards(uuid, text[], jsonb)
  from public, anon;
grant execute on function cards_effective(uuid, jsonb), recompute_role_permissions(uuid, jsonb), set_role_cards(uuid, text[], jsonb)
  to authenticated, service_role;

comment on function set_role_cards(uuid, text[], jsonb) is
  'Give a role exactly these cards, in this order, and recompute its role_permissions as the union of their bundles plus its extras (0194). Admin at 2-step only: it runs as the caller, so the RLS on role_cards and role_permissions applies.';

-- ---------------------------------------------------------------------------
-- 4. The seed, and the proof that it changes nothing
-- ---------------------------------------------------------------------------
do $seed$
declare
  v_snap     jsonb := $snap${
  "bundles": [
    {"card":"administer_medication","ord":1,"activity":"medical.prescriptions","level":1},
    {"card":"administer_medication","ord":1,"activity":"resident.record","level":1},
    {"card":"record_weight","ord":2,"activity":"medical.weight","level":2},
    {"card":"record_weight","ord":2,"activity":"resident.record","level":1},
    {"card":"add_medical_photos","ord":3,"activity":"photos.resident_add","level":2},
    {"card":"add_medical_photos","ord":3,"activity":"resident.record","level":1},
    {"card":"feed_special_diets","ord":4,"activity":"medical.diet","level":1},
    {"card":"feed_special_diets","ord":4,"activity":"resident.record","level":1},
    {"card":"do_maintenance","ord":5,"activity":"maintenance.jobs","level":2},
    {"card":"do_maintenance","ord":5,"activity":"maintenance.progress","level":2},
    {"card":"do_maintenance","ord":5,"activity":"recurring.do_own","level":2},
    {"card":"do_maintenance","ord":5,"activity":"resident.record","level":1},
    {"card":"do_maintenance","ord":5,"activity":"facility.enclosures","level":1},
    {"card":"do_stocktaking","ord":6,"activity":"stock.count","level":2},
    {"card":"do_purchasing","ord":7,"activity":"stock.purchasing","level":2},
    {"card":"record_delivery","ord":8,"activity":"stock.delivery","level":2},
    {"card":"view_residents","ord":9,"activity":"resident.record","level":1},
    {"card":"residents","ord":10,"activity":"resident.record","level":2},
    {"card":"residents","ord":10,"activity":"resident.register","level":2},
    {"card":"residents","ord":10,"activity":"resident.microchip","level":2},
    {"card":"residents","ord":10,"activity":"resident.adoption_news","level":2},
    {"card":"residents","ord":10,"activity":"placement.move","level":2},
    {"card":"residents","ord":10,"activity":"placement.hospital","level":2},
    {"card":"residents","ord":10,"activity":"placement.rehome","level":2},
    {"card":"residents","ord":10,"activity":"placement.death","level":2},
    {"card":"residents","ord":10,"activity":"photos.resident_add","level":2},
    {"card":"residents","ord":10,"activity":"photos.resident_manage","level":2},
    {"card":"residents","ord":10,"activity":"photos.resident_publish","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.visits","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.procedures","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.blood_tests","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.prescriptions","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.immunizations","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.weight","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.diet","level":2},
    {"card":"medical_records","ord":11,"activity":"medical.archive","level":2},
    {"card":"medical_records","ord":11,"activity":"resident.record","level":1},
    {"card":"book_clinic_visits","ord":12,"activity":"visit.book","level":2},
    {"card":"book_clinic_visits","ord":12,"activity":"medical.visits","level":1},
    {"card":"book_clinic_visits","ord":12,"activity":"resident.record","level":1},
    {"card":"contacts","ord":13,"activity":"contacts.browse","level":2},
    {"card":"contacts","ord":13,"activity":"contacts.directory","level":2},
    {"card":"contacts","ord":13,"activity":"contacts.add","level":2},
    {"card":"contacts","ord":13,"activity":"clinics.list","level":2},
    {"card":"contacts","ord":13,"activity":"clinics.doctors","level":2},
    {"card":"contacts","ord":13,"activity":"friends.view","level":2},
    {"card":"contacts","ord":13,"activity":"friends.manage","level":2},
    {"card":"recurring_jobs","ord":14,"activity":"recurring.manage","level":2},
    {"card":"recurring_jobs","ord":14,"activity":"recurring.do_any","level":2},
    {"card":"recurring_jobs","ord":14,"activity":"recurring.do_own","level":2},
    {"card":"dashboard","ord":15,"activity":"reports.dashboard","level":2},
    {"card":"dashboard","ord":15,"activity":"reports.cashflow","level":1},
    {"card":"donations_receipts","ord":16,"activity":"donation.receipt","level":2},
    {"card":"bills","ord":17,"activity":"maintenance.bills","level":2},
    {"card":"website","ord":18,"activity":"website.content","level":2},
    {"card":"outreach_notes","ord":19,"activity":"community.outings","level":2},
    {"card":"assistant","ord":20,"activity":"assistant.ask","level":2},
    {"card":"assistant","ord":20,"activity":"assistant.record","level":2},
    {"card":"enclosures","ord":21,"activity":"facility.enclosures","level":1}
  ],
  "includes": [
    {"card":"residents","includes":"view_residents"},
    {"card":"medical_records","includes":"view_residents"},
    {"card":"book_clinic_visits","includes":"view_residents"}
  ]
}$snap$::jsonb;
  v_explicit jsonb := '{
    "head_of_medical": ["administer_medication", "record_weight", "add_medical_photos", "feed_special_diets"],
    "head_of_maintenance": ["do_maintenance"],
    "second_in_command": ["do_stocktaking", "do_purchasing", "record_delivery", "do_maintenance"],
    "management": ["recurring_jobs", "residents"]
  }'::jsonb;
  r          record;
  v_cards    text[];
  v_bundle   jsonb;
  v_bad      text;
  v_gap      text;
  v_extras   integer;
begin
  if exists (select 1 from public.role_cards) then
    return; -- seeded once; after that the Director owns this
  end if;

  create temporary table seed_bundle on commit drop as
    select b ->> 'card' as card, (b ->> 'ord')::integer as ord, b ->> 'activity' as activity, (b ->> 'level')::smallint as level
      from jsonb_array_elements(v_snap -> 'bundles') b;
  create temporary table seed_includes on commit drop as
    select i ->> 'card' as card, i ->> 'includes' as includes from jsonb_array_elements(v_snap -> 'includes') i;

  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    if v_explicit ? r.key then
      select array_agg(x order by o) into v_cards from jsonb_array_elements_text(v_explicit -> r.key) with ordinality as t (x, o);
      -- A named card the role's cells do not fully give would GAIN it access: that is a finding, not something to adjust.
      select string_agg(distinct b.card || ' needs ' || b.activity || ' at ' || b.level, '; ') into v_gap
        from seed_bundle b
       where b.card = any (v_cards)
         and not exists (select 1 from public.role_permissions rp
                          where rp.role_id = r.id and rp.activity = b.activity and rp.level >= b.level);
      if v_gap is not null then
        raise exception 'cards seed: % would gain access it does not hold today: %', r.key, v_gap;
      end if;
    else
      -- The cards the role's cells already fully give, less any that another of them includes.
      select array_agg(c.card order by c.ord) into v_cards
        from (select distinct b.card, b.ord from seed_bundle b
               where not exists (
                 select 1 from seed_bundle b2
                  where b2.card = b.card
                    and not exists (select 1 from public.role_permissions rp
                                     where rp.role_id = r.id and rp.activity = b2.activity and rp.level >= b2.level))) c
       where not exists (
         select 1 from seed_includes i
          where i.includes = c.card
            and i.card in (select b.card from seed_bundle b
                            where not exists (
                              select 1 from seed_bundle b2
                               where b2.card = b.card
                                 and not exists (select 1 from public.role_permissions rp
                                                  where rp.role_id = r.id and rp.activity = b2.activity and rp.level >= b2.level))));
    end if;
    v_cards := coalesce(v_cards, array[]::text[]);

    -- Every included card travels with the card that includes it: the snapshot's bundles are already expanded.
    select coalesce(jsonb_agg(jsonb_build_object('activity', u.activity, 'level', u.level)), '[]'::jsonb) into v_bundle
      from (select b.activity, max(b.level) as level from seed_bundle b where b.card = any (v_cards) group by b.activity) u;

    insert into public.role_cards (role_id, card, position)
    select r.id, c.card, c.pos from unnest(v_cards) with ordinality as c (card, pos);

    -- Every cell the cards do not give, at the level held, is an extra, with the reason.
    insert into public.role_extras (role_id, activity, level, why)
    select r.id, rp.activity, rp.level,
           case when exists (select 1 from jsonb_array_elements(v_bundle) e where e ->> 'activity' = rp.activity)
                then 'Held at a higher level than the cards give; kept so nothing changes when cards begin (0194).'
                else 'No card gives this activity; kept so nothing changes when cards begin (0194).' end
      from public.role_permissions rp
     where rp.role_id = r.id
       and not exists (select 1 from jsonb_array_elements(v_bundle) e
                        where e ->> 'activity' = rp.activity and (e ->> 'level')::smallint >= rp.level);
    get diagnostics v_extras = row_count;

    -- The proof: cards plus extras is exactly what role_permissions holds now, cell for cell.
    select string_agg(d.activity || ' (' || d.was || ' -> ' || d.would_be || ')', ', ') into v_bad
      from (
        select coalesce(e.activity, rp.activity) as activity,
               coalesce(rp.level::text, 'none') as was, coalesce(e.level::text, 'none') as would_be
          from public.cards_effective(r.id, v_bundle) e
          full join (select activity, level from public.role_permissions where role_id = r.id) rp on rp.activity = e.activity
         where e.level is distinct from rp.level
      ) d;
    if v_bad is not null then
      raise exception 'cards seed: % would change: %', r.key, v_bad;
    end if;

    raise notice 'cards seed: % has % card(s) [%] and % extra(s); role_permissions unchanged',
      r.key, cardinality(v_cards), array_to_string(v_cards, ', '), v_extras;
  end loop;
end
$seed$;

-- ---------------------------------------------------------------------------
-- 5. Audit: after the seed, so the seed is not logged (as 0132 did)
-- ---------------------------------------------------------------------------
drop trigger if exists audit_role_cards on role_cards;
create trigger audit_role_cards after insert or update or delete on role_cards
  for each row execute function record_audit();
drop trigger if exists audit_role_extras on role_extras;
create trigger audit_role_extras after insert or update or delete on role_extras
  for each row execute function record_audit();

notify pgrst, 'reload schema';
