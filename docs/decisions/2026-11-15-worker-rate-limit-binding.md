# The report form's volume limit: the Workers rate limit binding (answered, not built)

Date: 2026-11-15. Item `#8t3rk`. Outcome: **answered, not built.**

## Step zero
Nothing in `worker/` bounds volume on a public path (the only "rate" hit is `worker/csp-report.mjs`, which caps its own log lines).
No earlier decision does either (`git log -S rateLimit` finds only an unrelated sign-up page). `reportAnAnimal` in
`src/app/services/report-animal/actions.ts` has no volume check. The gap was still there.

## The one free zone rule is spent on sign-in
Lutan read the zone's Rate limiting rules screen on 2026-11-15: **`1/1 rules`**. The rule is `Sign-in attempts`
(`/login`, Block). It has locked the shelter out of production once (`#fu9z6`, raised from 5 to 50), so it is not edited, and
it cannot be widened to the form: one rule carries one threshold. **There is no second dashboard rule to create.** The earlier
"What to do" steps cannot be followed.

## Is the Workers rate limit binding on the free plan? NOT ESTABLISHED
Read 2026-11-15:
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ (updated 2026-11-12): states no plan, no price,
  no GA/beta label. Needs Wrangler 4.36.0+. Periods 10 or 60 s, counts per Cloudflare location and eventually consistent,
  advises against keying on IP, "Rate limiting bindings are not currently visible in the Cloudflare dashboard".
- https://developers.cloudflare.com/workers/platform/limits/ (updated 2026-11-13): no rate-limiting row.
- https://developers.cloudflare.com/workers/platform/pricing/ (updated 2026-11-13): does not mention rate limiting.
- A third-party write-up (Classmethod) says no extra charge. Not Cloudflare's word; not relied on.

## Why nothing was built
The brief builds only if availability is established. It is not, and it cannot be tested without a production deploy, which is
Lutan's. A binding the plan rejects would fail the deploy itself, a worse outcome than the risk it addresses. So: **build
nothing, and the burst risk stays accepted**, exactly as `2026-10-20-desexing-drives-page.md` accepts it for sign-ups. The form
already bounds what one submission can be (type, size, 50 MP, metadata stripped); only repetition is unbounded.

**If this is revisited:** key judgement to make then. Per-IP is what bounds one visitor, at the cost of shared networks (a
whole shelter or mobile carrier sharing an address), and Cloudflare advises against it; limit generously (well above 2 to 3
requests per first report) and fail open (`success: true` on any error) so an injured-animal report is never refused. Cover
`/services/report-animal` and the Thai route; check how Thai paths are shaped first. No Turnstile (a challenge in front of
someone reporting an injured animal). No card: uncarded on purpose, and bounding repetition grants no ability.

## `/shop/merch/checkout` → `submitOrder` (read, not fixed)
It does not insert as anon. `placeOrder` (`src/lib/merch/checkout.ts`) uses `createAdminClient()` (service role) and calls
`place_merch_order()` (0373, security invoker, service_role only). Prices are re-read server-side and quantity per line is
capped, but **nothing bounds how many orders a stranger may place**: no rate limit, no per-email cap, no challenge. Each order
takes stock. For the planner to file.

## Takes effect
Nothing in `worker/` changed, so nothing waits on a Worker deploy.
