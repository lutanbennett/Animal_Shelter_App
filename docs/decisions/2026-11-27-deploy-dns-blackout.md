# The wrangler deploy failure is a DNS blackout, and that reverses the "no retry" decision

**2026-11-27, during the `0.49.3` release.** This records a **reversal of a decision made the day
before**, so it is written down rather than left as a backlog note: `#wgdns` closed on 2026-11-26
with *"(3) No retry"*, and `#dnsgp` now asks for one. Nothing here overrides `CLAUDE.md` or
`docs/release-procedure.md`.

## What was decided before, and why it was right

`#wgdns` was opened after `0.49.2`, where Lutan's production Worker deploy took four attempts, three
of them dying on `Unable to resolve Cloudflare's API hostname (api.cloudflare.com or
dash.cloudflare.com)`. It established, by measurement, what the fault was **not**: not DNS
configuration, not a proxy, not `NODE_USE_SYSTEM_CA`, not the API token, and **not IPv6** — the
`0.47.3` prefix-policy finding no longer holds on this machine.

It then closed with three answers. (1) Upgrading wrangler does not help: 4.153.0 and upstream main
both print that message **only** for `code === "ENOTFOUND"` on a Cloudflare host, so the message is
not a catch-all and `getaddrinfo` really was failing. (2) `scripts/lib/wrangler-net-trace.cjs` landed
(#1898), printing every failed lookup with host, code, errno and elapsed time at the moment it fails.
(3) **No retry**, with the reason stated plainly: *"a retry that hides an unknown fault is worse than
the fault."*

**That reasoning was correct and is not being disowned.** A retry added on 2026-11-26 would have
buried an unexplained failure on the one command that is Lutan's own, and the trace was the right
thing to build first.

## What changed: the fault is no longer unknown

`0.49.3`'s first Worker deploy (`--env test`) died on the same message after a complete nine-minute
build, and the trace recorded **six failed lookups inside about 250 ms**, 00:31:37.879Z to
00:31:38.102Z:

| host | elapsed | code |
| --- | --- | --- |
| `registry.npmjs.org` | 10 ms | `ENOTFOUND errno=-3008 getaddrinfo` |
| `api.github.com` | 41 ms | `ENOTFOUND errno=-3008 getaddrinfo` |
| `sparrow.cloudflare.com` | 1 ms | `ENOTFOUND errno=-3008 getaddrinfo` |
| `api.cloudflare.com` | 2 ms | `ENOTFOUND errno=-3008 getaddrinfo` |
| `api.cloudflare.com` | 1 ms | `ENOTFOUND errno=-3008 getaddrinfo` |
| `sparrow.cloudflare.com` | 4 ms | `ENOTFOUND errno=-3008 getaddrinfo` |

Two readings in that table are decisive, and neither was available on 2026-11-26:

1. **`registry.npmjs.org` and `api.github.com` are not Cloudflare API hosts.** The fault takes every
   host at once, so **it is not a Cloudflare problem at all**. Cloudflare's name is in the error only
   because that is what wrangler happened to be asking for when the window opened — which is exactly
   why three sessions spent their time on Cloudflare, DNS and address families.
2. **Every failure took 1 to 41 ms.** That is not a network timeout. It is a resolver answering *no
   such host* immediately, the signature of a stack with no usable DNS server.

**And it had recovered within minutes.** On the same machine, in the same Node binary, `dns.lookup`,
`resolve4` and `resolve6` all returned addresses for both Cloudflare hostnames, and a plain `fetch`
to `api.cloudflare.com/client/v4/user/tokens/verify` returned **HTTP 400** — a real answer. A
`--skip-build` retry then deployed in about a minute with the correct Server Actions key. Lutan's
production deploy, later the same hour **with the VPN up**, succeeded first time.

So the fault is characterised: **a machine-wide DNS blackout lasting under a second, whose only
effect is to kill whatever happened to be mid-flight.**

## The decision

**A bounded retry is now the right remedy, and it does not hide anything.** The trace prints every
failed lookup whether or not a retry follows, so the fault stays visible in the log and in the release
record. What the retry removes is a full eight-to-nine-minute rebuild — which on production is
**Lutan's time, and on `0.49.2` it was his time three times over.**

The shape, recorded so it is not implemented more loosely later:

- Retry **only** when the net trace saw an `ENOTFOUND` inside that wrangler child. Any other failure
  still fails at once.
- **At most twice**, a few seconds apart.
- Reuse the build exactly as `--skip-build` does, and **keep the Server Actions fingerprint assertion
  on every attempt** — that is the `0.47.4` safeguard and it is what makes build reuse safe.
- **Print each retry and its reason**, so a release record shows it happened.

**This must not become general error-swallowing**, which is precisely what `#wgdns` was protecting
against. The scope above is the whole of it.

## What is still NOT established, and must not be written up as if it were

**Why the resolver goes away.** `0.49.2` read NordLynx up with no DNS servers configured on its
interface, and a VPN re-establishing or rotating its resolver would produce exactly this shape. That
is consistent with the correlation across five deploys — **but `0.49.3`'s production deploy succeeded
with the VPN up**, so the VPN is a hypothesis and nothing more. Scope established, timing
established, **cause inferred**.

**The cheapest next measurement**, and the one that would remove the fault rather than paper over it:
whether NordVPN can be made to keep a resolver on its interface, and whether the blackout still
happens with it off. The trace now names what to watch for, so this is a short experiment rather than
an investigation.

**One operational note that cuts the other way:** the Pi is reachable *only* over Meshnet, so turning
the VPN off to avoid this fault costs the route to the Pi. `0.49.2` turned it off and `0.49.3` opened
unable to reach the Pi at all. Whatever is decided, the two have to be decided together.

## Where this lives

`#dnsgp` on the backlog carries the work. `docs/releases/2026-11-26-0-49-3.md` carries the
measurement. `docs/release-handover.md` section 1 carries the instruction for the next release
manager, because the expensive part is not the rebuild — it is the hour spent chasing the host the
error names.
