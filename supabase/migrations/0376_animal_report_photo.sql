-- consumer: src/app/services/report-animal/actions.ts, src/lib/animal-reports/photo-store.ts, src/app/management/animal-reports/page.tsx
--
-- One optional photo on a public animal report (#w7nde). The file lives in a PRIVATE Supabase Storage bucket and only the server
-- (service role, from the report action and the staff photo route) ever touches it. No storage.objects policy is written, so anon and
-- authenticated have no direct read OR write on the bucket: the public can write only by going through the form's server action,
-- which checks type and size and strips the metadata first. The row records the object name, and the name is forced to be
-- "<report id>.jpg", so a report can point at exactly one file, named by its own id, and at no other object.
-- Re-runnable. To undo: drop the column and constraint, delete the bucket's objects, then the bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animal-report-photos', 'animal-report-photos', false, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table animal_reports add column if not exists photo_path text;

alter table animal_reports drop constraint if exists animal_reports_photo_check;
alter table animal_reports add constraint animal_reports_photo_check
  check (photo_path is null or photo_path = id::text || '.jpg');

grant insert (photo_path) on animal_reports to anon;
