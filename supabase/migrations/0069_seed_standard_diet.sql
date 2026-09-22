-- Seed every existing resident with the standard diet (2026-09-22).
--
-- 0051 gave diets a home but shipped both lists empty: no diet types, and
-- a Diet tab reading "No diet recorded" for every resident who was already
-- here (only intakes taken since can carry a starting diet). So the food
-- forecast on Management → Diets totals nothing, and a volunteer reading
-- the hub can't tell "this resident eats the normal food" from "nobody has
-- filled this in".
--
--   1. `diet_types` gains **Standard dry food**, the everyday kibble.
--      Its portions (200 / 350 / 500 g a day for a small / medium / large
--      animal) and its cost (0) are placeholders — management edits both
--      in place on Management → Diets once the real bag and price are
--      known, and every resident's forecast follows from there.
--   2. `resident_diets` gains one ongoing row of it per resident who has
--      no diet at all, dated to their intake, so the tab and the forecast
--      both read true from today. Its notes say it was seeded, so the
--      staff member reviewing a resident knows this is the default and
--      not someone's considered answer.
--
-- Left out: deceased residents (their record is closed by 0026 and they
-- eat nothing) and adopted ones (they've left). Fostered and outreach
-- residents are in — they eat, whoever feeds them; `diet_forecast` is
-- what decides whose food the shelter buys, and it already excludes
-- fostered.
--
-- Re-runnable: the type is upserted by name and a resident who already has
-- any diet row — seeded here or added since — is skipped.

-- =========================================================================
-- 1. The standard diet type
-- =========================================================================

insert into diet_types (
  name, unit, cost_per_unit, daily_qty_small, daily_qty_medium, daily_qty_large, notes
)
values (
  'Standard dry food', 'g', 0, 200, 350, 500,
  'The shelter''s everyday dry food. Portions and cost per gram are placeholders from 0069 — set them here once the real product and price are known.'
)
on conflict (name) do nothing;

-- =========================================================================
-- 2. One ongoing row per resident with no diet
-- =========================================================================

do $$
declare
  v_diet_type_id uuid;
  v_seeded integer;
begin
  select id into v_diet_type_id from diet_types where name = 'Standard dry food';
  if v_diet_type_id is null then
    raise exception 'Standard dry food diet type is missing — step 1 did not run';
  end if;

  -- start_date is the intake date so the record reads as "this is what
  -- they have always eaten", bounded to today so a future-dated or missing
  -- intake can't create a course that hasn't started.
  insert into resident_diets (resident_id, diet_type_id, start_date, notes)
  select
    r.id,
    v_diet_type_id,
    least(coalesce(r.intake_date, current_date), current_date),
    'Seeded as the shelter''s standard diet (0069) — replace it with what this resident actually eats.'
  from residents r
  join resident_current_state s on s.resident_id = r.id
  where s.current_status not in ('Deceased', 'Adopted')
    and not exists (
      select 1 from resident_diets rd where rd.resident_id = r.id
    );

  get diagnostics v_seeded = row_count;
  raise notice 'Seeded the standard diet for % resident(s).', v_seeded;
end;
$$;

notify pgrst, 'reload schema';
