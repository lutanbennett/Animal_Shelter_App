# Suppliers leave Contacts: the final clean-up (#xkfsv), 2026-11-09

Third and last half, after the schema half (#1391) and the app half (#1399). Lutan's answer stands: *"Leave contacts entirely"*.

## Step zero, measured 2026-11-09
The three columns and the view were still defined; `grep` of `src/` and `worker/` found no reader. Three check scripts did (below).
Dev: 0 Vendor contacts before and after, 1 supplier row. Production was not read from here.

## Was one day in production enough? Yes, with a guard
The app half's 0338 reached production with 0.44.0. The old columns carry nothing `supplier_id` does not: 0337 and 0338 back-filled it,
and the twinning was counted on production (13 Vendors, 13 suppliers, 13 twinned, none left; #k3mqp). Nothing reads the old columns.
The drop cannot be undone, so `0348` opens with a guard that **refuses to run** if any receipt or delivery still names a contact with no
`supplier_id`. A wrong call therefore stops the apply instead of losing a link.

## What 0348 does
1. Rewrites `stock_deliveries_stamp()` and `stock_receipts_stamp()` without the old columns. These were the hidden readers: 0337's bodies
   named `supplier_contact_id` and `source_contact_id`, and plpgsql is not checked when a column goes, so the dry-run would have passed
   and the first delivery saved afterwards would have failed. Proved on dev by `check-bills-delivery-lines.mjs` (HARNESS-OK).
2. Archives every live Vendor contact (`archive_reason` "Moved to Suppliers (0348)"). **Archive, not delete or retype:** least destructive,
   keeps history and anything pointing at the row, reversible, and Contacts already hides Vendor. Friends were re-pointed by 0338, so none
   is attached. Enum value `Vendor` stays (code still names it).
3. Drops the view, the two `supplier_contact_id` columns and `suppliers.source_contact_id`.

## The twinning check retires with its column (deliverable 3)
`suppliers-backfill` in `readonly-checks.mjs` (and its test in `check-production.test.mjs`) existed to prove the back-fill; it did, on
production. Without `source_contact_id` it cannot be re-run, so it is **deleted deliberately**, not left to fail. In
`check-contact-type-partner.mjs` only the `stock_vendors` assertion (FAIL B) went; the rest of that harness still passes on dev.

## Outstanding
Production apply of `0348` is Lutan's step. Until then production still has the old columns, which is harmless.
