-- consumer: src/app/management/translations/page.tsx, src/app/admin/diets/page.tsx, src/app/admin/medications/page.tsx, src/app/admin/frequencies/page.tsx, src/app/admin/immunization-types/page.tsx, src/app/admin/procedure-types/page.tsx, src/app/admin/blood-test-types/page.tsx, src/app/admin/website/page.tsx, src/app/management/recurring-jobs/page.tsx
--
-- Thai for the labels that had none, and the plumbing for one Translations page (backlog, "One place to translate
-- everything", Lutan 2026-10-05: diets have no Thai, and translating means hunting in different places). This is the
-- schema half only; the page that reads it is the next stream. The field-by-field audit, and why each field went
-- where it did, is docs/decisions/2026-10-08-label-translations-schema.md.
--
-- The 2026-09-21 split stays as it is (decisions.md: prose in `translations`, labels as paired `_th` columns), and no
-- existing field moves between the two. What this file adds:
--
--   1. Paired `_th` columns for the labels a Thai reader sees and could not have in Thai:
--        diet_types.name_th            "Standard Kibble + Chicken" on the diet list, Diet tab, special diets, stock
--        medication.name_th            optional: most medicine names are drug or brand names, the same in Thai
--        frequency.label_th            "Twice daily" on a resident's Medical tab and the prescription form
--        immunization_types.name_th    "Rabies", "Deworming (Praferen)"
--        procedure_types.name_th       "Teeth cleaning", "Spay / neuter"
--        blood_test_types.name_th      "CBC (Complete Blood Count)"
--        item_unit_conversions.unit_th "bag (20 kg)", "packet": the stocktake and delivery units staff type
--        fixed_outgoings.label_th      the monthly costs on the cash-flow page
--        vets.name_th                  optional: clinic names are mostly proper names
--        site_content_photos.alt_th    the website photos' alt text (site_content's hero already has hero_alt_th)
--      Units of diets and medicines (`diet_types.unit`, `medication.dose_unit`) are fixed vocabularies already
--      translated by the dictionaries (src/lib/i18n/enum-labels.ts), so they need nothing.
--
--   2. Recurring job titles and descriptions join the prose queue (`translatable_fields`), the way maintenance job
--      titles and descriptions did in 0057, with the queue labelling and linking them.
--
--   3. `translatable_labels`: the label counterpart of `translatable_fields`. One row per (table, English column,
--      Thai column), with the group the page files it under and whether an empty Thai counts as missing.
--
--   4. `label_sources`: the English a Thai label was written against. A paired column cannot say "the English
--      changed after the Thai was written"; this can, so the page's "out of date" filter works for labels as it
--      does for prose. Kept by a trigger on each registered table, so no form has to remember it.
--
--   5. `label_translations()` reads every registered label with its state, and `set_label_th()` writes one Thai
--      label. Both ask translations.view / translations.manage, not the list's own permission: translating a label
--      is not editing the list (the item's point 4), and the Director, who holds translations.manage, cannot open
--      Settings → Diets.
--
--   6. The fixed-column views the new columns must reach, each re-created with the column appended (a view's column
--      list may only grow at the end). A new column is private until it is added to its view (0122, 0151).
--
-- Additive and re-runnable throughout. Nothing here changes a policy on an existing table.

-- ===================================================================================================================
-- 1. The missing Thai columns
-- ===================================================================================================================
alter table diet_types add column if not exists name_th text;
alter table medication add column if not exists name_th text;
alter table frequency add column if not exists label_th text;
alter table immunization_types add column if not exists name_th text;
alter table procedure_types add column if not exists name_th text;
alter table blood_test_types add column if not exists name_th text;
alter table item_unit_conversions add column if not exists unit_th text;
alter table fixed_outgoings add column if not exists label_th text;
alter table vets add column if not exists name_th text;
alter table site_content_photos add column if not exists alt_th text;

comment on column diet_types.name_th is 'The diet''s name in Thai (0166). Null: not translated yet; the English shows.';
comment on column medication.name_th is 'The medicine''s name in Thai (0166), for the descriptive ones ("Subcutaneous Fluids"). Null is normal: a drug or brand name reads the same in both languages, and the English shows.';
comment on column frequency.label_th is 'The frequency''s label in Thai (0166). Null: not translated yet; the English shows.';
comment on column immunization_types.name_th is 'The vaccine''s name in Thai (0166). Null: not translated yet; the English shows.';
comment on column procedure_types.name_th is 'The procedure''s name in Thai (0166). Null: not translated yet; the English shows.';
comment on column blood_test_types.name_th is 'The blood test''s name in Thai (0166). Null: not translated yet; the English shows.';
comment on column item_unit_conversions.unit_th is 'The unit''s name in Thai (0166), e.g. for "bag (20 kg)". Null: not translated yet; the English shows.';
comment on column fixed_outgoings.label_th is 'The monthly cost''s label in Thai (0166). Null: not translated yet; the English shows.';
comment on column vets.name_th is 'The clinic''s name in Thai (0166), where it is descriptive. Null is normal for a proper name; the English shows.';
comment on column site_content_photos.alt_th is 'The photo''s alt text in Thai (0166), as site_content.hero_alt_th is for the hero. Null: the English is used.';

-- ===================================================================================================================
-- 2. Recurring jobs join the prose queue
-- ===================================================================================================================
-- queue_translations() and drop_translations() (0056) are generic: they read translatable_fields for the table they
-- fire on. So registering the two columns and adding the triggers is all a new table needs, as 0057 did for
-- maintenance and 0076 for shelter_friends.
insert into translatable_fields (table_name, column_name, tier) values
  ('recurring_jobs', 'title', 'reviewed'),
  ('recurring_jobs', 'description', 'reviewed')
on conflict do nothing;

drop trigger if exists recurring_jobs_queue_translations on recurring_jobs;
create trigger recurring_jobs_queue_translations
  after insert or update on recurring_jobs
  for each row execute function queue_translations();
drop trigger if exists recurring_jobs_drop_translations on recurring_jobs;
create trigger recurring_jobs_drop_translations
  after delete on recurring_jobs
  for each row execute function drop_translations();

-- Backfill: a pending row for every existing job's title and description, as 0057 did for maintenance.
insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
select 'recurring_jobs', j.id, f.column_name,
       detect_language(v.txt), other_language(detect_language(v.txt)), btrim(v.txt)
  from recurring_jobs j
  join translatable_fields f on f.table_name = 'recurring_jobs'
  cross join lateral (select to_jsonb(j) ->> f.column_name as txt) v
 where nullif(btrim(v.txt), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

-- The queue names and links a recurring job. private.translation_queue is the one to edit (0086: public's view of
-- the same name is a gate over it). Same columns in the same order; only the two CASEs gain a branch.
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
           select 'Shelter Friend · ' || c.name
             from shelter_friends sf join contacts c on c.id = sf.contact_id
            where sf.id = t.row_id)
         when 'recurring_jobs' then (
           select 'Recurring job · ' || j.title from recurring_jobs j where j.id = t.row_id)
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
           select '/contacts/' || sf.contact_id from shelter_friends sf where sf.id = t.row_id)
         when 'recurring_jobs' then '/management/recurring-jobs'
         else null
       end as record_path
  from translations t
  join translatable_fields f on f.table_name = t.table_name and f.column_name = t.column_name;

