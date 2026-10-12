-- consumer: src/app/bills/actions.ts
--
-- bills-inbox: matching a bill to a delivery writes the bill's cost onto the delivery, which is an UPDATE of
-- stock_receipts. 0143 replaced the old catch-all policy with select, insert and delete policies only, so no
-- login could update a delivery (the grant has always allowed it; only the policy was missing). This adds the
-- update policy, for the same activity that inserts and deletes: stock.delivery. Nobody gains a power they did
-- not have in effect (a holder could already delete a delivery and record it again), and the 0096 trigger
-- keeps unit, recorded_by and created_at fixed on an update.
-- Re-runnable. To undo: drop policy stock_receipts_update_perm on stock_receipts.

drop policy if exists stock_receipts_update_perm on stock_receipts;
create policy stock_receipts_update_perm on stock_receipts for update to authenticated
  using ((select has_permission('stock.delivery')))
  with check ((select has_permission('stock.delivery')));
