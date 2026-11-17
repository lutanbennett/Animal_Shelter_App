# Scheduled and Pi-side writers against NOT NULL `shelter_id` (2026-11-17, #pirow)

**Why this exists.** Since `0397` every `shelter_id` is `NOT NULL`, and its default (`0390`, `current_shelter_id()`) reads only the
`x-shelter-id` request header. A writer with no header therefore **errors** where it once wrote a row `0392` hid. PR #1657 reported
*"none found by search, the live Pi was not exercised"*. A search of `src/` cannot see `pg_cron`, a database function or the Pi.

## What was read, from where, and when

`node scripts/check-scheduled-writers.mjs --env test`, **the DEV database** (`qxkmhwybjggxvsfxsxbd`), read at **2026-11-17 17:39 UTC**.
New, read-only, one SELECT over `cron.job`, `pg_proc` and `information_schema.columns`: no writes, no DDL, no `--apply`.
**Production's `cron.job` has NOT been read.** `.env.deploy.production` exists only on Lutan's PC. He should run
`node scripts/check-scheduled-writers.mjs --env production` bare; any job or function present there and absent below is new since this reading.
The dev database is shared with other streams, so the counts are a snapshot.

## The list (dev)

**Scheduled in the database: 3 jobs in `cron.job`, all active.**

| Job | Schedule | Shelter | How established |
|---|---|---|---|
| `purge-assistant-actions` | 17 3 * * * | sends (deletes only) | body read from `pg_proc` |
| `purge-donation-tax-ids` | 41 3 * * * | sends: one `retention_runs` row per shelter, `shelter_id` named | body read (`0397` rewrote it) |
| `purge-write-requests` | 29 3 * * * | writes nothing; it deletes | `0292`: the function only deletes expired `write_requests`; deletes need no shelter |

**The 91 writing functions (security definer or trigger), by body:** 31 name a shelter or only update/delete; 45 touch no shelter table;
**12 insert without naming `shelter_id`** and **3 use dynamic SQL, undecidable from here**.

The 12: `assign_pending_photo`, `claim_write_request`, `issue_donation_receipt`, `propose_label_th`, `propose_website_draft`,
`reassign_recurring_job`, `record_attachment`, `record_intake`, `record_recurring_job`, `record_stock_correction`, `record_stocktake`,
`undo_deceased_placement`. They lean on the header default. **That is correct for every one that is only called from a signed-in
request through the Worker or `next dev`, because the request carries the header.** Checked by grep of callers: eleven are called only
from `src/app/**` actions (a request), or from `scripts/check-*`/`prove-*` (which are tests and send the header via `scriptShelterHeaders`
or are anon/login calls). **The twelfth, `propose_label_th`, is called by the Worker's cron: see finding 2.**
The 3 undecidable: `approve_label_th`, `approve_website_draft`, `set_label_th` (dynamic `EXECUTE` over a table name). They are all
card-gated approvals pressed by a person, so they run in a request with the header; that is reasoning from the callers, not from the body.

## Findings

