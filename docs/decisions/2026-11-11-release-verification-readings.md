# Two release-verification readings (#rv4qk), 2026-11-11

**`supplier-vendor-rows`** (new, `scripts/lib/readonly-checks.mjs`) returns one row of counts: Vendor contacts live / archived /
archived by 0348 (`archive_reason = 'Moved to Suppliers (0348)'`), suppliers live / archived, and four booleans for what 0348 drops
(`stock_vendors`, `stock_receipts.supplier_contact_id`, `stock_deliveries.supplier_contact_id`, `suppliers.source_contact_id`). It is a
query returning rows, because a migration's `RAISE NOTICE` never comes back through the Management API. It names none of the dropped
columns (the booleans read the catalogue), so it cannot error on either side of 0348.

**`--env uat`**: `check-production.mjs` already loads its environment through `scripts/lib/env.mjs`, which has listed `uat` since the UAT
go-live (`.env.deploy.uat`, UAT's own Supabase project). Only the script's own allow-list refused it. The fix is one word in that list.
No second path, no allow rule change (the existing allow rule is on the script, and `--env uat` is an argument to it).

**Proved:** on test (ref `qxkmhwybjggxvsfxsxbd`) and UAT (ref `fsjagxmxjosauwmxwype`, a different project) the reading answers; the rows differ
(test: 0 Vendor contacts, 1 supplier; UAT: 13 Vendor contacts archived by 0348, 13 suppliers). Both are AFTER 0348.

**Still cannot see:** the before side was not run live. Every database reachable here already has 0348, so the query's pre-0348 behaviour
is by construction (it references only columns that exist both sides), not by run. It cannot show which contacts were moved, only counts;
and it does not cover the 0347 before-picture itself, only makes UAT askable.

**Same kind of work?** Yes, as the planner folded them: the UAT half was a one-word change, not plumbing.
