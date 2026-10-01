# 2026-10-01 — CSP reports are collected in the Worker; enforcement waits

- **Where reports go.** `POST /api/csp-report`, answered by the Worker itself
  (`worker/csp-report.mjs`), ahead of the edge cache and the Pi, like
  `/api/releases/*`. Two reasons: the endpoint keeps working when the Pi is
  down (the moment the degraded Worker render is serving pages and could be
  producing violations of its own), and nothing lands on the Pi's one disk,
  which also holds the weekly backups. A report becomes one `console.log` line
  in the Worker's logs (`observability` is on in `wrangler.jsonc`): Cloudflare
  dashboard → Workers → the environment's Worker → Logs, search `csp-report`.
  Both wire formats are named in the policy, `report-uri /api/csp-report` (old
  browsers) and `report-to csp` with `Reporting-Endpoints: csp="/api/csp-report"`
  (current ones). Because the Worker answers it, `x-lanna-served-by` is always
  `worker` for this route; there is no `pi` path to test.
- **What is stored.** Only: directive, blocked URL, page URL, source file,
  line, disposition, each stripped of query string and fragment (they can
  carry tokens and `?next=` paths), control characters removed, 200 characters
  at most. No IP, user agent, cookie or raw body.
- **Bounds, because any browser can post to it.** Body capped at 8 KB (413
  beyond, and a stream is cancelled once past the cap rather than buffered);
  at most 5 reports read from one body; at most 30 log lines per isolate per
  minute, with one "N more dropped" line when the window rolls; always an
  empty 204, so nothing is echoed; non-POST is 405. Not a database table: an
  open write endpoint into Supabase is exactly what a flood would exploit.
  The limiter is per isolate, so the true ceiling scales with isolates; that is
  accepted, since the cost is log lines and the Worker's own request quota,
  not a disk.
- **Enforcement is NOT switched on, and `'unsafe-inline'` stays.** The
  backlog item says "after a quiet week". The report-only header shipped on
  2026-09-30 and until this change nothing received reports, so the quiet
  week has zero observations behind it, not a clean one. Flipping to
  `Content-Security-Policy` now would be guessing, and a wrong guess blocks
  something on a public page for visitors, not for us. The tightening is
  filed on the `backlog` branch with its gate: a week of `csp-report` lines
  from lannacare.org read through, every distinct (directive, blocked) pair
  explained or fixed.
- **Nonces are not attempted.** A nonce has to be on every inline script Next
  emits on both render paths (the Pi's `next start` and the Worker's OpenNext
  render), and the headers are set in the Worker *after* the body is made, so
  it would need per-request plumbing into Next on both. One path working and
  the other not fails only when the Pi is already down; that is worse than
  `'unsafe-inline'`. Left for the follow-up to design.
- **HSTS** stays at six months; raising it is part of the same follow-up.
