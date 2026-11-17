# Two Cloudflare free-plan questions: the 10 ms budget (#egq18) and the wildcard host (#v0302)

Date: 2026-11-17. Stream `worker-free-plan-limits`. No app code, `wrangler.jsonc` or DNS changed.

## Step zero

- `2026-11-14-cooperjaidee-hostnames.md` still says the wildcard is "Not verified, and not assumed".
- `2026-11-16-tenancy-worker-shelter-header.md` never mentions a wildcard (0 matches).
- `wrangler.jsonc` lists every host one by one with `"custom_domain": true`.
- So neither question was already answered.

## #v0302: the wildcard (ANSWERED)

Two different questions, answered separately.

1. **Can a `custom_domain` binding be a wildcard? No.** Cloudflare's Custom Domains page says Custom Domains do not
   support wildcard DNS records, and that a request must exactly match the registered hostname.
   `node_modules/wrangler/config-schema.json` types `custom_domain` as a bare boolean beside a `pattern` string, so it is
   an exact-host binding and does not cure this. Not tried with a `--dry-run`, so the "no" rests on the docs.
2. **Can a Worker route match `*.cooperjaidee.org/*`? Yes.** The Routes page documents a leading `*.` as matching all
   subhosts (not the apex), and states no plan restriction. It requires an active zone and says each hostname needs a
   proxied DNS record. A wildcard route would therefore also need a proxied wildcard DNS record in the zone, which is
   Lutan's account and is not touched here. **Not established:** whether the zone must be in the same account (the page
   is silent), and whether a free-plan limit on route count applies (neither page gives one). Free certificate covers
   one level only (2026-11-14), so `*.cooperjaidee.org` and never a second level.

Conclusion: a wildcard is possible only as a zone **route**, not as a `custom_domain`; the current exact-host listing is
the known-working fallback and nothing is blocked. Recommendation for whoever adds shelter #2: keep listing hosts
one by one unless shelter count makes that tedious, then trial a route plus wildcard DNS on a non-production zone
first. Sources: developers.cloudflare.com/workers/configuration/routing/custom-domains/ and `.../routes/`, read 2026-11-17.

## #egq18: the 10 ms budget (NOT ESTABLISHED, needs a deploy)

**Method.** `npm run opennext:build` (took two runs: the first stopped at the known Next advisory after compiling), then
`opennextjs-cloudflare preview --port 8791`, the top-level wrangler config with no `ORIGIN_HOST`, so pages render in the
Worker. Twelve public prefixes requested, warmed once, three rounds with `/about` bracketing each round.

**Why there is no CPU figure.** Local `workerd` records `cpu_time_ms: 0` and `wall_time_ms: 0` for every request in its
observability spans, so the instrument the item needs does not exist locally. Only curl wall time is available, and
wall time includes Supabase round trips and loopback, so it is not CPU.

**What the wall times were (local, indicative only).** Machine load, read via `Win32_Processor.LoadPercentage` beside
each request, swung 44–100 % because other streams were building (`tenancy-*` streams were live), so these are not a
clean reading by the repo's own rules.

| Page | Wall time, 3 rounds (s) |
|---|---|
| /about (bracket, 6 readings) | 0.016–0.072 |
| /adopt, /volunteer, /shop, /privacy, /events, /friends, /donate | 0.016–0.100 |
| /our-work, /foster | 0.020–0.132 |
| /campaigns | 0.75, 0.90, 1.80 |
| /services | 404 on every round (not a page) |

Bracketing: `/about` read 0.016 to 0.072 s across a run, so drift is the same size as most of the differences. Most
pages answer in roughly 20 ms wall, which suggests a prerendered or cached response rather than a render, so it
says nothing about the cost of a real render. `/campaigns` is clearly heavier (0.75–1.8 s wall, mostly waiting).

**Conclusion: not established.** A local figure is not CPU, so I cannot honestly say *fits*, *does not fit* or *marginal*.
What a deploy needs: the **test** Worker with `ORIGIN_HOST` set empty for a short window, a handful of requests per page
from `PUBLIC_PAGE_PREFIXES`, then read each request's `cpu_time_ms` in Cloudflare's own Workers observability on a quiet
machine and quiet traffic. That is a deploy, which is not a stream's. The prior record (627 CPU-limit errors on UAT on
2026-11-05, `docs/pi-hosting.md`'s 30–40 ms per Next page) still points to *does not fit* for rendered pages, but that is
history, not this measurement. `#egq18` stays open on the deploy.

**`#34a30` (Part 13):** not decidable from this. It stays blocked on a real CPU number. Not ticked.
