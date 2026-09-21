-- Photos and bio stay editable after death (2026-09-21).
--
-- 0026 closed a deceased resident's record completely, pending a decision
-- on which fields should stay open. The decision: the bio — bio,
-- temperament, past story and behaviour notes, the words that describe who
-- they were — and their photos (adding, removing, choosing the profile
-- photo). Everything else (identity, dates, placements, medical records,
-- files on blood tests and procedures) stays locked.
--
--   1. enforce_deceased_lock() lets an UPDATE on `residents` through when
--      the only columns that changed are in that allowed set. Any other
--      change to the row, and every DELETE, is refused as before. The
--      other tables it guards are unaffected.
--   2. enforce_deceased_lock_attachment() lets 'resident' attachments (the
--      photos) through for a deceased resident; blood test and procedure
--      files are still locked with their records.
--
-- The application regenerates the archive (summary PDF and offline index)
-- after one of these edits, since both list the bio and the photos.
--
-- Written to be safely re-runnable.

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
    -- The one opening: a residents UPDATE that touches only the open
    -- columns. Compared with those columns stripped from both sides, so
    -- an unchanged value elsewhere on the row is fine but a changed one
    -- is not.
    if tg_table_name = 'residents' and tg_op = 'UPDATE'
      and (to_jsonb(new) - v_open_columns) = (to_jsonb(old) - v_open_columns)
    then
      return new;
    end if;

    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function enforce_deceased_lock_attachment()
returns trigger
language plpgsql
as $$
declare
  v_new_id uuid;
  v_old_id uuid;
  v_owner_type attachment_owner_type;
begin
  if deceased_lock_bypassed() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- A resident's own photos stay open after death (0052). The owner type
  -- can't change on UPDATE (there's no reason to re-home a file), so
  -- either side of the row says which kind this is.
  v_owner_type := case when tg_op = 'DELETE' then old.owner_type else new.owner_type end;
  if v_owner_type = 'resident'
    and (tg_op <> 'UPDATE' or new.owner_type = old.owner_type)
  then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op <> 'DELETE' then
    v_new_id := attachment_resident_id(new.owner_type, new.owner_id);
  end if;
  if tg_op <> 'INSERT' then
    v_old_id := attachment_resident_id(old.owner_type, old.owner_id);
  end if;

  if (v_new_id is not null and resident_is_deceased(v_new_id))
    or (v_old_id is not null and resident_is_deceased(v_old_id))
  then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
