-- consumer: src/lib/prescriptions/options.ts, src/lib/diets/options.ts
--
-- N1 and N2 (docs/decisions/2026-10-06-perm-convert-stock-and-lists.md): staff read `medication.cost_per_unit` and the
-- diet prices only because the prescription form, the diet picker and the intake form read the tables directly, so
-- `reference.add_while_recording` and `resident.register` had to stay in the two read policies. App first: those
-- readers now read the two fixed-column views below (no price, no stock); then the add cell and the register cell come
-- out of the two read policies and a login holding only those reads nothing off the tables.
--
--   picker_medications   id, name, dose_unit        for a login holding stock.medications Read or the add cell
--   picker_diet_types    id, name, unit, the three daily quantities, is_standard
--                                                   for a login holding stock.diets Read or resident.register
--
-- The audience of each view is the old table audience plus the medical cell for the same list (medical.prescriptions,
-- medical.diet), so the vet's embeds on a resident's page keep their names now that the views carry them; those cells
-- see names and units only, which is what the 2IC and Head of Medical already read through their own views.
-- The two policies after this file ask only the price cells (stock.medications, stock.diets), which are meant to see
-- prices; the vet's own vet_read_* policies are untouched (the vet half of the Security item, C10).

-- ---------------------------------------------------------------------------
-- 1. The views
-- ---------------------------------------------------------------------------
create or replace view picker_medications as
select m.id, m.name, m.dose_unit
  from medication m
 where (select has_permission('stock.medications', 'read'))
    or (select has_permission('reference.add_while_recording'))
    or (select has_permission('medical.prescriptions', 'read'));

create or replace view picker_diet_types as
select d.id, d.name, d.unit, d.daily_qty_small, d.daily_qty_medium, d.daily_qty_large, d.is_standard
  from diet_types d
 where (select has_permission('stock.diets', 'read'))
    or (select has_permission('resident.register'))
    or (select has_permission('medical.diet', 'read'));

comment on view picker_medications is
  'What a form that picks a medicine reads of one (0151): id, name, unit. No cost, stock, reorder or label. Rows for a login holding stock.medications Read, reference.add_while_recording or medical.prescriptions Read. A new medication column is private until it is added here.';
comment on view picker_diet_types is
  'What a form that picks a diet reads of one (0151): id, name, unit, the daily quantity for a small, medium and large animal, the standard flag. No cost, stock or reorder. Rows for a login holding stock.diets Read, resident.register or medical.diet Read. A new diet_types column is private until it is added here.';

revoke all on picker_medications, picker_diet_types from anon, authenticated, service_role;
grant select on picker_medications, picker_diet_types to authenticated, service_role;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 2. The two read policies, without the add cell and the register cell
-- ---------------------------------------------------------------------------
-- Everything below is the last thing in this file on purpose: the readers moved to the views first, so narrowing
-- the tables can no longer break the prescription form, the diet picker or the intake form. A login holding only
-- reference.add_while_recording can still INSERT a medication (0148's insert policy, unchanged); the form makes
-- the new id itself, because INSERT ... RETURNING would need the row to pass this select policy.
drop policy if exists medication_select_perm on medication;
create policy medication_select_perm on medication for select to authenticated
  using ((select has_permission('stock.medications', 'read')));

drop policy if exists diet_types_select_perm on diet_types;
create policy diet_types_select_perm on diet_types for select to authenticated
  using ((select has_permission('stock.diets', 'read')));
