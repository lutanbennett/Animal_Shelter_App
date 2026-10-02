# 2026-10-02 — A write falls back to the Worker only on a 530, the edge saying it never reached the Pi

**Context.** On 2026-10-02 the Pi went off the network and sign-in and every save returned `503 pi-timeout`, while reads fell back to the Worker. The backlog item proposed telling a *connect-time* failure (the request never left the Worker) from an *in-flight* one, and letting writes fall through on the first kind.

## What was observed

A probe Worker under `wrangler dev` (workerd, the runtime production uses) POSTed to throwaway origins on 127.0.0.1:

| origin | what the Worker's `fetch` did |
|---|---|
| nothing listening (connection refused) | throws `Error: Network connection lost.` |
| reads the whole write, then drops the connection | throws `Error: Network connection lost.` |
| unresolvable name | throws `Error: internal error; reference = …` |
| accepts, never answers | nothing, until an `AbortSignal` fires: `TimeoutError` |

**The first two are the same error.** One is the case where replaying is provably safe, the other is the exact case the refusal exists for (#250), and a thrown fetch cannot tell them apart. So the distinction the item hoped for does not exist at the level of thrown errors, and every thrown fetch for a write stays refused.

## What does distinguish them

`ORIGIN_HOST` is a tunnel hostname, so the Worker's `fetch` talks to Cloudflare's edge, never to the Pi directly. When the tunnel has no connector the edge answers for it: **530, body `error code: 1033`** — "Cloudflare's network cannot find a healthy `cloudflared` instance to receive the traffic" (Cloudflare's tunnel troubleshooting page). That is decided before anything is forwarded, so a write that gets a 530 never reached the Pi.

The other down statuses were each considered and left refused:

- **502/503/504** — cloudflared answers these when it loses the app, which can be after the Pi acted. #250's finding; unchanged.
- **522** — not only "could not connect": Cloudflare also returns it when the origin accepts the connection and then does not acknowledge the request within 90 seconds. Not provably pre-arrival.
- **521/523** — connect refused / unreachable for a directly-proxied origin. A tunnel origin does not produce them and nothing here checked them, so they stay refused rather than being widened on reasoning alone.

## Decision

- `worker/origin.mjs`: `NEVER_ARRIVED_STATUSES = {530}`. A write answered 530 returns `null` (render locally); every other failure is still `writeUnanswered()`.
- **The clone is back**, in `originOrLocal()`. The first cut of this change returned `null` for the write and stopped there — and the local render then failed with *"Body is unusable: Body has already been read"*, because the origin attempt had consumed it. #250 removed the clone because nothing replayed a write; now one thing does. It holds a write's body in Worker memory for the life of the request (uploads are capped at 16 MB).
- No pre-flight `HEAD`: the 530 is a better signal than a probe, which would add a round trip to every write and still race the Pi going down.
- `scripts/check-worker-origin.mjs` now also runs real loopback origins (530, 504, takes-the-write-then-drops, refuses, hangs) through `originOrLocal` and asserts the local render gets the body exactly once, or never.

## What this does not establish

- **That the 2026-10-02 outage was a 530.** The backlog records only the Worker's own `503 pi-timeout`, which the old code returned for a 530 and for a thrown fetch alike. Cloudflare's documentation and the failover drill in `docs/pi-hosting.md` ("tunnel down → 530 → worker") both say a missing connector is a 530, and that is what this change relies on — but nobody has watched it happen on this tunnel with a POST. The check is the drill: stop `cloudflared` on the Pi and sign in. It is in the test plan's manual list.
- **The first seconds of an outage.** Until the edge notices the connector is gone it may answer 502/504 or time out. Those writes are still refused, correctly.
- **Forms already open when the Pi drops.** The Pi and the Worker are separate builds and no `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is set, so (per Next's self-hosting guide; not reproduced here) a form rendered by the Pi and submitted to the Worker will likely fail once with "Failed to find Server Action" and work after a reload. Anyone loading `/login` after the Pi is down gets a Worker-rendered form, which is the case that mattered on the day.
- **CPU.** A write rendered locally runs under the limits the Pi was adopted to avoid (`Error 1102`). This is an outage mode.

## For the pieces this stream did not do

- **(b), batch 34:** a 530 from the tunnel hostname is the unambiguous "the Pi is gone" signal for the scheduled handler; `checkOrigin()` in `src/lib/status/health.ts` already records the status it gets.
- **`ORIGIN_HOST=""` as an emergency lever** (Lutan's call): this change makes it unnecessary for the tunnel-down case, which is the one that happened. It would still be the lever when the Pi is up but wrong — answering 502s, or slow — since those writes stay refused.
