-- The standard diet gets a flag (backlog, "Standard diet: flag it, make a
-- diet mandatory at intake, and show special diets on enclosure cards";
-- schema half — the feature half reads and moves the flag).
--
-- Until now the standard diet was known only by its name, "Standard Kibble
-- + Chicken" (seeded or adopted by 0069). The feature needs to ask "is this
-- resident on something other than the standard?" for the enclosure cards,
-- and to preselect the standard at intake; a name is not something to key
-- that on, because management can rename it.
--
--   1. diet_types.is_standard   boolean not null default false, with a
--      partial unique index on (is_standard) where is_standard, so at most
--      one diet type can be the standard. Zero is allowed: a fresh database
--      before 0069, or one where the named row was renamed before this ran.
--      Moving the standard is "clear the old, set the new" in one
--      transaction, which the feature half does. Two statements, in that
--      order: a unique index is checked row by row, so a single
--      `set is_standard = (id = <new>)` can fail on whichever row it
--      reaches first.
--
--   2. The existing standard is flagged by name, case-insensitively, as
--      0069 found it — but only when no row is flagged yet, so re-running
--      this file after management has moved the standard does not move it
--      back.
--
--   3. Backfill (default taken at planning, 2026-09-25; Lutan can overrule
--      it on the PR): every resident still living at the shelter with no
--      CURRENT resident_diets row — none with start_date <= today and
--      end_date null or >= today — gets one ongoing row of the standard
--      from today. On dev on 2026-09-26 that was four residents: three
--      intakes from 2026-09-24 taken in with "None yet", and one whose only
--      diet had been ended. The alternative was to list them for staff to
--      fix; a resident with no diet reads as "not fed" on the hub and is
--      missing from the food forecast, and the standard is what the shelter
--      feeds unless someone says otherwise, so the backfill is the safer
--      wrong answer. The note on each row says it was backfilled.
--
--      Differences from 0069's seed, on purpose:
--        - "no current diet", not "no diet at all": an ended diet leaves the
--          resident unfed today just as much.
--        - dated from today (shelter_today()), not from intake: a resident
--          whose diet ended last week was not on the standard all along.
--        - a resident whose next diet is already booked to start later gets
--          the standard only until the day before it, so the two don't
--          overlap.
--      Same as 0069: deceased and adopted residents are left out; fostered,
--      outreach, hospitalised and unassigned are in. Status is read from
--      private.resident_current_state (0086 moved it; the public name is a
--      gated wrapper).
--
-- Not here: rejecting a null p_diet_type_id in record_intake. The current
-- intake form still offers "None yet" and passes null, so the database
-- cannot refuse it until the feature half removes that option; the feature
-- branch changes the form, the action and the RPC together.
--
-- Additive. The new column is covered by diet_types' existing table-level
-- grants (0077) and RLS policies (0051: admin and management write, staff,
-- vet and volunteer read). Re-runnable: every statement is guarded, the
-- flag is set only when none is, and the backfill skips anyone who now has a
-- current diet — including the rows it wrote itself.

alter table diet_types add column if not exists is_standard boolean not null default false;

comment on column diet_types.is_standard is
  'True on the shelter''s standard diet — what a resident is fed unless someone says otherwise. At most one row (diet_types_one_standard). A resident whose current diet is any other type is on a special diet. Moved on Management → Diets by clearing the old row, then setting the new one, in one transaction.';

create unique index if not exists diet_types_one_standard
  on diet_types (is_standard)
  where is_standard;

do $$
declare
  v_standard_id uuid;
  v_today date := shelter_today();
  v_backfilled integer;
begin
  select id into v_standard_id from diet_types where is_standard;

  if v_standard_id is null then
    update diet_types
       set is_standard = true
     where lower(name) = lower('Standard Kibble + Chicken')
    returning id into v_standard_id;
  end if;

  if v_standard_id is null then
    raise notice 'No diet type is flagged standard and none is named "Standard Kibble + Chicken"; nothing flagged, nobody backfilled. Flag one on Management → Diets.';
    return;
  end if;

  insert into resident_diets (resident_id, diet_type_id, start_date, end_date, notes)
  select
    r.id,
    v_standard_id,
    v_today,
    (select min(rd.start_date) - 1
       from resident_diets rd
      where rd.resident_id = r.id and rd.start_date > v_today),
    'Backfilled with the shelter''s standard diet (0087): no diet was recorded for today. Replace it with what this resident actually eats.'
  from residents r
  join private.resident_current_state s on s.resident_id = r.id
  where s.current_status not in ('Deceased', 'Adopted')
    and not exists (
      select 1 from resident_diets rd
       where rd.resident_id = r.id
         and rd.start_date <= v_today
         and (rd.end_date is null or rd.end_date >= v_today)
    );

  get diagnostics v_backfilled = row_count;
  raise notice 'Backfilled the standard diet for % resident(s).', v_backfilled;
end;
$$;

notify pgrst, 'reload schema';
