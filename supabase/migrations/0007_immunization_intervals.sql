-- Immunization due-date tracking (Section 4.2 / docs/decisions.md item 6).
--
-- Adds a re-vaccination interval per immunization_type and a bulk recording
-- RPC that fans a resident-set x immunization-type-set out into individual
-- immunization_records rows in one transaction (same principle as
-- schedule_bulk_appointments / record_immunizations_bulk: never a loop of
-- individual requests). next_due_date is computed at query time from
-- interval_months, not stored, so it stays correct if an interval is
-- corrected later (per the "computed values as views/queries, not stored
-- columns" principle in Section 3.2).
--
-- Written to be safely re-runnable: every statement below is idempotent
-- (IF NOT EXISTS / IF EXISTS / OR REPLACE), so this file can be re-pasted
-- into the SQL editor after a partial failure without needing to figure out
-- exactly how far a previous attempt got.

alter table immunization_types
  add column if not exists interval_months integer;

alter table immunization_types
  drop constraint if exists interval_months_positive;

alter table immunization_types
  add constraint interval_months_positive check (interval_months is null or interval_months > 0);

comment on column immunization_types.interval_months is
  'Months between doses (e.g. 24 for Rabies, 3 for Heartworm). Null means no recurring due date (one-off record).';

-- =========================================================================
-- Staff currently has SELECT-only on immunization_records (0001), so the
-- record_immunization/record_immunizations_bulk RPCs from 0002 have never
-- actually been callable by Staff under RLS (the same gap 0006 found and
-- fixed for vet_appointments/bulk_appointments). Fix it here so the new
-- fan-out RPC (and the existing single/bulk ones) work for Staff too.
-- =========================================================================

drop policy if exists staff_insert_immunization_records on immunization_records;
create policy staff_insert_immunization_records on immunization_records
  for insert with check (current_user_role() = 'staff');

drop policy if exists staff_update_immunization_records on immunization_records;
create policy staff_update_immunization_records on immunization_records
  for update using (current_user_role() = 'staff');

-- =========================================================================
-- Bulk fan-out: N residents x M immunization types, one date administered,
-- one transaction. E.g. selecting 2 residents and 2 vaccines produces 4
-- immunization_records rows, each upserted (on conflict do update) exactly
-- as record_immunizations_bulk already does for the single-type case.
--
-- Returns the raw immunization_records rows (same shape as
-- record_immunizations_bulk) rather than a hand-built RETURNS TABLE --
-- resident/type names and next_due_date are enriched app-side afterward, so
-- there is no risk of this function's output columns ever drifting out of
-- sync with the real table's.
-- =========================================================================

drop function if exists record_immunizations_fanout(uuid[], uuid[], date, text, text);

create function record_immunizations_fanout(
  p_resident_ids uuid[],
  p_immunization_type_ids uuid[],
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
  select ri.resident_id, ti.immunization_type_id, p_date_administered,
    p_administered_by, p_notes, auth.uid()
  from unnest(p_resident_ids) as ri(resident_id)
  cross join unnest(p_immunization_type_ids) as ti(immunization_type_id)
  on conflict (resident_id, immunization_type_id, date_administered)
  do update set
    administered_by = excluded.administered_by,
    notes = excluded.notes,
    updated_at = now()
  returning *;
$$;

-- =========================================================================
-- Per resident/type "current state": most recent dose and its next due
-- date. Backs the resident immunizations tab and any future due/overdue
-- dashboard. security_invoker so it respects the querying user's RLS, same
-- as resident_list_view (0005).
-- =========================================================================

drop view if exists immunization_next_due;

create view immunization_next_due
with (security_invoker = on)
as
select distinct on (ir.resident_id, ir.immunization_type_id)
  ir.resident_id,
  ir.immunization_type_id,
  it.name as immunization_type_name,
  it.interval_months,
  ir.date_administered as last_administered,
  case when it.interval_months is not null
    then (ir.date_administered + (it.interval_months || ' months')::interval)::date
  end as next_due_date
from immunization_records ir
join immunization_types it on it.id = ir.immunization_type_id
order by ir.resident_id, ir.immunization_type_id, ir.date_administered desc;

notify pgrst, 'reload schema';
