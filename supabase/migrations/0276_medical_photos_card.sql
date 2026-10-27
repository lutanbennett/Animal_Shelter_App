-- consumer: none (the app half, next batch, reads photos.resident_medical through the gallery and the Move choice)
--
-- MEDICAL PHOTOS NEED THEIR OWN READ (Lutan, 2026-10-27: "on the view residents card I can access medical photos. I should not be able
-- to view medical photos"). attachments_select_perm's resident branch (live body: 0264) asked resident.record (read) and looked at no
-- sub_folder at all, so every login holding View residents read the Medical folder with the rest. The fix belongs in the database:
-- hiding the thumbnails in the page alone would leave a Medical photo readable by address (the photo proxy asks can_see_drive_file(),
-- 0193, which is security invoker, so it follows this policy with no change of its own).
--
--   1. NEW ACTIVITY photos.resident_medical (level; read is what the policy asks). Registered the way 0224 registered photos.approve.
--   2. GRANTED, read, to View medical (view_medical) and Manage medical (medical_records). Manage medical already includes View medical
--      (card_includes), so the second row is belt and braces and keeps the grant visible on both cards. Cards that include View medical
--      (book_clinic_visits, run_appeals) therefore read Medical photos too: that is what "includes" means and is recorded, not widened.
--   3. attachments_select_perm: a resident row in the Medical folder asks photos.resident_medical (read); any other resident row still
--      asks resident.record (read). THE TEST matches the app's isMedicalFolder() (src/lib/google/drive-client.ts:82):
--        return (subFolder ?? "").trim().toLowerCase() === "medical";
--      The SQL used by the other guards is lower(btrim(coalesce(sub_folder,''))) = 'medical', but btrim strips spaces only and JS trim()
--      strips tabs and newlines too, so 'Medical<tab>' would be Medical to the app and not to those guards. Here every JS whitespace
--      character is stripped, so a near-miss can only ever make the policy stricter, never leave a hole.
--   4. NOT GRANTED: Add medical photos (add_medical_photos). Lutan's card 3 ruling was "decrease to just what is required": that card
--      files photos, it does not browse them. Giving it the read later is one more card_grants row, not code.
-- Insert, update and delete policies are untouched (they already ask photos.resident_add / photos.resident_manage, never the read).
-- Nothing here names a role or grants anything to Admin, which sits outside the card system. Re-runnable.

insert into permission_activities (key, kind, area, sort)
select 'photos.resident_medical', 'level', 'photos', coalesce(max(sort), 0) + 1 from permission_activities
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values
  ('view_medical', 'photos.resident_medical', 1),
  ('medical_records', 'photos.resident_medical', 1)
on conflict (card, activity) do update set level = excluded.level;

alter policy "attachments_select_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT CASE
        WHEN lower(btrim(coalesce(attachments.sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
          THEN has_permission('photos.resident_medical'::text, 'read'::text)
        ELSE has_permission('resident.record'::text, 'read'::text)
      END AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text, 'read'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text, 'read'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can)
END);

notify pgrst, 'reload schema';

-- The record: which roles can no longer read Medical photos. A role loses the read when it reads residents (resident.record) and,
-- after the grants above, does not hold photos.resident_medical. This table is only a statement boundary for
-- scripts/check-hard-coded-security.mjs, as in 0269: the report below joins roles to print role keys, which no function reads.
create temp table report_0276_marker (n int) on commit drop;

do $report$
declare
  r record;
  lost text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select 'resident.record:' || rp.level into lost
      from public.role_permissions rp
     where rp.role_id = r.id and rp.activity = 'resident.record' and rp.level >= 1
       and not exists (select 1 from public.role_permissions m
                        where m.role_id = r.id and m.activity = 'photos.resident_medical' and m.level >= 1);
    if lost is not null then
      raise notice '0276 % | no longer reads Medical photos (still reads the other resident photos)', r.key;
    end if;
  end loop;
  raise notice '0276 done: roles holding View medical, Manage medical or a card that includes either keep the read; Admin is unaffected.';
end
$report$;
