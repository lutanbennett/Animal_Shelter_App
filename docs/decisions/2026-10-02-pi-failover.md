# Pi failover: the answers, the drills, and the revised size

Stream `pi-failover-drills` (A), 2026-10-28. The file is dated `2026-10-02` because that is the name
`docs/pi-failover.md` gives for where the agreed recommendation is recorded. It is not the date it was written.

## What Lutan decided (2026-10-19, verbatim)

1. *"I want to go for option 1 - the bigger build but proper fix. Let's do it right the first time."*
2. *"And yes do the drills first."*

So a refused-write window must be **zero**, which only option 1 (idempotent saves, then every failure
can retry on the Worker) delivers. This supersedes the paper's own recommendation of options 3 and 2.

## How the drills were run

- **Probe:** `scripts/pi/drill-probe.mjs`. Once a second it posts one REAL write to `https://test.lannacare.org`
  (Settings → Units "create unit", replayed as the form post, signed in as a `dev-signin` admin) and records the time,
  status or thrown error, duration, `x-lanna-served-by`, and **whether the row is in the dev database afterwards**.
  Landing is read from the table, not inferred from the status. 85 attempts per drill, 30 s client timeout.
- **Environment:** test site (dev database), the Pi `lanna-pi`, 2026-10-28, 16:50–16:55 UTC (23:50–23:55 Suphan Buri).
  Test and production share the Pi and the tunnel, so the `cloudflared` drill also took production's Pi away for about 48 s.
- **`lanna-care` row:** run on `lanna-care-test`, because the probe targets the test site. The mechanism is the same service
  unit shape; production's `lanna-care` was not stopped.
- The Pi had no passwordless `sudo` for stop/start, so Lutan added `/etc/sudoers.d/pi-failover-drills` (stop/start of the
  three services, plus `systemctl kill --signal=SIGSTOP|SIGCONT lanna-care-test`) on 2026-10-28. **It is temporary** and
  is to be removed when the drills are finished.
- Every service was restarted after its drill and `systemctl is-active` showed `cloudflared`, `lanna-care`,
  `lanna-care-test` all `active`.

## Results

| row | what it did | writes refused (not landed) | writes that landed anyway after the client gave up | duplicates |
|---|---|---|---|---|
| `cloudflared` stopped (stop issued 16:50:42) | **Falls back in about 1 s.** One write got a 503 `pi-timeout` (250 ms, did not land) at 16:50:43; from 16:50:44 the Worker answered every save (47 of 47 returned 200 and landed, 1.0–3.6 s each). Back on the Pi at 16:51:31, one second after the start. | 1 of 85 | 0 | none |
| `lanna-care-test` stopped (16:52:26, the stop took 16 s to finish) | **Never falls back.** During the 16 s shutdown, saves alternated between landing and 503; from 16:52:27 to the restart at 16:53:27 every save was a 503 `pi-timeout` in 100–325 ms. | 53 of 85 | 0 | none |
| app wedged (`SIGSTOP`, 16:54:03) | **No answer at all.** Every save hung to the probe's own 30 s limit and the edge sent nothing in that time. After `SIGCONT` (16:54:50) the Pi drained its queue and answered, some saves 20 s or more late. | 16 | **4**: they hit the 30 s timeout, then landed once the app resumed | none |
| **power pulled** | **Pending: Lutan at the Pi.** Not run, nothing recorded. | | | |

Duplicates were checked by name: every attempt has a unique name and no name appears twice.

**What these say.**
- The one row that works today is the one the paper expected. A stopped tunnel is a 1-second refusal window, not a long one.
- A stopped or wedged app is **never** handed to the Worker, and the wedge shows exactly why a plain retry is unsafe:
  4 writes that the client saw as failures did land. Replaying them on the Worker without a key to detect it would have
  recorded each twice. This is the case option 1 exists for.
- The edge does not turn a wedged app into any status within 30 s, so a "wait for a 5xx" rule cannot work without a time limit.

## Option 5 measurement (writes always on the Worker)

**Not established as a number, but one real data point.** In the `cloudflared` drill the Worker's own build rendered and
saved 47 consecutive create-unit saves against the dev database, all 200 and all landed, with **no 1102** ("Worker exceeded
resource limits"). The Worker is on the free plan (10 ms CPU per request, per `worker/index.mjs`).

What that does and does not show:
- It shows a **small, single-row save** fits on the Worker, on test, under that limit.
- It is **not** a CPU figure. The probe measures wall time (about 1 s, mostly the database round trips). CPU time needs
  `wrangler tail` or the dashboard, which needs Lutan's `wrangler login` and was not taken.
- It says nothing about the **heavy saves** (intake, stocktake, uploads' attachment rows), which are the ones that could
  hit 1102.

## Revised size for (B), (C), (D)

- **(B) schema, `write_requests` table (one migration):** small, about a day. Unchanged.
- **(C) the shared wrapper and the Worker rule (client request id, a first-result-wins record in the same transaction as
  the write, the Worker replaying on any failure):** medium, a few days. The drills confirm what it must cover: 502, 503,
  a hang with no answer, and a thrown fetch. It also needs a client-side time limit on writes, because a wedged app gives no
  status at all.
- **(D) the sweep over every write path:** still the largest part and unchanged by these results. The wedge row proves a
  write can land with no response, so any action left out of the sweep keeps the double-write risk.
- **Option 5 could delete most of (B)–(D), but only if the heavy saves also fit.** Next step before briefing (B): take
  CPU ms for the three heaviest saves with `wrangler tail` (needs Lutan's login). If they fit under 10 ms, route every write
  to the Worker and skip the sweep. If any does not, build (B)–(D) as planned.
- **Not covered by any of this:** the power-cut row, which still needs Lutan at the Pi.
