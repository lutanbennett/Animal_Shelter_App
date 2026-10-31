-- consumer: src/lib/permissions/catalogue.ts, src/lib/i18n/dictionaries/en.ts, src/lib/i18n/dictionaries/th.ts, scripts/lib/permission-probes.mjs, scripts/lib/readonly-checks.mjs, scripts/check-permission-catalogue.mjs
--
-- RETIRE THE reference.add_while_recording ACTIVITY. 0287 retired the card that granted it; this retires what it granted.
-- Lutan, 2026-10-30: "Missing medication added by admin only as part of system configuration."
--
-- What asked it, read from pg_policies / pg_views / pg_proc on dev before this was written (not from the migration files, which also
-- name it in comments and in policies long since replaced):
--   medication_insert_perm        stock.medications Edit  OR the activity
--   frequency_insert_perm         the activity            OR reference.types Edit
--   procedure_types_select_perm   medical.procedures Read OR reference.types Read OR the activity
--   procedure_types_insert_perm   the activity            OR reference.types Edit
--   view picker_medications       stock.medications Read  OR the activity OR medical.prescriptions Read
-- No function. No card_grants row, no role_permissions row.
--
-- WHY DROPPING THE TERM CHANGES NOTHING FOR ANY LOGIN. has_permission(a) is true when the login is Admin or its role holds a cell for a.
-- No role holds this cell (no card grants it since 0287), so the term was true for Admin and nobody else; and every one of the five keeps
-- another term that is already true for Admin (has_permission answers yes to Admin for any activity). So each policy and the view answer
-- exactly as before, for Admin and for everyone else. The reference screens (/admin/*) stay Admin's, outside the card system, as they were.
-- Nothing is given to Admin and nothing is put on a card.
--
-- Each policy and the view are restated as they stand on dev minus the one term; grants and the view's comment restated with them.
-- Re-runnable. Refuses rather than deletes if a card or a role has been given the activity since.

do $guard$
begin
  if exists (select 1 from public.card_grants where activity = 'reference.add_while_recording') then
    raise exception '0291: a card grants reference.add_while_recording; it was retired in 0287. Find out why before removing it.';
  end if;
  if exists (select 1 from public.role_permissions where activity = 'reference.add_while_recording') then
    raise exception '0291: a role holds reference.add_while_recording; no card grants it. Find out why before removing it.';
  end if;
end
$guard$;

drop policy if exists medication_insert_perm on medication;
create policy medication_insert_perm on medication for insert to authenticated
  with check ((select has_permission('stock.medications', 'edit')));

drop policy if exists frequency_insert_perm on frequency;
create policy frequency_insert_perm on frequency for insert to authenticated
  with check ((select has_permission('reference.types', 'edit')));

drop policy if exists procedure_types_select_perm on procedure_types;
create policy procedure_types_select_perm on procedure_types for select to authenticated
  using ((select has_permission('medical.procedures', 'read')) or (select has_permission('reference.types', 'read')));

drop policy if exists procedure_types_insert_perm on procedure_types;
create policy procedure_types_insert_perm on procedure_types for insert to authenticated
  with check ((select has_permission('reference.types', 'edit')));

create or replace view picker_medications as
select m.id, m.name, m.dose_unit, m.name_th
  from medication m
 where (select has_permission('stock.medications', 'read'))
    or (select has_permission('medical.prescriptions', 'read'));

comment on view picker_medications is
  'What a form that picks a medicine reads of one (0151): id, name, unit. No cost, stock, reorder or label. Rows for a login holding stock.medications Read or medical.prescriptions Read (0291 removed the retired reference.add_while_recording). A new medication column is private until it is added here.';

revoke all on picker_medications from anon, authenticated, service_role;
grant select on picker_medications to authenticated, service_role;

delete from permission_activities where key = 'reference.add_while_recording';

notify pgrst, 'reload schema';

-- Nothing live may still ask it.
do $after$
begin
  if exists (select 1 from pg_policies where coalesce(qual, '') || coalesce(with_check, '') like '%add_while_recording%') then
    raise exception '0291: a policy still asks reference.add_while_recording';
  end if;
  if exists (select 1 from pg_views where definition like '%add_while_recording%') then
    raise exception '0291: a view still asks reference.add_while_recording';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) like '%add_while_recording%') then
    raise exception '0291: a function still asks reference.add_while_recording';
  end if;
end
$after$;
