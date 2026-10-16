-- consumer: src/app/management/translations/page.tsx, src/lib/translations/labels.ts
--
-- Registers residents.breed / residents.colour in translatable_labels so the Translations page lists them
-- (their Thai columns, breed_th / colour_th, came in 0205 and the edit fields in #657). Three parts, as 0175 did
-- for map_rooms:
--   1. widen the label_group check to allow 'residents' (GROUP_ORDER in labels.ts already lists it);
--   2. insert the two rows, optional = true (most breeds and colours need no Thai to be understood);
--   3. give residents the label_sources trigger the other registered tables have, and snapshot any Thai already
--      typed as written against today's English, so nothing reads "out of date" on day one.
-- No view changes: breed_th / colour_th are already in public_resident_cards and public_resident_profiles (0205).

alter table translatable_labels drop constraint if exists translatable_labels_label_group_check;
alter table translatable_labels add constraint translatable_labels_label_group_check check (label_group in
  ('website', 'projects', 'places', 'diets', 'medications', 'units', 'setup_lists', 'money', 'roles', 'residents'));

insert into translatable_labels (table_name, column_name, th_column, label_group, optional) values
  ('residents', 'breed', 'breed_th', 'residents', true),
  ('residents', 'colour', 'colour_th', 'residents', true)
on conflict (table_name, column_name) do update
  set th_column = excluded.th_column, label_group = excluded.label_group, optional = excluded.optional;

drop trigger if exists residents_label_sources on residents;
create trigger residents_label_sources
  after insert or update or delete on residents
  for each row execute function record_label_sources();

insert into label_sources (table_name, row_id, column_name, source_text)
select 'residents', r.id::text, 'breed', r.breed from residents r where nullif(btrim(r.breed_th), '') is not null
union all
select 'residents', r.id::text, 'colour', r.colour from residents r where nullif(btrim(r.colour_th), '') is not null
on conflict (table_name, row_id, column_name) do nothing;
