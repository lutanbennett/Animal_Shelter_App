-- consumer: src/lib/permissions/jobs.ts, src/app/api/residents/[id]/photos/route.ts, src/lib/weight/record.ts, src/lib/diets/special-list.ts
--
-- The Head of Medical's three remaining jobs, database half (docs/decisions/
-- 2026-10-04-medical-jobs-schema.md). The screens are the next batch; this is what
-- they stand on. Everything is additive or a widening of a function's gate by a cell.
--
-- 1. RECORD WEIGHT. medical.weight at Edit. No new policy: 0135 already made `weight`
--    answer has_permission('medical.weight') AND sees_all_clinical(), so the cell is
--    the whole grant. The role cannot open a resident's record, but it does not need
--    to: the picker is resident_who_and_where (0134, gated on the borrowed volunteer
--    rights) and the write goes to `weight`, which asks the cell. The deceased lock is
--    a definer lookup, so it holds for this role too (checked under her JWT).
--
-- 2. ADD MEDICAL PHOTOS. photos.resident_add (Yes) and three pieces:
--    a. record_attachment() accepts a login that holds the activity, for a resident's
--       photo, beside the four legacy roles it already named. A role list is the thing
--       every converted gate is moving away from, so the new branch asks the cell.
--    b. THE DATABASE NOW ENFORCES MEDICAL-ONLY ON THIS PATH. docs §12 said scope_photos
--       is app code only. For a login that gets in through the new branch and whose
--       role says scope_photos = 'medical_only', the function refuses any other folder
--       and any adopter's photo. The four legacy roles are unchanged (their scope is 'all').
--    c. medical_photo_residents: the four things the upload route reads of a resident
--       (name, code, Drive folder, deceased) that a volunteer-based role cannot read
--       from `residents`. set_resident_drive_folder() writes the folder id when the
--       resident has none yet, and never overwrites one.
--
-- 3. FEED SPECIAL DIETS. medical.diet at Read, and special_diet_list: a fixed-column view
--    of every current diet whose type is not the standard one (diet_types.is_standard =
--    false, 0087), with who and where. The same shape as 0136's medication views, because
--    diet_types still names roles (it converts in perm-convert-stock-and-lists) and carries
--    cost, stock and reorder columns a policy could not hide.
--
-- Written to be safely re-runnable. To undo: drop the view, the two functions (set_resident_drive_folder,
-- photos_medical_only) and the photo view, restore record_attachment() from 0134, delete the
-- three role_permissions rows.

-- ---------------------------------------------------------------------------
-- 1. The cells
-- ---------------------------------------------------------------------------
insert into role_permissions (role_id, activity, level)
select r.id, c.activity, c.level
  from roles r
  cross join (values ('medical.weight', 2), ('photos.resident_add', 2), ('medical.diet', 1)) as c(activity, level)
 where r.key = 'head_of_medical'
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2a/2b. record_attachment(): a cell, and the medical-only scope
-- ---------------------------------------------------------------------------
-- Does the caller's live role file photos in Medical only? Definer, so it reads roles
-- whatever the caller may. False for no role.
create or replace function photos_medical_only()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and r.scope_photos = 'medical_only'
  );
$$;

