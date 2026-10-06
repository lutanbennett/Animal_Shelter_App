-- consumer: src/app/residents/[id]/photos/actions.ts
--
-- The photo split (docs/roles-and-permissions.md §15, A3 / A5) and the last role-named policies.
-- After this file no policy in the database names a role: `check-policy-role-names.mjs` ends on
-- nothing left, and perm-drop-enum's last database precondition is met.
--
-- THE QUESTION `attachments` HAD TO BE GIVEN
--   The six conversions before this one translated a question that already existed. `attachments`
--   has none: one table carries five kinds of file. So, as 0144 did for placement_history's five
--   acts, each policy asks the activity of the row's own owner_type:
--
--     owner_type    read                                 add / edit            remove
--     resident      resident.record (read)               photos.resident_add*  photos.resident_manage
--                   + sees_all_residents()                + sees_all_residents()  + sees_all_residents()
--     blood_test    medical.blood_tests (read)           medical.blood_tests   medical.blood_tests
--     procedure     medical.procedures (read)            medical.procedures    medical.procedures
--                   (both + sees_all_clinical())
--     maintenance   maintenance.photos                   maintenance.photos    maintenance.photos
--     project       projects.photos                      projects.photos       projects.photos
--
--   * A resident photo's UPDATE (refiling it) is photos.resident_manage, not add: that is A3, the
--     split between adding a photo and managing one. Its DELETE is manage too.
--   maintenance_photos and project_photos are one activity each: maintenance.photos, projects.photos.
--
-- A5: PUBLISHING IS NOT A SIDE EFFECT OF FILING ANY MORE
--   0101 / 0103 publish every non-Medical resident photo. So the folder a photo is filed under IS
--   the publish decision, and it is now asked of the database, not only of the app:
--     can_publish_resident_photos()   holds photos.resident_publish AND the role's scope_photos is not
--                                     medical_only
--   A resident photo may be filed (insert) or refiled (update) to a non-Medical folder only when that
--   is true. It is enforced twice, because there are two doors: a RESTRICTIVE policy on attachments
--   (every direct insert and update, whatever role reaches it, the vet's own policies included) and
--   record_attachment() (security definer, so it bypasses policies). This is the Security backlog
--   item "a vet's Medical-folder-only is enforced by the app, not the database": record_attachment()
--   checked the role and never the folder, and the vet's own insert/update policies never looked at it.
--
-- A3: delete_resident_photo() and set_resident_profile_photo() ask photos.resident_manage (and
--   sees_all_residents()) instead of listing admin, management and staff.
--
-- WHAT STAYS: admin_all_* (R6), the vet_* attachment policies (Vet is last; their folder gap is
--   closed by the restrictive policy, not by editing them), photos_medical_only() (still used).
--   record_attachment() keeps its role list for the four roles that had it (admin, management,
--   staff, vet); the vet has no cell rows yet, so the cell cannot replace the list until Vet converts.
--
-- Written to be re-runnable. To undo: drop the *_perm policies and the two folder guards, re-create
-- management_rw_* and staff_rw_* from 0001 and 0039, and re-create the three functions from 0134 / 0140.

-- ---------------------------------------------------------------------------
-- 1. The one new question: may this login publish a resident's photo (file it outside Medical)?
-- ---------------------------------------------------------------------------
create or replace function can_publish_resident_photos()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.has_permission('photos.resident_publish')), false)
     and not coalesce((select public.photos_medical_only()), false);
$$;

comment on function can_publish_resident_photos() is
  'May the caller file a resident photo outside the Medical folder, which publishes it (0101, 0103)? Holds photos.resident_publish and the role''s scope_photos is not medical_only. Asked as (select can_publish_resident_photos()) by the folder guards on attachments and by record_attachment().';

revoke all on function can_publish_resident_photos() from public, anon;
grant execute on function can_publish_resident_photos() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. attachments: drop the role-named policies, add one per command, per owner type
-- ---------------------------------------------------------------------------
drop policy if exists management_rw_attachments on attachments;
drop policy if exists staff_rw_attachments on attachments;
drop policy if exists attachments_select_perm on attachments;
drop policy if exists attachments_insert_perm on attachments;
drop policy if exists attachments_update_perm on attachments;
drop policy if exists attachments_delete_perm on attachments;
drop policy if exists attachments_insert_folder_guard on attachments;
drop policy if exists attachments_update_folder_guard on attachments;

create policy attachments_select_perm on attachments for select to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('resident.record', 'read')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests', 'read')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures', 'read')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else false
    end
  );

create policy attachments_insert_perm on attachments for insert to authenticated
  with check (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_add')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else false
    end
  );

-- A resident photo is refiled, captioned or reordered under photos.resident_manage (A3).
create policy attachments_update_perm on attachments for update to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else false
    end
  )
  with check (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else false
    end
  );

