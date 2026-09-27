-- One weight per vet visit, and one weight per resident per day (backlog,
-- "One weight per vet visit: hide visits that already have one", Lutan
-- 2026-09-27; the per-day rule added the same day).
--
-- Two independent constraints:
--
--   weight_one_per_visit   unique (vet_appointment_id), PARTIAL — only rows
--                          linked to a visit. Unpartial, every unlinked
--                          reading would collide with every other one.
--   weight_one_per_day     unique (resident_id, date). The stricter rule: two
--                          readings on one day where only one is linked to a
--                          visit pass the first and fail this.
--
-- The weight form hides visits that already carry a reading and turns a
-- same-day entry into a correction of the existing row
-- (src/lib/weight/record.ts), but a filter only covers the tab it was drawn
-- in. These indexes are what hold for a second tab, the assistant and an
-- import.
--
-- Existing duplicates, counted before writing this (2026-09-27): none on dev
-- under either rule (23 rows), and none in the AppSheet snapshot the
-- production import is built from (18 rows; its one pair sharing a visit id
-- names a visit the export doesn't have, so the importer loads both
-- unlinked, on different days). The file still deals with any it meets:
--
--   * per visit: every reading but the newest is unlinked from the visit.
--     Nothing is lost — the readings stay, dated as they were — and which
--     one the visit "owns" is the only thing decided.
--   * per day: refused, with the rows named. Keeping one of two different
--     readings is a judgement about which was right, and a migration is not
--     the place to make it silently. Resolve them (edit or delete one) and
--     re-run.
--
-- Intake (record_intake, 0029 onwards) writes a reading dated the intake
-- day. A new resident has no other readings, so intake itself can never
-- collide; the case the per-day rule meets is a vet weighing the animal the
-- same day, and the form handles that by correcting the intake reading.
--
-- Written to be safely re-runnable.

update weight w
set vet_appointment_id = null
where w.vet_appointment_id is not null
  and exists (
    select 1
    from weight n
    where n.vet_appointment_id = w.vet_appointment_id
      and (n.created_at, n.id) > (w.created_at, w.id)
  );

do $$
declare
  v_dupes text;
begin
  select string_agg(format('resident %s on %s (%s readings)', resident_id, date, n), '; ')
  into v_dupes
  from (
    select resident_id, date, count(*) as n
    from weight
    group by resident_id, date
    having count(*) > 1
  ) d;

  if v_dupes is not null then
    raise exception 'weight has more than one reading on the same day: %', v_dupes
      using hint = 'Keep the right reading for each day (edit or delete the others), then re-run this file.';
  end if;
end $$;

create unique index if not exists weight_one_per_visit
  on weight (vet_appointment_id)
  where vet_appointment_id is not null;

create unique index if not exists weight_one_per_day
  on weight (resident_id, date);

comment on index weight_one_per_visit is
  'One weight per vet visit (0106). Partial: unlinked readings are not constrained by it.';
comment on index weight_one_per_day is
  'One weight per resident per day (0106). A correction edits the day''s row rather than adding one.';
