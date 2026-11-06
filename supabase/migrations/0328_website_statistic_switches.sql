-- consumer: none (batch 2's website-switches-app reads these: src/lib/site/impact.ts, src/app/page.tsx, src/app/admin/website/, src/lib/public-pages.ts)
--
-- SCHEMA HALF of "a switch for each statistic on the public website" (#jdoto) and of the `page:events` key (#e7v1q).
-- Nothing in src/ or worker/ reads or writes any of this yet. Every default keeps today's site exactly as it is, so
-- applying this changes nothing a visitor can see.
--
-- THE HOMEPAGE'S IMPACT BAND HAS TWO KINDS OF STATISTIC, SO TWO SHAPES:
--
--   LIFETIME FIGURES (public_impact_figures, 0156/0169/0204) are rows, so the switch is a column on the row:
--     impact_baselines.show_on_website boolean not null default true
--   and the view leaves out a row where it is false. The baseline_count / baseline_date / since_year stay exactly
--   as they were: today's only off switch is to clear the Director's starting number, which is a delete wearing a
--   switch's clothes, and impact_baselines_pair forces the date out with it. This is not that.
--
--   LIVE COUNTS (public_shelter_stats, 0039/0062/0073/0124) are columns of one computed row, with nothing to hang
--   a flag on. Putting four "live" rows into impact_baselines would have given the Settings editor four rows with
--   no baseline to edit and made `baseline_count is not null` mean two things. So they get a table of their own:
--     public_stat_switches (id, key, show_on_website, updated_by, updated_at)  -- four fixed rows
--   and public_shelter_stats returns NULL for a statistic whose switch is off, rather than dropping the column
--   (dropping would break every reader of the view; NULL is what src/lib/site/impact.ts already reads as "no
--   tile", because null >= LIVE_TILE_MIN is false). The count is not even computed while the switch is off.
--   The other columns of the view (in_hospital, ready_for_adoption, adopted_last_7_days, intakes_this_year) are not
--   tiles and are not switchable.
--
-- LIVE_TILE_MIN = 2 STAYS in src/lib/site/impact.ts and sits BESIDE the switch: a tile shows only if the switch is
-- on AND the count is at least 2. The switch is the Director's choice, the threshold is a rule about what a donor
-- should see; neither replaces the other. A statistic switched on but below the threshold still shows nothing, and
-- the app half must say so on the screen.
--
-- GRANTS ON BOTH PUBLIC VIEWS ARE UNCHANGED (anon + authenticated select, restated below as 0204 and 0124 did).
-- Hiding a tile is content, not security. The new table is NOT granted to anon; the owner-run view reads it.
--
-- WHO CAN CHANGE ONE: website.content at Edit, through has_permission() (Admin implicit), the activity Settings ->
-- Website already asks. No role key anywhere. For public_stat_switches only show_on_website is updatable, so the
-- four keys cannot be renamed. Every change reaches audit_log through record_audit() (0121), which is what puts it
-- in Settings -> Recent changes. impact_baselines is already audited (0156).
--
-- PAGE:EVENTS. site_content.hidden_public_pages (0256, 0290) gains 'page:events', so /events can carry its own
-- switch in Settings -> Pages. Dropping the `noOwnSwitch` flag in src/lib/public-pages.ts is the app half and is
-- NOT done here; until it is, nothing offers the key and applying this hides nothing.
--
-- Re-runnable. To undo: re-create the two views from 0204 and 0124, drop table public_stat_switches, drop column
-- impact_baselines.show_on_website, restore the 0290 constraint. audit_log rows stay, by design.

-- 1. Lifetime figures: the switch is a column on the row.
alter table impact_baselines add column if not exists show_on_website boolean not null default true;

comment on column impact_baselines.show_on_website is
  'False = the figure is left off the public band (0328) while its baseline, date and since_year stay as entered. Default true, so nothing changes until someone switches one off. Written with website.content Edit; audited.';

create or replace view public_impact_figures as
select b.key,
       b.label,
       b.label_th,
       b.baseline_count,
       b.baseline_date,
       l.live_count,
       b.baseline_count + l.live_count as total,
       b.since_year
  from impact_baselines b
 cross join lateral (
   select case b.key
     when 'animals_rehomed' then (
       select count(*)::integer
         from placement_history p
        where p.placement_type = 'Adopt'
          and shelter_date(p.start_date) > b.baseline_date
     )
     when 'community_dogs' then (
       select coalesce(sum(o.dog_count), 0)::integer
         from community_dog_outings o
        where o.outing_on > b.baseline_date
     )
     when 'villages_sterilised' then (
       select coalesce(sum(o.sterilised_count), 0)::integer
         from community_dog_outings o
        where o.sterilised
          and o.outing_on > b.baseline_date
     )
     else 0
   end as live_count
 ) l
 where b.baseline_count is not null
   and b.baseline_date is not null
   and b.show_on_website;

comment on view public_impact_figures is
  'Public impact figures (0156): baseline + live count since the baseline date, computed on read. Only figures with a baseline entered and show_on_website true (0328). animals_rehomed, community_dogs and villages_sterilised are counted; any other key is baseline-only.';

grant select on public_impact_figures to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_impact_figures
  from anon, authenticated;

-- 2. Live counts: a small table of four fixed rows.
create table if not exists public_stat_switches (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  show_on_website boolean not null default true,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint public_stat_switches_key_unique unique (key),
  constraint public_stat_switches_key_known check (key in ('in_care', 'adopted_this_year', 'in_foster', 'in_treatment'))
);

comment on table public_stat_switches is
  'One row per live count on the public homepage band (0328): in_care, adopted_this_year, in_foster, in_treatment. show_on_website false makes public_shelter_stats return NULL for that count. Four fixed rows; only show_on_website is updatable. Written with website.content Edit; audited. Not readable by anon: the owner-run view reads it.';

insert into public_stat_switches (key)
values ('in_care'), ('adopted_this_year'), ('in_foster'), ('in_treatment')
on conflict (key) do nothing;

alter table public_stat_switches enable row level security;

drop policy if exists public_stat_switches_select_perm on public_stat_switches;
create policy public_stat_switches_select_perm on public_stat_switches for select to authenticated
  using ((select has_permission('website.content', 'read')));

drop policy if exists public_stat_switches_update_perm on public_stat_switches;
create policy public_stat_switches_update_perm on public_stat_switches for update to authenticated
  using ((select has_permission('website.content')))
  with check ((select has_permission('website.content')));

revoke all on public_stat_switches from anon, authenticated, service_role;
grant select on public_stat_switches to authenticated, service_role;
grant update (show_on_website) on public_stat_switches to authenticated, service_role;

create or replace function public_stat_switches_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public_stat_switches_stamp() from public, anon, authenticated;

drop trigger if exists public_stat_switches_stamp on public_stat_switches;
create trigger public_stat_switches_stamp
  before update on public_stat_switches
  for each row execute function public_stat_switches_stamp();

drop trigger if exists audit_public_stat_switches on public_stat_switches;
create trigger audit_public_stat_switches
  after insert or update or delete on public_stat_switches
  for each row execute function record_audit();

-- public_shelter_stats: 0124's definition, column for column, with the four tile counts returning NULL when switched off.
create or replace view public_shelter_stats as
select
  case when coalesce((select show_on_website from public_stat_switches where key = 'in_care'), true) then
    (select count(*) from private.resident_current_state
       where current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered'))::integer
  end as in_care,
  (select count(*) from private.resident_current_state
     where current_status = 'Hospitalised')::integer as in_hospital,
  case when coalesce((select show_on_website from public_stat_switches where key = 'in_foster'), true) then
    (select count(*) from private.resident_current_state
       where current_status = 'Fostered')::integer
  end as in_foster,
  (select count(*) from private.resident_current_state s
     join residents r on r.id = s.resident_id
     where r.ready_for_adoption and r.is_public_visible
       and s.current_status not in ('Deceased', 'Adopted'))::integer as ready_for_adoption,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and start_date >= now() - interval '7 days')::integer as adopted_last_7_days,
  case when coalesce((select show_on_website from public_stat_switches where key = 'adopted_this_year'), true) then
    (select count(*) from placement_history
       where placement_type = 'Adopt'
         and shelter_date(start_date) >= make_date(extract(year from shelter_today())::integer, 1, 1))::integer
  end as adopted_this_year,
  (select count(*) from placement_history
     where placement_type = 'Intake'
       and shelter_date(start_date) >= make_date(extract(year from shelter_today())::integer, 1, 1)
  )::integer as intakes_this_year,
  case when coalesce((select show_on_website from public_stat_switches where key = 'in_treatment'), true) then
    (select count(*) from private.resident_current_state s
       where s.current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered')
         and (
           s.current_status = 'Hospitalised'
           or exists (
             select 1 from prescriptions p
              where p.resident_id = s.resident_id
                and p.archived_at is null
                and (p.end_date is null or p.end_date >= shelter_today())
           )
         ))::integer
  end as in_treatment;

grant select on public_shelter_stats to anon, authenticated;

-- 3. #e7v1q: /events can be hidden like the other pages.
alter table site_content drop constraint if exists site_content_hidden_public_pages_check;
alter table site_content add constraint site_content_hidden_public_pages_check
  check (hidden_public_pages <@ array[
    'page:adopt', 'page:adopt-international', 'page:foster', 'page:volunteer', 'page:donate', 'page:appeals',
    'page:friends', 'page:friends-join', 'page:desexing', 'page:our-work', 'page:about', 'page:shop',
    'page:events',
    'section:adopt', 'section:get-involved', 'section:services'
  ]::text[]);

comment on column site_content.hidden_public_pages is
  'Public pages and menu sections hidden from visitors (0256, page:shop added by 0290, page:events by 0328): page:<key> or section:<key>. Empty = everything shown. Home and Privacy cannot be listed. Written under website.content; audited.';

notify pgrst, 'reload schema';
