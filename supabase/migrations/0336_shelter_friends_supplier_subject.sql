-- consumer: none
-- SCHEMA half of backlog item #xkfsv, deliverable "a Shelter Friend can be a supplier as well as a contact"
-- (Lutan, 2026-11-08: "Shelter Friends could also come from a supplier as well so need same functionality for Shelter
-- friends on both Contacts and Suppliers"). Decision file: docs/decisions/2026-11-08-suppliers-schema.md.
--
-- THE SHAPE: shelter_friends.contact_id becomes nullable and a nullable supplier_id sits beside it, with a check that
-- EXACTLY ONE is set. Chosen over a subject-type pair because both columns stay real foreign keys (cascade on delete,
-- one uniqueness each) and the 1:1 rule still holds per subject. Every existing row has contact_id and is untouched.
--
-- public_shelter_friends keeps the same columns in the same order and the same rows for every existing Friend, so the
-- website does not change. A supplier-subject Friend reads its name and contact details from suppliers the same way,
-- gated by the same show_* boxes, and drops out when the supplier is archived. The review queue for translations
-- (private.translation_queue, last written by 0175) names and links either subject. Its link for a supplier is
-- /suppliers/<id>, a screen the app half builds.
-- Policies on shelter_friends are card-driven already (0147, 0182) and are unchanged: friends.manage writes.
-- Re-runnable. To undo: restore the 0164 view and the 0175 queue, delete supplier-subject rows, drop the check and the
-- column, set contact_id not null.

alter table shelter_friends alter column contact_id drop not null;
alter table shelter_friends add column if not exists supplier_id uuid unique references suppliers (id) on delete cascade;

alter table shelter_friends drop constraint if exists shelter_friends_one_subject;
alter table shelter_friends add constraint shelter_friends_one_subject
  check ((contact_id is not null)::int + (supplier_id is not null)::int = 1);

comment on column shelter_friends.supplier_id is
  'The supplier this profile belongs to, when the Friend is a supplier rather than a contact (0336). Exactly one of contact_id and supplier_id is set.';

create or replace view public_shelter_friends as
select sf.id,
       coalesce(c.name, s.name) as name,
       sf.blurb,
       sf.help_kind,
       sf.discount_note,
       sf.website_url,
       sf.facebook_url,
       sf.logo_drive_file_id,
       sf.friend_since,
       sf.sort_order,
       case when sf.show_phone then coalesce(c.phone, s.phone) end as phone,
       case when sf.show_email then coalesce(c.email, s.email) end as email,
       case when sf.show_line then coalesce(c.line_id, s.line_id) end as line_id,
       case when sf.show_address then coalesce(c.address, s.address) end as address,
       case when sf.show_map then coalesce(c.map_url, c.address, s.map_url, s.address) end as map_location,
       private.approved_translations('shelter_friends'::text, sf.id) as translations
  from shelter_friends sf
  left join contacts c on c.id = sf.contact_id
  left join suppliers s on s.id = sf.supplier_id
 where sf.published
   and ((c.id is not null and c.archived_at is null)
        or (s.id is not null and s.archived_at is null));

grant select on public_shelter_friends to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shelter_friends from anon, authenticated;

-- The translation queue, same columns in the same order as 0175. Only the two shelter_friends branches change.
create or replace view private.translation_queue as
select t.id,
       t.table_name,
       t.row_id,
       t.column_name,
       f.tier,
       t.source_lang,
       t.target_lang,
       t.source_text,
       t.reviewed_source_text,
       t.text,
       t.status,
       t.engine,
       t.reviewed_by,
       t.reviewed_at,
       t.created_at,
       t.updated_at,
       case t.table_name
         when 'residents' then (
           select r.name || coalesce(' (' || r.resident_code || ')', '')
             from residents r where r.id = t.row_id)
         when 'project_folders' then (
           select p.name from project_folders p where p.id = t.row_id)
         when 'attachments' then (
           select p.name || ' — ' || coalesce(a.file_name, a.drive_file_id)
             from attachments a join project_folders p on p.id = a.owner_id
            where a.id = t.row_id)
         when 'maintenance' then (
           select coalesce(m.job_code || ' · ', '') || m.title
             from maintenance m where m.id = t.row_id)
         when 'site_pages' then (
           select 'Website · ' || p.title from site_pages p where p.id = t.row_id)
         when 'shelter_friends' then (
           select 'Shelter Friend · ' || coalesce(c.name, s.name)
             from shelter_friends sf
             left join contacts c on c.id = sf.contact_id
             left join suppliers s on s.id = sf.supplier_id
            where sf.id = t.row_id)
         when 'recurring_jobs' then (
           select 'Recurring job · ' || j.title from recurring_jobs j where j.id = t.row_id)
         when 'map_rooms' then (
           select 'Map room · ' || mr.name from map_rooms mr where mr.id = t.row_id)
         else null
       end as record_label,
       case t.table_name
         when 'residents' then '/residents/' || t.row_id
         when 'project_folders' then '/projects/' || t.row_id
         when 'attachments' then (
           select '/projects/' || a.owner_id from attachments a where a.id = t.row_id)
         when 'maintenance' then '/maintenance/' || t.row_id
         when 'site_pages' then (
           select '/admin/website#page-' || p.slug from site_pages p where p.id = t.row_id)
         when 'shelter_friends' then (
           select coalesce('/contacts/' || sf.contact_id, '/suppliers/' || sf.supplier_id)
             from shelter_friends sf where sf.id = t.row_id)
         when 'recurring_jobs' then '/management/recurring-jobs'
         when 'map_rooms' then '/admin/facility-map'
         else null
       end as record_path
  from translations t
  join translatable_fields f on f.table_name = t.table_name and f.column_name = t.column_name;
