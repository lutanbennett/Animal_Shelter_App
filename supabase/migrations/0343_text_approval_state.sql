-- consumer: src/app/adopt/ResidentCard.tsx, src/app/adopt/[id]/page.tsx, src/app/adopt/HappyEndings.tsx, src/app/page.tsx, src/app/r/[code]/page.tsx, src/app/e/[id]/page.tsx, src/lib/residents/public.ts, scripts/check-public-views.mjs
--
-- Backlog #7aev4 (schema half) folded with #r9wtk. docs/decisions/2026-11-09-text-approval-schema.md is the paper;
-- docs/decisions/2026-11-09-public-read-enumeration.md sections 2, 3.3 and 4 are the finding.
--
-- 1. A THREE-WAY REVIEW STATE for the TEXT the website shows from the eight subject tables that had only a publish switch:
--      text_approval = 'public_ok'     the Director has read it; the website may show it
--                      'private_only'  the Director has read it and refused it; the website never shows it
--                      NULL            not reviewed yet; the website does not show it
--    plus text_approval_by / text_approval_at, stamped by the database (never taken from the caller).
--    Same three values as attachments.approval (0318). The state is a REVIEW state, not an ability: no card is added here.
--    The ability to SET it, and the guard that stops a plain row update setting it, are the app half's (see the decision file).
--
-- 2. NOTHING A VISITOR SEES CHANGES. Every existing row is back-filled to 'public_ok' and the column's default is 'public_ok',
--    so the views that now ask for it return exactly what they returned before. The app half flips the default to NULL
--    once its review screens exist. 0217's approve-on-save is NOT touched here.
--
-- 3. THE VIEWS (nine are re-created from their live definitions; public_enclosures inherits through public_resident_cards):
--    - public_resident_profiles, public_recent_adoptions, public_adoption_updates, public_appeals, public_fundraising_events,
--      public_projects, public_desexing_drives: a row shows only when its text_approval = 'public_ok'.
--    - public_resident_cards has NO where clause by ruling DB-7 (every resident is listed), so it keeps every row and blanks
--      the prose (bio, temperament_notes and their Thai translations) of a resident whose text is not 'public_ok'.
--    - public_shelter_friends and public_shop_links are NOT changed: their text is ruled like the logo and the shop photo
--      (setter = publisher, friends.manage / shop.manage). The columns exist on those two tables, unread, so reversing the
--      ruling is one line in each view.
--
-- 4. #r9wtk, THE APPEAL OVERRIDE (Lutan, 2026-11-09: "If the animal has an appeal etc then it should be visible for the duration
--    of the appeal and this will override the Ready for adoption flag"). public_appeals and public_appeal_photos no longer ask
--    residents.is_public_visible: a published, non-draft appeal is sufficient on its own. 0216's Medical rule is unchanged
--    (a Medical photo still needs an appeal_photos row with medical_ok). THIS IS THE ONE DELIBERATE CHANGE TO WHAT A VISITOR SEES.
--
-- Every view keeps its column list, names and order. Grants are restated exactly as before (anon and authenticated may SELECT,
-- nothing else), declared in docs/hard-coded-security-registry.json. No policy, no role key, no security definer function.
-- Additive and re-runnable. To undo the views: re-run 0342 (resident views) and the earlier definition of each other view;
-- the columns can stay.

alter table residents
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table residents drop constraint if exists residents_text_approval_check;
alter table residents add constraint residents_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table adoption_updates
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table adoption_updates drop constraint if exists adoption_updates_text_approval_check;
alter table adoption_updates add constraint adoption_updates_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table appeals
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table appeals drop constraint if exists appeals_text_approval_check;
alter table appeals add constraint appeals_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table fundraising_events
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table fundraising_events drop constraint if exists fundraising_events_text_approval_check;
alter table fundraising_events add constraint fundraising_events_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table project_folders
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table project_folders drop constraint if exists project_folders_text_approval_check;
alter table project_folders add constraint project_folders_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table desexing_drives
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table desexing_drives drop constraint if exists desexing_drives_text_approval_check;
alter table desexing_drives add constraint desexing_drives_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table shelter_friends
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table shelter_friends drop constraint if exists shelter_friends_text_approval_check;
alter table shelter_friends add constraint shelter_friends_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

