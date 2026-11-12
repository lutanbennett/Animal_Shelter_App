-- consumer: src/app/management/translations/page.tsx
--
-- #l5gxn deliverable 3 (Lutan, 2026-11-10, answer (e)): an adopter writes in either language and the existing Translations queue
-- drafts the other one for a person to approve. Every prose source registers itself (translatable_fields + a queue_translations()
-- trigger, 0056); adoption_updates never did, so an adopter's words would have been kept in one language only.
-- UNAVOIDABLE AS A MIGRATION: the registration is rows and a trigger, and the queue view must learn to name and link the record.
-- Only note, and only for a row the adopter sent through the app (channel = 'app'): a staff-typed note is internal and is not
-- translated for anyone. Nothing here changes who can read or write: the trigger is the existing security definer one.
-- The queue view keeps its columns and order (0336); only two branches are added. Re-runnable.

insert into translatable_fields (table_name, column_name, tier) values
  ('adoption_updates', 'note', 'reviewed')
on conflict do nothing;

drop trigger if exists adoption_updates_queue_translations on adoption_updates;
create trigger adoption_updates_queue_translations
  after insert or update on adoption_updates
  for each row when (new.channel = 'app') execute function queue_translations();
drop trigger if exists adoption_updates_drop_translations on adoption_updates;
create trigger adoption_updates_drop_translations
  after delete on adoption_updates
  for each row execute function drop_translations();

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
         when 'adoption_updates' then (
           select 'Adopter update · ' || r.name from adoption_updates u join residents r on r.id = u.resident_id where u.id = t.row_id)
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
         when 'adoption_updates' then (
           select '/residents/' || u.resident_id || '/adoption-updates' from adoption_updates u where u.id = t.row_id)
         when 'map_rooms' then '/admin/facility-map'
         else null
       end as record_path
  from translations t
  join translatable_fields f on f.table_name = t.table_name and f.column_name = t.column_name;
