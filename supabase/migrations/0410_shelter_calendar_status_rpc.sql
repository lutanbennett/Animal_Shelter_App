-- consumer: src/lib/google/shelter-calendar-status.ts, src/app/admin/CalendarStatus.tsx
-- (Neither file exists yet: they belong to the app half of #calsh, a later stream.)
--
-- Backlog #calsh, SCHEMA HALF, piece 2: what Admin may see of the shelter's Google Calendar connection. shelter_calendar_credentials
-- (0409) has no grant for any login, so Admin reads it through this function, as 0405 did for the Drive. It returns the STATUS
-- columns only and never a client id, secret or token (ciphertext or not). It does return calendar_id and calendar_account_email:
-- neither is a secret, and Admin needs to see WHICH calendar is connected to notice a wrong one.
-- Admin only, decided by is_admin() (the roles.is_admin flag, 0277); it asks no card, because Admin sits outside the card system.
-- Scoped to the shelter being served: current_shelter_id() (0382/0392), so no shelter sees another's status. Returns no row for a
-- shelter with no credentials row (the fallback shelter, still on environment variables).
-- The owner is set in this same file (0405 needed 0406 for it), because the tenancy lint wants security definer functions owned
-- by rls_definer. Re-runnable. TO UNDO: drop function public.shelter_calendar_status().

create or replace function public.shelter_calendar_status()
returns table (token_status text, last_checked_at timestamptz, last_error text, calendar_id text, calendar_account_email text, connected boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.token_status, c.last_checked_at, c.last_error, c.calendar_id, c.calendar_account_email,
         (c.calendar_id is not null and c.oauth_client_id is not null and c.oauth_client_secret_enc is not null and c.refresh_token_enc is not null)
  from public.shelter_calendar_credentials c
  where public.is_admin()
    and c.shelter_id = public.current_shelter_id();
$$;

revoke all on function public.shelter_calendar_status() from public, anon;
grant execute on function public.shelter_calendar_status() to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.shelter_calendar_status() owner to rls_definer;
  end if;
end $$;
