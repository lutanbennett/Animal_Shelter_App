# Policy triage, batch 2: the last ten tables with a command no live policy answers

Branch `claude/policy-triage-2`. No migration, no policy, no change under `src/`. Second and final batch: with these ten, all twenty tables are triaged. Batch 1: `2026-10-28-policy-triage-1.md`.

## Readings, each with its database

- **Test (dev) database `qxkmhwybjggxvsfxsxbd`**, 2026-10-28 ~02:18 UTC, `node scripts/check-production.mjs table-policy-commands --env test`: the same ten tables as the item lists. 37 rows: `audit_log`, `label_sources`, `permission_activities` refuse insert/update/delete; the other seven refuse all four commands.
- **Production**: the planner's 2026-10-27 reading named these tables too. **NOT ESTABLISHED on production** for today's rows. The verdicts below come from migrations and code, which do not differ between environments; to settle the production half, run `node scripts/check-production.mjs table-policy-commands --env production` and compare the ten.

## What the check counts (read first)

As batch 1 says: it lists a command only when **no** policy for it (or `ALL`) exists that avoids the dead clinic-login functions. It does not evaluate policies, grants, security-definer functions or triggers, so "nobody can" here means "no policy", not "no one writes it".

## Verdicts (all ten deliberate; no real gap)

| table | refused | who writes it | why deliberate |
|---|---|---|---|
| `audit_log` | insert, update, delete | trigger function `record_audit()` (0121:118, 0195:33) | write revoked from every API role; trigger refuses change even to service role |
| `calendar_sync_state` | all four | service role: `calendar-poll.ts` (105, 169), sweep route | Google sync token; read for status tile at `calendar-sync.ts:321` |
| `label_sources` | insert, update, delete | trigger function `record_label_sources()` (0166:244) | select-only grants; a hand edit would hide a stale translation |
| `permission_activities` | insert, update, delete | migrations only (0132 seed, checked by `check-permission-catalogue.mjs`) | a new activity is code plus migration, never a form |
| `receipt_counters` | all four | `issue_donation_receipt()` (0168:194) | gap-free numbering via the card-checked function |
| `schema_migrations` | all four | `scripts/apply-migrations.mjs` through the Management API; 0203/0208 clean-ups | the ledger; no `src/` or `worker/` code touches it |
| `status_alert_checks` | all four | service role: `src/lib/status/alerts.ts`, `POST /api/status/alerts` | 0098: RLS on, no policy, service role only |
| `status_alert_runs` | all four | same | page reads it with the service role after `system.status` (`permission-probes.mjs:204`) |
| `status_alert_test_requests` | all four | `requestTestAlert` (`alerts.ts:409`) after `can(…, "system.status")` (`admin/status/actions.ts:72`); Worker run picks up | queue between the Pi button and the Worker |
| `video_uploads` | all four | service role in the video `start` and `finish` routes, after `can(…, "photos.resident_add")` | 0229: service role only |

Each is recorded with its call sites under `noLivePolicyDeliberate` in `docs/hard-coded-security-registry.json`.

## Buttons the database would refuse

The only control that reaches these tables is the Status page's test-mail button (gated on `system.status`, same card the server asks) and resident video upload (gated on `photos.resident_add`, same card the routes ask). Both write through a service-role client after the card check, so neither is refused. Nothing for `docs/card-access-faults.md`.

## Limits

A reading of code and migrations; the browser was not driven. A writer in a shape the greps missed would not have been seen. Production not read (see above).
