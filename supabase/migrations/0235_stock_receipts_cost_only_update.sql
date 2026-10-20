-- consumer: src/app/bills/actions.ts
--
-- A delivery is the record of what arrived: a wrong one is deleted and recorded again, so the audit trail shows
-- the correction (0145 C8). 0191 added a whole-row update policy for the bills inbox, which needs exactly one
-- thing: writing the bill's cost onto a delivery. That left note, quantity, item, supplier and date editable by
-- every stock.delivery holder (admin, management, the 2IC, the delivery lead), found by check-2ic-role 2026-10-19.
-- The 0191 policy stays (the bills inbox still needs an update to pass RLS); this trigger narrows what an update
-- may change to the cost column alone. Anything else is refused with the instruction to delete and re-record.
-- Cost edits are still recorded by audit_stock_receipts (0195).
-- Re-runnable. To undo: drop trigger stock_receipts_cost_only on stock_receipts.

create or replace function stock_receipts_cost_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'cost') is distinct from (to_jsonb(old) - 'cost') then
    raise exception 'A delivery cannot be edited: delete it and record it again. Only its cost can be changed.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists stock_receipts_cost_only on stock_receipts;
create trigger stock_receipts_cost_only
  before update on stock_receipts
  for each row execute function stock_receipts_cost_only();
