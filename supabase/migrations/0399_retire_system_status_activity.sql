-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/routes.ts, src/app/admin/status/page.tsx, src/app/admin/status/actions.ts, src/app/admin/page.tsx, src/app/releases/page.tsx, src/lib/i18n/dictionaries/en.ts, src/lib/i18n/dictionaries/th.ts, scripts/lib/permission-probes.mjs, scripts/check-permission-catalogue.mjs
--
-- RETIRE THE system.status ACTIVITY. Lutan, 2026-11-17, asked directly: the system status page is Admin-only.
-- It reports the whole installation (row counts, sign-ins, storage), so with a second shelter it would be one
-- customer reading another's numbers. No card ever granted it; the page is now guarded by requireAdminUser(), the
-- same Admin short-circuit as Recent changes (0301), so the row has nothing left to describe. Admin is not given a card.
--
-- No policy, view or function asks the key (0132's seed is the only mention). Re-runnable. Refuses rather than
-- deletes if a card or a role has been given it since.

do $guard$
begin
  if exists (select 1 from public.card_grants where activity = 'system.status') then
    raise exception '0399: a card grants system.status. Find out why before removing it.';
  end if;
  if exists (select 1 from public.role_permissions where activity = 'system.status') then
    raise exception '0399: a role holds system.status; no card grants it. Find out why before removing it.';
  end if;
end
$guard$;

delete from permission_activities where key = 'system.status';

notify pgrst, 'reload schema';

do $after$
begin
  if exists (select 1 from pg_policies where coalesce(qual, '') || coalesce(with_check, '') ~ 'system\.status') then
    raise exception '0399: a policy still asks system.status';
  end if;
  if exists (select 1 from pg_views where definition ~ 'system\.status') then
    raise exception '0399: a view still asks system.status';
  end if;
end
$after$;
