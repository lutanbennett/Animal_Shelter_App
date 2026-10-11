-- consumer: none
-- Stock on hand and reorder lead time on immunization_types (backlog, "Vaccine
-- stock forecast"; schema half — claude/vaccine-stock-forecast reads these).
--
-- Lutan confirmed 2026-10-10 that vaccines are bought ahead and kept, but 0083
-- gave stock columns to medication and diet_types only, so there is nowhere to
-- record how many doses are on the shelf. Same three columns, same rules:
--
--   stock_on_hand      numeric, null. In DOSES, the unit immunization_due_dates
--                      counts in. Null = never counted, distinct from 0 = out.
--   stock_counted_at   timestamptz, null. Stamped by the existing trigger
--                      function; callers cannot set it.
--   reorder_lead_days  integer, null. Days the supplier takes. Null = no flag.
--
-- Reuses stamp_stock_counted_at() from 0083 (it only touches the NEW row's
-- stock_on_hand / stock_counted_at, so it is table-agnostic). Additive,
-- re-runnable; existing table-level grants and RLS cover the new columns.

alter table immunization_types add column if not exists stock_on_hand numeric;
alter table immunization_types add column if not exists stock_counted_at timestamptz;
alter table immunization_types add column if not exists reorder_lead_days integer;

alter table immunization_types drop constraint if exists immunization_types_stock_on_hand_nonnegative;
alter table immunization_types add constraint immunization_types_stock_on_hand_nonnegative
  check (stock_on_hand is null or stock_on_hand >= 0);
alter table immunization_types drop constraint if exists immunization_types_reorder_lead_days_positive;
alter table immunization_types add constraint immunization_types_reorder_lead_days_positive
  check (reorder_lead_days is null or reorder_lead_days > 0);

comment on column immunization_types.stock_on_hand is
  'Doses on the shelf (the unit immunization_due_dates counts in). Null = never counted, distinct from 0 = out of stock.';
comment on column immunization_types.stock_counted_at is
  'When stock_on_hand was last set (stamped by trigger stamp_stock_counted_at, also on re-saving the same figure). Callers cannot set it.';
comment on column immunization_types.reorder_lead_days is
  'Days the supplier takes to deliver. Null = never flagged.';

drop trigger if exists immunization_types_stock_1_keep on immunization_types;
create trigger immunization_types_stock_1_keep
  before update on immunization_types
  for each row execute function stamp_stock_counted_at('keep');
drop trigger if exists immunization_types_stock_2_stamp on immunization_types;
create trigger immunization_types_stock_2_stamp
  before insert or update of stock_on_hand on immunization_types
  for each row execute function stamp_stock_counted_at();

notify pgrst, 'reload schema';
