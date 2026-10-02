# 2026-10-02 — A Pi that stops answering is red for the alert run, amber on the page

**Context.** On 2026-10-02 the Pi went off the network for about an hour and nobody was told; it was found because a person could not sign in. The machinery to tell them already existed: `status_alert_checks` (0098), a 15-minute cron on the Worker, a mail binding, one mail down and one mail on recovery. It never fired because `checkOrigin()` reports a dead Pi as **`warn`**, and the alert run counts only `fail`. The tile is amber on purpose (every public page still renders from the Worker fallback), but amber is the state in which an alert does nothing.

**Decision.**

- `src/lib/status/alerts.ts`: `isRed(key, report)` is `fail`, or `warn` for `origin`. The page's tile is unchanged. No new schedule, table, mail path or migration.
- **Threshold: unchanged, two consecutive red runs (`FAIL_RUNS_BEFORE_MAIL = 2`), so the mail arrives on the second 15-minute run: 15 to 30 minutes after the Pi goes, from a probe that has to fail with a 5 s timeout or a down status (502/503/504/521/522/523/530) twice.** One blip is one run and is forgotten; a Pi that reboots in under about 15 minutes may never mail. Against today's hour-long outage that is an alert at roughly the half-hour mark. One run would have caught it 15 minutes sooner and mailed on every Cloudflare hiccup; the project already learned (`test-plan`'s `continue-on-error`) that mail people filter is worse than mail that comes later. I did not shorten the interval for the Pi alone, since that needs a second cron entry and a second memory of runs.
- **Alert once, recover once:** inherited from 0098. `alerted_at` is set when the mail reaches someone and the following runs stay quiet; the first non-red run mails recovery and clears it. Watched on a local server (test plan): runs 1 quiet, run 2 mail, runs 3-4 quiet; after the Pi "came back", run 1 recovery mail, run 2 quiet.
- **What the mail says:** the check's own error line (status or "no answer within 5 seconds", which is the same evidence Lutan reached by hand), then a fixed line for the Pi: public pages still load, signing in and saving may be failing, check power/router/cable then `cloudflared`, and that production and test are both affected. `ADVICE` in `alerts.ts` is keyed by check, so another check can carry its own line.

**What this does not do.**

- **It cannot tell a 530 from a harder outage.** After #305 a 530 (no connector) means writes still work through the Worker; a timeout or 502/504 means they are refused. The probe is a HEAD to `/login`, and the mail says "may be failing", not "are". If the distinction matters to whoever reads it, the status is in the error line.
- **It needs the Worker, Supabase and the mail binding to be up**, as every alert does; a Supabase outage sends nothing (documented in the file's header).
- **It does not mention the `ORIGIN_HOST=""` lever.** That decision is Lutan's and has not been made; when it is, one sentence goes in `ADVICE.origin`.
- **UAT/other environments:** the cron and `STATUS_ALERT_SITE` exist only on test and production, so the alert is on for exactly those two, and since they share one Pi a Pi outage mails twice (once from each). Accepted: each mail's subject carries its site.

**(c), the weekly backup, is partly there already.** The `backup` check goes red after `BACKUP_FAIL_DAYS` (two missed Sundays) and now alerts through the same path. That is slow: a Pi down over a single Sunday is silent until the next. Making it alert after one missed week is a one-constant change to `health.ts`, left to Lutan because it also moves the tile's colour.
