-- Vet visit booking (Section 4.2 / 7.4).
--
-- Two gaps blocked staff from actually using schedule_bulk_appointments:
-- 1. Staff only had SELECT on vet_appointments and no policy at all on
--    bulk_appointments, so the RPC (security invoker) failed under RLS for
--    any staff-authored booking.
-- 2. The RPC didn't accept notes or an explicit status, so a retrospective
--    (already-happened) visit couldn't be recorded as completed.

-- 1. RLS: staff can log and update vet visits, not just read them.
create policy staff_insert_vet_appointments on vet_appointments
  for insert with check (current_user_role() = 'staff');
create policy staff_update_vet_appointments on vet_appointments
  for update using (current_user_role() = 'staff');
create policy staff_rw_bulk_appointments on bulk_appointments
  for all using (current_user_role() = 'staff') with check (current_user_role() = 'staff');

-- 2. Extend the bulk-booking RPC with notes + status. Dropped and recreated
-- (rather than just create-or-replace) since adding parameters changes the
-- function's signature — leaving the old 4-arg version in place alongside a
-- new 6-arg one would make calls with all-default trailing args ambiguous.
drop function if exists schedule_bulk_appointments(uuid[], uuid, timestamptz, text);

create or replace function schedule_bulk_appointments(
  p_resident_ids uuid[],
  p_vet_id uuid,
  p_appointment_date timestamptz,
  p_reason text default null,
  p_notes text default null,
  p_status appointment_status default 'scheduled'
)
returns setof vet_appointments
language plpgsql
security invoker
as $$
declare
  v_bulk_id uuid;
begin
  insert into bulk_appointments (vet_id, appointment_date, reason, created_by)
  values (p_vet_id, p_appointment_date, p_reason, auth.uid())
  returning id into v_bulk_id;

  return query
    insert into vet_appointments (
      resident_id, vet_id, appointment_date, reason, notes, status,
      bulk_appointment_id, created_by
    )
    select
      resident_id, p_vet_id, p_appointment_date, p_reason, p_notes, p_status,
      v_bulk_id, auth.uid()
    from unnest(p_resident_ids) as resident_id
    returning *;
end;
$$;
