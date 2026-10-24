# Two Stocktaking switches: the schema (0254)

2026-10-24, `claude/diets-and-stock-switches-schema`. Shared migration `0254` with
`2026-10-24-diet-forecasts-per-serving.md`: one migration in flight at a time, hence two subjects in one file.

## What was added

`site_content.stocktaking_food_enabled` and `stocktaking_medical_enabled`, boolean not null default TRUE, so nothing
changes the day this lands. **Nothing reads them yet** (no consumer; the app half is a later PR).

## Why `site_content`, and not a new table

It is a singleton with columns (`0018`), there is no key/value settings table anywhere (no `app_settings`,
`settings` or `site_settings`), and it already holds shelter settings that are not website copy
(`clinic_visit_estimate`, read by the cashflow forecast, `0172`). A new table would be a second place for settings.
Anon cannot see the new columns: `public_site_content` lists its columns.

## Admin at 2-step, and audited

- The table's write policy is `website.content`, which is wider than Admin. A `before update` trigger
  (`site_content_stocktaking_guard`) therefore refuses a change to either switch unless the caller is an Admin whose
  session is `aal2`. A caller with no login (service role, scripts) is let through, as for the other aal2 policies.
  A website edit that leaves the switches alone is never blocked.
- `record_audit()` could **not** be attached: `site_content.id` is a boolean and the function casts `id` to uuid, so
  every website save would have errored. A small dedicated trigger writes the same `audit_log` shape, with only the
  two switches in the before/after images (not the website copy sharing the row) and a fixed `row_id`
  (`00000000-0000-0000-0000-000000000001`), since the singleton has no uuid.
- **For the app half:** Settings -> Recent changes has no label for `site_content` rows of this kind, and an Undo
  must not be offered as a plain re-insert; it is the same guarded write.

Proof: `scripts/check-diets-forecast-functions.mjs` (rolled back, on dev): defaults on, non-admin refused, Admin at
aal1 refused, Admin at aal2 allowed, exactly one audit row per switch change and none for a website edit.
