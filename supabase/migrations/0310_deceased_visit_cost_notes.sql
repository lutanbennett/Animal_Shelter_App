-- consumer: src/app/bills/actions.ts, src/app/clinic-visits/[id]/edit/actions.ts
--
-- A DECEASED RESIDENT'S CLINIC VISIT CAN HAVE ITS COST AND NOTES CORRECTED (backlog #314hq, part 1, schema half).
-- docs/decisions/2026-11-04-deceased-records-app.md is the paper for this file.
--
-- WHAT REFUSED IT: enforce_deceased_lock() (0026:162, last redefined 0307) is attached BEFORE INSERT/UPDATE/DELETE to
-- clinic_visits (0026 put it on vet_appointments; 0172 renamed the table and the trigger went with it). Writing a bill's
-- amount (/bills match, or the visit edit) is an UPDATE of clinic_visits.cost, so it was refused for a dead resident.
-- Bill PHOTOS were never refused: attachment_resident_id() (0032) knows resident, blood_test and procedure but not
-- clinic_visit, so it returns null and the attachment lock lets a clinic_visit file through.
--
-- WHAT THIS FILE DOES, and nothing else: enforce_deceased_lock() gains ONE opening beside the 0052 and 0307 ones: an
-- UPDATE of clinic_visits that changes only cost and notes. Status, date, clinic, doctor, reason, INSERT and DELETE stay
-- refused. Nothing is keyed by a role; the card check (medical.visits) is unchanged. Additive and re-runnable.

create or replace function enforce_deceased_lock()
returns trigger
language plpgsql
as $$
declare
  v_column text := tg_argv[0];
  v_new_id uuid;
  v_old_id uuid;
  -- residents.* that may change after death (0052). Kept here rather than
  -- in a table so the exemption is visible next to the rule it relaxes.
  v_open_columns text[] := array[
    'bio', 'temperament_notes', 'past_story_notes', 'behaviour_notes',
    'profile_photo_drive_file_id'
  ];
  -- The columns correct_intake_date() moves (0307), per table.
  v_intake_columns text[];
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

    -- 0310: a visit's own cost and notes are corrections to a past record (a bill arriving late), not an act on a
    -- living animal. UPDATE only, on clinic_visits only, and only those two columns; every other column, every
    -- INSERT and every DELETE is refused exactly as before.
    if tg_table_name = 'clinic_visits' and tg_op = 'UPDATE'
      and (to_jsonb(new) - array['cost', 'notes']) = (to_jsonb(old) - array['cost', 'notes'])
    then
      return new;
    end if;

    -- 0307: the intake date correction, and only while correct_intake_date() has raised its flag.
    if tg_op = 'UPDATE' and coalesce(current_setting('app.intake_date_correction_lock', true), '') = 'on' then
      v_intake_columns := case tg_table_name
        when 'residents'      then array['intake_date', 'age_estimated_on']
        when 'placement_history' then array['start_date']
        when 'resident_diets' then array['start_date']
        when 'weight'         then array['date']
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
