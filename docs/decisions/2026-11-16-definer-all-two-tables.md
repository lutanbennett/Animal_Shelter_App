# 2026-11-16 — definer_all on the two tables that missed it (#w4t9k)

**Step zero:** `check-tenancy-catalogue.mjs --strict --tenant-role rls_definer` on dev flagged exactly two tables, `donation_tax_ids` (0381) and `retention_runs` (0385). Not three, and not one as the backlog item said. Neither migration creates a `definer_all` policy (read: 0381 lines 80-83 create only `donation_tax_ids_perm`; 0385 enables RLS on `retention_runs` and grants service_role only).

**Why they were missed.** 0375 created `definer_all` in a one-off loop over the tables that existed that day. Nothing gives a later table one, so every new RLS table needs it written by hand, and the lint is the only thing that notices.

## Outcome per table, decided separately

Both got the policy (0388), for the same reason. The question that decides it is whether anything reads the table through a definer function. Read: `purge_donation_tax_ids()` in 0385 is `security definer`; it deletes from `donation_tax_ids` and inserts into `retention_runs`. Nothing else in `supabase/migrations`, `src/`, `worker/` or `scripts/` touches `retention_runs`; the app reads `donation_tax_ids` as the logged-in user (`src/app/management/donations/*`, `src/lib/donations/tax-id-list.ts`), under `donation_tax_ids_perm`.

- Today the function is owned by `postgres` (not API-executable, so outside the re-own's scope) and works. **The gap is latent, not live.**
- If it is ever owned by `rls_definer` (a re-run of the re-own, a future tightening), a table without `definer_all` reads and deletes nothing, and the cron job still reports success. That is the failure shape that would stop a PDPA retention purge silently. So neither table is a case for allowed-by-name: neither has a reason to refuse the policy, and each has a definer reader.
- The policy is `to rls_definer` only; it widens nothing for any login.

Measured after applying: `0 flagged (0 views, 0 functions, 0 tables missing definer_all), 2 allowed by name, 0 stale.`

## The reporting half: recorded, not built

1. **Does the email reach a person?** The last editor of the cron line is Lutan (`git log` on the workflow), so GitHub's failure email goes to him. It reached him and was not acted on: it is one of several scheduled-run emails (the daily `advisories.yml` has failed on purpose every day since 2026-11-10, so scheduled failure mail is background noise by design).
2. **Should it report itself like `EXPECTED_CRON_JOBS`?** No. That machinery watches `pg_cron` jobs inside the database through `scheduled_job_status`. This is a GitHub Action, the wrong substrate, and the lint needs the Management API token that the app deliberately does not hold. Putting it in `/status` would mean giving the app a catalogue-reading credential for a dev-only check.
3. **What would actually fix it** is a reader, not a channel: the planner's daily routine reads the last scheduled run (`gh run list --workflow tenancy-catalogue.yml --limit 1`) beside the open-PR list. That is the planner's to add, for the planner to file; nothing in this PR changes `.claude/`.
4. The workflow is not edited to stop it failing, and `continue-on-error` is not added.

## Does the schedule match the cron line? (deliverable 8)

The file says `43 5 * * *` (05:43 UTC); the one scheduled run was created **2026-11-15T12:57:54Z**. `gh run list` shows that run plus a push-triggered one, only. `advisories.yml` (cron `17 6 * * *`) shows the same pattern: its scheduled runs land 13:35-15:18Z every day, 7-9 hours late. GitHub delays scheduled workflows under load, so the cron line is the earliest time, not the run time. The 2026-11-16 slot had not arrived when checked (04:11Z). So the schedule is right and the lateness is GitHub's; nobody should expect a reading before about 13:00Z. Do not read "no run yet today at 06:00" as a fault.
