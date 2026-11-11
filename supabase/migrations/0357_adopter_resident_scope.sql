-- consumer: none
--
-- Backlog #l5gxn, SCHEMA HALF. docs/decisions/2026-11-11-adoption-updates-schema.md is the specification for the app half.
--
-- 1. THE ADOPTER-TO-RESIDENT SCOPE. Lutan, 2026-11-10: an adopter's account is "keyed on their contacts email and limited to
--    just the resident they have adopted". The link already exists as data: the resident's open Adopt placement
--    (placement_history.placement_type = 'Adopt', end_date is null) names the adopter in carer_id (a contacts row).
--    These two functions let a later stream ask the question in one call instead of re-deriving the join.
--      adopter_residents(p_contact_id)               the residents this contact may send an update about
--      adopter_may_submit(p_contact_id, p_resident)  the same answer for one resident
--    DECIDED: ONLY THE CURRENT ADOPTER. A resident returned to the shelter has an ended Adopt placement, so the past adopter drops
--    out of the scope and may not send news; a re-adopter enters it. Updates already sent stay on the record (0097).
--    An archived contact (0075) is out of scope. "Who may submit" is this scope; "who sent it" stays adoption_updates.sender_contact_id.
--
-- 2. THE APPROVAL STATE OF AN UPDATE'S TEXT ALREADY EXISTS: adoption_updates.text_approval / _by / _at (0343), default NULL since
--    0346, stamped by the database, setting it guarded by text.approve (0345/0346). Nothing is added for it here.
--
-- SECURITY INVOKER, no card, no role key: the caller's own row access applies. Callable by signed-in logins only.
-- Re-runnable. To undo: drop both functions.

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
    and ph.placement_type = 'Adopt'
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
