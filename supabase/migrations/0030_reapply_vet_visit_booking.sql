-- Re-apply 0006 (vet visit booking).
--
-- The dev database was migrated by hand before scripts/apply-migrations.mjs
-- existed and then baselined as "0001–0027 applied", but 0006 had never
-- actually run there: schedule_bulk_appointments was still the 0002
-- four-argument version and the three staff policies were missing, so every
-- booking from /vet-visits/new failed with "could not find the function
-- schedule_bulk_appointments(p_appointment_date, p_notes, p_reason, ...)".
-- 0006 is recorded as applied and applied files are never edited, so this
-- file repeats it in re-runnable form (drop-if-exists before each policy,
-- both function signatures dropped before the create). Harmless on a
-- database where 0006 did run, such as production.

drop policy if exists staff_insert_vet_appointments on vet_appointments;
create policy staff_insert_vet_appointments on vet_appointments
  for insert with check (current_user_role() = 'staff');

drop policy if exists staff_update_vet_appointments on vet_appointments;
create policy staff_update_vet_appointments on vet_appointments
  for update using (current_user_role() = 'staff');

drop policy if exists staff_rw_bulk_appointments on bulk_appointments;
create policy staff_rw_bulk_appointments on bulk_appointments
  for all using (current_user_role() = 'staff') with check (current_user_role() = 'staff');

-- The 4-arg and 6-arg versions can't coexist (calls with all-default
-- trailing args would be ambiguous), so both are dropped first.
drop function if exists schedule_bulk_appointments(uuid[], uuid, timestamptz, text);
drop function if exists schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status);

create function schedule_bulk_appointments(
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

notify pgrst, 'reload schema';
