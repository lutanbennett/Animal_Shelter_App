-- Anon keeps only the functions the public site calls (found 2026-09-25).
-- See docs/decisions.md, 2026-09-25, "Anon loses the functions".
--
-- 0081 closed anon's grants on tables and views. Functions have the same
-- problem one layer over, from two defaults at once (0072 spells them out):
-- Postgres grants EXECUTE to PUBLIC on every new function, and Supabase's
-- `alter default privileges` grants it to anon explicitly as well. So anon
-- could call every function in `public` through /rest/v1/rpc/.
--
-- What that exposed. With only the public anon key, no sign-in, dev
-- answered (the writes were run as anon inside a rolled-back transaction):
--
--   approved_translations     the approved Thai text of ANY row, public or
--                             not: three of the four residents with an
--                             approved bio are not on the public site and
--                             their bios came back all the same. Would do
--                             the same for story, temperament, maintenance,
--                             captions, projects and unpublished friends.
--   delete_resident_photo     DELETED a resident photo. Its attachment id
--                             is readable from public_resident_photos.
--   record_attachment         inserted an attachment row against a hidden
--                             resident, pointing at a made-up Drive file,
--                             and made it their profile photo.
--   set_resident_profile_photo,
--   record_deceased_archive   reachable the same way.
--   resident_is_deceased,
--   attachment_resident_id    a boolean / an id for any row id.
--
-- The writers were not simply "missing a check": each opens with
--
--   if current_user_role() not in ('admin', ...) then raise ...
--
-- and current_user_role() is NULL for anon (and for a signed-in user with
-- no role, or an archived one). NULL not in (...) is NULL, `if NULL` does
-- not raise, and the function carries on as its owner. undo_deceased_
-- placement uses `is distinct from` and was always safe. So this file
-- fixes the guards as well as the grants: revoking anon alone would leave
-- every signed-in-but-roleless session able to do the same.
--
-- 1. Grants, by allow-list as in 0081: revoke EXECUTE on every function in
--    `public` from PUBLIC and anon, then grant anon back exactly what the
--    public site needs. Function privileges are checked as the CALLER even
--    inside an owner-rights view, so "what the public views call" counts:
--
--      shelter_date, shelter_today,
--      shelter_time_zone         public_recent_adoptions and
--                                public_shelter_stats call the first two,
--                                which call the third. Pure date arithmetic.
--      current_user_role         the RLS policies on site_content,
--                                site_content_photos and site_pages are
--                                `to public` and are evaluated for anon's
--                                SELECT. Returns NULL for anon.
--      is_known_drive_file       the photo proxy (/api/photos) calls it as
--                                anon. It answers yes/no for a Drive file id,
--                                which the proxy's own 200/404 already tells
--                                anyone, so restricting the RPC alone would
--                                hide nothing. Whether the proxy should serve
--                                non-public attachments to anon is a question
--                                about the route, not this function (backlog).
--
--    authenticated and service_role already hold explicit EXECUTE on every
--    function (checked in pg_proc.proacl on dev), so removing PUBLIC takes
--    nothing from them.
--
-- 2. approved_translations moves to a new schema, `private`, which the Data
--    API does not expose. Chosen over "restrict it to public rows when the
--    caller is anon" because the public views are the only callers and they
--    already filter to public rows; restating each view's idea of "public"
--    inside the function would duplicate it (and for residents, recursively:
--    the view calls the function). The views reference the function by oid,
--    so they follow it without being re-created, and anon keeps EXECUTE so
--    they still work signed out. What goes is the /rpc/ door: nothing can
--    name it through the API any more. A migration that re-creates a public
--    view must now write `private.approved_translations(...)`.
--
-- 3. The four role guards become `current_user_role() is null or ... not in`.
--    Bodies are otherwise exactly 0039's. The unused five-argument
--    record_attachment overload (0014; every caller passes p_date_taken, and
--    0020 added the six-argument one beside it rather than replacing it) is
--    dropped rather than fixed.
--
-- 4. Default privileges: functions postgres creates from now on are no
--    longer executable by PUBLIC or anon, so a new function starts closed.
--    A new helper a public view calls must grant anon itself.
--
-- Re-runnable: grants, revokes and default privileges are idempotent; the
-- schema move is guarded; functions are `create or replace`.

-- ---------------------------------------------------------------------------
-- 3. Null-safe role guards (before the grants, so the drop below is covered)
-- ---------------------------------------------------------------------------

drop function if exists record_attachment(attachment_owner_type, uuid, text, text, text);

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
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'vet', 'volunteer') then
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
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'volunteer') then
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
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'volunteer') then
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
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff') then
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

-- ---------------------------------------------------------------------------
-- 2. approved_translations leaves the API
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

do $$
begin
  if to_regprocedure('public.approved_translations(text, uuid)') is not null then
    alter function public.approved_translations(text, uuid) set schema private;
  end if;
end;
$$;

revoke execute on function private.approved_translations(text, uuid) from public;
grant execute on function private.approved_translations(text, uuid)
  to anon, authenticated, service_role;

comment on function private.approved_translations(text, uuid) is
  'Approved translations of one row, for the public_* views only. In `private` so the Data API cannot call it: it is security definer and answers for any row id (0082).';

-- ---------------------------------------------------------------------------
-- 1. Grants: everything closed to anon, then the allow-list back
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

grant execute on function
  current_user_role(),
  is_known_drive_file(text),
  shelter_date(timestamptz),
  shelter_time_zone(),
  shelter_today()
to anon;

-- ---------------------------------------------------------------------------
-- 4. New functions start closed
-- ---------------------------------------------------------------------------

-- The PUBLIC grant is Postgres's built-in default, which only a global
-- (not per-schema) entry can take away; anon's comes from the per-schema
-- entry Supabase set up for postgres in `public`.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;