revoke all on function photos_medical_only() from public, anon;
grant execute on function photos_medical_only() to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_attachment(p_owner_type attachment_owner_type, p_owner_id uuid, p_drive_file_id text, p_file_name text DEFAULT NULL::text, p_sub_folder text DEFAULT NULL::text, p_date_taken date DEFAULT NULL::date, p_adoption_update_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(attachment attachments, is_profile boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_legacy boolean := current_user_role() is not null
                      and current_user_role() in ('admin', 'management', 'staff', 'vet');
  v_by_cell boolean := false;
begin
  -- A configured role gets in by its cell, for a resident's photo only (0140). Blood-test and
  -- procedure files stay with the four roles that had them.
  if not v_legacy then
    v_by_cell := p_owner_type = 'resident'
                 and coalesce((select has_permission('photos.resident_add')), false)
                 and coalesce((select sees_all_clinical()), false);
  end if;

  if not (v_legacy or v_by_cell) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- The medical-only scope, enforced here for the login that arrived by its cell: Medical
  -- folder, and not an adopter's photo (which has no folder of its own choosing).
  if v_by_cell and (select photos_medical_only()) then
    if p_adoption_update_id is not null
       or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical' then
      raise exception 'This login can add photos to the Medical folder only.';
    end if;
  end if;

  if current_user_role() = 'vet'
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_vet_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0110: a file on another clinic's blood test or procedure is not the
  -- vet's to add. Definer, so the policies above do not reach here.
  if current_user_role() = 'vet' and not vet_can_write_attachment(p_owner_type, p_owner_id) then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
  returning * into v_attachment;

  if p_owner_type = 'resident' then
    update residents
    set profile_photo_drive_file_id = p_drive_file_id
    where id = p_owner_id
      and profile_photo_drive_file_id is null;

    if found then
      v_is_profile := true;
    end if;
  end if;

  return query select v_attachment, v_is_profile;
end;
$function$;

-- create or replace keeps the grants; restated for the grants lint and so a re-run cannot widen them.
revoke all on function record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid) from public, anon;
grant execute on function record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2c. What the upload route reads of a resident, and the one write it can need
-- ---------------------------------------------------------------------------
create or replace view medical_photo_residents as
select r.id,
       r.name,
       r.thai_name,
       r.resident_code,
       r.drive_folder_id,
       coalesce(s.is_deceased, false) as is_deceased
  from residents r
  left join private.resident_current_state s on s.resident_id = r.id
 where (select has_permission('photos.resident_add')) and (select sees_all_clinical());

comment on view medical_photo_residents is
  'What the photo upload reads of a resident (0140): name, code, Drive folder, deceased. Rows for a login holding photos.resident_add with all-resident clinical scope. A new residents column is private until it is added here.';

revoke all on medical_photo_residents from anon, authenticated, service_role;
grant select on medical_photo_residents to authenticated, service_role;

-- The resident's Drive folder id is written the first time a photo is filed. Only when there
-- is none: this can never repoint a resident at another folder.
create or replace function set_resident_drive_folder(p_resident_id uuid, p_folder_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (coalesce((select has_permission('photos.resident_add')), false)
          and coalesce((select sees_all_clinical()), false)) then
    raise exception 'Not authorized to add photos.';
  end if;
  update residents
     set drive_folder_id = p_folder_id
   where id = p_resident_id and drive_folder_id is null;
end;
$$;

revoke all on function set_resident_drive_folder(uuid, text) from public, anon;
grant execute on function set_resident_drive_folder(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. The special diets list
-- ---------------------------------------------------------------------------
-- One row per current non-standard diet. "Amount" is the resident's own daily quantity, else the
-- type's default for the resident's size (the rule 0051 states). Not cost, stock, reorder or
-- the type's notes. round_keys is where 0137 put the meals ({morning,evening}), sorted.
create or replace view special_diet_list as
select d.id as resident_diet_id,
       r.id as resident_id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th,
       t.id as diet_type_id,
       t.name as diet_name,
       t.unit as diet_unit,
       d.meals_per_day,
       coalesce(d.daily_quantity,
                case r.size when 'Small' then t.daily_qty_small
                            when 'Medium' then t.daily_qty_medium
                            when 'Large' then t.daily_qty_large end) as daily_quantity,
       d.notes,
       coalesce((select array_agg(rd.key order by rd.sort_order)
                   from resident_diet_rounds x
                   join rounds rd on rd.id = x.round_id
                  where x.resident_diet_id = d.id), array[]::text[]) as round_keys
  from resident_diets d
  join diet_types t on t.id = d.diet_type_id
  join residents r on r.id = d.resident_id
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where t.is_standard = false
   and d.start_date <= shelter_today()
   and (d.end_date is null or d.end_date >= shelter_today())
   and (select has_permission('medical.diet', 'read'))
   and (select sees_all_clinical());

comment on view special_diet_list is
  'Every current diet that is not the standard one, with who and where (0140). Rows for a login holding medical.diet Read with all-resident clinical scope. No cost, stock or reorder column; a new column on diet_types or residents is private until added here. Status is not filtered: the screen drops Deceased and Adopted.';

revoke all on special_diet_list from anon, authenticated, service_role;
grant select on special_diet_list to authenticated, service_role;

notify pgrst, 'reload schema';
