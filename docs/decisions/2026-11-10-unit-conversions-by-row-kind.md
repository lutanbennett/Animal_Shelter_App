# item_unit_conversions write policies split by row kind (#q7dn3, migration 0352)

**Live source of the fault:** `0145_perm_convert_orphans.sql` (three unscoped `*_perm` write policies asking
`stock.diets` for every row). `0148` does not touch this table, so `item-settings.ts`'s comment crediting `0148`
is stale. `0340`'s `diets.settings` policies were already scoped to ingredient rows and were correct.

**Fix:** `0352` drops and recreates 0145's insert/update/delete policies: `item_kind = 'diet_type'` asks
`stock.diets`, `item_kind = 'medication'` asks `stock.medications`, both through `has_permission()`. 0145's
policies had to go, not be supplemented, because permissive policies OR together. Read policy (0143) not touched.

**Discriminator:** `item_kind` (says what it means; 0340 used `diet_type_id is not null`, equivalent through the table's one-item constraint).

**Proof (rollback harness on dev, non-Admin identities, role `authenticated` + JWT sub; nothing committed):**
- (a) medication-Edit-only login: insert, update, delete a medicine row all succeed; refused on an ingredient row.
- (b) `stock.diets`-Edit-only login: insert, update, delete an ingredient row succeed (no regression).
- (c) the same login on a medicine row: refused with `new row violates row-level security policy for table "item_unit_conversions"` (database-only, nothing on screen).

Both throwaway roles also held `stock.count` so the read policy let `returning` and the update's WHERE see rows; that is the same for both.

Method: harness, not `dev-signin --cards`, because **no card grants Edit on `stock.medications` or `stock.diets`**
(found, for the planner to file: the writes these policies guard are reachable by Admin only, and the screen needs `reference.types`, Admin-only by ruling).

**Production:** 0352 is pending behind 0348 (destructive), 0350, 0351; any apply must be pinned with `--upto`.
