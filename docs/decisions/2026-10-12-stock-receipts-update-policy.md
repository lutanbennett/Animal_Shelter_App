# 2026-10-12 — stock_receipts gets an update policy

`bills-inbox` needs to write a bill's cost onto a delivery that already exists (`stock_receipts.cost`, 0096).
Found by running the bills role harness against dev: an update by Management, Admin and the 2IC touched 0 rows.
0143 swapped 0096's catch-all write policy for select, insert and delete policies and left out update, so the
table has been update-proof for any login since. The fix is one policy on the same activity as insert and delete
(`stock.delivery`). It widens nothing in effect: a holder could already delete and re-record. Separate PR so the
schema reaches dev before the screens that need it, as `CLAUDE.md` requires.
