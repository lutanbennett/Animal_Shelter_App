-- consumer: src/app/admin/website/page.tsx, src/lib/site/impact.ts
--
-- #s4t7q. impact_baselines_stamp (defined only in 0156) refreshed set_by / set_at on EVERY update, so the 0328
-- show_on_website switch rewrote "when the Director last set this number" although the number was untouched.
--
-- "THE NUMBER" = baseline_count, baseline_date, since_year (0204). Only a change to one of those moves the stamp.
-- label / label_th / show_on_website do not: the first two are wording, the third is visibility.
--
-- SHAPE: the tests live INSIDE the function, one trigger. A trigger `when` clause may not reference OLD on an
-- insert, so a bare `when` cannot cover both; two triggers would be two objects to keep in step.
--
-- FORGERY GUARD KEPT: on insert, and on an update of the number, set_by/set_at come from auth.uid() and now().
-- On an update that leaves the number alone they are pinned to OLD, so a set_at in the request is still ignored.
-- Re-runnable: create or replace; the trigger is unchanged (re-stated for safety).

create or replace function impact_baselines_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.baseline_count is not distinct from old.baseline_count
     and new.baseline_date  is not distinct from old.baseline_date
     and new.since_year     is not distinct from old.since_year then
    new.set_by := old.set_by;
    new.set_at := old.set_at;
    return new;
  end if;
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
