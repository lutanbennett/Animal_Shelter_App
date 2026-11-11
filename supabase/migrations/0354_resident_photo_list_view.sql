-- consumer: src/app/memes/make/page.tsx
-- A resident's approved, non-medical, image photos, readable by a card that may NAME the resident (#m8kq4).
--
-- The meme maker offers a resident under resident.who_and_where (via resident_who_and_where), but listed that resident's photos
-- from attachments, whose select policy asks resident.record (0316). A login holding only the Add memes card could pick the
-- resident and then met "no photos that can be made into a meme". Same fault as #t3n9r one layer up, same fix: a view.
--
-- The activity is resident.who_and_where at read, resolved through has_permission() (Admin passes inside it). Non-medical uses
-- the exact trim expression of attachments_select_perm (0316) so the two cannot drift. Approved = approved_at is not null.
-- Photos only (media_kind = 'photo'); the file-name image test stays in the page. attachments' own policy is NOT touched.
create or replace view resident_photo_list as
select a.id,
       a.owner_id as resident_id,
       a.drive_file_id,
       a.file_name,
       a.uploaded_at
  from attachments a
 where a.owner_type = 'resident'::attachment_owner_type
   and a.approved_at is not null
   and a.media_kind = 'photo'
   and lower(btrim(coalesce(a.sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'
   and (select has_permission('resident.who_and_where'::text, 'read'::text));

comment on view resident_photo_list is
  'Approved non-medical photos of a resident, for any card that may name the resident (0354, #m8kq4). No sub_folder column on purpose.';

revoke all on resident_photo_list from anon, authenticated, service_role;
grant select on resident_photo_list to authenticated, service_role;
