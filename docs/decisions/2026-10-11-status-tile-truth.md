# System status tiles: ask which machine drew the page

2026-10-11, `claude/status-tile-truth`. Third and fourth instance of one cause,
after the visitor count (`2026-10-10-visitor-count-live.md`).

## The cause

On production the **Pi** renders `/admin/status` and runs its buttons. The
Worker holds the bindings and the `wrangler.jsonc` vars; the Pi gets only what
`scripts/pi/write-env.mjs` writes. Any check that reads a Worker thing is
wrong-when-healthy there.

## The one way

**A check that is *about* the Worker, or needs a Worker thing, asks `renderedBy()`
(`src/lib/status/runtime.ts`: `worker` / `pi` / `local`) and says what is true of
that machine.** It is the detection #522 put in `usage.ts`, moved so every check
shares it. **A value the Pi genuinely needs to do its own job** (the Cloudflare
pair, the backup folder) goes in `OPTIONAL_SECRETS` and so reaches the Pi.
Rule of thumb: if the Pi would use the value for itself, send it; if the value
only describes the Worker, do not copy it, ask who drew the page.

`ORIGIN_HOST`/`ORIGIN_KEY` are the second kind: the Pi probing its own tunnel
proves nothing the page being drawn does not already prove, and `ORIGIN_KEY`
stays Worker-only. So `RUNTIME_VARS` is **unchanged**, and **the Pi needs no
redeploy for this change to take effect beyond the normal code deploy.**

## Tile-by-tile audit (every tile on `/admin/status`, read from the code)

| Tile | Reads | On the Pi | Verdict |
|---|---|---|---|
| Database | Supabase service key | Pi has it | fine |
| Photo storage (Drive) | Google OAuth + root folder | in `KEYS` | fine |
| Migrations | `BUILD_MIGRATIONS` baked at build, DB | build-time, same on Pi | fine |
| Running release | `latestRelease`; Worker version metadata | no metadata, says "Not running on the Worker", state ok | honest; not wrong |
| **Release mail** | Worker bindings `RELEASE_MAIL*` | grey: "Only the Worker sends release mail, and this page wasn't rendered by it" | **true but blind**: on the page admins actually see (the Pi) it can never go green or red. Not a lie, so not fixed here; filed as a backlog follow-up |
| Weekly backup | Drive + `BACKUP_DRIVE_FOLDER_ID` | in `OPTIONAL_SECRETS` | fine |
| **Pi origin** | `ORIGIN_HOST` (Worker var) | read empty, said "Not in use yet" | **wrong when healthy: fixed** (ok, "drawn by the Pi") |
| **Status alert mail** | `status_alert_runs`, written by buttons | a press on the Pi recorded sent=0 as "the last mail" | **wrong when healthy: fixed** |
| Access requests | DB only | fine | fine |
| Usage: sign-ins, records, uploads, assistant | DB only | fine | fine |
| Usage: visitors | Cloudflare pair | fixed 2026-10-10 | fine |

So the fourth is real: **Release mail** is the same fault in a milder form
(correct words, no information). It is a follow-up, not folded in, because the
right answer (have the Worker report its own mail state somewhere the Pi can
read) is a design choice, not a one-line check.

## Alert mail tile: what was and was not established

- **Cause, established by Lutan pasting the live tile (2026-10-11):** "reached 0,
  skipped 2 ... not running on the Worker", both admins. It is the Pi cause,
  not unverified Cloudflare addresses.
- **Fix:** the buttons are off on a Pi-drawn page with a sentence; the actions
  refuse and record nothing there; `checkAlerts()` skips any run whose only
  story is the Pi reason (`PI_NO_MAIL_REASON`), so the bad row already in
  production stops counting the moment this is on the Pi.
- **Not proved on production** (these sessions cannot read it). The tile should
  go green by itself there; the release manager confirms (test plan handover).
- **Deviation from the brief, on purpose:** the brief asks that a successful
  *Run the alert check now* can clear a red mail tile. It cannot, honestly: a run
  with nothing to mail proves nothing about the mail path. What proves it is a
  test mail that reaches someone, from the Worker. And there is no way to press
  that from a Pi-drawn page. So a genuine sent=0 from the Worker (say an
  unverified address) is still only cleared by the next real alert. That needs
  a Pi-to-Worker relay and is filed, not built. The backlog item is therefore
  **not ticked**.

## Alerts are not affected

The schedule runs inside the Worker, where `renderedBy()` is `worker`, so
`checkOrigin()` still probes the tunnel there and `isRed` still reddens a down Pi.
