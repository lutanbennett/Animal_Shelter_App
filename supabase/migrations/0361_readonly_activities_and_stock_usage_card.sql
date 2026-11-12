-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/can.ts
-- The last five of Lutan's fourteen activity rulings of 2026-11-12 (#c4vn7;
-- docs/decisions/2026-11-12-fourteen-activities-ruled.md recorded the nine that needed no migration).
--
-- 1. FOUR UNUSED EDIT SETTINGS COME OFF THE LIST. photos.resident_medical, reports.expenses,
--    resident.who_and_where and roles.view are levels, but no screen, save, policy or function in the app
--    has ever asked any of them at edit: every caller asks read (verified by search, 2026-11-12). Lutan chose
--    to remove the setting rather than leave it as a placeholder, because a setting that does nothing is a
--    trap -- someone grants it and expects a result. The removal is said with a third activity kind,
--    'readonly' (Read / None), which the catalogue file now carries too.
--    Read is untouched: about a dozen cards hold these reads and every one of them keeps working.
--
-- 2. stock.usage GETS A CARD -- the two that already exist. "Stock between counts" is a read-only report
--    over the stock figures food_forecast and medicine_forecast already show, so he put it on both rather
--    than mint a card of its own. Nothing that changes a figure is granted: correcting a count still asks
--    stock.correct, Admin-only by his ruling of 2026-11-09.
--
-- Admin is unaffected throughout: it sits outside the card system and answers yes before a cell is read
-- (can.ts, has_permission()). No role is named anywhere here; the grant is on cards, which is what a role is.
--
-- Re-runnable: the kind constraint is dropped by whatever name it carries and re-added, the catalogue rows
-- are upserted, the guards are "or replace", and the card grant is an upsert.

-- ---------------------------------------------------------------------------
-- 1. kind may be 'readonly'
-- ---------------------------------------------------------------------------
-- Dropped by discovered name: 0132 wrote the constraint inline, so its name is the server's choice.
do $c$
declare v_name text;
begin
  for v_name in
    select conname from pg_constraint
     where conrelid = 'public.permission_activities'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table public.permission_activities drop constraint %I', v_name);
  end loop;
end $c$;

alter table permission_activities
  add constraint permission_activities_kind_check check (kind in ('level', 'yesno', 'readonly'));

comment on table permission_activities is
  'The catalogue (§4), seeded in 0132 and kept equal to src/lib/permissions/catalogue.ts by a check that lint runs. kind level = Edit/Read/None, yesno = Yes/No, readonly = Read/None (0361: nothing is ever done at Edit, so the setting is not offered).';

-- ---------------------------------------------------------------------------
-- 2. The guards, before any row is changed, so they protect this file too
-- ---------------------------------------------------------------------------
-- A cell on a Read/None activity can only be Read. Replaces 0132's function, adding the third branch;
-- the fixed-role rule and the Yes/No rule are unchanged.
create or replace function role_permissions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_kind text;
  v_activity_kind text;
begin
  select kind into v_role_kind from public.roles where id = new.role_id;
  if v_role_kind = 'fixed' then
    raise exception 'Fixed roles have no cells: Admin is a rule, not data, and the public viewer is not a column.'
      using errcode = 'check_violation';
  end if;
  select kind into v_activity_kind from public.permission_activities where key = new.activity;
  if v_activity_kind = 'yesno' and new.level <> 2 then
    raise exception '% is a Yes/No activity; its only level is 2.', new.activity
      using errcode = 'check_violation';
  end if;
  if v_activity_kind = 'readonly' and new.level <> 1 then
    raise exception '% is a Read/None activity; its only level is 1. Nothing is done at Edit (0361).', new.activity
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function role_permissions_guard() from public, anon, authenticated;

