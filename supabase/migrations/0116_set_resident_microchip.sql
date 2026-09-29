-- set_resident_microchip (2026-09-29). Schema half of "Microchip, second half":
-- lets a vet add or correct a resident's chip from their own interface.
--
-- Vets can read residents in their clinic's scope (0108) but hold no update on
-- residents, and widening that policy would let them write every column. So the
-- write goes through one security-definer function that touches exactly two
-- columns of exactly one row.
--
--   set_resident_microchip(p_resident_id uuid, p_number text, p_implanted_on date default null)
--
-- Who: admin and staff (the roles that can already update residents), and a
-- vet whose resident is in current_vet_resident_ids(). Scope is re-checked
-- here; a definer function bypasses RLS, so trusting the caller to have
-- checked would be a hole straight past 0108 and 0110.
--
-- Refuses a deceased resident with the same message and errcode as the 0026
-- lock, so this cannot become the way round it.
--
-- Strips nothing: the app strips spaces and dashes first. The 15-digit check
-- (residents_microchip_number_iso) and the unique-where-set index from 0113
-- still apply and fail at the database. p_number null clears the chip.
--
-- Does not widen any other column: the UPDATE names microchip_number and
-- microchip_implanted_on and nothing else, there is no dynamic SQL, and no
-- argument selects a column.
--
-- Written to be safely re-runnable.

create or replace function set_resident_microchip(
  p_resident_id uuid,
  p_number text,
  p_implanted_on date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role := current_user_role();
begin
  if v_role is null or v_role not in ('admin', 'staff', 'vet') then
    raise exception 'Not authorized to set a microchip.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_role = 'vet'
     and p_resident_id not in (select current_vet_resident_ids()) then
    raise exception 'Not authorized to set a microchip for this resident.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from residents where id = p_resident_id) then
    raise exception 'Resident not found.' using errcode = 'no_data_found';
  end if;

  if resident_is_deceased(p_resident_id) then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  update residents
     set microchip_number = p_number,
         microchip_implanted_on = p_implanted_on
   where id = p_resident_id;
end;
$$;

comment on function set_resident_microchip(uuid, text, date) is
  'Sets residents.microchip_number and microchip_implanted_on for one resident, and nothing else (0116). Admin, staff, or a vet whose clinic holds the resident (current_vet_resident_ids). Refuses a deceased resident. Strips nothing: the 0113 check and unique index apply.';

revoke all on function set_resident_microchip(uuid, text, date) from public, anon;
grant execute on function set_resident_microchip(uuid, text, date) to authenticated, service_role;

notify pgrst, 'reload schema';