alter table shop_links
  add column if not exists text_approval text default 'public_ok',
  add column if not exists text_approval_by uuid references auth.users (id) on delete set null,
  add column if not exists text_approval_at timestamptz;
alter table shop_links drop constraint if exists shop_links_text_approval_check;
alter table shop_links add constraint shop_links_text_approval_check check (text_approval is null or text_approval in ('public_ok', 'private_only'));
-- (the default on the add column above is the back-fill: Postgres gives every existing row 'public_ok' without running triggers, so a deceased resident's lock is not tripped)

-- The stamp: who/when, set by the database when the answer changes. Not a permission check (see the header).
create or replace function text_approval_stamp()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.text_approval_by := case when new.text_approval is null then null else auth.uid() end;
    new.text_approval_at := case when new.text_approval is null then null else now() end;
  elsif new.text_approval is distinct from old.text_approval then
    new.text_approval_by := case when new.text_approval is null then null else auth.uid() end;
    new.text_approval_at := case when new.text_approval is null then null else now() end;
  else
    new.text_approval_by := old.text_approval_by;
    new.text_approval_at := old.text_approval_at;
  end if;
  return new;
end $$;

drop trigger if exists residents_text_approval_stamp on residents;
create trigger residents_text_approval_stamp before insert or update on residents for each row execute function text_approval_stamp();
drop trigger if exists adoption_updates_text_approval_stamp on adoption_updates;
create trigger adoption_updates_text_approval_stamp before insert or update on adoption_updates for each row execute function text_approval_stamp();
drop trigger if exists appeals_text_approval_stamp on appeals;
create trigger appeals_text_approval_stamp before insert or update on appeals for each row execute function text_approval_stamp();
drop trigger if exists fundraising_events_text_approval_stamp on fundraising_events;
create trigger fundraising_events_text_approval_stamp before insert or update on fundraising_events for each row execute function text_approval_stamp();
drop trigger if exists project_folders_text_approval_stamp on project_folders;
create trigger project_folders_text_approval_stamp before insert or update on project_folders for each row execute function text_approval_stamp();
drop trigger if exists desexing_drives_text_approval_stamp on desexing_drives;
create trigger desexing_drives_text_approval_stamp before insert or update on desexing_drives for each row execute function text_approval_stamp();
drop trigger if exists shelter_friends_text_approval_stamp on shelter_friends;
create trigger shelter_friends_text_approval_stamp before insert or update on shelter_friends for each row execute function text_approval_stamp();
drop trigger if exists shop_links_text_approval_stamp on shop_links;
create trigger shop_links_text_approval_stamp before insert or update on shop_links for each row execute function text_approval_stamp();

create or replace view public_resident_cards as
SELECT r.id,
    r.resident_code,
    r.name,
    r.thai_name,
    r.species,
    r.breed,
    r.sex,
    r.size,
    r.colour,
    r.is_desexed,
    r.estimated_age_years,
    r.age_estimated_on,
    r.intake_date,
    CASE WHEN (r.text_approval = 'public_ok'::text) THEN r.bio ELSE NULL::text END AS bio,
    CASE WHEN (r.text_approval = 'public_ok'::text) THEN r.temperament_notes ELSE NULL::text END AS temperament_notes,
        CASE
            WHEN ((EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) <> 'medical'::text) AND (COALESCE(a.media_kind, 'photo'::text) = 'photo'::text) AND (COALESCE(a.file_name, ''::text) !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'::text) AND (a.approval = 'public_ok'::text)))) AND (NOT (EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) = 'medical'::text)))))) THEN r.profile_photo_drive_file_id
            ELSE NULL::text
        END AS profile_photo_drive_file_id,
    r.ready_for_adoption,
    r.is_public_visible,
    r.good_with_dogs,
    r.good_with_cats,
    r.good_with_children,
    r.energy_level,
    CASE WHEN (r.text_approval = 'public_ok'::text) THEN private.approved_translations('residents'::text, r.id) ELSE NULL::jsonb END AS translations,
        CASE
            WHEN (s.current_status = ANY (ARRAY['Adopted'::text, 'Deceased'::text])) THEN s.current_status
            ELSE 'Resident'::text
        END AS status,
    r.breed_th,
    r.colour_th
   FROM (residents r
     LEFT JOIN private.resident_current_state s ON ((s.resident_id = r.id)));

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_cards from anon, authenticated;

create or replace view public_resident_profiles as
SELECT id,
    name,
    species,
    breed,
    sex,
    ready_for_adoption,
    bio,
    temperament_notes,
    past_story_notes,
        CASE
            WHEN ((EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) <> 'medical'::text) AND (COALESCE(a.media_kind, 'photo'::text) = 'photo'::text) AND (COALESCE(a.file_name, ''::text) !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'::text) AND (a.approval = 'public_ok'::text)))) AND (NOT (EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) = 'medical'::text)))))) THEN profile_photo_drive_file_id
            ELSE NULL::text
        END AS profile_photo_drive_file_id,
    estimated_age_years,
    intake_date,
    age_estimated_on,
    size,
    private.approved_translations('residents'::text, id) AS translations,
    good_with_dogs,
    good_with_cats,
    good_with_children,
    energy_level,
    colour,
    is_desexed,
    (EXISTS ( SELECT 1
           FROM immunization_records i
          WHERE ((i.resident_id = r.id) AND (i.archived_at IS NULL)))) AS is_vaccinated,
    hook_line,
    ideal_home,
    (microchip_number IS NOT NULL) AS is_microchipped,
    breed_th,
    colour_th
   FROM residents r
  WHERE ((is_public_visible = true) AND (r.text_approval = 'public_ok'::text) AND (COALESCE(( SELECT s.current_status
           FROM private.resident_current_state s
          WHERE (s.resident_id = r.id)), 'Resident'::text) <> ALL (ARRAY['Deceased'::text, 'Adopted'::text])));

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_profiles from anon, authenticated;

create or replace view public_recent_adoptions as
SELECT p.id,
    r.name,
    r.species,
        CASE
            WHEN ((EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) <> 'medical'::text) AND (COALESCE(a.media_kind, 'photo'::text) = 'photo'::text) AND (COALESCE(a.file_name, ''::text) !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'::text) AND (a.approval = 'public_ok'::text)))) AND (NOT (EXISTS ( SELECT 1
               FROM attachments a
              WHERE ((a.owner_type = 'resident'::attachment_owner_type) AND (a.owner_id = r.id) AND (a.drive_file_id = r.profile_photo_drive_file_id) AND (lower(btrim(COALESCE(a.sub_folder, ''::text), E' \t\r\n\f\v')) = 'medical'::text)))))) THEN r.profile_photo_drive_file_id
            ELSE NULL::text
        END AS profile_photo_drive_file_id,
    shelter_date(p.start_date) AS adopted_on,
    r.id AS resident_id
   FROM (placement_history p
     JOIN residents r ON ((r.id = p.resident_id)))
  WHERE ((p.placement_type = 'Adopt'::placement_type) AND (p.end_date IS NULL) AND (p.start_date >= (now() - '90 days'::interval)) AND (r.is_public_visible = true) AND (r.text_approval = 'public_ok'::text) AND (NOT (EXISTS ( SELECT 1
           FROM private.resident_current_state s
          WHERE ((s.resident_id = r.id) AND (s.current_status = 'Deceased'::text))))));

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_recent_adoptions from anon, authenticated;

