# 2026-11-26 — What wrangler's "Unable to resolve Cloudflare's API hostname" actually catches (#wgdns)

## What the message catches

Read in the installed `node_modules/wrangler/wrangler-dist/cli.js` (4.153.0, `npm ls wrangler`) and in
upstream `packages/wrangler/src/core/handle-errors.ts` on `main`:

- `handleError()` prints the message when `isCloudflareAPIDNSError(e)` is true, and that is true **only**
  when the error, or its first `.cause`, has `code === "ENOTFOUND"` **and** its message or `hostname`
  names `api.cloudflare.com` or `dash.cloudflare.com`.
- Timeouts (`UND_ERR_CONNECT_TIMEOUT`), resets, refusals, `EAI_AGAIN` and certificate errors take other
  branches. **So the message is not a catch-all for network failures**, which is what the backlog item
  assumed: when it appears, a `getaddrinfo` call inside the wrangler process really did return
  "not found" for a Cloudflare host.
- The branch then **returns without logging the error at all**, not even at `WRANGLER_LOG=debug`, and
  wrangler's own log file holds nothing about it (checked: no `ENOTFOUND`/`getaddrinfo` in the log a forced
  failure wrote). The permission and file-not-found branches do log at debug; this one is the outlier.

The 0.49.2 sweep (both hostnames resolving from curl and from Node, between attempts) does not contradict
this: the failures were intermittent, and the resolves that were checked were not the ones that failed.

## The upgrade question

**Upgrading would not help, and is not recommended for this reason.** Upstream `main` has the same
ENOTFOUND-only test and the same silent return. No `CHANGELOG.md` entry from 4.153.0 to 4.168.0 mentions
ENOTFOUND, the message, or cause logging in `handleError`. (4.166.0 adds retries for transient API
failures on some reads; that is an unrelated reason someone may want the upgrade, in its own PR.)

## What landed

`scripts/deploy.mjs`'s `wrangler()` now starts the child as
`node --require scripts/lib/wrangler-net-trace.cjs wrangler.js …`. The preload wraps `dns.lookup` and
`dns.promises.lookup` and, on **failure only**, prints one line to stderr:

`[deploy net-trace] DNS lookup FAILED: host=… code=… errno=… syscall=… family=… after=<ms> at=<ISO time>`

It passes every result through unchanged, so it alters no behaviour.

**Forced, not reproduced** (a production deploy is Lutan's): the same spawn shape with
`CLOUDFLARE_API_BASE_URL=https://api.cloudflare.com.invalid/client/v4` and `wrangler whoami` printed

```
[deploy net-trace] DNS lookup FAILED: host=api.cloudflare.com.invalid code=ENOTFOUND errno=-3008 syscall=getaddrinfo family=any after=27ms at=2026-11-26T05:46:37.472Z
X [ERROR] Unable to resolve Cloudflare's API hostname (api.cloudflare.com or dash.cloudflare.com).
```

so the trace reaches the exact path that produces the message. The run exited 127 with
`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`; the same run **without** the preload does the
same, so that is wrangler's own Windows teardown, not the trace.

What the next failure's line will tell us: the exact host (api vs dash, or something else), whether
`after=` is near zero (cached negative answer / no network adapter) or several seconds (resolver timed out
and Windows reported it as not-found), and the time, to match against the machine's network events.

## Retry: no

A retry would hide the one fault we have now made visible, before anyone has read it. Decided against.
Revisit only once a traced failure has been read. If one is ever added, `--skip-build` keeps it to seconds
and the reused build must print the same Server Actions key (0.47.4).

## Not established

**Why `getaddrinfo` intermittently fails on the deploy machine.** That is the half of #wgdns this does not
close; the next failing deploy prints the facts needed.
