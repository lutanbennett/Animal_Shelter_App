-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/approvers.ts, src/lib/photos/approval.ts, src/app/photos/approve/actions.ts, src/app/photos/approve/pending-actions.ts, scripts/check-cards-schema.mjs
--
-- photo-approval-off-residents (docs/decisions/2026-10-19-photos-approve-is-its-own-activity.md). Lutan, 2026-10-19: "If I have
-- the residents existing permissions I should be able to load a photo and bypass approvals. If a photo is loaded through the
-- Add Shelter Photo path then it requires approval through the approve photos card."
--
-- photos.resident_publish meant two things: "my own uploads publish on save" and "I may approve the queue". It keeps the first.
-- A NEW activity, photos.approve (yes/no), is the second, and only the Approve photos card bundles it.
--   * can_approve_photos(): photos.approve, and the role's photo scope is not medical_only (same shape as can_publish_resident_photos).
--   * attachments_approval_stamp: a photo is approved on save for a login that may publish OR approve; changing approval needs
--     can_approve_photos(). pending_photos policies and assign_pending_photo ask can_approve_photos() too.
--   * set_role_cards' approver test (0221/0222) counts photos.approve instead of photos.resident_publish.
-- Seed, ORDER LOAD-BEARING: Management is given the Approve photos card first (and the cell), then every other role holding the
-- card is recomputed. Management only; the 2IC does not get it (Lutan adds it himself on Who does what). Residents is untouched.
--
-- Re-runnable: create or replace / on conflict / replace() that finds nothing the second time.

insert into permission_activities (key, kind, area, sort)
values ('photos.approve', 'yesno', 'photos', 67)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

create or replace function can_approve_photos()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.has_permission('photos.approve')), false)
     and not coalesce((select public.photos_medical_only()), false);
$$;
revoke all on function can_approve_photos() from public, anon;
grant execute on function can_approve_photos() to authenticated, service_role;
comment on function can_approve_photos() is
  'May the caller approve or remove a photo waiting for approval (0224)? Holds photos.approve and the role''s scope_photos is not medical_only.';

create or replace function attachments_approval_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner_type <> 'resident'
       or lower(btrim(coalesce(new.sub_folder, ''))) = 'medical'
       or new.adoption_update_id is not null
       or auth.uid() is null
       or coalesce((select can_publish_resident_photos()), false)
       or coalesce((select can_approve_photos()), false) then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := null;
      new.approved_by := null;
    end if;
    return new;
  end if;

  if new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by then
    if auth.uid() is not null and not coalesce((select can_approve_photos()), false) then
      raise exception 'You do not have permission to approve a photo';
    end if;
    if new.approved_at is null then
      new.approved_by := null;
    elsif old.approved_at is null then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function attachments_approval_stamp() from public, anon, authenticated;

drop policy if exists pending_photos_select on pending_photos;
create policy pending_photos_select on pending_photos for select to authenticated
  using (uploaded_by = (select auth.uid()) or (select can_approve_photos()));

drop policy if exists pending_photos_update on pending_photos;
create policy pending_photos_update on pending_photos for update to authenticated
  using ((select can_approve_photos()))
  with check ((select can_approve_photos()));

drop policy if exists pending_photos_delete on pending_photos;
create policy pending_photos_delete on pending_photos for delete to authenticated
  using ((select can_approve_photos()));

-- assign_pending_photo and set_role_cards: same bodies as 0218 / 0222 with the one test swapped, taken from the live definition.
do $swap$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.assign_pending_photo(uuid, jsonb, boolean)'::regprocedure);
  v_def := replace(v_def, 'can_publish_resident_photos()', 'can_approve_photos()');
  execute v_def;

  v_def := pg_get_functiondef('public.set_role_cards(uuid, text[], jsonb)'::regprocedure);
  v_def := replace(v_def, 'photos.resident_publish', 'photos.approve');
  execute v_def;
end
$swap$;

-- Seed. Written once in the plain form so scripts that read the migrations (the acceptance matrix) can see who holds it.
insert into role_permissions (role_id, activity, level)
select r.id, 'photos.approve', 2 from roles r where r.key = 'management'
on conflict (role_id, activity) do nothing;

-- Management first, so there is an approver the moment the guard looks.
do $seed$
declare
  v_mgmt uuid;
  v_role uuid;
  v_bundle jsonb;
begin
  select id into v_mgmt from public.roles where key = 'management';
  if v_mgmt is not null then
    insert into public.role_cards (role_id, card, position)
    select v_mgmt, 'approve_photos', coalesce(max(position), 0) + 1 from public.role_cards where role_id = v_mgmt
    on conflict (role_id, card) do nothing;
  end if;

  -- Every role holding the card: its cells, plus photos.approve; photos.resident_publish stays only if Residents or an extra gives it.
  for v_role in
    select rc.role_id from public.role_cards rc join public.roles r on r.id = rc.role_id
     where rc.card = 'approve_photos' and r.kind <> 'fixed'
  loop
    select coalesce(jsonb_agg(jsonb_build_object('activity', rp.activity, 'level', rp.level)), '[]'::jsonb) into v_bundle
      from public.role_permissions rp
     where rp.role_id = v_role
       and (rp.activity <> 'photos.resident_publish'
            or exists (select 1 from public.role_cards x where x.role_id = v_role and x.card = 'residents'));
    v_bundle := v_bundle || jsonb_build_array(
      jsonb_build_object('activity', 'photos.approve', 'level', 2),
      jsonb_build_object('activity', 'photos.resident_manage', 'level', 2));
    perform public.recompute_role_permissions(v_role, v_bundle);
  end loop;
end
$seed$;
