# 2026-11-14 — Report-an-animal photos are removed after 90 days closed, and when their report is gone (#6rkux)

Owed by `2026-11-14-report-animal-photo.md` answer (4). Before this, nothing removed an object from `animal-report-photos`.

## Where it runs: the Worker's `scheduled` handler (the planner's recommendation, agreed)

A new stage in `worker/index.mjs` posts to `POST /api/animal-reports/photo-retention` in-process, with the service-role
key as bearer, exactly as the merch supplier email and the calendar sweep do. The Worker already holds
`SUPABASE_SERVICE_ROLE_KEY`, so **no new secret exists anywhere**. A GitHub Actions schedule was rejected: it would put a
production service-role key in a repository that is public on purpose (see `#x5tbv`). `pg_cron` was rejected: it would need a
migration and cannot call Storage's API without more credentials. The Worker cannot import the job directly (the Next code runs
inside `.open-next`), which is why it goes through the route, as the other stages do.

## What it does

- **(a)** A report `resolved` or `dismissed` whose `handled_at` is more than **90 days** old loses its photo object. The
  90 days is the decision file's figure and is **kept**. `handled_at` is the right clock: a trigger sets it when the status
  changes (measured on dev: changing status resets it), so it is "closed since". A report with no `handled_at` falls back
  to `created_at`. A report still `new` or `in_progress` never expires, however old.
- **(b)** Any object in the bucket whose report row no longer exists is removed (a staff delete, or a failed insert after a
  successful upload). An object less than **one hour** old is never treated as an orphan, because the report action uploads
  before it inserts and the row may not exist yet.
- **The report row is never deleted.** After (a), `photo_path` is set to null so nothing points at a missing file; the
  report's history survives.

## How it is bounded

The cron fires every 15 minutes; the stage runs only on the **20:00 UTC tick (03:00 in Thailand)**, once a day. Per run:
the expired query is limited to 500 rows, and the bucket listing is paged 100 at a time for at most 20 pages (2,000
objects). A bucket larger than that is cleaned across successive days. The bucket's own size cap is 3 MB per object.

## Proved on dev

Fixtures: a resolved and a dismissed report closed 100 days ago, a resolved one closed 10 days ago, a still-new one 100 days
old, and an orphan object with no row. Run 1 (default grace) left the fresh orphan alone. Run 2 (grace 0): both 100-day
photos removed and their `photo_path` cleared, the 10-day and the still-new photos kept, the orphan removed, all four
report rows still present. Left behind on dev: those four fixture rows (description "retention proof fixture").

The route takes an optional `orphan_grace_minutes`, which can only **shorten** the one-hour grace; it exists so the proof
needs no hour of waiting, and sits behind the same bearer check.

## Deliberately not done

- **No storage policy.** The bucket has none on purpose; adding one to make the job work would undo the reason the uncarded
  public upload was allowed.
- **No card.** Nothing here is a person's activity; the only caller is the Worker cron, guarded by the service-role secret
  and recorded in `docs/hard-coded-security-registry.json`.
- **The rate limit** is `#8t3rk`, not this.

## Production

The job does not run on production yet: `0377` (which creates the bucket) is still pending there and the Worker deploy is
Lutan's. Release note: `n/a` for that reason.
