-- Management role, part 2 of 2: what the role can do (needs 0038 committed).
--
-- =========================================================================
-- 1. Row-level security: management mirrors staff
--
-- A manager does the day-to-day work as well as reading the reports, so
-- their access to the operational tables is *exactly* staff's — the same
-- read/write split on residents, placements, vet data, maintenance,
-- projects and contacts, and the same things staff can't touch
-- (user_roles, site_content, and the vet-only writes). Rather than restate
-- forty-odd policies by hand and drift the next time one of staff's
-- changes, every `staff_*` policy in the public schema is copied as a
-- `management_*` twin with 'staff' swapped for 'management' in its USING /
-- WITH CHECK expressions. Policies are permissive (OR-ed), so the twin
-- grants the same thing to the other role and nothing else.
--
-- Re-runnable: each twin is dropped and re-created, so re-applying after a
-- later migration adds or changes a staff policy brings management back
-- in step. A migration that adds a new staff policy should add the
-- management one next to it (or re-run this block) — the count check at
-- the end is there to catch the two drifting apart.
--
-- What management gets *beyond* staff is in the app, not in RLS: the
-- Management section (dashboard, contact management) is gated by
-- requireManagementUser() in src/lib/auth/require-management.ts, and the
-- dashboard only reads tables staff can already read.
-- =========================================================================

do $$
declare
  p record;
  v_name text;
  v_sql text;
  v_staff integer;
  v_management integer;
begin
  for p in
    select tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and policyname like 'staff\_%'
    order by tablename, policyname
  loop
    v_name := 'management_' || substr(p.policyname, length('staff_') + 1);
    execute format('drop policy if exists %I on public.%I', v_name, p.tablename);

    v_sql := format(
      'create policy %I on public.%I as %s for %s',
      v_name, p.tablename, p.permissive, p.cmd
    );
    -- Every staff policy today applies to PUBLIC (no TO clause); keep any
    -- explicit role list should one appear later.
    if p.roles <> '{public}'::name[] then
      v_sql := v_sql || ' to ' || (
        select string_agg(quote_ident(r), ', ') from unnest(p.roles) as r
      );
    end if;
    if p.qual is not null then
      v_sql := v_sql || format(
        ' using (%s)', replace(p.qual, '''staff''', '''management''')
      );
    end if;
    if p.with_check is not null then
      v_sql := v_sql || format(
        ' with check (%s)', replace(p.with_check, '''staff''', '''management''')
      );
    end if;
    execute v_sql;
  end loop;

  select count(*) into v_staff
  from pg_policies where schemaname = 'public' and policyname like 'staff\_%';
  select count(*) into v_management
  from pg_policies where schemaname = 'public' and policyname like 'management\_%';
  if v_staff <> v_management then
    raise exception 'management policies (%) do not match staff policies (%)',
      v_management, v_staff;
  end if;
  raise notice 'mirrored % staff policies for management', v_staff;
end;
$$;

-- =========================================================================
-- 2. Security-definer functions with their own role list
--
-- These bypass RLS and check the role themselves, so the mirror above
-- doesn't reach them. Each is re-created as last defined (record_attachment
-- from 0020, the two photo functions from 0013, the archive one from 0026)
-- with 'management' added wherever 'staff' appears.
-- =========================================================================

create or replace function record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null
)
returns table (attachment attachments, is_profile boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
begin
  if current_user_role() not in ('admin', 'management', 'staff', 'vet', 'volunteer') then
    raise exception 'Not authorized to add attachments.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid())
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
$$;

create or replace function set_resident_profile_photo(
  p_resident_id uuid,
  p_drive_file_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_role() not in ('admin', 'management', 'staff', 'volunteer') then
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
$$;

create or replace function delete_resident_photo(
  p_attachment_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_drive_file_id text;
  v_was_profile boolean;
  v_fallback text;
begin
  if current_user_role() not in ('admin', 'management', 'staff', 'volunteer') then
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
$$;

create or replace function record_deceased_archive(
  p_resident_id uuid,
  p_drive_folder_id text default null,
  p_summary_drive_file_id text default null,
  p_index_drive_file_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_index text;
begin
  if current_user_role() not in ('admin', 'management', 'staff') then
    raise exception 'Not authorized to archive a deceased resident.';
  end if;

  if not resident_is_deceased(p_resident_id) then
    raise exception 'This resident is not recorded as deceased.';
  end if;

  perform set_config('app.deceased_lock_bypass', 'on', true);

  update residents
  set drive_folder_id = coalesce(p_drive_folder_id, drive_folder_id),
      deceased_summary_drive_file_id =
        coalesce(p_summary_drive_file_id, deceased_summary_drive_file_id),
      deceased_index_drive_file_id =
        coalesce(p_index_drive_file_id, deceased_index_drive_file_id)
  where id = p_resident_id
  returning deceased_summary_drive_file_id, deceased_index_drive_file_id
  into v_summary, v_index;

  -- Only a complete archive counts as archived; a partial one stays flagged
  -- for retry.
  if v_summary is not null and v_index is not null then
    update residents set deceased_archived_at = now() where id = p_resident_id;
  end if;

  perform set_config('app.deceased_lock_bypass', 'off', true);
end;
$$;

-- =========================================================================
-- 3. public_shelter_stats — the impact strip on the public home page
--
-- Counts only, no names or ids, so it is safe for `anon` (backlog, Public
-- website: "Shelter impact stats on the home page"). Same mechanism as
-- public_resident_profiles (0016/0025): a view owned by postgres reads the
-- base tables without RLS, SELECT is granted to anon/authenticated and
-- every write privilege Supabase's defaults would hand out is revoked. "In
-- care" is Resident + Hospitalised + Fostered — an animal in the Lifecycle
-- 'Unassigned' pseudo-enclosure (status Outreach) isn't in the shelter's
-- care in the sense the public strip means.
-- =========================================================================

create or replace view public_shelter_stats as
select
  (select count(*) from resident_current_state
     where current_status in ('Resident', 'Hospitalised', 'Fostered'))::integer as in_care,
  (select count(*) from resident_current_state
     where current_status = 'Hospitalised')::integer as in_hospital,
  (select count(*) from resident_current_state
     where current_status = 'Fostered')::integer as in_foster,
  (select count(*) from resident_current_state s
     join residents r on r.id = s.resident_id
     where r.ready_for_adoption and r.is_public_visible
       and s.current_status not in ('Deceased', 'Adopted'))::integer as ready_for_adoption,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and start_date >= now() - interval '7 days')::integer as adopted_last_7_days,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and start_date >= date_trunc('year', now()))::integer as adopted_this_year,
  (select count(*) from placement_history
     where placement_type = 'Intake'
       and start_date >= date_trunc('year', now()))::integer as intakes_this_year;

grant select on public_shelter_stats to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shelter_stats
  from anon, authenticated;

notify pgrst, 'reload schema';
