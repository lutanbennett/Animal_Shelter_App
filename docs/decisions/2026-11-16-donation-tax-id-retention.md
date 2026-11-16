# Donation tax IDs are deleted when their seven years are up (#q7x4m, 0385)

**Shape: pg_cron, copying `0227`** (not a step in an existing nightly). Reasons: the watcher already exists and is list-driven
(`EXPECTED_CRON_JOBS`, `#cea66`), so the job is watched by adding its name; the apply is the install (`#ayx3o`); and no nightly
elsewhere runs in the database, so a step in one would need a key and a deploy.

**The delete:** `purge_donation_tax_ids()`, security definer, `search_path = ''`, execute revoked from public/anon/authenticated,
deletes `donation_tax_ids` rows where `retain_until < current_date`. It measures from `retain_until` and never recomputes a date.
Daily 03:41 UTC (`0227` is 03:17; `purge-write-requests` 03:29).

**The receipt fact:** read, not assumed. `donation_receipts` (`0168`) is a separate register with no link to `donation_tax_ids`, no
delete grant and a trigger that refuses delete, so deleting the tax-ID row cannot touch it. Nothing needed building.

**Reporting:** the job name is in `EXPECTED_CRON_JOBS`, so a missing, switched-off, failed or stale run shows on the status tile and
mails on red. Each run also writes one row to `retention_runs` (job, time, count; no personal data; service role only), so "what it
deleted" is recorded.

**A quiet seven years is not a fault:** the watcher reads run status (`neverRun` / `failed` / stale by age), never the number
deleted, so a run that deleted zero rows is healthy. No gift recorded today can expire before 2033.

**Proved** by `supabase/harness/donation-tax-id-retention.sql` (begin/rollback, fake IDs): expired row deleted, current row kept,
both donations survive, run recorded, not executable by anon/authenticated, job scheduled.

**Remaining:** production apply of `0385` at the next release (release manager). Nothing else installs.