create policy attachments_delete_perm on attachments for delete to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      else false
    end
  );

-- A5, and the vet's Medical-only guard: whoever writes a resident photo row, by whichever policy
-- let them in, may file it outside Medical only if they may publish. Restrictive, so it is ANDed
-- with every permissive policy above and the vet_* ones.
create policy attachments_insert_folder_guard on attachments as restrictive for insert to authenticated
  with check (
    owner_type <> 'resident'
    or lower(btrim(coalesce(sub_folder, ''))) = 'medical'
    or (select can_publish_resident_photos())
  );

create policy attachments_update_folder_guard on attachments as restrictive for update to authenticated
  with check (
    owner_type <> 'resident'
    or lower(btrim(coalesce(sub_folder, ''))) = 'medical'
    or (select can_publish_resident_photos())
  );

-- ---------------------------------------------------------------------------
-- 3. maintenance_photos and project_photos: one activity each, all four commands
--    (Edit includes remove, as adoption_updates does, A8).
-- ---------------------------------------------------------------------------
do $convert$
declare
  t record;
begin
  for t in
    select * from (values
      ('maintenance_photos', 'maintenance.photos'),
      ('project_photos',     'projects.photos')
    ) as v(tbl, act)
  loop
    execute format('drop policy if exists %I on public.%I', 'management_rw_' || t.tbl, t.tbl);
    execute format('drop policy if exists %I on public.%I', 'staff_rw_' || t.tbl, t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_select_perm', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_insert_perm', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_update_perm', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_delete_perm', t.tbl);

    execute format('create policy %I on public.%I for select to authenticated using ((select has_permission(%L)))',
      t.tbl || '_select_perm', t.tbl, t.act);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select has_permission(%L)))',
      t.tbl || '_insert_perm', t.tbl, t.act);
    execute format('create policy %I on public.%I for update to authenticated using ((select has_permission(%L))) with check ((select has_permission(%L)))',
      t.tbl || '_update_perm', t.tbl, t.act, t.act);
    execute format('create policy %I on public.%I for delete to authenticated using ((select has_permission(%L)))',
      t.tbl || '_delete_perm', t.tbl, t.act);
  end loop;
end
$convert$;

-- ---------------------------------------------------------------------------
-- 4. The three functions
-- ---------------------------------------------------------------------------
-- delete_resident_photo: 0134's body, the role list replaced by the cell (A3).
create or replace function delete_resident_photo(p_attachment_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner_id uuid;
  v_drive_file_id text;
  v_was_profile boolean;
  v_fallback text;
begin
  if not (coalesce((select has_permission('photos.resident_manage')), false)
          and coalesce((select sees_all_residents()), false)) then
    raise exception 'Not authorized to remove attachments.';
  end if;

  select owner_id, drive_file_id into v_owner_id, v_drive_file_id
  from attachments
  where id = p_attachment_id and owner_type = 'resident';

  if v_owner_id is null then
    raise exception 'Photo not found.';
  end if;

  select (profile_photo_drive_file_id = v_drive_file_id) into v_was_profile
  from residents where id = v_owner_id;

  delete from attachments where id = p_attachment_id;

  if v_was_profile then
    select drive_file_id into v_fallback
    from attachments
    where owner_type = 'resident' and owner_id = v_owner_id
    order by uploaded_at asc
    limit 1;

    update residents set profile_photo_drive_file_id = v_fallback where id = v_owner_id;
  end if;

  return v_drive_file_id;
end;
$function$;

-- set_resident_profile_photo: the live body, the role list replaced by the cell (A3).
create or replace function set_resident_profile_photo(p_resident_id uuid, p_drive_file_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not (coalesce((select has_permission('photos.resident_manage')), false)
          and coalesce((select sees_all_residents()), false)) then
    raise exception 'Not authorized to set the profile photo.';
  end if;

  -- Require an existing attachment row for this resident/file, so an
  -- arbitrary Drive file ID can't be set as the profile photo.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
  ) then
    raise exception 'That photo does not belong to this resident.';
  end if;

  update residents
  set profile_photo_drive_file_id = p_drive_file_id
  where id = p_resident_id;
end;
$function$;

-- record_attachment: 0140's body with the folder rule made the same for every login (A5). 0140
-- applied it only to a login that arrived by its cell, so a vet (legacy list) could file anywhere.
create or replace function record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null
)
returns table (attachment attachments, is_profile boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  -- A5: a resident photo outside the Medical folder is published (0101), so it is filed only by a
  -- login that may publish. An adopter's photo has a folder of its own choosing, so the same.
  -- Everyone, not only the login that arrived by its cell: a vet's own login used by hand could
  -- otherwise file under any folder.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical') then
    raise exception 'This login can add photos to the Medical folder only.';
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

notify pgrst, 'reload schema';
