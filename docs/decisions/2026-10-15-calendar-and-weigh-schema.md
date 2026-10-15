# 2026-10-15 — Schema for the vet calendar and Record Weight's "weigh these first" (`0207`)

One schema PR for two features, because only one in-flight branch may carry a migration. **Neither is
usable when this merges**: nothing in `src/` reads these objects. The visible halves are
`vet-calendar-build` and `weigh-first-app`.

## The calendar: a column set on `clinic_visits`, not a `clinic_calendar_days` table

The brief for this stream asked for `clinic_calendar_days`. The backlog item was changed twice on
2026-10-15: first to one event per clinic per day, then (the Director, after seeing her own calendar) to
**one entry per dog**, with "the `clinic_calendar_days` table and the clinic-day rebuild are **not**
needed". The latest wording wins, so `0207` adds columns to `clinic_visits`:

- `calendar_event_id` (text, null = no event), `calendar_synced_at`, `calendar_error`,
  `calendar_out_of_date_at`.
- **Out of date is a timestamp, not a boolean.** A boolean cannot tell the sweep how stale a row is, nor
  order the oldest first. A row is out of date when `calendar_out_of_date_at` is later than
  `calendar_synced_at`, or the latter is null. A partial index keeps the sweep's lookup tiny.
- **A trigger sets it**, on insert and when date, clinic, resident, status or `archived_at` change, so no
  code path can change a visit and forget. It stamps `clock_timestamp()`, not `now()`, so two changes in
  one transaction still differ. Writes to the `calendar_*` columns alone do not re-mark, so the sync's
  own success write cannot loop.
- Cancelling or archiving a visit marks it; the app half deletes the event and clears the id. A hard
  delete of a visit leaves no row to mark; the app half deletes the event in the same action (the
  visits are soft-deleted in practice, `0124`).
- If the Director ever reverts to the clinic-day shape, that table is a new small migration; nothing here
  blocks it.

## Record Weight: `weigh_first_visits()`

`security definer` function returning **only** `resident_id`, `visit_at`, `clinic_name`, for visits
not cancelled and not archived, dated yesterday or today in Bangkok time, to a login holding
`medical.weight` at edit (admin always does; Management, Staff and Doctor hold it). The Head of Medical
may not read `clinic_visits` (`0134`) and still cannot: **no `role_permissions`, `role_extras` or card
bundle is touched**. Weights are not read inside the function; the page compares them, since she can read
`weight`.

- The day boundary uses `shelter_time_zone()` (`0073`), never UTC. `shelter_date()` was not used: its body
  names `shelter_time_zone()` unqualified, so under the empty `search_path` this function must have it
  fails ("function does not exist", found by the harness). Widening the path on a definer function was the
  wrong fix.
- Anonymous callers are refused (no execute grant); a login without `medical.weight` at edit (checked with
  a Volunteer, who holds read only) gets zero rows.

## Public views (the `0201` rule)

Neither object is public: the calendar columns are internal and the weigh-first read is staff-only. No
public view changes, and `check-public-views.mjs` needs nothing new.

## Checked

A `begin … rollback` harness on dev: a 01:00-Bangkok-today visit and a yesterday visit counted, two days
ago and a cancelled visit did not (admin saw 2, Volunteer 0, anon refused); a calendar-only write did not
re-mark; a cancel did. `check-perm-convert-settings.mjs` 291 held, 0 failed. `check-cards-schema.mjs` and
`check-permission-parity.mjs` did not run to a result on this machine (module resolution; a dev
resident-code collision in its own seed), and neither reads anything added here.
