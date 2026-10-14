-- consumer: none
--
-- 0196's role_row_live() pinned search_path to '' and so could not run shelter_date(), whose body calls
-- shelter_time_zone() unqualified ("function shelter_time_zone() does not exist"). Every permission helper that asks it
-- failed on dev between applying 0196 and this file. Same function, search_path = public, the way shelter_date's other
-- callers run it. Nothing else in 0196 changes. Re-runnable.
create or replace function role_row_live(p_starts_on date, p_ends_on date)
returns boolean
language sql
stable
set search_path = public
as $$
  select (p_starts_on is null or p_starts_on <= shelter_date(now()))
     and (p_ends_on is null or p_ends_on >= shelter_date(now()));
$$;
