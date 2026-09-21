-- Dietary requirements and resident size (2026-09-21).
--
-- What a resident eats has had nowhere to live but the behaviour notes.
-- The shelter wants it as a record in its own right — one or more diets
-- per resident, dated, so today's needs and the history are both visible,
-- and so food can be forecast and budgeted the way medication already is
-- (0043/0044). Modelled on prescriptions:
--
--   1. `residents.size` (Small / Medium / Large). Meal size depends on the
--      animal's size, and weight may or may not be recorded at intake, so
--      size is its own field: required by the intake and edit forms (the
--      column stays nullable for the residents intaken before this, who
--      get "Size not set" on the hub until someone edits them) and shown
--      on the public adoption pages beside age and sex.
--   2. `diet_types` — the product list (Management → Diets): a name, the
--      unit it is bought and served in, cost per unit in baht, and the
--      daily quantity for a small, medium and large animal. No inline add
--      from the resident's diet form: a type needs its quantities and cost,
--      which is management's call, not a field-side one.
--   3. `resident_diets` — the resident's dated records: type, start and
--      optional end date, meals a day, an optional per-resident daily
--      quantity that overrides the size default, and notes (allergies,
--      "soak first"). Several can run at once (kibble + wet + supplement).
--      Locked with the rest of the record on death (0026); not ended by
--      the death cascade — the forecast excludes deceased residents by
--      status, and the tab reads "current" from the resident's state.
--   4. `diet_forecast(from, to)` — per diet type, the residents fed, the
--      quantity and the cost over a window, for the Management → Diets
--      page beside the medication forecast. Excludes deceased and adopted
--      residents, and fostered ones too: carers feed at home.
--   5. `record_intake()` takes the size and an optional starting diet type,
--      written as the first resident_diets row dated to the intake.
--
-- Written to be safely re-runnable after a partial failure.

-- =========================================================================
-- 1. residents.size
-- =========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'resident_size') then
    create type resident_size as enum ('Small', 'Medium', 'Large');
  end if;
end;
$$;

alter table residents add column if not exists size resident_size;

comment on column residents.size is
  'Small / Medium / Large. Drives the default daily quantity of each diet type (diet_types.daily_qty_*) and shows on the public adoption pages. Required by the forms; null only for residents intaken before 0051.';

-- The public profile view gains the size. CREATE OR REPLACE keeps the
-- grants (SELECT only to anon, per 0025) — the column is appended, which
-- is the one shape of change a view replace allows.
create or replace view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  r.profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

-- =========================================================================
-- 2. diet_types
-- =========================================================================

create table if not exists diet_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null default 'g',
  cost_per_unit numeric(10, 2) not null default 0,
  daily_qty_small numeric not null,
  daily_qty_medium numeric not null,
  daily_qty_large numeric not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint diet_types_cost_nonnegative check (cost_per_unit >= 0),
  constraint diet_types_qty_positive check (
    daily_qty_small > 0 and daily_qty_medium > 0 and daily_qty_large > 0
  )
);

comment on table diet_types is
  'The food product list (Management → Diets): what a diet is bought and served in, its cost per unit in baht, and the daily quantity for a small / medium / large animal.';
comment on column diet_types.unit is
  'What one of it is — g, ml, can, sachet, cup. daily_qty_* and cost_per_unit are in this unit.';
comment on column diet_types.cost_per_unit is
  'Baht per unit, for the food forecast. Zero until management has a price.';

alter table diet_types enable row level security;

drop policy if exists admin_all_diet_types on diet_types;
create policy admin_all_diet_types on diet_types
  for all using (current_user_role() = 'admin');

drop policy if exists management_rw_diet_types on diet_types;
create policy management_rw_diet_types on diet_types
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');

drop policy if exists staff_read_diet_types on diet_types;
create policy staff_read_diet_types on diet_types
  for select using (current_user_role() = 'staff');

drop policy if exists vet_read_diet_types on diet_types;
create policy vet_read_diet_types on diet_types
  for select using (current_user_role() = 'vet');

drop policy if exists volunteer_read_diet_types on diet_types;
create policy volunteer_read_diet_types on diet_types
  for select using (current_user_role() = 'volunteer');

