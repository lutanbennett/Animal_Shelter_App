-- consumer: src/lib/permissions/jobs.ts, src/app/my/page.tsx, src/app/api/blood-tests/[id]/attachments/route.ts
--
-- CARD REVIEW 1, THE LAST TWO ITEMS (the "NOT built" list of docs/decisions/2026-10-26-card-review-1-app-half.md).
--   1. Record weight and Feed special diets gain recurring.do_own at level 2: the My tasks piece (Lutan, 2026-10-26: "Yes fix the my
--      job link"). card_grants is the only source; the card_grants_recompute trigger (0257) hands the cell to every role holding either
--      card in this same transaction, as 0265 did. Mirrored in src/lib/permissions/jobs.ts.
--   2. record_attachment() (latest definition 0259): a Medical-folder upload never becomes the resident's profile picture. Only the
--      first approved upload with no profile yet used to; a Medical photo is clinical, and the profile picture is public-facing.
--      Admin changes the profile picture through its own action, which does not go through this function, so it is untouched.
-- Nothing is granted to Admin and no role key is read. Re-runnable.

insert into card_grants (card, activity, level)
values ('record_weight', 'recurring.do_own', 2), ('feed_special_diets', 'recurring.do_own', 2)
on conflict (card, activity) do update set level = excluded.level;

create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill'
)
returns table(attachment attachments, is_profile boolean)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_allowed boolean;
begin
  -- 0220: purpose is bill or report, and a report hangs on a visit only.
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  v_allowed := case p_owner_type
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0217 CHANGE 1, card half only: photos.shelter_add admits a resident photo in the SHELTER folder, not an adopter's.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical')
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'This login can add photos to the Medical folder only.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose)
  returning * into v_attachment;

  -- 0217 CHANGE 2: a photo still waiting for approval never becomes the profile photo (that is public).
  -- 0267: a Medical-folder photo never becomes the profile picture.
  if p_owner_type = 'resident' and v_attachment.approved_at is not null
     and lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical' then
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

notify pgrst, 'reload schema';
