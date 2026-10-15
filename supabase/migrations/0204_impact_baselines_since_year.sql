-- consumer: none
--
-- Schema half of "since <year>" on the baseline figures. impact_baselines.baseline_date is the day the
-- baseline was entered; this is the year counting began, which is what the public label needs
-- ("Animals rehomed since 2019"). It is a YEAR, not a date: the label only ever prints a year, and a date
-- invites a day nobody knows. Null = not entered, and then no "since" is shown. The Director supplies it.
-- The Settings field and the label are a later item; nothing reads this yet.
--
-- Per docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md a column the public site must read
-- is not finished until the public view names it, so public_impact_figures gains it here, appended last.
-- Re-created from its live definition (pg_get_viewdef on dev, 2026-10-15), grants restated.

alter table impact_baselines add column if not exists since_year smallint;

alter table impact_baselines drop constraint if exists impact_baselines_since_year_range;
alter table impact_baselines add constraint impact_baselines_since_year_range
  check (since_year is null or since_year between 1990 and 2100);

comment on column impact_baselines.since_year is
  'The year counting began, printed as "since <year>" beside the figure (0204). Null = not entered, no "since" shown. A year, not a date, so it cannot be filled in with a made-up day.';

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
   and b.baseline_date is not null;

grant select on public_impact_figures to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_impact_figures
  from anon, authenticated;

notify pgrst, 'reload schema';
