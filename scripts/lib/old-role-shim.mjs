// For the harnesses that REPLAY an old migration inside their rolled-back transaction (0090, 0112, 0118 ...).
//
// Those files define functions and policies that call current_user_role(), which 0181 dropped. Replaying one inside
// a begin ... rollback block re-creates the old body, so the call has to resolve for the harness to exercise the
// migration it is named after. This puts back a function of that name FOR THE TRANSACTION ONLY (it is rolled back
// with everything else), answering what the enum used to: the role's key for a built-in role, and for a configured
// one the floor it stands on ('volunteer' on the who-and-where floor, 'management' above it).
//
// It is a harness fixture, not a production object: nothing in the app, a migration or a policy may rely on it.
export const OLD_ROLE_SHIM = `
create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = ''
as $shim$
  select case when r.kind = 'custom'
              then case when r.scope_residents = 'who_and_where' then 'volunteer' else 'management' end
              else r.key end
    from public.user_roles ur join public.roles r on r.id = ur.role_id
   where ur.user_id = auth.uid() and ur.archived_at is null;
$shim$;
`;
