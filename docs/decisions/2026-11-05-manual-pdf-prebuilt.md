# The full manual PDF is built once at deploy time, and the path never runs on the Worker

2026-11-05, stream `manual-pdf-prebuilt`. Lutan chose this fix himself after being shown the timings.

## The fault

Asking for the full manual as a PDF gave Cloudflare error 1102. Only an Admin can ask: the route gives an
Admin the whole manual whatever is requested. Measured on a fast PC against a real build: 33 s with the 44
screenshots, 27.9 s without them. **The screenshots are only ~5 s of it; react-pdf laying out the text is the
rest**, so trimming the live render could not work. The Worker gives the Pi 20 s (`ORIGIN_TIMEOUT_MS`), then
renders the page itself, and a Worker cannot finish that.

## What changed

**(a) The path is Pi-only.** `src/lib/pi-only-paths.ts` lists `/manual/pdf`. For a listed path
`worker/origin.mjs` never falls back to the Worker and does not time the Pi out: a Pi that is down or
returns a down status (502/503/504/52x) gives a plain 503 (`x-lanna-served-by: pi-unavailable`). This is a
third shape beside `/api/releases/*` (answered by the Worker) and `/api/version` (always the Pi) and
is closest to the latter; it is a list rather than a one-off so the next heavy path is one line.

**(c) Build once, serve the file.** `topicInCopy()` never consults permissions when `all` is true, so the full
manual is identical for every reader of a language. Only the locale varies (the card names and the *Cards
at a glance* heading come from the reader's dictionary; the body is English). So two files,
`.manual-pdf/en.pdf` and `.manual-pdf/th.pdf`, written by `scripts/build-manual-pdf.mjs`.

- They live in `.manual-pdf/` under the app directory, **not `public/`**, which is served to anyone.
- `/manual/pdf` keeps its own sign-in check and reads the file after it. It is not a static route.
- The personalised copy (anyone who is not asking for, or given, the whole manual) and `?images=0` stay live.
  Both are Pi-only now, so a slow answer no longer reaches the Worker.

## Decided: when the files are built

**In `scripts/pi/deploy-pi.sh`, after the build and before the swap**, not in `npm run build` and not a
release step someone remembers.

- Not `npm run build`: the Cloudflare Worker build also runs it, where the files can never be served,
  and it costs ~100 s there on every build and every `gates.mjs` run.
- Not a release step: that is a thing to forget, and a forgotten step looks like a working site until
  an Admin presses the button.
- The deploy script already builds the thing that is served, on the machine that serves it. A failure
  stops before the swap, so the old version and its old manual keep serving.
- The script bundles `manual-pdf.tsx` with `esbuild` (already present through `wrangler`, a dev dependency
  the Pi installs with `npm ci`) so the TSX and the `@/` alias run outside Next. `server-only` is stubbed
  empty. It is not a new dependency.

## Decided: the missing-file case is an error, not a slow path

If `.manual-pdf/<locale>.pdf` is absent the route answers 503 with a plain message (and logs the command to
run). It does **not** fall back to a live render, because that is the 1102/timeout this removes. The
personalised copy still works.

## Decided: the screenshots are not shrunk

The files total 8.6 MB each, nearly all screenshots; shrinking would cut that ~80%. Not done here:
- it is size, not speed, and nothing now waits on it;
- the screenshots are deliberately stale and one full re-take is planned. Re-encoding the old ones is
  work that is then thrown away, and `screenshot-sizes.json` (which drives the layout) would have to stay in step.
Do it at the re-take.

## Found, not fixed

- A file on the Pi is built at deploy, so editing `src/lib/manual/en.ts` takes effect for the Admin PDF at
  the next Pi deploy (the live `/manual` page follows the build too, so they agree).
- `?view=all` in Thai is the English body with Thai card names, exactly as before.