### 1. FIXED: the 02:00 UTC supplier email (`runSupplierEmails`, `src/lib/merch/supplier-email.ts`)
The Worker's cron (`worker/index.mjs` → `runMerchSupplierEmails`) calls `/api/merch/supplier-emails` through `openNext.fetch` directly,
**which never passes the `x-shelter-id` step the public `fetch` handler applies.** `runSupplierEmails()` then inserted into
`merch_supplier_emails` (NOT NULL `shelter_id`, default from the header) through `createAdminClient()` with no shelter. **Since `0397`
that insert errors**, the code treats it as `send_failed: could not write the log row`, **and no supplier email is sent**: a daily
order email to each supplier silently does not go out, reported only in the Worker log. It would have fired the first 02:00 UTC after
`0397` reached production with an unsent merch part waiting. **Fix:** read `suppliers.shelter_id` (itself `NOT NULL`) in the existing select and
stamp the insert with it, so the row takes the shelter of the supplier whose email it records. No Lanna fallback and no migration.
The registry record stays `cross-shelter` (it is: one run covers every shelter's suppliers).

### 2. RECORDED, NOT FIXED: the label-draft cron (`runLabelDrafts`, `worker/translations.mjs`)
Every 15 minutes (when `LABEL_DRAFT_EMAIL`/`LABEL_DRAFT_PASSWORD` are set) the Worker signs in as a machine login and calls
`rpc/propose_label_th`, **with no `x-shelter-id`.** `propose_label_th` inserts into `label_drafts` without naming a shelter, so after `0397`
the RPC answers 4xx/5xx; the Worker's `call()` throws, `runLabelDrafts` catches it and logs `labels: error: supabase rpc propose_label_th → <status>`
and the run ends. **What a person sees: nothing. No Thai label draft is ever proposed from the machine, and nothing is mailed.** The label
list on `/management/translations` just never gains machine drafts. It also cannot be fixed by stamping a column from this file: the
login belongs to a shelter, the Worker has no request to take it from, and the right answer is a design choice (the login's shelter from
`user_roles`, or one `x-shelter-id` per configured login). **Left for the planner.** Not fixed here because it is not small and a wrong guess would
pick a shelter silently. `runTranslations` (same file) only PATCHes existing rows, and an update needs no shelter, so it is fine.
Also unaffected: `worker/heartbeat.mjs` (`status_alert_runs` has no `shelter_id`), the calendar sweep and the report-photo retention
(no inserts found in `calendar-sync.ts` / `photo-retention.ts` by grep: **a search, not a reading of the live database**).

### 3. The service-role registry's scope (for the planner)
`docs/service-role-sites-registry.json` records `createAdminClient()` calls in `src/`, not the Worker's `fetch`-to-REST writers
(`worker/*.mjs`), nor scripts, nor database functions. Finding 2 is in that gap. To cover it the registry would need a second section
keyed by file for `worker/` and `scripts/`, plus a check that every scheduled path names how it gets its shelter. **Not widened here**, because
`check-hard-coded-security.mjs` fails the build on an unrecorded service-role file.

## THE PI: what could not be seen, and the procedure for the person who can run it

**Not seen, and no instrument in this repository can see it:** whatever runs on `lanna-pi.local` that is not in this checkout, and the
Pi's own scheduled units. The Pi serves the same `src/` build (so every `src/` writer above applies to it, header supplied by the Cloudflare
Worker in front) and is read-only to this stream: no ssh, no restart, no poller triggered. The item stays **open** for exactly this part.

**Procedure for Lutan (on the home network), nothing destructive:**
1. List what the Pi schedules: `ssh lutan@lanna-pi.local "systemctl list-timers --all; crontab -l"`. Write down every timer and cron line.
   *Pass:* each is a known unit (the `lanna-care` service restart/health ones). *Failure:* a timer or cron line that runs a script from outside
   a repository clone: that is code this audit cannot see.
2. For each, read what it runs: `ssh lutan@lanna-pi.local "systemctl cat <unit>"`, then open the script. Does it write to Supabase (a `POST`/`PATCH`,
   `.insert(`, an `rpc/` call)? If it only restarts a service or reads, it is out of scope.
3. For each that writes, find the table and ask: does its request carry `x-shelter-id`, or does the body name `shelter_id`?
4. Settle it without touching production data: the Pi's journal shows past failures. `ssh lutan@lanna-pi.local "journalctl -u <unit> --since '2026-11-17' | grep -i 'shelter_id\|null value\|23502'"`.
   *Pass:* no matches since production got `0397`. *Failure:* `null value in column "shelter_id"`: the unit has been erroring since that migration reached production, silently.
5. Also read production's `cron.job`: `node scripts/check-scheduled-writers.mjs --env production` (bare, on the PC that has `.env.deploy.production`).
Report what 1-5 found on `#pirow` before ticking it.

## What this reading does not prove
Bodies are judged by pattern, not executed; a function that calls another writing function is not followed; "sends no shelter" is an error only
where no request header exists. Dev, not production. A `--strict` flag exits 1 when a scheduled job reaches a headerless insert, for later use in a nightly.
