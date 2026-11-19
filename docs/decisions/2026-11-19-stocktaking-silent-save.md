# 2026-11-19 — Stocktaking switches no longer report success when no row was written (#stcnt, app half)

**Step zero:** gap still present. `setStocktakingSwitch` did `update … where id = true` and only checked `error`.

**Change:** `src/app/admin/stocktaking/actions.ts` adds `.select("id")` to the update and fails with the new
`admin.stocktaking.errors.noRow` message when no row comes back (en + th). Chosen over a separate existence
check because it is one round trip and cannot disagree with the write itself. The person sees: *"This shelter has
no settings row yet, so the switch was not saved. Ask the product administrator to set the shelter up, then try again."*
(the dictionaries are `platform-console-finish`'s files; one line added to each, nothing else.)

**Proof:** `supabase/harness/stocktaking-zero-row-write.sql` (rolled back): row present -> 1 row updated; row deleted ->
0 rows and no error. That is exactly the empty array the new check reads.

**Deliverable 5 — can dev-signin sign in to a non-default shelter?** No. It has no shelter option; it upserts its role
on `shelter_id,key` with the dev shelter header only, so a login only ever has a role on the default shelter. Standing one
up for `test-shelter-2` would be a new instrument. So the second clause of #stcnt is blocked and the item is NOT ticked.
The app-level press (row missing) was not driven: that needs deleting a live row, which the brief forbids outside a rollback.

**Same shape elsewhere (findings for the planner, not fixed):** `.eq("id", true)` updates on `site_content` that check only `error`:
`src/app/admin/website/actions.ts` lines 100, 108, 284, 375, 494, 586, 612, 1112, 1119, 1142, 1149, 1175 (and reads in
`src/lib/site/content.ts` 83, 227). Same silent zero-row success if the row is absent.
