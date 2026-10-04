-- consumer: src/lib/permissions/jobs.ts, src/lib/home/tiles.ts, src/app/stocktake/page.tsx, src/app/deliveries/page.tsx, src/app/deliveries/actions.ts, src/app/management/purchasing/page.tsx, src/app/api/photos/[fileId]/route.ts
--
-- R4, the third configured role (docs/roles-and-permissions.md §12; copies 0136 and 0141,
-- decisions/2026-10-04-2ic-role.md): the 2IC. A row in `roles`, never an enum value.
--
-- HER CELLS (Lutan, 2026-10-04: the whiteboard's tiles, everything else None; P1 adds a delivery,
-- P4 her own recurring tasks):
--   stock.count          yes   Do Stocktaking
--   stock.purchasing     yes   Do the Purchasing
--   stock.delivery       yes   Record a delivery (P1)
--   maintenance.jobs     edit  Do Maintenance (0141's job, unchanged)
--   maintenance.progress yes
--   recurring.do_own     yes   mark her own recurring tasks done (P4); NOT recurring.manage (P2)
--   resident.record      read  who and where (0134), the picker on a job
--   facility.enclosures  read  the board names and picks them (0141)
-- Not given: stock.usage, stock.medications, stock.diets, stock.correct (Management's), any
-- medical, contacts, money, photos on a job, or deleting one.
--
-- THE LEGACY_ROLE CALL: `volunteer`, the narrowest floor, not `staff`. A staff floor would admit
-- her to every table staff reads (all residents, the whole medical record, contacts) through the
-- role-named policies, which makes "everything else None" true only in the app. With the volunteer
-- floor the cells are the whole grant, and the price is this file: every stock table below answers
-- by role name, so each is given a policy, a view or a guard that asks the cell.
--
-- WHAT THE FOUR SCREENS NEED BEYOND THE CELLS (all additive; admin, management and staff keep
-- the role-named policies they have, and none of their answers change):
--   stock_medications, stock_diet_types   fixed-column views of medication and diet_types WITHOUT
--                    cost_per_unit (the price of a medicine is Management's) and without the daily
--                    quantities. Rows for a login holding ANY of the three stock cells: the figures
--                    a stocktake, a delivery and an order each read are the same, and there is no
--                    "read stock" activity, so the dependency lives here and not in a bundle.
--   stock_vendors    the suppliers a delivery and an order name: id, name, archived only.
--   stock_counts, item_unit_conversions   select policies on any of the three cells (nothing
--                    private in either: a count, and how a pack converts).
--   stock_receipts   select on stock.delivery or stock.purchasing (an order needs what has arrived
--                    since the last count); insert and delete on stock.delivery. Its cost column is
--                    visible to a holder, which is fine: she types it.
--   record_stocktake()  the guard also admits a login holding stock.count.
--   stock_medication_forecast(), stock_diet_forecast()   what the purchasing page asked of
--                    medication_forecast / diet_forecast, which are security invoker and read
--                    prescriptions and diets she must not see. Definer wrappers on stock.purchasing,
--                    returning the same rows and, for diets, WITHOUT the cost column.
--
-- Written to be safely re-runnable. To undo: drop the three views, the two functions and the
-- five policies below, restore record_stocktake() from 0134, delete the role's role_permissions
-- rows and the role row.

-- ---------------------------------------------------------------------------
-- 1. The role and its cells
-- ---------------------------------------------------------------------------
insert into roles (key, name, name_th, kind, opens_app, home_path, legacy_role,
                   scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
values ('second_in_command', '2IC', 'รองผู้จัดการ', 'custom', true, '/home', 'volunteer',
        'all', 'any', 'name_type', 'medical_only', false)
on conflict (key) do nothing;

insert into role_permissions (role_id, activity, level)
select r.id, c.activity, c.level
  from roles r
  cross join (values ('stock.count', 2), ('stock.purchasing', 2), ('stock.delivery', 2),
                     ('maintenance.jobs', 2), ('maintenance.progress', 2), ('recurring.do_own', 2),
                     ('resident.record', 1), ('facility.enclosures', 1)) as c(activity, level)
 where r.key = 'second_in_command'
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Stock figures, without prices
-- ---------------------------------------------------------------------------
create or replace view stock_medications as
select m.id, m.name, m.dose_unit, m.stock_on_hand, m.stock_counted_at, m.reorder_lead_days,
       m.safety_stock, m.label_drive_file_id
  from medication m
 where (select has_permission('stock.count'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'));

create or replace view stock_diet_types as
select d.id, d.name, d.unit, d.stock_on_hand, d.stock_counted_at, d.reorder_lead_days,
       d.safety_stock, d.is_standard
  from diet_types d
 where (select has_permission('stock.count'))
    or (select has_permission('stock.delivery'))
    or (select has_permission('stock.purchasing'));

create or replace view stock_vendors as
select c.id, c.name, c.archived_at
  from contacts c
 where c.type = 'Vendor'
   and ((select has_permission('stock.delivery')) or (select has_permission('stock.purchasing')));

comment on view stock_medications is
  'What the stock screens (stocktake, deliveries, purchasing) read of a medicine (0143): name, unit, stock, reorder and label. No cost. Rows for a login holding stock.count, stock.delivery or stock.purchasing. A new medication column is private until it is added here.';
comment on view stock_diet_types is
  'What the stock screens read of a diet type (0143): name, unit, stock, reorder, standard flag. No cost, no daily quantities. Rows for a login holding stock.count, stock.delivery or stock.purchasing. A new diet_types column is private until it is added here.';
comment on view stock_vendors is
  'The suppliers a delivery or an order names (0143): id, name, archived. Rows for a login holding stock.delivery or stock.purchasing.';

revoke all on stock_medications, stock_diet_types, stock_vendors from anon, authenticated, service_role;
grant select on stock_medications, stock_diet_types, stock_vendors to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Counts, conversions and deliveries
-- ---------------------------------------------------------------------------
drop policy if exists stock_counts_select_perm on stock_counts;
create policy stock_counts_select_perm on stock_counts for select to authenticated
  using ((select has_permission('stock.count')) or (select has_permission('stock.delivery'))
         or (select has_permission('stock.purchasing')));

drop policy if exists item_unit_conversions_select_perm on item_unit_conversions;
create policy item_unit_conversions_select_perm on item_unit_conversions for select to authenticated
  using ((select has_permission('stock.count')) or (select has_permission('stock.delivery'))
         or (select has_permission('stock.purchasing')));

drop policy if exists stock_receipts_select_perm on stock_receipts;
create policy stock_receipts_select_perm on stock_receipts for select to authenticated
  using ((select has_permission('stock.delivery')) or (select has_permission('stock.purchasing')));

drop policy if exists stock_receipts_insert_perm on stock_receipts;
create policy stock_receipts_insert_perm on stock_receipts for insert to authenticated
  with check ((select has_permission('stock.delivery')));

drop policy if exists stock_receipts_delete_perm on stock_receipts;
create policy stock_receipts_delete_perm on stock_receipts for delete to authenticated
  using ((select has_permission('stock.delivery')));

-- ---------------------------------------------------------------------------
-- 4. The stocktake: the live body of 0134 with the guard also admitting stock.count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_stocktake(p_medication jsonb DEFAULT NULL::jsonb, p_diet_types jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(medication_updated integer, diet_types_updated integer, counted_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_lists jsonb := jsonb_build_object(
    'medication', coalesce(p_medication, '[]'::jsonb),
    'diet_types', coalesce(p_diet_types, '[]'::jsonb)
  );
  v_kind text;
  v_label text;
  v_bad integer;
  v_repeated integer;
  v_med integer := 0;
  v_diet integer := 0;
  v_stocktake uuid := gen_random_uuid();
begin
  if current_user_role() is null
     or (current_user_role() not in ('admin', 'management', 'staff') and not has_permission('stock.count')) then
    raise exception 'Not authorized to record a stocktake.';
  end if;

  foreach v_kind in array array['medication', 'diet_types'] loop
    v_label := case v_kind when 'medication' then 'medication' else 'diet type' end;
    if jsonb_typeof(v_lists -> v_kind) <> 'array' then
      raise exception 'The % counts must be a list.', v_label;
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where jsonb_typeof(e) <> 'object'
          or jsonb_typeof(e -> 'id') is distinct from 'string'
          or (e ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          or jsonb_typeof(e -> 'count') is distinct from 'number'
    ) then
      raise exception 'Every % count needs an id and a number. Leave out an item that was not counted.', v_label;
    end if;
    select count(*) filter (where (e ->> 'count')::numeric < 0),
           count(*) - count(distinct (e ->> 'id')::uuid)
      into v_bad, v_repeated
      from jsonb_array_elements(v_lists -> v_kind) e;
    if v_bad > 0 then
      raise exception 'A stock count cannot be negative.';
    end if;
    if v_repeated > 0 then
      raise exception 'The same % is listed twice.', v_label;
    end if;
    -- Optional "entered": when present it must be well-formed and add up to
    -- count, the same rule the stock_counts CHECK would enforce, raised here
    -- first so the message names the problem.
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where e ? 'entered'
         and jsonb_typeof(e -> 'entered') <> 'null'
         and (units_entered_total(e -> 'entered') is null
              or abs(units_entered_total(e -> 'entered') - (e ->> 'count')::numeric)
                   > 0.000001 * greatest(1, (e ->> 'count')::numeric))
    ) then
      raise exception 'The units entered for a % count do not add up to the count.', v_label;
    end if;
  end loop;

  update medication m
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, count numeric)
   where m.id = x.id;
  get diagnostics v_med = row_count;
  if v_med <> jsonb_array_length(v_lists -> 'medication') then
    raise exception 'Stocktake not saved: % of % medications were found. Reload the page and count again.',
      v_med, jsonb_array_length(v_lists -> 'medication');
  end if;

  update diet_types d
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, count numeric)
   where d.id = x.id;
  get diagnostics v_diet = row_count;
  if v_diet <> jsonb_array_length(v_lists -> 'diet_types') then
    raise exception 'Stocktake not saved: % of % diet types were found. Reload the page and count again.',
      v_diet, jsonb_array_length(v_lists -> 'diet_types');
  end if;

  insert into stock_counts
    (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at, counted_by, entered)
  select v_stocktake, 'medication', m.id, m.stock_on_hand, m.dose_unit, now(), auth.uid(),
         case when jsonb_typeof(x.entered) = 'array' then x.entered end
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, entered jsonb)
    join medication m on m.id = x.id;

  insert into stock_counts
    (stocktake_id, item_kind, diet_type_id, counted_quantity, unit, counted_at, counted_by, entered)
  select v_stocktake, 'diet_type', d.id, d.stock_on_hand, d.unit, now(), auth.uid(),
         case when jsonb_typeof(x.entered) = 'array' then x.entered end
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, entered jsonb)
    join diet_types d on d.id = x.id;

  return query select v_med, v_diet, now();
end;
$function$;

-- ---------------------------------------------------------------------------
-- 5. What an order is forecast from
-- ---------------------------------------------------------------------------
create or replace function stock_medication_forecast(p_from date, p_to date)
returns table (medication_id uuid, medication_name text, dose_unit text, prescription_count bigint,
               resident_count bigint, dose_count bigint, quantity numeric)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not has_permission('stock.purchasing') then
    raise exception 'Not authorized to read the purchasing forecast.' using errcode = 'insufficient_privilege';
  end if;
  return query select * from medication_forecast(p_from, p_to);
end;
$$;

-- Same rows as diet_forecast() without its cost column: the price of a diet is Management's.
create or replace function stock_diet_forecast(p_from date, p_to date)
returns table (diet_type_id uuid, diet_type_name text, unit text, diet_count bigint,
               resident_count bigint, quantity numeric)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not has_permission('stock.purchasing') then
    raise exception 'Not authorized to read the purchasing forecast.' using errcode = 'insufficient_privilege';
  end if;
  return query select f.diet_type_id, f.diet_type_name, f.unit, f.diet_count, f.resident_count, f.quantity
                 from diet_forecast(p_from, p_to) f;
end;
$$;

revoke all on function stock_medication_forecast(date, date), stock_diet_forecast(date, date) from public, anon;
grant execute on function stock_medication_forecast(date, date), stock_diet_forecast(date, date) to authenticated, service_role;
