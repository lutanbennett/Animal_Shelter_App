# 2026-10-14 — Security schema fold: website read, audit coverage, shelter day (`0195`)

One migration for database-review findings F2, F4 and W1 (`docs/database-review-2026-10-13.md`).

## F2: website tables are read by permission, not by everyone

`public_read_site_*` (`using (true)`) are replaced by `read_site_*`, `to authenticated`. `site_pages` and
`site_content_photos` need `website.content` Read. **`site_content` also admits `reports.cashflow` Read**, because the
cashflow forecast reads `clinic_visit_estimate` from that row (`loadClinicVisitEstimate`); a plain `website.content`
check would have blanked the forecast for a role holding one permission and not the other. Management holds both today.
Visitors are unaffected: `public_site_*` run as their owner and anon has no policy. Proved on dev by role: admin and
management read 1/7/3 rows; doctor, volunteer, head_of_medical, head_of_maintenance and second_in_command read 0; anon
reads the views and is refused the base table. No clinic login exists on dev, so the clinic case rests on doctor reading 0.

## F4: nine tables audited, actors from scripts

`record_audit()` on `placement_history`, `user_roles`, `maintenance`, `maintenance_bills`, `bills_inbox`,
`stock_receipts`, `blood_tests`, `procedures`, `resident_diets`. Extends the 2026-10-01 decision; nothing there is reversed.

- **`user_roles` has no `id`** (key `user_id`) and `audit_log.row_id` is not null, so the unchanged function would have
  raised on every role change. It now falls back to `user_id` for `row_id`.
- **`app.actor`** is used only when `auth.uid()` is null, and only if it parses as a uuid; anything else is ignored rather
  than raised, so an audit trigger can never block the write it records. A signed-in caller cannot pose as someone else.
- **The brief said the correction scripts already set `app.actor`. They do not** (grep over `scripts/`). The database half
  is done; making `scripts/correct-resident.mjs` and its siblings call `set_config('app.actor', ...)` is still to do.

## W1: views moved to `shelter_today()`, not dropped

`prescription_round_status` and `resident_diet_round_status` filtered on `current_date`; now `shelter_today()`.
(`frequency_round_status` never had a date filter.) Verified: no reader in `src/` or `worker/`, **but**
`scripts/check-medication-rounds.mjs` reads all three and `check-view-write-grants.mjs` lists them. Dropping would break
two checks to save nothing. `maintenance_bills.bill_date` now defaults to `shelter_today()`.
