# Home Assistant monitoring — the app's health feed

This file covers the shelter app's side only. The Home Assistant steps are done as a guided
session and live on the Home Assistant box; no house entity names belong in this public repo.

## `GET /api/status/health`

A read-only feed of the System status checks, for a Home Assistant `rest` sensor.

- **Address:** `https://<app host>/api/status/health` (the staff app's address, not the public site's).
- **Auth:** header `Authorization: Bearer <STATUS_READ_TOKEN>`. This token reads this one feed and
  nothing else. It is **not** the service-role key and cannot send mail or change anything.
- **Wrong or missing token:** `401 {"error":"Not authorised."}`. More than 10 bad attempts a minute,
  or 30 good ones, gets `429` with `Retry-After: 60`. Poll every 5 minutes; the answer is cached for one minute.
- **Always** `Cache-Control: no-store`. No error text, host names or file names are ever returned.

Reply shape (values are examples):

```json
{
  "generatedAt": "2026-11-06T01:00:00.000Z",
  "environment": "production",
  "checks": {
    "database":   { "state": "ok",   "checkedAt": "…", "durationMs": 41 },
    "drive":      { "state": "ok",   "checkedAt": "…", "durationMs": 310 },
    "migrations": { "state": "ok",   "checkedAt": "…", "durationMs": 55 },
    "release":    { "state": "ok",   "checkedAt": "…", "durationMs": 0 },
    "releaseMail":{ "state": "ok",   "checkedAt": "…", "durationMs": 0 },
    "backup":     { "state": "ok",   "checkedAt": "…", "durationMs": 420 },
    "origin":     { "state": "ok",   "checkedAt": "…", "durationMs": 120 },
    "cronJobs":   { "state": "ok",   "checkedAt": "…", "durationMs": 60 },
    "databaseSize": { "state": "ok", "checkedAt": "…", "durationMs": 0 }
  },
  "numbers": {
    "databaseResponseMs": 41,
    "databaseSizeMb": 44.0,
    "databaseSizeLimitMb": 500,
    "databaseSizePercent": 8.8,
    "databaseConnections": 7,
    "newestBackupAgeDays": 0.4,
    "releaseVersion": "0.43.3",
    "originInUse": true
  }
}
```

`state` is `ok`, `warn`, `fail` or `off` (off = deliberately not in use, not a fault). `databaseSize` is
warn from 80% and fail from 95% of the free tier's 500 MB. A number is `null` when it could not be read.

## Setting the token

1. Make a long random value: `openssl rand -hex 32` (or any generator giving 32+ characters).
2. Put `STATUS_READ_TOKEN=<value>` in `.env.deploy.production` (and `.env.deploy.test` for the test site).
3. `npm run deploy:prod -- --secrets` uploads it to the Worker (Lutan's step for production), and add it to the Pi's
   `.env.deploy.production` as well, because the Pi serves the app while it is up.
4. In Home Assistant, store it in `secrets.yaml` as `lanna_status_token` and use `!secret` in the sensor.
   Never paste it into a chat, a commit or this repo.

To rotate it: change the value in the same places and redeploy; nothing else is affected.

## Try it

```bash
curl -i -H "Authorization: Bearer <STATUS_READ_TOKEN>" https://<app host>/api/status/health
```

`node scripts/check-status-health.mjs --url <base url> [--token <value>]` checks the refusals (and a 200 with a token).

## Database numbers need `0324`

Size and connections come from `database_health()` (migration `0324_database_health.sql`). Until it is applied
to an environment those two numbers are `null` and `databaseSize` reads `fail`.
