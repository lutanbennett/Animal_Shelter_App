-- consumer: src/app/admin/diets/AddButtons.tsx, src/app/admin/diets/IngredientDetail.tsx, src/app/admin/diets/actions.ts
--
-- Units of measure become data (Lutan, 2026-10-23: "all hard coding out"; he wants 'each' for eggs).
-- Schema half. The app half (Settings -> Units, the forms reading this table, deleting DIET_UNITS /
-- DOSE_UNITS from src/lib/i18n/enum-labels.ts) is the next stream.
--
-- diet_types.unit and medication.dose_unit KEEP storing the unit's name as text: no existing row changes.
-- A unit is checked against this table by a TRIGGER ON WRITE ONLY, never by a constraint, because a
-- constraint is validated against existing rows and could refuse data already in the database.
-- medication.dose_unit's old fixed-list CHECK (0027) is dropped here: it would refuse every new unit.
--
-- Re-runnable.

create table if not exists units (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_th     text,
  for_ingredients boolean not null default false,
  for_medicines   boolean not null default false,
  sort_order  int  not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint units_name_not_blank check (btrim(name) <> ''),
  constraint units_used_somewhere check (for_ingredients or for_medicines)
);
create unique index if not exists units_name_lower_key on units (lower(btrim(name)));

comment on table units is
  'The units an item is measured in (0252). for_ingredients / for_medicines say which list offers it. Archived units stay on rows that use them but are not offered for new ones. diet_types.unit and medication.dose_unit store the name as text.';

-- Seed: today's DIET_UNITS and DOSE_UNITS (enum-labels.ts) with the Thai names from enums.dietUnit /
-- enums.doseUnit, plus 'each'. Tags are a first guess for Lutan to correct on screen.
insert into units (name, name_th, for_ingredients, for_medicines, sort_order) values
  ('g',           'กรัม',       true,  true,  10),
  ('ml',          'มล.',        true,  true,  20),
  ('can',         'กระป๋อง',    true,  false, 30),
  ('sachet',      'ซอง',        true,  true,  40),
  ('cup',         'ถ้วย',       true,  false, 50),
  ('portion',     'ส่วน',       true,  false, 60),
  ('each',        'ชิ้น',       true,  false, 70),
  ('tablet',      'เม็ด',       false, true,  110),
  ('capsule',     'แคปซูล',     false, true,  120),
  ('mg',          'มก.',        false, true,  130),
  ('mcg',         'มคก.',       false, true,  140),
  ('IU',          'IU',         false, true,  150),
  ('drop',        'หยด',        false, true,  160),
  ('application', 'ครั้งที่ทา', false, true,  170),
  ('dose',        'โดส',        false, true,  180)
on conflict (lower(btrim(name))) do nothing;

alter table units enable row level security;
drop policy if exists units_select_perm on units;
create policy units_select_perm on units for select to authenticated using (true);

-- Write gate = canEditItemSettings (src/lib/permissions/item-settings.ts): reference.types plus the item's own
-- stock cell. Units serve both lists, so either stock cell qualifies.
drop policy if exists units_insert_perm on units;
create policy units_insert_perm on units for insert to authenticated
  with check ((select has_permission('reference.types', 'edit'))
          and ((select has_permission('stock.diets', 'edit')) or (select has_permission('stock.medications', 'edit'))));
drop policy if exists units_update_perm on units;
create policy units_update_perm on units for update to authenticated
  using ((select has_permission('reference.types', 'edit'))
     and ((select has_permission('stock.diets', 'edit')) or (select has_permission('stock.medications', 'edit'))))
  with check ((select has_permission('reference.types', 'edit'))
          and ((select has_permission('stock.diets', 'edit')) or (select has_permission('stock.medications', 'edit'))));
grant select, insert, update on units to authenticated;
grant all on units to service_role;
-- No delete policy or grant: units are archived, not deleted.

-- Write-time check. Only a new row, or a changed unit, is checked; an untouched legacy value always saves.
create or replace function check_unit_in_units()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_unit text;
  v_old  text;
  v_med  boolean := tg_table_name = 'medication';
  u      units;
begin
  v_unit := to_jsonb(new) ->> case when v_med then 'dose_unit' else 'unit' end;
  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old) ->> case when v_med then 'dose_unit' else 'unit' end;
    if v_unit is not distinct from v_old then return new; end if;
  end if;
  select * into u from units where lower(btrim(name)) = lower(btrim(v_unit));
  if u.id is null then
    raise exception 'There is no unit called "%". Add it under Settings -> Units first.', v_unit;
  end if;
  if u.archived_at is not null then
    raise exception 'The unit "%" is archived and cannot be used on new items.', v_unit;
  end if;
  if (v_med and not u.for_medicines) or (not v_med and not u.for_ingredients) then
    raise exception 'The unit "%" is not offered for %.', v_unit, case when v_med then 'medicines' else 'ingredients' end;
  end if;
  return new;
end;
$$;

alter table medication drop constraint if exists medication_dose_unit_check;

drop trigger if exists diet_types_check_unit on diet_types;
create trigger diet_types_check_unit before insert or update of unit on diet_types
  for each row execute function check_unit_in_units();
drop trigger if exists medication_check_unit on medication;
create trigger medication_check_unit before insert or update of dose_unit on medication
  for each row execute function check_unit_in_units();
