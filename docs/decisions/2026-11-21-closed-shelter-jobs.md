# Closed shelters and the scheduled jobs (#clsjb), 2026-11-21

`0428` closes both doors for people, but trusted callers (service role, cron, the Worker's own jobs) are unfiltered by
design, so each job needed its own decision. Five reached "skip a closed shelter"; the retention purges are left on
purpose. Proof was by reading the code and by unit test, which is the right instrument for a scheduled job: there is no
screen to press.

| Job | Verdict | Reason |
|---|---|---|
| `pollCalendarChanges` (`src/lib/clinics/calendar-poll.ts:182`) | **Skip. Already done** in #1789 | It reads shelters `archived_at is null`. The worked example. |
| `label-drafts` (`worker/translations.mjs`) | **Skip. Done here** | It served every shelter its login holds a role in. #1789 was right that it is a second read, not one condition: one read of `shelters` (open ones only) after the `user_roles` read. All closed gives `skipped`, which counts as healthy on System status. A draft for a shelter nobody can reach is wasted work. |
| `calendar-sweep` (`syncPendingVisits`, `src/lib/clinics/calendar-sync.ts`) | **Skip. Done here** | It writes to a shelter's Google Calendar, outside the system, from clinic visits carrying `shelter_id`. Same class as the poll that was already fixed. Visits of a closed shelter are left untouched (still out of date / never sent), so they go if it reopens. |
| `merch-supplier-emails` (`runSupplierEmails`, `src/lib/merch/supplier-email.ts`) | **Skip. Done here** | **It sends email outside the system in the shelter's name**, a worse class of wrong than tidying rows, and cannot be recalled. Parts stay `new` and unsent, so reopening resumes them and nothing is lost. The trade-off: a customer who paid before the shelter closed is not shipped to while it is closed. That is a decision for whoever closes a shelter (settle open orders first), not for a cron to override quietly. |
| `report-photo-retention` (`src/lib/animal-reports/photo-retention.ts`) | **No skip** | It is a retention purge: deletes photo files of reports closed over 90 days, and orphans. A closed shelter's expired data should still be purged, the same ruling as the database retention crons. Also its orphan pass is bucket-wide, not per shelter. |
| `purge-assistant-actions`, `purge-write-requests`, `purge-donation-tax-ids` | **No skip** (#1789, agreed) | Retention purges. Skipping would keep a closed shelter's expired rows, including donor tax ids, longer than the retention promise. Do not add one. |

## The guard in `scripts/check-scheduled-writers.mjs` (deliverable 6)

Not built. It would have to assert that any writer file which loops over shelters, or reads a table carrying
`shelter_id` through the service role to act outside the database (mail, calendar, translation engine), also reads
`shelters.archived_at`, with a recorded exemption for retention purges. That needs a per-writer "acts outside the
database" classification the script does not have, so it is a design task of its own: left for the planner to file.
