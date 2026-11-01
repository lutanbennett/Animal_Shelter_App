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
- **The fourth row was run differently, on 2026-11-01**, and the differences matter when the rows are
  compared: **240 attempts, not 85**; the probe ran from the PC rather than the Pi, because the
  temporary sudoers rule above was removed on 2026-10-29 and the probe can no longer stop services;
  Lutan pulled the plug with no shutdown; and the probe carried a **write-request id per attempt**,
  which did not exist in October. See "The power-pull row is NOT like-for-like" below. After it the
  Pi was back with `cloudflared`, `lanna-care` and `lanna-care-test` all `active`.

## Results

| row | what it did | writes refused (not landed) | writes that landed anyway after the client gave up | duplicates |
|---|---|---|---|---|
| `cloudflared` stopped (stop issued 16:50:42) | **Falls back in about 1 s.** One write got a 503 `pi-timeout` (250 ms, did not land) at 16:50:43; from 16:50:44 the Worker answered every save (47 of 47 returned 200 and landed, 1.0–3.6 s each). Back on the Pi at 16:51:31, one second after the start. | 1 of 85 | 0 | none |
| `lanna-care-test` stopped (16:52:26, the stop took 16 s to finish) | **Never falls back.** During the 16 s shutdown, saves alternated between landing and 503; from 16:52:27 to the restart at 16:53:27 every save was a 503 `pi-timeout` in 100–325 ms. | 53 of 85 | 0 | none |
| app wedged (`SIGSTOP`, 16:54:03) | **No answer at all.** Every save hung to the probe's own 30 s limit and the edge sent nothing in that time. After `SIGCONT` (16:54:50) the Pi drained its queue and answered, some saves 20 s or more late. | 16 | **4**: they hit the 30 s timeout, then landed once the app resumed | none |
| **power pulled** (2026-11-01, Lutan at the Pi, no shutdown; 240 attempts, not 85) | **Covered for 11 s, then not at all for 44 s. Outage 55.6 s; from power back to serving again about 20 s.** The first failed save **had already been written** — the Pi wrote the row and died before answering. The Worker then covered **7 of 11 attempts over 11 s**. After that the Worker **stopped covering for 44 s**: every save a 503 in 250–370 ms with **no `x-lanna-served-by` header at all**, which `worker/origin.mjs` always sets, so those replies did not come from our Worker and something at Cloudflare's edge answered before it ran. | 46 of 240 | **2**: they landed although the client saw a failure | **none** |

Duplicates were checked by name: every attempt has a unique name and no name appears twice.

### The power-pull row is NOT like-for-like with the other three. Read it on its own.

The first three rows were measured on 2026-10-28, **before the write-request wrapper existed**
(`runWriteAction()`, `docs/decisions/2026-10-31-write-request-wrapper.md`). The power-pull row was
measured on 2026-11-01, after it. **The app changed between them, not just the instrument**, so the
four rows are four different systems and reading them as a series gives a false answer — in
particular, "zero duplicates" in this row is the wrapper doing its job, not a property of a power
cut, and the earlier rows' zeros were measured when nothing was there to help.

What the row does say, and it is the headline: **194 landed, 46 refused, 2 landed although the client
saw a failure, and ZERO duplicates.** The write-request id did exactly the job option 1 exists for.

Two faults came out of the drill, each with its own backlog item:

- **The Worker's cover has a hole in the middle of an outage** (Architecture). It covered the first
  11 s and then nothing for 44 s. That is the most important thing the drill found and it is not
  fixed here.
- **`scripts/pi/drill-probe.mjs` was dead and failed silently** (PI FAILOVER): it sent no
  `__writeRequest`, and `runWriteAction` fails closed on a write with no request id, so every attempt
  returned a clean-looking 200 while nothing landed. A six-second dry run against a healthy Pi gave
  6 of 6 refused in exactly that shape. The row above was taken with a corrected copy that sends a
  fresh uuid per attempt, as a real browser save does; the committed probe is fixed in the same PR
  as this row. Unchanged across the pull it would have recorded "85 of 85 writes refused" as a fact
  about power loss.

### Timing caveat for this row, and for any outage post-mortem on this Pi

**The Pi's real-time clock has no battery.** It boots believing it is 1970, restores a stale saved
time, and is corrected by NTP only once the network is up. So **wall-clock stamps from the first
seconds after a power cut are wrong**, and a reading taken from them is wrong in a way that looks
tidy. The first reading of the 20 s figure was taken that way and had to be redone; the figure above
comes from the journal's **monotonic** stamps, which no clock step can touch.

**About 6 of those 20 seconds are a `cloudflared` boot race**, measured from the same journal on
2026-11-01 and filed as its own backlog item (*`cloudflared` loses a race at boot and only its own
restart saves it*): it starts as soon as `network-online.target` is reached, fails on a DNS lookup
because the router is not answering yet, and is rescued only by its own restart. So the 20 s is not
a floor — part of it is a fault with an owner.

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
  **SUPERSEDED 2026-11-01: the power-cut row is run** (above), so no drill is waiting on Lutan. What
  it added to the list of what is left is the Worker's 44-second hole, which is an Architecture item
  of its own and is not part of (B), (C) or (D).
