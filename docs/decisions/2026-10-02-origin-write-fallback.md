# 2026-10-02 — A write falls back to the Worker only when the edge says it never reached the Pi

**Context.** 2026-10-02 the Pi went off the network and sign-in and every save returned `503 pi-timeout`, while reads fell back to the Worker. The backlog item proposed telling a *connect-time* failure (never left the Worker) from an *in-flight* one by what `fetch` throws.

**Observed, not assumed.** A probe Worker under `wrangler dev` (workerd) POSTed to: a closed port, an unresolvable name, and a socket that accepts and never answers (with `AbortSignal.timeout`):

| case | what `fetch` did |
|---|---|
| refused connection | throws `Error: Network connection lost.` |
| DNS failure | throws `Error: internal error; reference = …` |
| accepts, never answers | throws `TimeoutError` (only because we aborted it) |

A refused connect is therefore **indistinguishable from a mid-flight connection loss** — the same message either way. The thrown-error distinction in the item does not exist, so every thrown fetch for a write stays refused. (Local workerd, not production; the conclusion is that the message cannot be relied on, which holds either way.)

**What does distinguish them.** `ORIGIN_HOST` is a Cloudflare-proxied hostname, so the Worker's `fetch` reaches Cloudflare's edge, not the Pi. When the Pi is gone the edge answers for it. 530 (no tunnel connector — error 1033), 521 (refused), 522 (connect timed out) and 523 (unreachable) are all produced *before* any request is forwarded, so they prove it never arrived. 502/503/504 are not: cloudflared can produce them after the Pi has acted (#250). Today's outage was a tunnel with no connector, i.e. 530.

**Decision.** `worker/origin.mjs` exports `NEVER_ARRIVED_STATUSES` = 521/522/523/530. A write answered with one of those returns `null` (render locally); every other failure — thrown fetch, 502/503/504 — is still `writeUnanswered()`. No pre-flight `HEAD` was needed. `scripts/check-worker-origin.mjs` covers both sides.

**Caveats.** The 52x/530 mapping is from Cloudflare's documented behaviour and the stubbed check, not a live run: the Pi serves production *and* test, so the outage could not be reproduced without taking both down. A write replayed locally runs under the Worker's CPU limits (`Error 1102`) the Pi was adopted to avoid, and for the same reason this is an outage mode, not a normal one.

**Not decided here.** (b) the Worker noticing the Pi is down and mailing (batch 34); (c) the weekly backup on the same single point of failure; whether `ORIGIN_HOST=""` becomes a documented emergency lever — Lutan's call. Note for (b): 530 on the Worker's own probe is the signal that the tunnel has no connector.
