# `NOT NULL` on every `shelter_id` (#stmp5 step 3), and the writers it would have broken

**Status: applied to dev (`0397_shelter_id_not_null.sql`); not in any release.** 105 of 105 base-table `shelter_id` columns are `NOT NULL`; `check-null-shelter-id.mjs` reads `ok … 105 objects`.

## The gate was not "Part 7"
`0390` defaults every column to `current_shelter_id()`, which reads only the `x-shelter-id` request header. pg_cron and the service role send none, so the default is null: a silent null row today, a hard error with `NOT NULL`. The registry reads `src/` only, so it could not see the SQL writers. Enumerated from the **live** database (`pg_proc`, `cron.job`, `pg_trigger`), not the files.

## Live enumeration (dev, 2026-11-17)
**Cron (3):** `purge_assistant_actions` (deletes only, fine), `purge_write_requests` (deletes only, fine), `purge_donation_tax_ids` (inserts `retention_runs` with no shelter: **stamped**).

**28 functions in `public` that `insert into` a table carrying `shelter_id`.** Classified:
- *Signed-in request, header present, fine:* `assign_pending_photo`, `claim_write_request`, `merge_doctors`, `place_merch_order` (the app passes the shelter, Part 7), `propose_label_th`, `propose_website_draft`, `reassign_recurring_job`, `recompute_role_permissions`, `record_attachment`, `record_immunization`, `record_immunizations_bulk`, `record_immunizations_fanout`, `record_intake`, `record_recurring_job`, `record_stock_correction`, `record_stocktake`, `schedule_bulk_appointments`, `set_role_cards`, `undo_deceased_placement`.
- *Already stamp from their row:* `record_audit`, `site_content_hidden_pages_audit`, `site_content_stocktaking_audit` (0389), `reset_diet_rounds` (0383), `issue_donation_receipt` (0395), `clinic_visits_link_doctor`.
- *Headerless when a service-role/cron statement fires them, and did not stamp:* `queue_translations` (→ `translations`), `record_label_sources` (→ `label_sources`), `purge_donation_tax_ids` (→ `retention_runs`). **These three were fixed.**
- Other trigger functions that write (`close_prior_placement`, `handle_deceased_placement`, `doctors_*`, `item_unit_conversions_*`, `prescriptions_carry_dose`, `project_folders_after_move`) only update existing rows; they insert nothing tenant-shaped.

## What was stamped, and how (no Lanna fallback anywhere)
- `purge_donation_tax_ids`: loops over `shelters`, deletes each shelter's expired rows, writes one `retention_runs` row per shelter stamped from `shelters.id`. A shelter with nothing to purge still gets its row (as before, the job always logged a run).
- `queue_translations`, `record_label_sources`: the triggering row's own `shelter_id` (the `0383` parent-row pattern), else `current_shelter_id()` for a source table with no `shelter_id`. If neither exists the insert errors under `NOT NULL`, which is the intended loud failure.

## One file or two: one
The runner commits per file, so two files would let `NOT NULL` reach a database before the writers' fix. One file is one transaction: the order cannot be got wrong, and `--dry-run` validates the whole of it (it said `ok`). The file also refuses, naming the table, if any null row remains.

## Proof (what was exercised)
Before: `check-null-shelter-id.mjs` → `ok … 105`. After apply, **headerless** (Management API, no header): `purge_donation_tax_ids()`, `purge_assistant_actions()`, `purge_write_requests()` all ran without error and `retention_runs` has 0 null rows; a rolled-back insert into `shop_links` with no header produced one stamped `translations` row and one stamped `audit_log` row. Then the check again: clean. `information_schema`: 105 `NOT NULL`, 0 nullable. Strict catalogue lint `0 flagged, 0 stale`; shared-tables and migration-grants lints ok.

## Left, for the planner to file
- Scripts or Pi pollers that insert through the service role without `scriptShelterHeaders` will now error rather than write a null row: none found in `scripts/` by search, but the live Pi was not exercised.
- Views carrying `shelter_id` cannot be `NOT NULL` and are untouched.
- `#ujqr5` is **not** closed: its release-order guard remains, and Part 5 is in no release yet.
