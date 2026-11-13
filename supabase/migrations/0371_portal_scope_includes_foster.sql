-- consumer: src/lib/adopter/scope.ts, src/app/adopter-update/actions.ts, src/lib/adopter/media.ts
--
-- Backlog #d6wxo, SCHEMA HALF. docs/decisions/2026-11-13-adopter-portal-schema.md is the paper and the specification for the app half.
--
-- The website account (CLAUDE.md, the second recorded exception) may post only on residents it ADOPTED OR FOSTERS. 0357's scope covered
-- Adopt placements only. This widens the two functions to the open placement of either type, and nothing else:
--   adopter_residents(p_contact_id)               residents whose OPEN Adopt or Foster placement names this contact as carer
--   adopter_may_submit(p_contact_id, p_resident)  the same answer for one resident
-- A Foster placement is closed the same way an Adopt one is (end_date, or a later placement auto-closes it: close_prior_placement), so a
-- foster carer drops out the day the animal moves on. An archived contact (0075) is still out. Function names are kept so the shipped
-- callers (src/lib/adopter/scope.ts and the adopter-update actions) change by nothing.
--
-- No new table, no card, no policy, no role key. SECURITY INVOKER and callable by signed-in logins only, exactly as in 0357: the
-- caller still has no table access, so the app half asks through the service role after verifying the sign-in email.
-- Re-runnable. To undo: re-create 0357's bodies.

create or replace function adopter_residents(p_contact_id uuid)
returns setof uuid
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select ph.resident_id
  from placement_history ph
  join contacts c on c.id = ph.carer_id
  where ph.carer_id = p_contact_id
    and ph.placement_type in ('Adopt', 'Foster')
    and ph.end_date is null
    and c.archived_at is null
$$;

create or replace function adopter_may_submit(p_contact_id uuid, p_resident_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (select 1 from adopter_residents(p_contact_id) r(id) where r.id = p_resident_id)
$$;

revoke execute on function adopter_residents(uuid) from public, anon;
revoke execute on function adopter_may_submit(uuid, uuid) from public, anon;
grant execute on function adopter_residents(uuid) to authenticated;
grant execute on function adopter_may_submit(uuid, uuid) to authenticated;
