-- consumer: src/app/admin/DriveStatus.tsx, src/lib/google/shelter-drive-status.ts
--
-- Tenancy Part 9 (backlog #o2iyh), APP HALF: what Admin may see of the shelter's Google connection. shelter_drive_credentials (0404)
-- has no grant for any login, so Admin reads it through this function, which returns the STATUS columns only and never a client id,
-- secret or token (ciphertext or not). Admin only, decided by is_admin() (the roles.is_admin flag, 0277); it asks no card, because
-- Admin sits outside the card system. Scoped to the shelter being served: current_shelter_id() (0382/0392), so no shelter sees
-- another's status. Returns no row for a shelter with no credentials row (the fallback shelter, still on environment variables).
-- Re-runnable. TO UNDO: drop function public.shelter_drive_status().

create or replace function public.shelter_drive_status()
returns table (token_status text, last_checked_at timestamptz, last_error text, drive_account_email text, connected boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.token_status, c.last_checked_at, c.last_error, c.drive_account_email,
         (c.oauth_client_id is not null and c.oauth_client_secret_enc is not null and c.refresh_token_enc is not null)
  from public.shelter_drive_credentials c
  where public.is_admin()
    and c.shelter_id = public.current_shelter_id();
$$;

revoke all on function public.shelter_drive_status() from public, anon;
grant execute on function public.shelter_drive_status() to authenticated, service_role;
