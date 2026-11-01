# Drill probe now captures headers and bodies (2026-11-01)

Backlog item: *THE WORKER FALLBACK STOPS COVERING AFTER ABOUT ELEVEN SECONDS* (Architecture). **Still open.** This
changes the instrument only; it diagnoses nothing, and no timing constant or `worker/` file was touched.

## What changed in `scripts/pi/drill-probe.mjs`

- Every attempt records **all response headers**. No header is picked as "the proof": the reader decides.
- Any **non-2xx** reply records its **body**, cut at 2000 characters and marked `<truncated: N chars in all>`;
  an empty body says `<empty body>`; a thrown error says it had no response.
- **Where the detail goes (my choice):** the per-attempt lines are unchanged, so they still read at a glance. Full
  detail goes to `.local/drill-<case>.detail.jsonl` (appended, one JSON object per attempt). Under the summary the
  probe also prints the **first** non-2xx reply (headers, first 300 chars of body), so one screen answers "who replied".
  A bad reply is 5-20 lines on screen, never one per attempt.

## Should the probe post to more than `/admin/units`? No.

The open question is *who answered the 503s*, and that does not depend on the address: an edge reply before the Worker
runs would be the same for any path. A second address would need another hand-copied server-action id that goes stale
with every build (the probe's header already warns about the first), and it would add output. If the next drill shows
the 503s depend on the path, add one then.

## The next drill (at the Pi)

1. Make a fresh cookie (`node scripts/dev-signin.mjs admin --port <p>`, keep the `sb-...-auth-token=base64-...` part in a file).
2. Dry run first, as the script's header says: `node scripts/pi/drill-probe.mjs dry 6 <cookie-file>` must show
   `landed=yes` six times and "no non-2xx replies".
3. **Lutan's step:** in another window, `wrangler login` if needed, then `wrangler tail` on the Worker, and leave it running.
4. Pull the power. Run `node scripts/pi/drill-probe.mjs power-2 90 <cookie-file>`.
5. Read the output for the first reply with no `served-by`:
   - its **headers**: `server`, `cf-ray`, `content-type`, anything Cloudflare adds, and the absence of ours;
   - its **body**: a Cloudflare error page (code in the text, e.g. 1033/1101/1102), or empty, or ours;
   - the **tail**: does a request line appear for those saves at all? **No line means the Worker never ran** (edge or route);
     a line with an exception means the Worker erred or was evicted.
6. Keep `.local/drill-power-2.detail.jsonl` and the tail output; write the finding on the backlog item.

Not established, as before: Worker eviction/error, route or custom-domain behaviour with no tunnel connector, or the
edge answering on 1033. This capture is meant to tell them apart in one run.

## Proven how

Against a healthy Pi (test site, 6 seconds): 6 of 6 `landed=yes`, `served-by=pi`, full headers (including `cf-ray`,
`content-type`) in the detail file. The non-2xx body path was exercised against a local stub returning a 5 KB 503 (body
truncated and marked) and the no-response path against a refused connection. The dead-Pi path itself is untested.

Also: a timing constant is not suspected; `WORKER_FALLBACK_MS` and neighbours are unchanged.