create or replace view public_adoption_updates as
SELECT u.id,
    u.resident_id,
    att.drive_file_id,
    u.public_story,
    u.public_first_name
   FROM ((adoption_updates u
     JOIN residents r ON ((r.id = u.resident_id)))
     JOIN attachments att ON ((att.adoption_update_id = u.id)))
  WHERE ((u.share_publicly = true) AND (u.text_approval = 'public_ok'::text) AND (r.is_public_visible = true) AND (COALESCE(( SELECT s.current_status
           FROM private.resident_current_state s
          WHERE (s.resident_id = r.id)), 'Resident'::text) <> 'Deceased'::text) AND (att.owner_type = 'resident'::attachment_owner_type) AND (lower(btrim(COALESCE(att.sub_folder, ''::text))) <> 'medical'::text) AND (att.approved_at IS NOT NULL) AND (att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif|mp4|mov|m4v|webm)$'::text))
  ORDER BY u.received_on DESC, att.uploaded_at;

grant select on public_adoption_updates to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_adoption_updates from anon, authenticated;

create or replace view public_appeals as
SELECT a.id,
    a.resident_id,
    r.name AS resident_name,
    r.thai_name AS resident_thai_name,
    r.species,
    a.title,
    a.what_is_wrong,
    a.treatment_needed,
    a.cost_covers,
    a.target_amount,
    (COALESCE(( SELECT sum(l.amount) AS sum
           FROM (donations d
             JOIN donation_lines l ON ((l.donation_id = d.id)))
          WHERE ((d.designation = 'appeal'::text) AND (d.designation_appeal_id = a.id))), (0)::numeric))::numeric(12,2) AS raised_amount,
    ( SELECT max(d.created_at) AS max
           FROM donations d
          WHERE ((d.designation = 'appeal'::text) AND (d.designation_appeal_id = a.id))) AS raised_as_of,
    a.deadline,
    a.status,
    a.outcome_note,
    a.display_style,
    a.social_links,
    ( SELECT att.drive_file_id
           FROM (appeal_photos p
             JOIN attachments att ON ((att.id = p.attachment_id)))
          WHERE ((p.appeal_id = a.id) AND p.is_cover AND (att.owner_type = 'resident'::attachment_owner_type) AND (att.owner_id = a.resident_id) AND (att.approved_at IS NOT NULL) AND ((lower(btrim(COALESCE(att.sub_folder, ''::text))) <> 'medical'::text) OR p.medical_ok) AND (att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'::text))) AS cover_drive_file_id,
    COALESCE(( SELECT p.is_graphic
           FROM appeal_photos p
          WHERE ((p.appeal_id = a.id) AND p.is_cover)), false) AS cover_is_graphic,
    a.published_at,
    a.closed_at,
    private.approved_translations('appeals'::text, a.id) AS translations,
    COALESCE(( SELECT p.medical_ok
           FROM (appeal_photos p
             JOIN attachments att ON ((att.id = p.attachment_id)))
          WHERE ((p.appeal_id = a.id) AND p.is_cover AND (lower(btrim(COALESCE(att.sub_folder, ''::text))) = 'medical'::text))), false) AS cover_is_medical
   FROM (appeals a
     JOIN residents r ON ((r.id = a.resident_id)))
  WHERE (a.published AND (a.status <> 'draft'::text) AND (a.text_approval = 'public_ok'::text));

grant select on public_appeals to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeals from anon, authenticated;

create or replace view public_appeal_photos as
SELECT p.id,
    p.appeal_id,
    att.drive_file_id,
    p."position",
    p.is_cover,
    p.is_graphic,
    (lower(btrim(COALESCE(att.sub_folder, ''::text))) = 'medical'::text) AS is_medical
   FROM (((appeal_photos p
     JOIN appeals a ON ((a.id = p.appeal_id)))
     JOIN residents r ON ((r.id = a.resident_id)))
     JOIN attachments att ON ((att.id = p.attachment_id)))
  WHERE (a.published AND (a.status <> 'draft'::text) AND (att.owner_type = 'resident'::attachment_owner_type) AND (att.owner_id = a.resident_id) AND (att.approved_at IS NOT NULL) AND ((lower(btrim(COALESCE(att.sub_folder, ''::text))) <> 'medical'::text) OR p.medical_ok) AND (att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'::text))
  ORDER BY p."position", p.created_at;

grant select on public_appeal_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeal_photos from anon, authenticated;

create or replace view public_fundraising_events as
SELECT id,
    title,
    summary,
    description,
    event_date,
    end_date,
    location,
    status,
    social_links,
    ( SELECT a.id
           FROM public_appeals a
          WHERE (a.id = e.appeal_id)) AS appeal_id,
    ( SELECT p.id
           FROM public_projects p
          WHERE (p.id = e.project_folder_id)) AS project_folder_id,
    ( SELECT att.drive_file_id
           FROM (fundraising_event_photos p
             JOIN attachments att ON ((att.id = p.attachment_id)))
          WHERE ((p.event_id = e.id) AND p.is_cover AND (NOT p.is_meme) AND (att.owner_type = 'event'::attachment_owner_type) AND (att.owner_id = e.id) AND (att.approved_at IS NOT NULL) AND (att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'::text))) AS cover_drive_file_id,
    published_at,
    private.approved_translations('fundraising_events'::text, id) AS translations
   FROM fundraising_events e
  WHERE (published AND (status <> 'cancelled'::text) AND (e.text_approval = 'public_ok'::text));

grant select on public_fundraising_events to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_fundraising_events from anon, authenticated;

create or replace view public_projects as
SELECT id,
    top_level_category AS category,
    name AS title,
    name_th AS title_th,
    summary,
    project_date,
    location,
    COALESCE(project_date, (created_at)::date) AS sort_date,
    COALESCE(( SELECT a.drive_file_id
           FROM attachments a
          WHERE ((a.id = f.cover_attachment_id) AND (a.approved_at IS NOT NULL))), ( SELECT a.drive_file_id
           FROM attachments a
          WHERE ((a.owner_type = 'project'::attachment_owner_type) AND (a.owner_id = f.id) AND (a.approved_at IS NOT NULL))
          ORDER BY a.sort_order, a.uploaded_at
         LIMIT 1)) AS cover_drive_file_id,
    (( SELECT count(*) AS count
           FROM attachments a
          WHERE ((a.owner_type = 'project'::attachment_owner_type) AND (a.owner_id = f.id) AND (a.approved_at IS NOT NULL))))::integer AS photo_count,
    private.approved_translations('project_folders'::text, id) AS translations
   FROM project_folders f
  WHERE ((is_public = true) AND (parent_folder_id IS NOT NULL) AND (f.text_approval = 'public_ok'::text));

grant select on public_projects to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_projects from anon, authenticated;

create or replace view public_desexing_drives as
SELECT id,
    title,
    drive_date,
    starts_at,
    ends_at,
    venue,
    venue_address,
    species,
    capacity,
    signups_close_on,
    price_note,
    eligibility_note,
    description,
    (status = 'cancelled'::text) AS is_cancelled,
        CASE
            WHEN (capacity IS NULL) THEN NULL::bigint
            ELSE GREATEST((capacity - ( SELECT count(*) AS count
               FROM desexing_drive_signups s
              WHERE ((s.drive_id = d.id) AND (s.status = ANY (ARRAY['new'::text, 'confirmed'::text]))))), (0)::bigint)
        END AS spots_left,
    ((status = 'open'::text) AND ((signups_close_on IS NULL) OR (signups_close_on >= shelter_today())) AND ((capacity IS NULL) OR (capacity > ( SELECT count(*) AS count
           FROM desexing_drive_signups s
          WHERE ((s.drive_id = d.id) AND (s.status = ANY (ARRAY['new'::text, 'confirmed'::text]))))))) AS accepting_signups
   FROM desexing_drives d
  WHERE ((status = ANY (ARRAY['open'::text, 'cancelled'::text])) AND (drive_date >= shelter_today()) AND (d.text_approval = 'public_ok'::text))
  ORDER BY drive_date, starts_at;

grant select on public_desexing_drives to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_desexing_drives from anon, authenticated;

