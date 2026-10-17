-- consumer: none
--
-- SCHEMA half of the backlog item "Add resident photos: tag a photo to an ENCLOSURE when you do not know which
-- resident it is, and the approver picks the resident". NOTHING IN src/ READS THIS TABLE OR THESE FUNCTIONS YET.
-- When this merges, nobody can file an unassigned photo and no approver can assign one: the flow and the queue are
-- the app half. See docs/decisions/2026-10-17-pending-photos-schema.md.
--
-- THE SHAPE: a separate table, pending_photos, not a new attachment_owner_type value. A photo nobody has identified is
-- not yet an attachment of anything. Keeping it out of `attachments` means every view, policy, guard and trigger
-- already written against attachments keeps its meaning (a new enum value would silently widen anything written as
-- owner_type <> '...'), and it needs one file, not the two an enum add-value + use requires.
--
-- WHY IT CANNOT BE PUBLIC, STRUCTURALLY: the table has no approval column to set, RLS is on, anon holds no grant, and
-- no public view or is_public_drive_file() mentions it. is_public_drive_file asks the public views, none of which
-- read this table. It has no resident, so it can appear on no resident page, profile or appeal.
--
-- ONE FILE OR A COPY PER RESIDENT? A COPY. assign_pending_photo() takes one (resident, drive file id) pair per
-- resident and writes one ordinary attachments row for each. The first pair normally carries the original file
-- (moved into that resident's Shelter folder); every further resident gets a Drive copy the app makes. Every existing
-- path (delete, refile, set profile photo, the Medical guard) assumes one file = one attachment, so sharing one
-- Drive id between two residents would let deleting one resident's photo trash the other's.
--
-- WHO, AND WHEN: filing needs photos.shelter_add or the right to publish resident photos (the same two logins that
-- may file a Shelter photo, 0217), never a Medical-only login. A filer sees their own rows; a login that may publish
-- sees all, assigns, and discards. Assigning IS approving (the approver has looked and named the animal), unless
-- p_approve is false, in which case the new attachments rows wait like any other waiting photo.
--
-- WHO WAS THERE: pending_photo_candidates() lists the residents whose placement covered that enclosure at taken_at.
--
-- Additive and re-runnable. To undo in a new file: drop the two functions, the policies, and the table; restore
-- 0193's can_see_drive_file() and 0076's is_known_drive_file().

create table if not exists pending_photos (
  id uuid primary key default gen_random_uuid(),
  enclosure_id uuid not null references enclosures (id),
  drive_file_id text not null unique,
  file_name text,
  taken_at timestamptz not null default now(),
  note text,
  uploaded_by uuid not null default auth.uid() references auth.users (id),
  uploaded_at timestamptz not null default now()
);

create index if not exists pending_photos_enclosure_idx on pending_photos (enclosure_id, taken_at);

comment on table pending_photos is
  'A photo filed against an ENCLOSURE because the filer did not know which resident it is (0218). Never public: no approval state, no resident, no public view reads it. assign_pending_photo() turns it into ordinary attachments rows and deletes it.';

alter table pending_photos enable row level security;

-- May this login file or discard an unassigned photo?
create or replace function can_file_pending_photo()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select can_publish_resident_photos()), false)
      or (coalesce((select has_permission('photos.shelter_add')), false)
          and not coalesce((select photos_medical_only()), false));
$$;
revoke all on function can_file_pending_photo() from public, anon;
grant execute on function can_file_pending_photo() to authenticated, service_role;

drop policy if exists pending_photos_select on pending_photos;
create policy pending_photos_select on pending_photos for select to authenticated
  using (uploaded_by = (select auth.uid()) or (select can_publish_resident_photos()));

drop policy if exists pending_photos_insert on pending_photos;
create policy pending_photos_insert on pending_photos for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and (select can_file_pending_photo()));

-- Approvers can correct the enclosure, time or note; filers cannot rewrite what they filed.
drop policy if exists pending_photos_update on pending_photos;
create policy pending_photos_update on pending_photos for update to authenticated
  using ((select can_publish_resident_photos()))
  with check ((select can_publish_resident_photos()));

drop policy if exists pending_photos_delete on pending_photos;
create policy pending_photos_delete on pending_photos for delete to authenticated
  using ((select can_publish_resident_photos()));

revoke all on pending_photos from public, anon, authenticated;
grant select, insert, update, delete on pending_photos to authenticated;
grant all on pending_photos to service_role;

