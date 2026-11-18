# `GHSA-3g3m-2fjr-6pw4` (glob AbortSignal bypass) is not reachable here: judged, not fixed

**2026-11-18, backlog `#globh`.** The nightly `advisories.yml` run went red because `audit:register` fails on any
high advisory not on `docs/advisory-register.json`. That is the mechanism working on its first new advisory. This
file is the judgement it was waiting for.

## The advisory, read at source

`https://github.com/advisories/GHSA-3g3m-2fjr-6pw4` (CVE-2026-118773, published 2026-10-27 by the node-glob
maintainers). GitHub rates it **moderate** (CVSS 4.0 6.3, availability-only, CWE-400); `npm audit` reports the
`glob` package as **high** because it rolls up with the CLI advisory, which is why the register check sees it.

- **Mechanism:** *"abort branches in src/walker.ts call cb() without returning"* (`if (this.signal?.aborted) cb()`
  should be `return cb()`), in `walkCB()`, `walkCB2()`, `walkCBSync()`, `walkCB2Sync()`. After an abort the walk
  rejects, but directory reads continue in the background. It affects the **library** `glob()` and `globStream()`
  when a **`signal`** option is passed.
- **What an attacker must control:** attacker-influenced patterns or directory trees, in an application that uses
  `AbortSignal`/`AbortSignal.timeout()` as a traversal budget. Repeated timeouts stack background walks.
- **Impact:** availability only; the advisory says no confidentiality or integrity impact was observed.
- **Affected:** `glob >= 9.0.0, <= 14.0.1`. **Patched:** `14.0.2`. No workaround is listed.

## Reachability here: not reachable (what was searched)

1. `grep -rnE "from ['\"]glob['\"]|require\(['\"]glob['\"]\)|globStream|node-minify" src scripts worker package.json`
   returns nothing. This repo never imports `glob`. Every `AbortSignal` hit in `src/`, `scripts/` and `worker/` is
   a `fetch` timeout, none touches a glob call.
2. The two installed copies are build-time only: `glob@13.0.6` direct under `@opennextjs/cloudflare@1.20.13`, and
   `glob@10.3.3` via `@opennextjs/cloudflare > @opennextjs/aws > @node-minify/core`.
3. The adapter's own glob calls (`bundle-server.js`, `bundle-node-middleware.js`, `plugins/load-manifest.js`,
   `commands/populate-cache.js`) pass no `signal`; the only `AbortSignal.timeout` near them
   (`populate-cache.js:399`) is on a `fetch`. `@node-minify/core` passes none either. Without a signal the
   cancellation path the flaw lives in never runs.
4. The walked trees are the project's own `.next`/`.open-next` output on the developer's machine, not input from a
   request. No attacker controls pattern or tree, and none of it runs in the deployed Worker.

## Why it was not fixed

`glob` 14.0.2 comes only through a newer `@node-minify/core`/`@opennextjs/*`. `npm audit` offers
`@opennextjs/cloudflare@0.3.0`, a backwards move across the chain (see
`2026-10-28-glob-cli-advisory-not-reachable.md`). A forward adapter bump changes what ships and is its own PR; this
one changes no dependency. If a fixed adapter release appears, take it then and the entry can be deleted.

## Outcome: recorded under `resolved`, not `accepted`

Run today, `npm audit --omit=dev --json` rates this advisory **moderate** (matching GitHub's page); the 2026-11-17
nightly log showed it as high, so the severity has evidently been corrected since. `audit:register` gates only high
and critical, so with an `accepted` entry it prints *"no longer reported. Delete its entry"*. An entry the checker
tells us to delete is dead weight, so it sits under `resolved` as a named record ("not accepted; if it is reported as
high again, re-read this file"). The nightly goes green on the next run.

**`mustBeAbsentFromBuild` (deliverable 8):** it would apply if this were registered, with a different pattern from
the CLI entry's (`walkCB2`, glob's walker, absent from the Worker bundle), since a traversal flaw matters only where
it runs at request time. Not added, because there is no entry to carry it. If the advisory returns as high, register
it with that block and a `mustStayAbsent` on `from "glob"`, `require("glob")`, `globStream` and `globSync` in
`src`, `scripts` and `worker`.

## What would change the answer

Any app, script or Worker code starting to call `glob` with a `signal` over request-derived input; `glob` appearing
in the Worker bundle; or the `reviewBy` date passing.
