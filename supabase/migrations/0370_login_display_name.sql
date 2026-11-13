-- consumer: src/lib/translations/queries.ts, src/app/management/translations/TranslationQueue.tsx
--
-- The prose translation queue can say WHO reviewed a string (#v3knd). translation_queue is a VIEW and has no body in
-- which to resolve a name for the caller, and public.app_users opens only for maintenance, bills, deliveries,
-- recurring jobs (private.works_with_logins(), 0263), so a translations-only login would read a dash. 0366 solved the
-- label screen inside label_translations(); this is the reusable form: a name-only security definer function, gated on
-- the two translations cards, that any screen with the same gap can call.
--
-- Returns the display name, else the part of the email before the @ -- never the address (Lutan, 2026-10-26;
-- appUserName()). Null for no login, or for anyone without translations.view / translations.manage Read.
create or replace function login_display_name(p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read'))) then
    return null;
  end if;
  return (
    select coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), nullif(u.raw_user_meta_data ->> 'name', ''), nullif(split_part(u.email, '@', 1), ''))::text
      from auth.users u where u.id = p_user
  );
end;
$$;

comment on function login_display_name(uuid) is
  'A login''s display name (never the email address; 0370). For translations.view or translations.manage Read; null for anyone else.';

revoke all on function login_display_name(uuid) from public, anon;
grant execute on function login_display_name(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
