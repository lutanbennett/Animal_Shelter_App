-- consumer: none
-- Backlog #314hq part (D), schema half. Lutan chose the WIDEST option on 2026-11-05: notes on a closed record, and a late blood test.
-- Extends 0310 (which opened clinic_visits.cost and notes only) in the same shape:
--   * NAMED COLUMNS, never whole rows: an UPDATE that changes only the listed columns passes, anything else is refused as before.
--       placement_history, weight, prescriptions, procedures : notes
--       immunization_records                                 : notes (+ updated_at, which its own trigger bumps)
--       blood_tests                                          : results, drive_file_id (a late result or its file)
--   * INSERT and DELETE stay refused on every table, with ONE exception: INSERT on blood_tests. A late blood test is a new row, so the
--     rule cannot be a column list; it is "a blood_tests row may be inserted" and nothing else is. A dead resident still cannot be given
--     a placement, weight, prescription, immunization, procedure or visit. DELETE is refused everywhere, blood tests included.
--   * Nothing is keyed by a role. The card checks and row-level policies on each table are unchanged and still decide who may write.
-- Files attached to a blood test (attachments, owner_type blood_test) stay locked by enforce_deceased_lock_attachment; the result text
-- and blood_tests.drive_file_id are what a late result uses. Re-runnable: create or replace of the 0310 body plus two blocks.

create or replace function enforce_deceased_lock()
returns trigger
language plpgsql
as $$
declare
  v_column text := tg_argv[0];
  v_new_id uuid;
  v_old_id uuid;
  v_open_columns text[] := array[
    'bio', 'temperament_notes', 'past_story_notes', 'behaviour_notes',
    'profile_photo_drive_file_id'
  ];
  v_intake_columns text[];
  v_note_columns text[];
begin
  if deceased_lock_bypassed() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op <> 'DELETE' then
    v_new_id := (to_jsonb(new) ->> v_column)::uuid;
  end if;
  if tg_op <> 'INSERT' then
    v_old_id := (to_jsonb(old) ->> v_column)::uuid;
  end if;

  if (v_new_id is not null and resident_is_deceased(v_new_id))
    or (v_old_id is not null and resident_is_deceased(v_old_id))
  then
    if tg_table_name = 'residents' and tg_op = 'UPDATE'
      and (to_jsonb(new) - v_open_columns) = (to_jsonb(old) - v_open_columns)
    then
      return new;
    end if;

    -- 0310: a visit's own cost and notes.
    if tg_table_name = 'clinic_visits' and tg_op = 'UPDATE'
      and (to_jsonb(new) - array['cost', 'notes']) = (to_jsonb(old) - array['cost', 'notes'])
    then
      return new;
    end if;

    -- 0320: notes on the other tables, and a late result's text and file. UPDATE of named columns only.
    if tg_op = 'UPDATE' then
      v_note_columns := case tg_table_name
        when 'placement_history'    then array['notes']
        when 'weight'               then array['notes']
        when 'prescriptions'        then array['notes']
        when 'procedures'           then array['notes']
        when 'immunization_records' then array['notes', 'updated_at']
        when 'blood_tests'          then array['results', 'drive_file_id']
        else null end;
      if v_note_columns is not null
        and (to_jsonb(new) - v_note_columns) = (to_jsonb(old) - v_note_columns)
      then
        return new;
      end if;
    end if;

    -- 0320: the one permitted INSERT on a closed record: a blood test result that arrives after the death.
    if tg_op = 'INSERT' and tg_table_name = 'blood_tests' then
      return new;
    end if;

    -- 0307: the intake date correction, and only while correct_intake_date() has raised its flag.
    if tg_op = 'UPDATE' and coalesce(current_setting('app.intake_date_correction_lock', true), '') = 'on' then
      v_intake_columns := case tg_table_name
        when 'residents'         then array['intake_date', 'age_estimated_on']
        when 'placement_history' then array['start_date']
        when 'resident_diets'    then array['start_date']
        when 'weight'            then array['date']
        else null end;
      if v_intake_columns is not null
        and (to_jsonb(new) - v_intake_columns) = (to_jsonb(old) - v_intake_columns)
      then
        return new;
      end if;
    end if;

    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
