# 2026-10-01 — The Worker does not replay a write when the Pi's status says it is down

Backlog item: "The Worker may replay a `POST` when the tunnel returns 502/530."
It was marked unverified; it is real.

- **Confirmed by reading the code.** `serve()` cloned a write before the
  origin attempt, so the clone's body was still readable, and the status
  branch of `fetchFromOrigin` returned `null` for any `ORIGIN_DOWN_STATUSES`
  without looking at the method — `serve()` then rendered the write locally
  through OpenNext. Only the `catch` branch (a thrown `fetch`) honoured the
  file's own rule that a POST with no answer is not retried. Neither candidate
  "not a bug" held: the clone made the replay succeed rather than fail, and a
  502 or 504 is what cloudflared produces when it loses the origin
  mid-request, which is after the Pi may have recorded the write. That last
  point is reasoned from how cloudflared behaves, not reproduced on the live
  tunnel. (530 and 52x usually mean the request never arrived; they are
  treated alike on purpose — the Worker cannot tell the two apart, and "check
  whether it saved" is the safe reading.)

- **Both branches now share one answer.** A non-idempotent request that gets a
  down status returns the same 503, message and `x-lanna-served-by: pi-timeout`
  as one whose `fetch` throws (`writeUnanswered()` in `worker/origin.mjs`).
  GET/HEAD/OPTIONS still return `null` and fall back to the local render, which
  is what kept the public site up on 2026-10-01.

- **The clone in `serve()` is gone.** It existed only so a write's body could
  be replayed locally; nothing replays one now, and the clone buffered every
  upload for no reason.

- **The origin logic moved to `worker/origin.mjs`.** `index.mjs` imports the
  OpenNext bundle, which exists only after a build, so a check script cannot
  load it. `scripts/check-worker-origin.mjs` stubs `fetch` and asserts, for
  every down status and for a thrown fetch, that GET/HEAD/OPTIONS fall back and
  POST/PUT/PATCH/DELETE get the 503; and that real answers (including app 4xx
  and 500) pass through. Not wired into CI, like the other `check-*.mjs`
  scripts.

- **Known limit.** An app that itself returns 502/503/504 to a POST is now
  reported as "did not answer" rather than passed through. The app does not do
  that today; if it ever should, it needs a status outside the set.