drop trigger if exists audit_pending_photos on pending_photos;
create trigger audit_pending_photos
  after insert or update or delete on pending_photos
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- Who was in that enclosure when the photo was taken
-- ---------------------------------------------------------------------------
create or replace function pending_photo_candidates(p_pending_id uuid)
returns table (resident_id uuid, resident_code text, name text, species text, start_date timestamptz, end_date timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select r.id, r.resident_code, r.name, r.species::text, h.start_date, h.end_date
    from pending_photos p
    join placement_history h
      on h.enclosure_id = p.enclosure_id
     and h.start_date <= p.taken_at
     and (h.end_date is null or h.end_date > p.taken_at)
    join residents r on r.id = h.resident_id
   where p.id = p_pending_id
   order by r.name;
$$;
revoke all on function pending_photo_candidates(uuid) from public, anon;
grant execute on function pending_photo_candidates(uuid) to authenticated, service_role;

comment on function pending_photo_candidates(uuid) is
  'Residents whose placement in the photo''s enclosure covered its taken_at: the ones the approval queue offers first (0218). Security invoker, so RLS on pending_photos and residents decides what the caller sees.';

-- ---------------------------------------------------------------------------
-- Assign: one pending photo -> one attachments row per resident, atomically
-- ---------------------------------------------------------------------------
-- p_assignments: [{"resident_id": "<uuid>", "drive_file_id": "<id>"}, ...]. Needs the right to publish.
create or replace function assign_pending_photo(p_pending_id uuid, p_assignments jsonb, p_approve boolean default true)
returns setof attachments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p pending_photos;
  v_item jsonb;
  v_resident uuid;
  v_file text;
  v_att attachments;
begin
  if not coalesce((select can_publish_resident_photos()), false) then
    raise exception 'You do not have permission to assign a photo';
  end if;

  select * into v_p from pending_photos where id = p_pending_id for update;
  if v_p.id is null then
    raise exception 'That photo is not waiting to be assigned';
  end if;

  if p_assignments is null or jsonb_typeof(p_assignments) <> 'array' or jsonb_array_length(p_assignments) = 0 then
    raise exception 'Choose at least one resident';
  end if;

  if (select count(distinct x ->> 'resident_id') from jsonb_array_elements(p_assignments) x)
     <> jsonb_array_length(p_assignments) then
    raise exception 'A resident can only be chosen once for a photo';
  end if;

  for v_item in select * from jsonb_array_elements(p_assignments) loop
    v_resident := (v_item ->> 'resident_id')::uuid;
    v_file := nullif(btrim(coalesce(v_item ->> 'drive_file_id', '')), '');
    if v_file is null then
      raise exception 'Each resident needs a file id';
    end if;
    if not exists (select 1 from residents where id = v_resident) then
      raise exception 'That resident does not exist';
    end if;

    -- Approved on save by attachments_approval_stamp (the caller can publish); uploaded_by keeps the credit.
    insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_at, uploaded_by)
    values ('resident', v_resident, 'Shelter', v_file, v_p.file_name, (v_p.taken_at at time zone 'Asia/Bangkok')::date,
            v_p.uploaded_at, v_p.uploaded_by)
    returning * into v_att;

    if not p_approve then
      update attachments set approved_at = null where id = v_att.id returning * into v_att;
    else
      update residents set profile_photo_drive_file_id = v_file
       where id = v_resident and profile_photo_drive_file_id is null;
    end if;

    return next v_att;
  end loop;

  delete from pending_photos where id = p_pending_id;
  return;
end;
$$;
revoke all on function assign_pending_photo(uuid, jsonb, boolean) from public, anon;
grant execute on function assign_pending_photo(uuid, jsonb, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The photo proxy and the "known file" check must know the new table (neither makes anything public)
-- ---------------------------------------------------------------------------
create or replace function can_see_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from attachments where drive_file_id = p_drive_file_id
    union all
    select 1 from project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from maintenance_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from community_outing_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from medication where label_drive_file_id = p_drive_file_id
    union all
    select 1 from stock_medications where label_drive_file_id = p_drive_file_id
    union all
    select 1 from pending_photos where drive_file_id = p_drive_file_id
  );
$$;

create or replace function is_known_drive_file(p_drive_file_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from attachments where drive_file_id = p_drive_file_id
    union all
    select 1 from project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from maintenance_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from site_content where hero_drive_file_id = p_drive_file_id
    union all
    select 1 from site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from pending_photos where drive_file_id = p_drive_file_id
  );
$$;
revoke execute on function is_known_drive_file(text) from public, anon, authenticated;
grant execute on function is_known_drive_file(text) to service_role;

notify pgrst, 'reload schema';
