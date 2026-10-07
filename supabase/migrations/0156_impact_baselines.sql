-- consumer: src/app/admin/website/, src/app/page.tsx
--
-- Impact figures as a baseline plus a live count (backlog, "Impact figures as a baseline plus a live count";
-- decided 2026-10-07, decision brief q10). SCHEMA HALF ONLY: the Settings → Website editor, the "about" wording
-- on the page and both dictionaries are the app half, built from main once this is applied to dev.
--
-- The shelter existed before the app, so every lifetime total is a number nobody recorded plus what the app has
-- seen since. One row per public figure holds the first half; the second half is counted from the data.
--
--   impact_baselines        id, key (unique), label, label_th, baseline_count, baseline_date, set_by, set_at
--   public_impact_figures   key, label, label_th, baseline_count, baseline_date, live_count, total
--
-- THE TOTAL IS COMPUTED, NEVER STORED. The view adds the baseline to a live count each time it is read; nothing
-- caches a sum, so a corrected baseline or a corrected placement changes the figure at once.
--
-- "SINCE THE BASELINE DATE" means strictly after it. The baseline is the count up to and including that day
-- (shelter_date, Asia/Bangkok, as every other public figure); the live count is placements on later days. So
-- entering "412 as of 2026-10-07" never counts a 7 October adoption twice. Recorded in
-- docs/decisions/2026-10-07-impact-baselines.md.
--
-- WHICH FIGURES COUNT ANYTHING. 'animals_rehomed' counts placement_history rows of type Adopt (the same rows
-- public_shelter_stats.adopted_this_year counts). Every other key is baseline-only (live_count 0): sterilisations
-- in local villages in particular, because nothing records them. The Sterilisations project category (0034) is a
-- folder of photos, there is no count field on projects, and procedure_types' "Spay / neuter" (0031) is for
-- residents. Adding a counted figure later is one more `when` below.
--
-- A FIGURE WITH NO BASELINE YET IS NOT PUBLIC. The two seeded rows start with count and date both null
-- ("not entered"); the view omits a row until both are set, so the page cannot show a 0 nobody chose. A check
-- keeps the pair together: both set or both null.
--
-- WHO CAN CHANGE ONE. A baseline is a public claim, so: insert and update need website.content (Edit), the
-- cell Settings → Website already asks (Admin implicit). There is no delete policy and no delete grant: a
-- figure is retired by clearing it, which leaves its history. set_by and set_at are filled by a trigger from
-- auth.uid() and now(), never taken from the request, so they cannot be forged.
--
-- AUDIT. The change reaches audit_log the same way as every other audited table (0121): a record_audit()
-- trigger, before and after image, actor from the session. audit_log needs a uuid `id` on the row, hence the
-- surrogate id beside the natural key.
--
-- WHO CAN READ. The table: website.content (Read). The public figure: anon and signed-in, through the view
-- only, which exposes label, baseline and totals (the same things the public page prints) and not set_by.
--
-- Written to be safely re-runnable. To undo: drop view public_impact_figures, drop table impact_baselines
-- (cascade removes its triggers); audit_log rows for it stay, by design.

create table if not exists impact_baselines (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  label_th text,
  baseline_count integer,
  baseline_date date,
  set_by uuid references auth.users (id),
  set_at timestamptz not null default now(),
  constraint impact_baselines_key_unique unique (key),
  constraint impact_baselines_key_shape check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint impact_baselines_count_nonneg check (baseline_count is null or baseline_count >= 0),
  constraint impact_baselines_pair check ((baseline_count is null) = (baseline_date is null))
);

comment on table impact_baselines is
  'One row per public impact figure: a hand-entered starting number and the date it is true to (0156). The public figure is baseline + a live count since that date, computed in public_impact_figures, never stored. Written with website.content Edit; every change is in audit_log.';
comment on column impact_baselines.baseline_count is
  'An estimate entered by hand, not an audit. Null with baseline_date null = not entered, and the figure is not public.';
comment on column impact_baselines.baseline_date is
  'The baseline is the count up to and including this day (Asia/Bangkok). The live count starts the day after.';
comment on column impact_baselines.set_by is
  'auth.uid() of the last login to change the row, set by trigger.';

alter table impact_baselines enable row level security;

drop policy if exists impact_baselines_select_perm on impact_baselines;
create policy impact_baselines_select_perm on impact_baselines for select to authenticated
  using ((select has_permission('website.content', 'read')));

drop policy if exists impact_baselines_insert_perm on impact_baselines;
create policy impact_baselines_insert_perm on impact_baselines for insert to authenticated
  with check ((select has_permission('website.content')));

drop policy if exists impact_baselines_update_perm on impact_baselines;
create policy impact_baselines_update_perm on impact_baselines for update to authenticated
  using ((select has_permission('website.content')))
  with check ((select has_permission('website.content')));

revoke all on impact_baselines from anon, authenticated, service_role;
grant select, insert, update on impact_baselines to authenticated, service_role;

-- set_by / set_at come from the session, not the request.
create or replace function impact_baselines_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.set_by := auth.uid();
  new.set_at := now();
  return new;
end;
$$;

revoke execute on function impact_baselines_stamp() from public, anon, authenticated;

drop trigger if exists impact_baselines_stamp on impact_baselines;
create trigger impact_baselines_stamp
  before insert or update on impact_baselines
  for each row execute function impact_baselines_stamp();

drop trigger if exists audit_impact_baselines on impact_baselines;
create trigger audit_impact_baselines
  after insert or update or delete on impact_baselines
  for each row execute function record_audit();

-- The two figures the homepage band wants. Not entered, so not public until someone sets them.
insert into impact_baselines (key, label, label_th)
values
  ('animals_rehomed', 'Animals rehomed', 'สัตว์ที่ได้บ้านใหม่'),
  ('villages_sterilised', 'Sterilisations in local villages', 'การทำหมันในหมู่บ้านใกล้เคียง')
on conflict (key) do nothing;

-- The public figure. Owner-run view (like public_shelter_stats), so anon reads the numbers without reading the
-- table. Rows with no baseline entered are left out.
create or replace view public_impact_figures as
select b.key,
       b.label,
       b.label_th,
       b.baseline_count,
       b.baseline_date,
       l.live_count,
       b.baseline_count + l.live_count as total
  from impact_baselines b
 cross join lateral (
   select case b.key
     when 'animals_rehomed' then (
       select count(*)::integer
         from placement_history p
        where p.placement_type = 'Adopt'
          and shelter_date(p.start_date) > b.baseline_date
     )
     else 0
   end as live_count
 ) l
 where b.baseline_count is not null
   and b.baseline_date is not null;

comment on view public_impact_figures is
  'Public impact figures (0156): baseline + live count since the baseline date, computed on read. Only figures with a baseline entered. animals_rehomed counts Adopt placements after baseline_date; every other key is baseline-only.';

grant select on public_impact_figures to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_impact_figures
  from anon, authenticated;

notify pgrst, 'reload schema';
