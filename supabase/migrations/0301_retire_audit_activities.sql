-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/routes.ts, src/app/admin/recent-changes/page.tsx, src/app/admin/recent-changes/actions.ts, src/lib/i18n/dictionaries/en.ts, src/lib/i18n/dictionaries/th.ts, scripts/lib/permission-probes.mjs, scripts/check-permission-catalogue.mjs
--
-- RETIRE THE audit.view AND audit.undo ACTIVITIES. Lutan, 2026-11-02, asked directly: Recent changes IS Admin-only, on purpose.
-- No card ever granted either; the page was reachable only through the Admin rule. It now asks requireAdminUser() and these two
-- rows have nothing left to describe. (The backlog item said no migration was needed; check-permission-catalogue.mjs check A
-- requires catalogue.ts and permission_activities to match, so this delete is needed.)
--
-- No policy, view or function asks either key (grep of supabase/migrations: only 0132's seed and a comment in 0154).
-- Re-runnable. Refuses rather than deletes if a card or a role has been given either activity since.

do $guard$
begin
  if exists (select 1 from public.card_grants where activity in ('audit.view', 'audit.undo')) then
    raise exception '0301: a card grants audit.view or audit.undo. Find out why before removing it.';
  end if;
  if exists (select 1 from public.role_permissions where activity in ('audit.view', 'audit.undo')) then
    raise exception '0301: a role holds audit.view or audit.undo; no card grants them. Find out why before removing it.';
  end if;
end
$guard$;

delete from permission_activities where key in ('audit.view', 'audit.undo');

notify pgrst, 'reload schema';

do $after$
begin
  if exists (select 1 from pg_policies where coalesce(qual, '') || coalesce(with_check, '') ~ 'audit\.(view|undo)') then
    raise exception '0301: a policy still asks audit.view or audit.undo';
  end if;
  if exists (select 1 from pg_views where definition ~ 'audit\.(view|undo)') then
    raise exception '0301: a view still asks audit.view or audit.undo';
  end if;
end
$after$;
