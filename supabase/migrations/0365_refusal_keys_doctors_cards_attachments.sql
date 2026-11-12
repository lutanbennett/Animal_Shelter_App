-- consumer: src/app/management/clinics/[id]/doctors/actions.ts, src/app/admin/who-does-what/actions.ts,
-- consumer: src/app/api/blood-tests/[id]/attachments/route.ts, src/app/api/clinic-visits/[id]/report/route.ts,
-- consumer: src/app/api/events/[id]/photos/route.ts, src/app/api/medical/residents/[id]/photos/route.ts,
-- consumer: src/app/api/photos/shelter/[id]/route.ts, src/app/api/procedures/[id]/attachments/route.ts,
-- consumer: src/app/api/residents/[id]/photos/route.ts, src/app/api/residents/[id]/videos/finish/route.ts,
-- consumer: src/lib/bills/upload.ts
-- #3nuwy, group 9 (the three unkeyed forwarded-and-masked functions): merge_doctors, set_role_cards and
-- record_attachment raise KEYS instead of English sentences (docs/decisions/2026-11-12-refusal-keys-group-9.md).
-- Bodies are the LIVE ones -- merge_doctors from 0264, set_role_cards from 0272, record_attachment from 0314 --
-- with only the raise lines changed, generated from those files rather than retyped. Re-runnable.
--
-- 15 raises, 14 keys: merge_doctors' two "Not allowed to merge doctors." raises (the up-front has_permission
-- check and the row-level-security-filtered delete) are one sentence, one errcode and one meaning to the
-- reader, so they share merge.doctors_not_allowed.
--
-- EVERY EXISTING SQLSTATE IS KEPT. merge_doctors and set_role_cards name their own
-- (insufficient_privilege / no_data_found / check_violation / unique_violation); record_attachment's raises are
-- bare, so its SQLSTATE stays the default P0001, as 0363's did. dbRefusal() matches on the key, not the code,
-- but an unconverted caller and the policies still see what they saw before.
--
-- record_attachment is SECURITY DEFINER, so 0262's rule applies: its permission is still resolved entirely
-- through has_permission(), bill_owner_can() and can_publish_resident_photos(). Not one of those lines is
-- touched here -- only the message text of the raises -- and no role is read by name.
--
-- set_role_cards runs with search_path = '', so json_build_object is written pg_catalog-qualified rather than
-- left to the implicitly-searched catalog.
--
-- undo: re-apply the three bodies from 0264, 0272 and 0314 in a new file.

CREATE OR REPLACE FUNCTION public.merge_doctors(p_from uuid, p_into uuid)
 RETURNS doctors
 LANGUAGE plpgsql
