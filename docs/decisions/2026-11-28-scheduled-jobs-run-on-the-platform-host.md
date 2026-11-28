# The Worker's scheduled jobs run on the platform host (#alrth), 2026-11-28

## What was wrong

`STATUS_ALERT_SITE` is the host the Worker's cron builds each job's request on
(`worker/index.mjs`: status alerts, calendar sweep, merch supplier email, report-photo retention). It named
**Lanna's** host on test (`https://test.lannacare.org`) and production (`https://lannacareforanimals.org`). A shelter
is closed, never deleted (#tstsh), and the console can close one, so the platform's jobs for *every* shelter hung off
one shelter's address. Found by `platform-own-signin` inside `#plsso`.

## What the endpoints actually are (the evidence for the answer)

All four are bearer-guarded with the service-role key and called **in-process** (`openNext.fetch`), so DNS never
matters; the host only feeds the request URL.

| Endpoint | Scope | Uses the host for |
|---|---|---|
| `/api/status/alerts` | platform: one run over the whole system, then every shelter's Drive token | the links and site label in alert mail (`${origin}/admin/status`) |
| `/api/calendar/sweep` | platform: loops open shelters itself (`archived_at is null`) | event links, **already** from `appUrl()` (APP_HOST) first |
| `/api/merch/supplier-emails` | platform: loops open shelters | nothing |
| `/api/animal-reports/photo-retention` | platform: bucket-wide | nothing |

None picks a shelter from the host. The proxy lets these four POSTs through on any host, and the platform host keeps
every `/api/` path (`PLATFORM_KEEPS`), so they run there unchanged.

## The answer to the open question

**The variable points at the platform host (`https://<PLATFORM_HOST>`); the links in what a job sends come from
`APP_HOST`.** The other two shapes were weaker: keeping a shelter host keeps the fault; per-job hosts add a setting to
answer a question none of the jobs asks. The one shelter-facing thing was the alert mail's link to `/admin/status`,
which the platform host would redirect to the console, so `jobLinkOrigin()` (`src/lib/site-hosts.ts`, lifted from the
calendar sweep, which had solved this already) now serves both routes: `APP_HOST` first, the request's own origin only
as a fallback.

**Production, in one plain sentence:** on Lutan's next production deploy the cron's jobs run on `cooperjaidee.org`
instead of `lannacareforanimals.org`, and nothing they do or send changes: the alert mail still links to
`https://lannacareforanimals.org/admin/status` and is still labelled with that host, because production's `APP_HOST`
is that address. Correct the moment he deploys; no step of his is needed beyond the deploy.

**Known residue, not fixed here:** "links go to APP_HOST" is still Lanna's address in a one-shelter world. When
APP_HOST itself stops being one shelter's, that is `#plsso`'s and the tenancy work's to settle, not this variable's.

## UAT: no value, on purpose (the brief's premise did not hold)

The brief said UAT's jobs were skipping silently. **They are not running at all:** UAT's block in `wrangler.jsonc`
has **no `triggers`** (its own comment says "UAT has no cron"), so `scheduled()` never fires there and nothing reads
the variable. A value would be dead configuration. Adding a cron to UAT is not tidying: it would start a calendar
sweep and a supplier email from UAT's data, which is a decision of its own. So UAT gets no value and no UAT deploy was
needed; the test below demands the value the day a cron is added.

## The second open question: a check, and it fails

`scripts/check-alert-site.test.mjs`, in `npm test` (so CI's test job): for every environment **with a cron**,
`STATUS_ALERT_SITE` must exist and equal `https://<that environment's PLATFORM_HOST>`. Missing, a shelter host, or no
`PLATFORM_HOST` fails; an environment with no cron is not asked. A test rather than a new `check-*.mjs` because it reads
one checked-in file and needs no network, which is exactly what the test gate already runs.