-- =========================================================================
-- 3. resident_diets
-- =========================================================================

create table if not exists resident_diets (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  diet_type_id uuid not null references diet_types (id),
  start_date date not null,
  end_date date,
  meals_per_day integer not null default 2,
  daily_quantity numeric,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint resident_diets_end_after_start check (end_date is null or end_date >= start_date),
  constraint resident_diets_meals_positive check (meals_per_day > 0),
  constraint resident_diets_quantity_positive check (daily_quantity is null or daily_quantity > 0)
);

comment on table resident_diets is
  'A resident''s dietary requirements over time, one row per diet type per period. Several may run at once. Null end_date = ongoing.';
comment on column resident_diets.daily_quantity is
  'Per-resident daily quantity in the diet type''s unit, overriding the type''s default for the resident''s size. Null = use the size default.';

create index if not exists resident_diets_resident_id_idx on resident_diets (resident_id);
create index if not exists resident_diets_diet_type_id_idx on resident_diets (diet_type_id);
create index if not exists resident_diets_active_idx on resident_diets (resident_id) where end_date is null;

alter table resident_diets enable row level security;

drop policy if exists admin_all_resident_diets on resident_diets;
create policy admin_all_resident_diets on resident_diets
  for all using (current_user_role() = 'admin');

-- Staff record diets day to day; management mirrors staff (0039); vets set
-- prescription diets. Volunteers read so they can feed correctly.
drop policy if exists staff_read_resident_diets on resident_diets;
create policy staff_read_resident_diets on resident_diets
  for select using (current_user_role() = 'staff');
drop policy if exists staff_insert_resident_diets on resident_diets;
create policy staff_insert_resident_diets on resident_diets
  for insert with check (current_user_role() = 'staff');
drop policy if exists staff_update_resident_diets on resident_diets;
create policy staff_update_resident_diets on resident_diets
  for update using (current_user_role() = 'staff');

drop policy if exists management_read_resident_diets on resident_diets;
create policy management_read_resident_diets on resident_diets
  for select using (current_user_role() = 'management');
drop policy if exists management_insert_resident_diets on resident_diets;
create policy management_insert_resident_diets on resident_diets
  for insert with check (current_user_role() = 'management');
drop policy if exists management_update_resident_diets on resident_diets;
create policy management_update_resident_diets on resident_diets
  for update using (current_user_role() = 'management');

drop policy if exists vet_read_resident_diets on resident_diets;
create policy vet_read_resident_diets on resident_diets
  for select using (current_user_role() = 'vet');
drop policy if exists vet_insert_resident_diets on resident_diets;
create policy vet_insert_resident_diets on resident_diets
  for insert with check (current_user_role() = 'vet');
drop policy if exists vet_update_resident_diets on resident_diets;
create policy vet_update_resident_diets on resident_diets
  for update using (current_user_role() = 'vet');

drop policy if exists volunteer_read_resident_diets on resident_diets;
create policy volunteer_read_resident_diets on resident_diets
  for select using (current_user_role() = 'volunteer');

-- A closed record (0026) is closed for diets too.
drop trigger if exists resident_diets_deceased_lock on resident_diets;
create trigger resident_diets_deceased_lock
  before insert or update or delete on resident_diets
  for each row execute function enforce_deceased_lock('resident_id');

-- =========================================================================
-- 4. diet_forecast
-- =========================================================================
--
-- Quantity = for every diet row overlapping the window, the overlapping
-- days × the daily quantity (the row's own override, else the type's
-- default for the resident's size — Medium when the size isn't set yet).
-- Cost = quantity × the type's cost per unit. Fostered residents are fed
-- by their carer, so they're out along with deceased and adopted.