-- The same rule where a grant is actually chosen. card_grants had no kind guard at all, so a card could be
-- given a Read/None activity at 2 and the recompute would then be refused by the trigger above -- a card
-- that grants nothing is exactly what the card rules forbid. Refuse it at the source instead.
create or replace function card_grants_guard_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
begin
  select kind into v_kind from public.permission_activities where key = new.activity;
  if v_kind = 'yesno' and new.level <> 2 then
    raise exception '% is a Yes/No activity; a card grants it at 2.', new.activity
      using errcode = 'check_violation';
  end if;
  if v_kind = 'readonly' and new.level <> 1 then
    raise exception '% is a Read/None activity; a card grants it at 1. Nothing is done at Edit (0361).', new.activity
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function card_grants_guard_kind() from public, anon, authenticated;

drop trigger if exists card_grants_guard_kind on card_grants;
create trigger card_grants_guard_kind
  before insert or update on card_grants
  for each row execute function card_grants_guard_kind();

-- An activity cannot become Read/None under cells that say Edit, as it cannot become Yes/No under cells
-- that say Read. Replaces 0132's function, adding the second branch.
create or replace function permission_activities_guard_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'yesno' and exists (
    select 1 from public.role_permissions where activity = new.key and level <> 2
  ) then
    raise exception '% has Read cells and cannot become a Yes/No activity.', new.key
      using errcode = 'check_violation';
  end if;
  if new.kind = 'readonly' and exists (
    select 1 from public.role_permissions where activity = new.key and level = 2
  ) then
    raise exception '% has Edit cells and cannot become a Read/None activity.', new.key
      using errcode = 'check_violation';
  end if;
  if new.kind = 'readonly' and exists (
    select 1 from public.card_grants where activity = new.key and level = 2
  ) then
    raise exception '% is granted at Edit by a card and cannot become a Read/None activity.', new.key
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function permission_activities_guard_kind() from public, anon, authenticated;

drop trigger if exists permission_activities_guard_kind on permission_activities;
create trigger permission_activities_guard_kind
  before update of kind on permission_activities
  for each row execute function permission_activities_guard_kind();

-- ---------------------------------------------------------------------------
-- 3. The four rows become Read/None
-- ---------------------------------------------------------------------------
-- Same key, area and sort as the rows they replace (0276, 0317, 0265, 0268): only kind changes, and the
-- guard above refuses the change outright if any card or cell holds one of them at Edit.
insert into permission_activities (key, kind, area, sort) values
  ('photos.resident_medical', 'readonly', 'photos', 71),
  ('reports.expenses', 'readonly', 'management', 82),
  ('resident.who_and_where', 'readonly', 'residents', 69),
  ('roles.view', 'readonly', 'settings', 68)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- 4. Stock between counts goes onto the two forecast cards
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level) values
  ('food_forecast', 'stock.usage', 2),
  ('medicine_forecast', 'stock.usage', 2)
on conflict (card, activity) do update set level = excluded.level;

-- ---------------------------------------------------------------------------
-- 5. Assert what this file claims
-- ---------------------------------------------------------------------------
do $a$
declare
  v_bad text;
  v_n integer;
begin
  select string_agg(key, ', ' order by key) into v_bad
    from public.permission_activities
   where key in ('photos.resident_medical', 'reports.expenses', 'resident.who_and_where', 'roles.view')
     and kind <> 'readonly';
  if v_bad is not null then
    raise exception '0361 FAILED: still not Read/None: %', v_bad;
  end if;

  select count(*) into v_n from public.permission_activities where kind = 'readonly';
  if v_n <> 4 then
    raise exception '0361 FAILED: % Read/None activities, expected 4', v_n;
  end if;

  select count(*) into v_n from public.card_grants
   where activity = 'stock.usage' and card in ('food_forecast', 'medicine_forecast') and level = 2;
  if v_n <> 2 then
    raise exception '0361 FAILED: stock.usage is on % of the two forecast cards', v_n;
  end if;

  -- The reads these four carry are the whole point of keeping them: a dozen cards hold them.
  select count(*) into v_n from public.card_grants
   where activity in ('photos.resident_medical', 'reports.expenses', 'resident.who_and_where', 'roles.view');
  if v_n = 0 then
    raise exception '0361 FAILED: no card holds any of the four reads any more';
  end if;
  raise notice '0361 ok: four activities are Read/None, % cards hold their reads, stock.usage is on both forecast cards', v_n;
end $a$;
