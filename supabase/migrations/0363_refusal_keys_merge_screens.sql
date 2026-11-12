-- consumer: src/app/admin/medications/actions.ts, src/app/admin/procedure-types/actions.ts, src/app/admin/blood-test-types/actions.ts
-- #3nuwy, group 8 (the three merge screens): merge_medication, merge_procedure_type and merge_blood_test_type raise KEYS
-- (docs/decisions/2026-11-12-refusal-keys-group-8.md). Bodies are 0043 / 0047 / 0050 unchanged but for the raise lines.
-- All three stay SECURITY INVOKER (row-level security decides who may delete); SQLSTATE stays the default (P0001). Re-runnable.
-- undo: re-apply the three bodies from 0043, 0047 and 0050 in a new file.

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
    raise exception 'merge.medication_same';
  end if;
  select * into v_from from medication where id = p_from;
  select * into v_into from medication where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'merge.medication_not_found';
  end if;
  if v_from.dose_unit <> v_into.dose_unit then
    raise exception 'merge.medication_unit_mismatch'
      using detail = json_build_object('from', v_from.dose_unit, 'into', v_into.dose_unit)::text;
  end if;

  update prescriptions set medication_id = p_into where medication_id = p_from;
  get diagnostics v_moved = row_count;

  delete from medication where id = p_from;
  if not found then
    raise exception 'merge.medication_not_allowed';
  end if;
  return v_moved;
end;
$$;

create or replace function merge_procedure_type(p_from uuid, p_into uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_moved integer;
begin
  if p_from = p_into then
    raise exception 'merge.procedure_type_same';
  end if;
  if not exists (select 1 from procedure_types where id = p_from)
     or not exists (select 1 from procedure_types where id = p_into) then
    raise exception 'merge.procedure_type_not_found';
  end if;

  update procedures set procedure_type_id = p_into where procedure_type_id = p_from;
  get diagnostics v_moved = row_count;

  delete from procedure_types where id = p_from;
  if not found then
    raise exception 'merge.procedure_type_not_allowed';
  end if;
  return v_moved;
end;
$$;

create or replace function merge_blood_test_type(p_from uuid, p_into uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_moved integer;
begin
  if p_from = p_into then
    raise exception 'merge.blood_test_type_same';
  end if;
  if not exists (select 1 from blood_test_types where id = p_from)
     or not exists (select 1 from blood_test_types where id = p_into) then
    raise exception 'merge.blood_test_type_not_found';
  end if;

  update blood_tests set blood_test_type_id = p_into where blood_test_type_id = p_from;
  get diagnostics v_moved = row_count;

  delete from blood_test_types where id = p_from;
  if not found then
    raise exception 'merge.blood_test_type_not_allowed';
  end if;
  return v_moved;
end;
$$;

notify pgrst, 'reload schema';
