-- Seed every existing resident with the standard diet (2026-09-22).
--
-- 0051 gave diets a home but shipped no data: every resident taken in
-- before it reads "no diet recorded" on their hub — indistinguishable from
-- a question nobody has answered — and the food forecast on Management →
-- Diets totals nothing. Production has since had its standard diet entered
-- by hand (Standard Kibble + Chicken, ฿17 a cup) but no resident is on it.
--
-- So this file does not own the diet type; it adopts it. The type is
-- looked up by name, case-insensitively, and only created when it is
-- missing — which is the dev and test databases, and any fresh one. A
-- database that already has it (production) keeps its own cost and
-- portions untouched. Then every resident with no diet at all gets one
-- ongoing row of it, dated to their intake.
--
-- Left out: deceased residents (0026 closes the record, and they eat
-- nothing) and adopted ones (they've left). Fostered and outreach
-- residents are in — they eat, whoever feeds them; whose food the shelter
-- actually buys is `diet_forecast`'s question, and it already excludes
-- fostered.
--
-- Re-runnable: the type is created only if absent, and a resident who has
-- any diet row — seeded here or added since — is skipped.

do $$
declare
  v_diet_type_id uuid;
  v_seeded integer;
begin
  select id into v_diet_type_id
  from diet_types
  where lower(name) = lower('Standard Kibble + Chicken');

  -- Not production, then. Create it with the price production uses; the
  -- portions are an estimate, flagged as one in the notes, and whoever
  -- runs this database corrects them on Management → Diets.
  if v_diet_type_id is null then
    insert into diet_types (
      name, unit, cost_per_unit,
      daily_qty_small, daily_qty_medium, daily_qty_large, notes
    )
    values (
      'Standard Kibble + Chicken', 'cup', 17,
      1, 2, 3,
      'The shelter''s everyday meal. ฿17 a cup is the real price; the per-size portions are an estimate from 0069 — correct them here.'
    )
    returning id into v_diet_type_id;
  end if;

  -- start_date is the intake date, so the record reads as what they have
  -- always eaten rather than something that began the day this ran.
  -- Bounded to today so a missing or future-dated intake can't create a
  -- course that hasn't started.
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
