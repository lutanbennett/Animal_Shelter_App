-- consumer: none (the `bills-inbox` and `maintenance-bills` streams read the values 0189 uses)
-- Bills, part 1 of 2: the four attachment owner types a bill photo can hang on.
--
--   clinic_visit      a bill for a clinic visit              (medical.visits)
--   stock_receipt     a bill for a delivery                  (stock.delivery)
--   bill_inbox        a photo not yet matched to anything    (any of the three bill activities)
--   maintenance_bill  a bill kept against a maintenance job  (maintenance.bills)
--
-- A file that adds an enum value cannot also use it: the runner wraps each file in its own
-- transaction (CLAUDE.md "Database migrations"). 0189 uses these.
-- One owner value per thing, not a single `bill` owner: each policy then reads its own parent's
-- activity from owner_type alone, so a 2IC who records deliveries but not clinic visits cannot see a
-- visit's bill. See docs/decisions/2026-10-12-bills-schema.md.
-- Re-runnable.

alter type attachment_owner_type add value if not exists 'clinic_visit';
alter type attachment_owner_type add value if not exists 'stock_receipt';
alter type attachment_owner_type add value if not exists 'bill_inbox';
alter type attachment_owner_type add value if not exists 'maintenance_bill';
