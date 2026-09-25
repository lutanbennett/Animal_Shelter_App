-- Signed in is not the same as staff (found 2026-09-25, auditing for the
-- public viewer; docs/decisions.md, 2026-09-25, "Internal views need a
-- staff role, not a session").
--
-- 0085 adds a role no policy names, on the premise that "no named role"
-- means "no access". RLS on every base table bears that out: each policy
-- compares current_user_role() with a named role (checked in pg_policies
-- on dev), bar the three public_read_* ones and translatable_fields below.
-- But six internal views run as their owner (no security_invoker), so RLS
-- under them never applies, and each is granted to `authenticated` — any
-- session with a JWT, whatever its role. On dev, as an archived login (the
-- same position a public viewer would be in), and as a login that was
-- never given a role:
--
--   translation_queue             every translation with its source text,
--                                 resident names, maintenance titles and
--                                 Shelter Friend names; no filter at all
--   current_placement             every placement: notes, carer ids
--   resident_current_state        names, status, deceased + date
--   immunization_compliance       names and immunisation gaps
--   immunization_duplicate_check  the same records, paired up
--   app_users                     already filtered to "has a role", so an
--                                 archived login saw nothing — but a
--                                 public_viewer has a role, and would have
--                                 read every staff name and email
--
-- 0081 found the same four for anon and revoked anon's grant; turning on
-- security_invoker was left alone because it changes what vets and
-- volunteers see in the app. Revoking `authenticated` is not possible
-- either — the app reads all six.
--
-- Nor can the views simply gain `where <caller is staff>`:
-- current_placement and resident_current_state are what the public_* views
-- are built on, and a public view must answer anon and the public viewer
-- in full. So, as 0082 did for approved_translations:
--
--   1. The six move to `private`, which the Data API does not expose.
--      Views that depend on them (the public_* views, resident_list_view,
--      immunization_compliance) reference them by oid and follow without
--      being re-created, so the public site reads exactly what it did.
--   2. `public` gets a view of the same name and columns over each —
--      `select * from private.<name> where private.has_app_access()` — so
--      the app, and the SQL functions that name them (diet_forecast,
--      medication_forecast, cashflow_forecast), read them unchanged, and a
--      session without a staff role reads nothing. security_barrier so the
--      gate is applied before any filter the caller adds.
--   3. has_app_access() is an allow-list — admin, management, staff, vet,
--      volunteer — not "any role but public_viewer", so a role added later
--      starts with no access until someone decides otherwise, as RLS does.
--      A caller that is not a Data API role at all (service_role, postgres
--      in scripts and definer functions) passes: those are not sessions.
--
-- Also: translatable_fields was readable by `auth.uid() is not null`. It is
-- only (table, column, tier) and nothing on the public site reads it, but
-- "any session" is the rule this file retires, so it takes the same gate.
--
-- What this does not change, recorded so nobody assumes otherwise:
--   * resident_is_deceased and attachment_resident_id (security definer,
--     callable by authenticated) answer a boolean / an id for a row id
--     without checking the role. 0082 kept them callable; a row id is not
--     guessable and both are called from the lock triggers.
--   * cashflow_forecast, diet_forecast and medication_forecast are
--     security invoker: for a session without a staff role they return the
--     month grid with every amount 0, since RLS hides everything under it.
--
-- From here, a migration that changes one of the six edits
-- `private.<name>`, then re-creates `public.<name>` as the same gate so it
-- picks up any new column (`select *` is expanded when a view is created).
-- A `create or replace view public.<name>` with anything else in it would
-- replace the gate, so scripts/check-migration-grants.mjs (npm run lint)
-- fails a file numbered after this one that does that.
--
-- Does not use 'public_viewer' by name, so it does not depend on 0085
-- being committed first. Re-runnable: the move is guarded, the wrappers
-- and the function are `create or replace`, grants are idempotent.

-- ---------------------------------------------------------------------------
-- 3. The gate
-- ---------------------------------------------------------------------------

create or replace function private.has_app_access()
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select current_user::text not in ('anon', 'authenticated')
      or coalesce(
           public.current_user_role() in ('admin', 'management', 'staff', 'vet', 'volunteer'),
           false
         );
$$;

comment on function private.has_app_access() is
  'True for a session holding a staff role (admin, management, staff, vet, volunteer), and for callers that are not a Data API session. False for anon, archived logins, role-less logins and public_viewer. The gate on the public wrappers of the internal views (0086).';

revoke all on function private.has_app_access() from public, anon;
grant execute on function private.has_app_access() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. The six internal views move to `private`
-- ---------------------------------------------------------------------------

do $$
declare
  v text;
begin
  foreach v in array array[
    'app_users',
    'current_placement',
    'resident_current_state',
    'immunization_compliance',
    'immunization_duplicate_check',
    'translation_queue'
  ] loop
    if to_regclass('private.' || v) is null then
      execute format('alter view public.%I set schema private', v);
    end if;
  end loop;
end;
$$;

-- Nothing reads these through the API any more. resident_list_view is
-- security_invoker and is built on resident_current_state, so its readers
-- keep SELECT on that one; the rest are read only through owner-rights
-- views, which check the owner's privileges.
revoke all on
  private.app_users,
  private.current_placement,
  private.resident_current_state,
  private.immunization_compliance,
  private.immunization_duplicate_check,
  private.translation_queue
from anon, authenticated, service_role;

grant select on private.resident_current_state to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Same names in `public`, gated
-- ---------------------------------------------------------------------------

create or replace view public.app_users with (security_barrier = true) as
select * from private.app_users where private.has_app_access();

create or replace view public.current_placement with (security_barrier = true) as
select * from private.current_placement where private.has_app_access();

create or replace view public.resident_current_state with (security_barrier = true) as
select * from private.resident_current_state where private.has_app_access();

create or replace view public.immunization_compliance with (security_barrier = true) as
select * from private.immunization_compliance where private.has_app_access();

create or replace view public.immunization_duplicate_check with (security_barrier = true) as
select * from private.immunization_duplicate_check where private.has_app_access();

create or replace view public.translation_queue with (security_barrier = true) as
select * from private.translation_queue where private.has_app_access();

comment on view public.app_users is
  'private.app_users for a session with a staff role; empty for anyone else (0086). Edit private.app_users, not this.';
comment on view public.current_placement is
  'private.current_placement for a session with a staff role; empty for anyone else (0086). Edit private.current_placement, not this.';
comment on view public.resident_current_state is
  'private.resident_current_state for a session with a staff role; empty for anyone else (0086). The public_* views read the private one. Edit private.resident_current_state, not this.';
comment on view public.immunization_compliance is
  'private.immunization_compliance for a session with a staff role; empty for anyone else (0086). Edit private.immunization_compliance, not this.';
comment on view public.immunization_duplicate_check is
  'private.immunization_duplicate_check for a session with a staff role; empty for anyone else (0086). Edit private.immunization_duplicate_check, not this.';
comment on view public.translation_queue is
  'private.translation_queue for a session with a staff role; empty for anyone else (0086). Edit private.translation_queue, not this.';

revoke all on
  public.app_users,
  public.current_placement,
  public.resident_current_state,
  public.immunization_compliance,
  public.immunization_duplicate_check,
  public.translation_queue
from anon, authenticated, service_role;

grant select on
  public.app_users,
  public.current_placement,
  public.resident_current_state,
  public.immunization_compliance,
  public.immunization_duplicate_check,
  public.translation_queue
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- translatable_fields: staff roles, not any session
-- ---------------------------------------------------------------------------

drop policy if exists authenticated_read_translatable_fields on translatable_fields;
drop policy if exists app_read_translatable_fields on translatable_fields;
create policy app_read_translatable_fields on translatable_fields
  for select using (private.has_app_access());

notify pgrst, 'reload schema';