-- ===================================================================================================================
-- 3. The label registry
-- ===================================================================================================================
-- label_group is what the page files a label under (the item's groups). `optional`: an empty Thai is not "missing"
-- but "shown as typed", for the lists where most entries are proper names (medicines, clinics) or are named by the
-- dictionaries (the built-in roles).
--
-- Not registered, on purpose: residents.thai_name (a second name, not a translation of the first, 0056); rounds
-- (a fixed, seeded vocabulary whose Thai ships with it, 0137).
create table if not exists translatable_labels (
  table_name text not null,
  column_name text not null,
  th_column text not null,
  label_group text not null check (label_group in
    ('website', 'projects', 'places', 'diets', 'medications', 'units', 'setup_lists', 'money', 'roles')),
  optional boolean not null default false,
  primary key (table_name, column_name),
  unique (table_name, th_column)
);

comment on table translatable_labels is
  'The short labels that carry their Thai in a paired column (0166), as translatable_fields lists the prose that carries it in translations. label_group: where the Translations page files it. optional: an empty Thai means "shown as typed", not "missing".';

insert into translatable_labels (table_name, column_name, th_column, label_group, optional) values
  ('site_content', 'tagline', 'tagline_th', 'website', false),
  ('site_content', 'hero_alt', 'hero_alt_th', 'website', false),
  ('site_content', 'visiting_hours', 'visiting_hours_th', 'website', false),
  ('site_content_photos', 'alt', 'alt_th', 'website', false),
  ('impact_baselines', 'label', 'label_th', 'website', false),
  ('project_folders', 'name', 'name_th', 'projects', false),
  ('zones', 'name', 'name_th', 'places', false),
  ('enclosures', 'name', 'name_th', 'places', false),
  ('diet_types', 'name', 'name_th', 'diets', false),
  ('medication', 'name', 'name_th', 'medications', true),
  ('item_unit_conversions', 'unit', 'unit_th', 'units', false),
  ('frequency', 'label', 'label_th', 'setup_lists', false),
  ('immunization_types', 'name', 'name_th', 'setup_lists', false),
  ('procedure_types', 'name', 'name_th', 'setup_lists', false),
  ('blood_test_types', 'name', 'name_th', 'setup_lists', false),
  ('vets', 'name', 'name_th', 'setup_lists', true),
  ('fixed_outgoings', 'label', 'label_th', 'money', false),
  ('roles', 'name', 'name_th', 'roles', true)
on conflict (table_name, column_name) do update
  set th_column = excluded.th_column, label_group = excluded.label_group, optional = excluded.optional;

alter table translatable_labels enable row level security;

drop policy if exists translatable_labels_select_perm on translatable_labels;
create policy translatable_labels_select_perm on translatable_labels for select to authenticated
  using ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read')));

revoke all on translatable_labels from anon, authenticated, service_role;
grant select on translatable_labels to authenticated, service_role;

-- ===================================================================================================================
-- 4. The English each Thai label was written against
-- ===================================================================================================================
-- row_id is text because site_content's id is a boolean (the singleton); every other registered table has a uuid.
create table if not exists label_sources (
  table_name text not null,
  row_id text not null,
  column_name text not null,
  source_text text,
  recorded_at timestamptz not null default now(),
  primary key (table_name, row_id, column_name),
  constraint label_sources_label_known foreign key (table_name, column_name)
    references translatable_labels (table_name, column_name) on delete cascade
);

comment on table label_sources is
  'For each Thai label that is filled in, the English it was written against (0166). Thai present and source_text different from the English now = out of date. Written only by record_label_sources(); no one writes it directly.';

alter table label_sources enable row level security;

drop policy if exists label_sources_select_perm on label_sources;
create policy label_sources_select_perm on label_sources for select to authenticated
  using ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read')));

revoke all on label_sources from anon, authenticated, service_role;
grant select on label_sources to authenticated, service_role;

-- Fires after any write to a registered table. For each registered pair on the row:
--   Thai empty                              → no snapshot (nothing to be out of date)
--   Thai new, or changed by this write      → snapshot the English as it is now
--   Thai unchanged                          → keep the snapshot, so an English edit makes it out of date
-- Security definer so it runs whoever edited the row; it writes only label_sources.
create or replace function record_label_sources()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  v_new jsonb;
  v_old jsonb;
  v_row text;
  v_th text;
begin
  if tg_op = 'DELETE' then
    delete from label_sources
     where table_name = tg_table_name and row_id = to_jsonb(old) ->> 'id';
    return old;
  end if;

  v_new := to_jsonb(new);
  v_old := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  v_row := v_new ->> 'id';

  for l in select column_name, th_column from translatable_labels where table_name = tg_table_name loop
    v_th := nullif(btrim(v_new ->> l.th_column), '');
    if v_th is null then
      delete from label_sources
       where table_name = tg_table_name and row_id = v_row and column_name = l.column_name;
    elsif tg_op = 'INSERT'
       or v_th is distinct from nullif(btrim(v_old ->> l.th_column), '')
       or not exists (select 1 from label_sources s
                       where s.table_name = tg_table_name and s.row_id = v_row
                         and s.column_name = l.column_name) then
      insert into label_sources (table_name, row_id, column_name, source_text, recorded_at)
      values (tg_table_name, v_row, l.column_name, v_new ->> l.column_name, now())
      on conflict (table_name, row_id, column_name)
        do update set source_text = excluded.source_text, recorded_at = excluded.recorded_at;
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function record_label_sources() from public, anon, authenticated;

-- One trigger per registered table, and a snapshot of what is already there: an existing Thai label is taken as
-- written against today's English (nobody can say otherwise), so nothing reads "out of date" on day one.
do $$
declare
  t text;
  l record;
begin
  for t in select distinct table_name from translatable_labels loop
    execute format('drop trigger if exists %I on %I', t || '_label_sources', t);
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function record_label_sources()',
      t || '_label_sources', t);
  end loop;

  for l in select table_name, column_name, th_column from translatable_labels loop
    execute format(
      'insert into label_sources (table_name, row_id, column_name, source_text)
       select %L, x.id::text, %L, x.%I from %I x where nullif(btrim(x.%I), '''') is not null
       on conflict (table_name, row_id, column_name) do nothing',
      l.table_name, l.column_name, l.column_name, l.table_name, l.th_column);
  end loop;
end;
$$;

-- ===================================================================================================================
-- 5. Reading and writing a label from the Translations page
-- ===================================================================================================================
-- Every registered label with its state:
--   missing   English present, Thai empty, the list is not optional
--   as_typed  English present, Thai empty, the list is optional (a drug, a clinic, a built-in role)
--   stale     Thai present, and the English has changed since it was written
--   current   Thai present and written against today's English
-- Rows with no English are left out: there is nothing to translate. Security definer, because the person
-- translating may not be able to read the list itself (stock.diets, reference.types, reports.cashflow); it returns
-- nothing to a session holding neither translations permission.
create or replace function label_translations()
returns table (
  table_name text,
  row_id text,
  column_name text,
  th_column text,
  label_group text,
  optional boolean,
  source_text text,
  text_th text,
  seen_source_text text,
  status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  l record;
begin
  if not ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read'))) then
    return;
  end if;

  for l in select * from translatable_labels order by translatable_labels.label_group,
                                                   translatable_labels.table_name loop
    return query execute format(
      'select %L::text, x.id::text, %L::text, %L::text, %L::text, %L::boolean,
              x.%I::text, nullif(btrim(x.%I), '''')::text, s.source_text,
              case
                when nullif(btrim(x.%I), '''') is null then case when %L::boolean then ''as_typed'' else ''missing'' end
                when s.source_text is distinct from x.%I then ''stale''
                else ''current''
              end
         from %I x
         left join label_sources s
           on s.table_name = %L and s.row_id = x.id::text and s.column_name = %L
        where nullif(btrim(x.%I), '''') is not null',
      l.table_name, l.column_name, l.th_column, l.label_group, l.optional,
      l.column_name, l.th_column,
      l.th_column, l.optional,
      l.column_name,
      l.table_name,
      l.table_name, l.column_name,
      l.column_name);
  end loop;
end;
$$;

comment on function label_translations() is
  'Every label in translatable_labels with its English, its Thai and missing / as_typed / stale / current (0166). For translations.view or translations.manage Read; empty for anyone else.';

revoke all on function label_translations() from public, anon;
grant execute on function label_translations() to authenticated, service_role;

-- Writes one Thai label. Asks translations.manage, not the list's own edit permission: translating "Standard Kibble
-- + Chicken" is not editing the diet list. Only a registered Thai column can be written, and nothing else on the
-- row. Empty text clears the Thai. Returns false when the row does not exist. The write fires the row's own audit
-- and label_sources triggers like any other update.
create or replace function set_label_th(p_table text, p_row_id text, p_column text, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_count integer;
begin
  if not (select has_permission('translations.manage')) then
    raise exception 'translations.manage is required to translate a label' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'not a translatable label: %.%', p_table, p_column using errcode = '22023';
  end if;

  execute format('update %I set %I = $1 where id::text = $2', p_table, v_th_column)
    using nullif(btrim(p_text), ''), p_row_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

comment on function set_label_th(text, text, text, text) is
  'Sets one Thai label registered in translatable_labels (0166). For translations.manage; translating a label is not editing its list.';

revoke all on function set_label_th(text, text, text, text) from public, anon;
grant execute on function set_label_th(text, text, text, text) to authenticated, service_role;

-- ===================================================================================================================
-- 6. The views the new columns must reach
-- ===================================================================================================================
-- Each is its latest definition with the Thai column appended (0151, 0161, 0162, 0136, 0155, 0124, 0122). Same
-- audience, same filters; the Thai name of something a view already shows by name is no wider than the name.
-- Grants restated as they stand (a replaced view keeps its grants; the grant lint asks for them in the file).

create or replace view picker_medications as
select m.id, m.name, m.dose_unit, m.name_th
  from medication m
 where (select has_permission('stock.medications', 'read'))
    or (select has_permission('reference.add_while_recording'))
    or (select has_permission('medical.prescriptions', 'read'));

create or replace view picker_diet_types as
select d.id, d.name, d.unit, d.daily_qty_small, d.daily_qty_medium, d.daily_qty_large, d.is_standard, d.name_th
  from diet_types d
 where (select has_permission('stock.diets', 'read'))
    or (select has_permission('resident.register'))
    or (select has_permission('medical.diet', 'read'));

revoke all on picker_medications, picker_diet_types from anon, authenticated, service_role;
grant select on picker_medications, picker_diet_types to authenticated, service_role;

create or replace view stock_medications as
select m.id, m.name, m.dose_unit, m.stock_on_hand, m.stock_counted_at, m.reorder_lead_days,
       m.safety_stock, m.label_drive_file_id, m.sort_order, m.name_th
  from medication m
 where (select has_permission('stock.count'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'));

create or replace view stock_diet_types as
select d.id, d.name, d.unit, d.stock_on_hand, d.stock_counted_at, d.reorder_lead_days,
       d.safety_stock, d.is_standard, d.sort_order, d.name_th
  from diet_types d
 where (select has_permission('stock.count'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'));

revoke all on stock_medications, stock_diet_types from anon, authenticated, service_role;
grant select on stock_medications, stock_diet_types to authenticated, service_role;

create or replace view medication_list_medications as
select m.id, m.name, m.dose_unit, m.label_drive_file_id, m.name_th
  from medication m
 where (select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical());

create or replace view special_diet_list as
select d.id as resident_diet_id,
       r.id as resident_id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th,
       t.id as diet_type_id,
       t.name as diet_name,
       t.unit as diet_unit,
       d.meals_per_day,
       coalesce(d.daily_quantity,
                case r.size when 'Small' then t.daily_qty_small
                            when 'Medium' then t.daily_qty_medium
                            when 'Large' then t.daily_qty_large end) as daily_quantity,
       d.notes,
       coalesce((select array_agg(rd.key order by rd.sort_order)
                   from resident_diet_rounds x
                   join rounds rd on rd.id = x.round_id
                  where x.resident_diet_id = d.id), array[]::text[]) as round_keys,
       z.colour as zone_colour,
       t.name_th as diet_name_th
  from resident_diets d
  join diet_types t on t.id = d.diet_type_id
  join residents r on r.id = d.resident_id
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where t.is_standard = false
   and d.start_date <= shelter_today()
   and (d.end_date is null or d.end_date >= shelter_today())
   and (select has_permission('medical.diet', 'read'))
   and (select sees_all_clinical());

revoke all on medication_list_medications, special_diet_list from anon, authenticated, service_role;
grant select on medication_list_medications, special_diet_list to authenticated, service_role;

create or replace view picker_immunization_types as
select i.id, i.name, i.is_mandatory, i.interval_months, i.name_th
  from immunization_types i
 where (select has_permission('medical.immunizations', 'read'))
    or (select has_permission('reference.types', 'read'));

revoke all on picker_immunization_types from anon, authenticated, service_role;
grant select on picker_immunization_types to authenticated, service_role;

create or replace view immunization_next_due
with (security_invoker = on) as
select distinct on (ir.resident_id, ir.immunization_type_id)
  ir.resident_id,
  ir.immunization_type_id,
  it.name as immunization_type_name,
  it.interval_months,
  ir.date_administered as last_administered,
  case
    when it.interval_months is not null
      then (ir.date_administered + (it.interval_months || ' months')::interval)::date
    else null
  end as next_due_date,
  it.name_th as immunization_type_name_th
from immunization_records ir
join immunization_types it on it.id = ir.immunization_type_id
where ir.archived_at is null
order by ir.resident_id, ir.immunization_type_id, ir.date_administered desc;

grant select on immunization_next_due to authenticated, service_role;

-- Public alt text, as `alt` already is: the website shows the Thai to a Thai reader.
create or replace view public_site_content_photos as
select id, drive_file_id, alt, sort_order, alt_th
from site_content_photos;

grant select on public_site_content_photos to anon, authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger
  on public_site_content_photos from anon, authenticated;

notify pgrst, 'reload schema';