AS $function$
declare
  v_from doctors;
  v_into doctors;
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  if not coalesce((select has_permission('clinics.doctors')), false) then
    raise exception 'merge.doctors_not_allowed' using errcode = 'insufficient_privilege';
  end if;

  select * into v_from from doctors where id = p_from;
  select * into v_into from doctors where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'merge.doctors_not_found' using errcode = 'no_data_found';
  end if;
  if v_from.id = v_into.id then
    return v_into;
  end if;
  if v_from.user_id is not null and v_into.user_id is not null then
    raise exception 'merge.doctors_both_have_logins' using errcode = 'check_violation';
  end if;
  if (v_from.user_id is not null or v_into.user_id is not null)
     and not coalesce((select is_admin()), false) then
    raise exception 'merge.doctors_login_admin_only' using errcode = 'insufficient_privilege';
  end if;

  -- Two rows for one person usually share a name, and p_into's link at a clinic p_from also works at would
  -- then clash with p_from's own on (clinic_id, name_key). p_from's links go in a placeholder key first; they
  -- are deleted with p_from below.
  update doctor_clinics set name_key = 'merging ' || p_from where doctor_id = p_from;

  insert into doctor_clinics (clinic_id, doctor_id, active)
    select c.clinic_id, p_into, c.active from doctor_clinics c where c.doctor_id = p_from
    on conflict (clinic_id, doctor_id) do nothing;

  perform set_config('app.deceased_lock_bypass', 'on', true);
  update clinic_visits set doctor_id = p_into where doctor_id = p_from;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);

  if v_from.user_id is not null then
    update doctors set user_id = null where id = p_from;
    update doctors set user_id = v_from.user_id where id = p_into;
  end if;

  delete from doctors where id = p_from;
  -- 0147: a delete the policy filters out is not an error, so without this a caller who may book a visit but not
  -- remove a doctor (visit.book lets them add one) would leave a half-merge. Raising rolls the whole merge back.
  if not found then
    raise exception 'merge.doctors_not_allowed' using errcode = 'insufficient_privilege';
  end if;
  select * into v_into from doctors where id = p_into;
  return v_into;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_role_cards(p_role uuid, p_cards text[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_approver_after boolean;
  v_holders text;
begin
  if exists (select 1 from unnest(p_cards) c group by c having count(*) > 1) then
    raise exception 'role_cards.card_twice' using errcode = 'unique_violation';
  end if;

  -- Is there an approver once this call lands? The edited role counts by what the cards it is being handed require (card_grants,
  -- with includes), every other role by the cells it holds now (role_permissions is exactly its cards' union).
  v_approver_after :=
    exists (select 1 from public.card_closure(p_cards) cl join public.card_grants g on g.card = cl.card
             where g.activity = 'photos.approve' and g.level >= 1)
    or exists (select 1 from public.role_permissions rp join public.roles ar on ar.id = rp.role_id
                where rp.role_id <> p_role and rp.activity = 'photos.approve' and rp.level >= 1);

  if not v_approver_after then
    if 'add_photos' = any (coalesce(p_cards, array[]::text[]))
       and not exists (select 1 from public.role_cards rc where rc.role_id = p_role and rc.card = 'add_photos') then
      raise exception 'role_cards.needs_an_approver_first'
        using errcode = 'check_violation';
    end if;

    if exists (select 1 from public.role_permissions rp
                where rp.role_id = p_role and rp.activity = 'photos.approve' and rp.level >= 1) then
      select string_agg(h.name, ', ' order by h.name) into v_holders
        from (
          select r.name from public.role_cards rc join public.roles r on r.id = rc.role_id
           where rc.card = 'add_photos' and rc.role_id <> p_role
          union
          select r.name from public.roles r
           where r.id = p_role and 'add_photos' = any (coalesce(p_cards, array[]::text[]))
        ) h;
      if v_holders is not null then
        raise exception 'role_cards.last_approver'
          using errcode = 'check_violation',
                detail = pg_catalog.json_build_object('roles', v_holders)::text;
      end if;
    end if;
  end if;

  delete from public.role_cards rc
   where rc.role_id = p_role and not (rc.card = any (coalesce(p_cards, array[]::text[])));

  insert into public.role_cards (role_id, card, position)
  select p_role, c.card, c.pos
    from unnest(coalesce(p_cards, array[]::text[])) with ordinality as c (card, pos)
  on conflict (role_id, card) do update set position = excluded.position
    where public.role_cards.position is distinct from excluded.position;

  perform public.recompute_role_permissions(p_role, null);
end;
$function$;

create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill',
  p_media_kind text default 'photo'
)
returns table(attachment attachments, is_profile boolean)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_allowed boolean;
  v_medical boolean := lower(btrim(coalesce(p_sub_folder, ''), E' \t\r\n\f\v')) = 'medical';
  v_is_picture boolean;
  v_illustrates boolean := false;
begin
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'attachment.purpose_invalid';
  end if;

  if p_media_kind is null or p_media_kind not in ('photo', 'video') then
    raise exception 'attachment.media_kind_invalid';
  end if;
  v_is_picture := p_media_kind = 'photo' and coalesce(p_file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$';

  if p_owner_type::text = 'resident' and p_adoption_update_id is not null then
    v_illustrates := coalesce((select has_permission('resident.adoption_news')), false)
      and exists (
        select 1 from adoption_updates u
         where u.id = p_adoption_update_id
           and u.resident_id = p_owner_id
           and lower(btrim(coalesce(p_sub_folder, ''))) = to_char(u.received_on, 'YYYYMMDD')
      );
  end if;

  v_allowed := case p_owner_type::text
    when 'resident' then v_illustrates
                      or coalesce((select has_permission('photos.resident_add')), false)
                      or coalesce((select has_permission('photos.shelter_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'event' then coalesce((select has_permission('events.run')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_delivery' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'utility_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'general_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'attachment.add_not_allowed';
  end if;

  if p_owner_type::text = 'event' and not exists (select 1 from fundraising_events e where e.id = p_owner_id) then
    raise exception 'attachment.event_not_found';
  end if;

  if p_owner_type::text = 'resident' and v_medical
     and not coalesce((select has_permission('photos.medical_add')), false) then
    raise exception 'attachment.medical_folder_not_allowed';
  end if;

  if p_owner_type::text = 'resident'
     and not v_medical
     and not v_illustrates
     and not (select can_publish_resident_photos())
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'attachment.shelter_folder_only';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type::text = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'attachment.update_not_this_residents';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose, media_kind)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose, p_media_kind)
  returning * into v_attachment;

  if p_owner_type::text = 'resident' and v_attachment.approved_at is not null and not v_medical and v_is_picture then
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

revoke all on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) from public, anon;
grant execute on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) to authenticated, service_role;
