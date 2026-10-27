# Policy triage, batch 1: ten tables with a command no live policy answers

Branch `claude/policy-triage-1`. No migration, no policy, no app change. Backlog item: *Triage the tables where no live policy can answer for a command*.

## Readings, each with its database

- **Production**, 2026-10-27 ~18:10 UTC (the planner's reading, quoted, not repeated here): 58 rows over 20 tables.
- **Test (dev) database `qxkmhwybjggxvsfxsxbd`**, 2026-10-28, `node scripts/check-production.mjs table-policy-commands --env test`: 57 rows over the same 20 tables. Dev differs from production by one row; which one was not looked for, since the verdicts below are read from migrations and code and do not depend on it.

## What the check cannot see (its SQL, `scripts/lib/readonly-checks.mjs`)

- "Live" means **any** policy for that command (or `ALL`) whose text does not name `is_clinic_login` or `clinic_login_may_edit_doctor`. It does **not** evaluate the policy: `using (false)`, or a policy limited `to` a role nobody holds, counts as live. So a clean row proves little; a listed row is a true "nobody can".
- It reads policies, not grants. A table can show no gap and still lack the grant, or the reverse.
- Security-definer functions, triggers and views are invisible to it: a table written only through a card-checked function (most of the ten) and a table nobody writes look identical. Only reading the code tells them apart.
- It cannot say whether the refusal is **wanted**. That is this triage.

## Verdicts (all ten: deliberate; no real gap found)

| table | commands refused | why deliberate |
|---|---|---|
| `site_content` | insert, delete | singleton, seeded by 0018, held to one row by `site_content_singleton`; app only updates |
| `site_pages` | insert, delete | fixed slugs seeded by 0059/0099; the editor only updates |
| `stock_counts` | insert, update, delete | written only by security-definer `save_stocktake` / `record_stock_correction`; grant is select only |
| `translatable_labels` | insert, update, delete | migration-seeded registry; even `service_role` has select only |
| `units` | delete | archived, never deleted (`setUnitArchived`); no delete control |
| `donation_receipts` | insert, delete | insert via `issue_donation_receipt` (0168); delete refused to everyone, service role too, by `donation_receipts_guard` |
| `recurring_job_occurrences` | insert, update, delete | written only by `record_recurring_job` / `reassign_recurring_job` |
| `recurring_job_occurrence_assignees` | insert, update, delete | `reassign_recurring_job` |
| `community_places` | delete | archived, never deleted; grants exclude delete; no control |
| `impact_baselines` | delete | fixed keys; editor only updates |

Each is recorded, with its call sites, under `noLivePolicyDeliberate` in `docs/hard-coded-security-registry.json`.

**A third kind of "deliberate".** The brief offered two: a named service-role site, or the Worker. Not one of these ten is written by either. They are written by a card-checked security-definer function, by a migration, or by nobody. That is a stronger reason (no way around the card at all), so it is recorded rather than forced into `serviceRoleSites`.

## Buttons that the database would refuse

Checked for the screens the brief named: Settings → Units (archive only), the website editor (update only), stocktaking and deliveries (RPC writes), outreach places (insert and update only), donation receipts (update, via the card-gated actions). No screen offers a delete or an insert the database refuses on these ten tables. **Nothing for `docs/card-access-faults.md`.** The known fault (a hidden public page is not shown in Recent changes) is unchanged and not re-filed.

## Not done

The other ten tables (`audit_log`, `calendar_sync_state`, `label_sources`, `permission_activities`, `receipt_counters`, `schema_migrations`, `status_alert_checks`, `status_alert_runs`, `status_alert_test_requests`, `video_uploads`) belong to the next stream. The browser was not driven; this is a reading of code and migrations, so a control that exists in a shape the greps missed would not have been seen.
