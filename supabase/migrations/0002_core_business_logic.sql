-- Core business-logic functions called out as the highest-priority
-- correctness requirements in the rebuild spec (Sections 7.2, 7.3, 7.4).
-- These are the direct structural fixes for bug B69 and the deceased-
-- cascade/cascade-delete lessons from the original build.

-- =========================================================================
-- 7.3 — Immunization recording, single and bulk (fixes B69)
--
-- Single INSERT ... ON CONFLICT per call. Bulk fan-out inserts every row in
-- one statement (one transaction), never a loop of individual requests —
-- this is what removes the getLastRow()-style batching race entirely.
-- =========================================================================

create or replace function record_immunization(
  p_resident_id uuid,
  p_immunization_type_id uuid,
  p_date_administered date,
  p_administered_by text default null,
  p_notes text default null,
  p_batch_number text default null
)
returns immunization_records
language plpgsql
security invoker
as $$
declare
  result immunization_records;
begin
  insert into immunization_records (
    resident_id, immunization_type_id, date_administered,
    administered_by, notes, batch_number, created_by
  )
  values (
    p_resident_id, p_immunization_type_id, p_date_administered,
    p_administered_by, p_notes, p_batch_number, auth.uid()
  )
  on conflict (resident_id, immunization_type_id, date_administered)
  do update set
    administered_by = excluded.administered_by,
    notes = excluded.notes,
    batch_number = excluded.batch_number,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function record_immunizations_bulk(
  p_resident_ids uuid[],
  p_immunization_type_id uuid,
  p_date_administered date,
  p_administered_by text default null,
  p_notes text default null
)
returns setof immunization_records
language sql
security invoker
as $$
  insert into immunization_records (
    resident_id, immunization_type_id, date_administered,
    administered_by, notes, created_by
  )
  select
    resident_id, p_immunization_type_id, p_date_administered,
    p_administered_by, p_notes, auth.uid()
  from unnest(p_resident_ids) as resident_id
  on conflict (resident_id, immunization_type_id, date_administered)
  do update set
    administered_by = excluded.administered_by,
    notes = excluded.notes,
    updated_at = now()
  returning *;
$$;

-- Reconciliation safety net (Section 7.3): should never return rows given
-- the unique constraint, but kept as a defense-in-depth check during the
-- transition period. Query it periodically (e.g. from an admin dashboard).
create view immunization_duplicate_check as
select resident_id, immunization_type_id, date_administered, count(*)
from immunization_records
group by resident_id, immunization_type_id, date_administered
having count(*) > 1;

-- =========================================================================
-- 7.4 — Bulk vet appointments: one transaction, not a loop.
-- =========================================================================

create or replace function schedule_bulk_appointments(
  p_resident_ids uuid[],
  p_vet_id uuid,
  p_appointment_date timestamptz,
  p_reason text default null
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
      resident_id, vet_id, appointment_date, reason, bulk_appointment_id, created_by
    )
    select resident_id, p_vet_id, p_appointment_date, p_reason, v_bulk_id, auth.uid()
    from unnest(p_resident_ids) as resident_id
    returning *;
end;
$$;

-- =========================================================================
-- 7.2 — Deceased workflow cascade.
--
-- Runs in the same transaction as the Deceased placement_history insert.
-- Deliberately scoped updates only (cancel future appointments, end active
-- prescriptions) — never ON DELETE CASCADE, per the explicit lesson in the
-- spec about a prior bug that deleted ALL historical records instead of
-- just future-dated ones.
-- =========================================================================

create or replace function handle_deceased_placement()
returns trigger
language plpgsql
security invoker
as $$
begin
  if new.placement_type = 'Deceased' then
    update vet_appointments
    set status = 'cancelled'
    where resident_id = new.resident_id
      and status = 'scheduled'
      and appointment_date > new.start_date;

    update prescriptions
    set end_date = new.start_date::date
    where resident_id = new.resident_id
      and (end_date is null or end_date > new.start_date::date);

    update residents
    set ready_for_adoption = false
    where id = new.resident_id;

    -- PDF generation (Section 8.5) and the Drive folder archive move
    -- (Section 5.1) are triggered from the application layer after this
    -- insert commits, not from this trigger — they call external services
    -- (Drive API, PDF renderer) that don't belong in a DB transaction.
  end if;

  return new;
end;
$$;

create trigger placement_history_deceased_cascade
  after insert on placement_history
  for each row execute function handle_deceased_placement();

-- =========================================================================
-- 4.2 — Immunization compliance view.
-- Missing mandatory immunizations computed as a query (mandatory types minus
-- recorded types for that resident), excluding Deceased/Adopted residents.
-- =========================================================================

create view immunization_compliance as
select
  r.id as resident_id,
  r.name as resident_name,
  it.id as immunization_type_id,
  it.name as immunization_type_name
from residents r
cross join immunization_types it
join resident_current_state s on s.resident_id = r.id
where it.is_mandatory = true
  and s.current_status not in ('Deceased', 'Adopted')
  and not exists (
    select 1 from immunization_records ir
    where ir.resident_id = r.id
      and ir.immunization_type_id = it.id
  );

-- NOTE: Section 4.2 also calls for a per-vaccine-type stock forecast (doses
-- due in the next 7/14/30/90 days). That requires a re-vaccination interval
-- per immunization_type, which is not in the source data model as
-- documented — flagged as an open question (see docs/decisions.md) rather
-- than guessed at here. Add an `interval_days` column to immunization_types
-- and a forecast view once that's confirmed against the live sheet.
