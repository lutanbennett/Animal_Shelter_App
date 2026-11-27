# The DNS-blackout retry: where it sits, what it reads, and what it leaves alone

**2026-11-27, `#dnsgp`.** Implements the shape recorded in `2026-11-27-deploy-dns-blackout.md`; read
that first for why a retry is now right. This file records the three choices that shape did not settle.

## 1. The retry reads a file the trace writes, not wrangler's message

wrangler's stderr is inherited so the operator sees it live, which means `deploy.mjs` cannot read it.
Matching wrangler's *"Unable to resolve Cloudflare's API hostname"* text would also be the wrong test:
it is wrangler's wording, and it names only Cloudflare hosts. So `wrangler-net-trace.cjs` gained one
opt-in behaviour: when `DEPLOY_NET_TRACE_FILE` is set it also appends each failed-lookup line there.
It still changes no lookup. `deploy.mjs` gives each attempt its own file and retries only if that
attempt's file holds a line with `code=ENOTFOUND` **and** `syscall=getaddrinfo`. No file, any other
code (`EAI_AGAIN`, a timeout), or any non-DNS failure: it fails at once, as before.

## 2. It sits in `wrangler()`, after the build, so it never rebuilds

The build is `npm run opennext:build` through `run()`, not `wrangler()`. Retrying inside `wrangler()`
re-uploads the `.open-next` output already on disk — what `--skip-build` does by hand. `builtKeyProblem`
runs again before each retry (the `0.47.4` safeguard). It also covers `wrangler secret bulk`, which is
idempotent.

## 3. The build's own lookups are NOT retried

Asked by the brief. The trace's `registry.npmjs.org` and `api.github.com` failures on `0.49.3` were
**inside the wrangler child** (the trace is preloaded only there), so they are covered already. A
failure in the build itself costs a rebuild either way — a retry saves nothing there, and a failed build
is loud and early. Not worth widening the retry for.

## Not established

Whether NordVPN is the cause. Read 2026-11-27 on the deploy machine: the NordLynx adapter was up with
**no DNS server configured on its interface**, the same as 0.49.2. A recommendation, not a finding;
the PR body for this change carries it.
