-- Medication management moves under the Management section (2026-09-21).
--
-- 0027 let staff and vets add a medication or frequency inline from the
-- prescription form, but only admin could rename one, fix a unit or its
-- doses_per_day, or delete a duplicate — the backlog item "Admin page for
-- medications and frequencies" was SQL until now. That page is
-- /management/medications, so management needs update/delete on both
-- reference tables, the same way 0040 gave it write access on vets.
--
-- 0039 mirrored staff's policies as management_read_* and
-- management_insert_* on each table. As in 0040, the insert twin is
-- replaced by a read/write policy rather than adding a third, so the
-- policy *count* still matches staff's (which the 0039 mirror block
-- asserts) while the names no longer pair one to one for these two
-- tables. The read twin stays; it is redundant next to `for all` but
-- harmless. If the 0039 block is ever re-run it would recreate the insert
-- twins and trip its own count check — re-run this file after it.
--
-- Deleting a medication or frequency that prescriptions reference is
-- blocked by the FK (no cascade — the prescription is part of the
-- resident's medical record); the page checks first and says so.

drop policy if exists management_insert_medication on medication;
drop policy if exists management_rw_medication on medication;
create policy management_rw_medication on medication
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');

drop policy if exists management_insert_frequency on frequency;
drop policy if exists management_rw_frequency on frequency;
create policy management_rw_frequency on frequency
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');


-- =========================================================================
-- Merging duplicates
--
-- "Amoxicillin" and "amoxicillin 250" added inline by two different people
-- are the same product. Merging moves every prescription from the
-- duplicate onto the one to keep and deletes the duplicate, in one
-- transaction — two statements from the app could leave the duplicate
-- half-emptied. SECURITY INVOKER, so RLS decides who may: the caller needs
-- UPDATE on prescriptions and DELETE on the reference table (admin and
-- management have both; staff's update-only access fails at the delete and
-- the whole thing rolls back). A medication can only be merged into one
-- with the same dose_unit — the doses moved across keep their numbers, so
-- they must keep their meaning. Frequencies carry no such constraint; the
-- page says the moved prescriptions take the kept row's doses_per_day.
-- =========================================================================

create or replace function merge_medication(p_from uuid, p_into uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_from medication;
  v_into medication;
  v_moved integer;
begin
  if p_from = p_into then
    raise exception 'Choose a different medication to merge into.';
  end if;
  select * into v_from from medication where id = p_from;
  select * into v_into from medication where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'Medication not found.';
  end if;
  if v_from.dose_unit <> v_into.dose_unit then
    raise exception 'Both medications must be measured in the same unit (% vs %).',
      v_from.dose_unit, v_into.dose_unit;
  end if;

  update prescriptions set medication_id = p_into where medication_id = p_from;
  get diagnostics v_moved = row_count;

  delete from medication where id = p_from;
  if not found then
    raise exception 'Not authorized to remove the duplicate medication.';
  end if;
  return v_moved;
end;
$$;

create or replace function merge_frequency(p_from uuid, p_into uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_moved integer;
begin
  if p_from = p_into then
    raise exception 'Choose a different frequency to merge into.';
  end if;
  if not exists (select 1 from frequency where id = p_from)
     or not exists (select 1 from frequency where id = p_into) then
    raise exception 'Frequency not found.';
  end if;

  update prescriptions set frequency_id = p_into where frequency_id = p_from;
  get diagnostics v_moved = row_count;

  delete from frequency where id = p_from;
  if not found then
    raise exception 'Not authorized to remove the duplicate frequency.';
  end if;
  return v_moved;
end;
$$;

notify pgrst, 'reload schema';
