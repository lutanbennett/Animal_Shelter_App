# 2026-10-07 — Keep `MAX_UPLOAD_BYTES` at 15 MB: the Pi took the premise away

The backlog item (follow-up to #441) asked for photos of 3, 6, 10 and 14 MB to be uploaded to
test.lannacare.org and each request's Worker CPU read off, then `MAX_UPLOAD_BYTES` lowered if anything under 15 MB hit
1102. Its last sentence said "moot for requests the Pi origin serves once it is live". The Pi is live
(production since 2026-10-01), so the first job was to find out what that leaves. No upload campaign was run.

## What the code does now

`worker/index.mjs` → `originOrLocal()` (`worker/origin.mjs`):

- **test and production** have `ORIGIN_HOST` set. An upload is **streamed** to the Pi: `fetch(url, { body: request.body })`.
  The Worker never parses the multipart body, never runs Next, never re-sends the file to Supabase or Drive. All of that
  runs on the Pi, on Node, with no 10 ms CPU budget. The Worker's cost is a header copy and a pipe, the same ~2 ms the
  header comment gives any proxied request.
- For a write, `request.clone()` is taken first, so the body can be rendered locally if the edge answers 530. A clone is a
  `tee()`: the Pi leg drains the stream and the local leg queues it, so the Worker **holds one copy of the body**, at most
  `MAX_UPLOAD_BODY_BYTES` (16 MB), against a 128 MB isolate. That is memory, not CPU, and nowhere near the cap.
- **uat** has `ORIGIN_HOST: ""` and is the only environment that renders uploads in the Worker. It is not deployed
  (README, "Environments": no routes until the cutover; `--env uat` refuses to deploy), so no request reaches that path.

So the question the item asked, "can a free-plan Worker buffer, parse and re-send 15 MB inside its CPU budget", is no longer
asked of any deployed Worker on the normal path.

## What was checked, and what was not

`scripts/check-worker-origin.mjs` gained two cases with a **16 MB** body: through a Pi that answers, the Pi receives every
byte and nothing is rendered locally; through a Pi that answers 530, the local render receives every byte exactly once.
That shows the plumbing (stream through, clone-and-hold once) and nothing about Cloudflare's accounting.

**Not measured:** Worker CPU or memory for an upload on Cloudflare itself. That is reasoned from the code above, not read from
observability. The reasoning is strong for the Pi path, because there is no Worker-side parsing to cost anything.

## The residual, named rather than measured

An upload made **while the Pi is off the network** (edge 530, which the write fallback of 2026-10-02 replays locally) is
rendered by the Worker at full cost, and was never measured at any size. Reads in that state already hit the same wall (the
Pi single-point-of-failure item), so a photo upload failing then is the same outage, not a new one. The user gets a readable
`fileTooLarge`-style message or a 503, not a stack. Measuring it means switching the tunnel off on test and uploading, which
is cheap if the outage behaviour is ever worth hardening; this decision does not claim it works.

## Decision

- `MAX_UPLOAD_BYTES` stays `15 * 1024 * 1024`. Nothing measured says to lower it, and lowering a limit users meet in their
  own language on the strength of a path nothing deployed takes would cost them for no gain.
- The `fileTooLarge` strings (en and th) are unchanged and still name 15 MB.
- If uat is ever deployed with an empty `ORIGIN_HOST` and uploads matter there, run the item's measurement then. The brief
  for it is in the backlog item's original text (git history of `docs/backlog.md`).
