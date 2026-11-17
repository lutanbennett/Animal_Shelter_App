# Part 7, third slice: the last 27 shelter filters, and the writes (#ps6ms)

**Status: done. The registry answers 0 `needs-shelter-filter` (58 filtered, 25 cross-shelter, 0 unclassified). Every service-role WRITE is closed.**

Step zero: the registry on this branch said 27 remained, the check passed, and nothing had landed. Built.

## The storage-path shape (the one open question)

Object names carry the id of the row that owns them (`plans/<plan id>/…`, `<report id>.jpg`) and no shelter. A service-role call is trusted with every shelter, so the proof is not a filter on the Storage call but **a lookup of the owning row with `.eq("shelter_id", acting shelter)` before the object is read or written**:

- `plan-store.ts`: `shelterIdOwnsPlan(planId)` reads `facility_maps` for that id in the acting shelter; `readPlanImage` takes the plan id out of the path first. A plan being created has no row yet, so `storePlanImage(…, { newPlan: true })` is told so by its one caller, which minted the id a line earlier.
- `photo-store.ts`: `readReportPhoto` proves the `animal_reports` row (the name is the report id) is in the acting shelter; `storeReportPhoto` refuses with no acting shelter.
- No acting shelter, or a row of another shelter, means no object. Reused unchanged for reels and resident videos, whose rows (`video_uploads`) carry the shelter themselves.

## A service-role INSERT is not stamped

`0390`'s column default takes the shelter from the request header, and a service-role client sends none, so every insert names `shelter_id` itself (`attachments`, `adoption_updates`, `video_uploads`, `clinic_visits`). `placeOrder` calls an SQL function, so it passes `createAdminClient({ shelterId })` and lets the function's defaults stamp.

## Judgements

- `ensureBucket`: `cross-shelter` (creates the one shared bucket; touches no shelter row).
- `listReportPhotos` / `removeReportPhotos`: `cross-shelter`, the installation-wide retention cron, which names objects only after finding them expired or row-less.
- `calendar-sync.syncRow`: fenced by the visit's own `shelter_id`; the sweep syncs rows of every shelter, each as itself. `syncVisitToCalendar` is request-scoped and filters by the acting shelter.
- `calendar-import.createVisits`: the cron poll has no acting shelter, so the visit goes in the **clinic's** shelter and only that shelter's residents are let through. `loadRefs` filters when given a shelter; the poll passes none (one Google calendar per installation) and the matches only feed `createVisits`. The confirm action refuses with no shelter rather than pass none.
- `resident_current_state` carries no `shelter_id` of its own, so it is asked only about residents already fenced.
- Adopter scope is unchanged: `adopter_may_submit` still decides who may post; the shelter fence is added beside it, and an adopter with no acting shelter sees nothing (the host always sets one on the website).
- `calendar_sync_state`'s entry was not stale: it was already out of the 27 (cross-shelter, cron).

## What wrote the null-shelter `retention_runs` row

Not app code. `supabase/migrations/0385_donation_tax_id_retention.sql` defines a pg_cron SQL function that does `insert into public.retention_runs (job, deleted)` with no shelter, run daily with no header. The registry reads `createAdminClient()` calls in `src/` only, so it cannot see it, nor the Worker's cron or any SQL job. **`#stmp5`'s `NOT NULL` is therefore gated on something the registry cannot see: for `retention_runs`, either the function stamps a shelter or the table is left nullable as installation-level. For the planner to file.** Any other SQL/pg_cron writer should be looked for the same way.

## Not done / not verified

- No browser click-through of an upload was driven (see the test plan); typecheck and the check script were.
- No schema change, no `NOT NULL`.