create or replace function diet_forecast(p_from date, p_to date)
returns table (
  diet_type_id uuid,
  diet_type_name text,
  unit text,
  diet_count bigint,
  resident_count bigint,
  quantity numeric,
  cost numeric
)
language sql
stable
set search_path = public
as $$
  select
    dt.id,
    dt.name,
    dt.unit,
    count(rd.id),
    count(distinct rd.resident_id),
    coalesce(sum(q.days * q.per_day), 0),
    coalesce(sum(q.days * q.per_day), 0) * dt.cost_per_unit
  from diet_types dt
  join resident_diets rd on rd.diet_type_id = dt.id
  join residents r on r.id = rd.resident_id
  join resident_current_state s on s.resident_id = rd.resident_id
  cross join lateral (
    select
      (least(p_to, coalesce(rd.end_date, p_to)) - greatest(p_from, rd.start_date) + 1)::numeric as days,
      coalesce(
        rd.daily_quantity,
        case coalesce(r.size, 'Medium'::resident_size)
          when 'Small' then dt.daily_qty_small
          when 'Large' then dt.daily_qty_large
          else dt.daily_qty_medium
        end
      ) as per_day
  ) q
  where rd.start_date <= p_to
    and (rd.end_date is null or rd.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted', 'Fostered')
  group by dt.id, dt.name, dt.unit, dt.cost_per_unit;
$$;

-- =========================================================================
-- 5. record_intake: size and an optional starting diet
-- =========================================================================
--
-- New parameters, so the 0029 signature is dropped and re-created rather
-- than replaced in place.

drop function if exists record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text,
  text, boolean, boolean, uuid, text, uuid, text, numeric
);

create function record_intake(
  p_name text,
  p_intake_date date,
  p_thai_name text default null,
  p_other_names text default null,
  p_species text default null,
  p_breed text default null,
  p_sex text default null,
  p_estimated_age_years numeric default null,
  p_bio text default null,
  p_temperament_notes text default null,
  p_past_story_notes text default null,
  p_behaviour_notes text default null,
  p_ready_for_adoption boolean default false,
  p_is_public_visible boolean default false,
  p_enclosure_id uuid default null,
  p_notes text default null,
  p_group_origin_id uuid default null,
  p_new_origin_name text default null,
  p_weight_kg numeric default null,
  p_size resident_size default null,
  p_diet_type_id uuid default null
)
returns residents
language plpgsql
security invoker
as $$
declare
  v_resident residents;
  v_enclosure_id uuid := p_enclosure_id;
  v_zone_id uuid;
  v_group_origin_id uuid := p_group_origin_id;
begin
  if v_enclosure_id is null then
    select e.id into v_enclosure_id
    from enclosures e
    join zones z on z.id = e.zone_id
    where z.name = 'Lifecycle' and e.name = 'Unassigned';

    if v_enclosure_id is null then
      raise exception 'Unassigned pseudo-enclosure not found — check the Lifecycle zone seed data';
    end if;
  end if;

  select e.zone_id into v_zone_id from enclosures e where e.id = v_enclosure_id;

  if p_new_origin_name is not null and length(trim(p_new_origin_name)) > 0 then
    insert into group_origins (name, date)
    values (trim(p_new_origin_name), p_intake_date)
    returning id into v_group_origin_id;
  end if;

  insert into residents (
    name, thai_name, other_names, species, breed, sex, size,
    estimated_age_years, age_estimated_on, intake_date, bio,
    temperament_notes, past_story_notes, behaviour_notes,
    ready_for_adoption, is_public_visible, group_origin_id, created_by
  )
  values (
    p_name, p_thai_name, p_other_names, p_species, p_breed, p_sex, p_size,
    p_estimated_age_years, p_intake_date, p_intake_date, p_bio,
    p_temperament_notes, p_past_story_notes, p_behaviour_notes,
    p_ready_for_adoption, p_is_public_visible, v_group_origin_id, auth.uid()
  )
  returning * into v_resident;

  insert into placement_history (
    resident_id, placement_type, start_date, zone_id, enclosure_id, notes, created_by
  )
  values (
    v_resident.id, 'Intake', p_intake_date::timestamptz, v_zone_id, v_enclosure_id,
    p_notes, auth.uid()
  );

  if p_weight_kg is not null then
    insert into weight (resident_id, date, weight_kg, created_by)
    values (v_resident.id, p_intake_date, p_weight_kg, auth.uid());
  end if;

  if p_diet_type_id is not null then
    insert into resident_diets (resident_id, diet_type_id, start_date, created_by)
    values (v_resident.id, p_diet_type_id, p_intake_date, auth.uid());
  end if;

  return v_resident;
end;
$$;

notify pgrst, 'reload schema';
