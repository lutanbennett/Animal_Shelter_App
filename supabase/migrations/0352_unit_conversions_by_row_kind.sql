-- consumer: src/lib/permissions/item-settings.ts
-- #q7dn3: item_unit_conversions' WRITE policies asked stock.diets for every row, medicine rows included.
-- The app (item-settings.ts) already asks stock.medications for a medicine and stock.diets for an
-- ingredient; the database disagreed. 0145 defined the unscoped policies (0148 does not touch this table).
-- Permissive policies OR together, so the 0145 policies are dropped, not supplemented.
-- 0340's diets.settings policies are already scoped to ingredient rows and are left alone; the READ
-- policy (0143) is left alone too.

drop policy if exists item_unit_conversions_insert_perm on item_unit_conversions;
create policy item_unit_conversions_insert_perm on item_unit_conversions for insert to authenticated
  with check (
    (item_kind = 'diet_type' and (select has_permission('stock.diets')))
    or (item_kind = 'medication' and (select has_permission('stock.medications')))
  );

drop policy if exists item_unit_conversions_update_perm on item_unit_conversions;
create policy item_unit_conversions_update_perm on item_unit_conversions for update to authenticated
  using (
    (item_kind = 'diet_type' and (select has_permission('stock.diets')))
    or (item_kind = 'medication' and (select has_permission('stock.medications')))
  )
  with check (
    (item_kind = 'diet_type' and (select has_permission('stock.diets')))
    or (item_kind = 'medication' and (select has_permission('stock.medications')))
  );

drop policy if exists item_unit_conversions_delete_perm on item_unit_conversions;
create policy item_unit_conversions_delete_perm on item_unit_conversions for delete to authenticated
  using (
    (item_kind = 'diet_type' and (select has_permission('stock.diets')))
    or (item_kind = 'medication' and (select has_permission('stock.medications')))
  );
