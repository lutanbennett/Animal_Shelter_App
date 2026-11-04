# 2026-11-04 — A check that the client's fetch hosts are allowed by our own CSP

**Backlog item:** `#wltz7`. Sits beside `worker/security-headers.test.mjs` (#1277), which pins the Drive case; it does not duplicate it.

## 1. Can the client's fetch targets be enumerated? Only partly.

- **Findable (literal or a `const` of a literal):** same-origin paths (`/api/...`, `/lca-logo.jpg`, the receipt PDF) and any absolute `https://` literal. Today **every client call that can be read is same-origin**; there is no absolute third-party URL in browser code.
- **Not findable:** a URL that arrives at run time. Today three call sites: the Drive resumable session URL in `resumable-video.ts` (returned by our server, the one that broke), and the `uploadUrl` of `AttachmentUploader` / `PhotoUploader` (props, same-origin `/api` routes by construction). **Each is listed in `UNRESOLVED_OK` with where its value really comes from**; a new unreadable call fails the test so a person looks.
- **Supabase** is reached through the browser client whose host is an environment value; the check only asserts `connect-src` names `*.supabase.co` over https and wss.

**Honest consequence: this check would NOT have caught the original fault by itself.** The Drive URL is a run-time value, so it sits in the acknowledged list. What caught it is #1277's test on `DRIVE_UPLOAD_API`, which stays. The new check guards the rest: a developer adding `fetch("https://something.example/...")` to browser code, or adding a run-time URL without saying where it points. The item's title should read as partial, not as solved.

## How it works

`worker/csp-client-fetch.test.mjs` imports `CSP` from `security-headers.mjs` (never restated), follows imports from every `'use client'` file (relative and `@/`; skipping `import type`, `"use server"` and `server-only` files, which run on the server), and classifies the first argument of `fetch`, `xhr.open`, `WebSocket`, `EventSource`, `sendBeacon`. It is picked up by `npm test` via `worker/*.test.mjs`. It also checks the scan finds the known sites at all, so a broken scan cannot pass by matching nothing.

## Blind spots (also at the top of the test file)

Run-time URLs; Supabase's real host; every directive other than `connect-src`; redirects to a third host; third-party scripts that fetch for themselves; computed import paths.

## 2. Does `/api/csp-report` receive a blocked `connect-src`? By reading: it should. Not observed.

The Worker answers `POST /api/csp-report` itself, before the cache and the Pi (`worker/index.mjs`), and `summarise()` accepts any `effectiveDirective`, so a `connect-src` report is logged as one line (`csp-report: {"directive":"connect-src","blocked":...}`), in both report-uri and report-to formats. Browsers send reports for every directive, not only scripts. **Not established:** that a real blocked fetch reaches it. `next dev` has no Worker and sends no CSP, so a refusal cannot be provoked from a worktree, and Worker logs are not readable here. Two caveats that make it a weaker net than it looks: the line lives only in Cloudflare's live tail / dashboard (no stored history in the repo or database), and each isolate logs at most 30 lines a minute. So the runtime report is evidence you can fetch **after** a fault; it did not make this one visible. A static check is the better guard, and a stored report is a separate item.

## Left alone

CSP unchanged, no wildcard added, no other header touched, no migration.
