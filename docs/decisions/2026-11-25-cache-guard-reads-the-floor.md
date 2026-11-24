# The edge-cache guard reads the effective website state, floor included (#wbcch)

**Decided 2026-11-25.** `worker/index.mjs` decided cacheability from the shelter's `x-public-site` header alone. The deployment
floor (`PUBLIC_SITE`) was never read, so a page the app rendered as the holding page *because the floor was locked* was stored
at the edge as though the site were open and could outlive the floor's lift by up to `CACHE_TTL_SECONDS` (600).

**Fix (the minimal option).** New `worker/cache-guard.mjs`: `siteIsOpenForCache(request, env)` calls `publicSiteStateFor(header, env.PUBLIC_SITE)`
from `src/lib/public-site.ts` and caches only when the result is `open`. It imports the app's own function, so there is no second rank
table to drift. The Worker already imports `.ts` from `src/lib` (`public-paths.ts`), so this adds no new build path.

**Why not forward the effective state from `worker/shelter.mjs`.** It would change the contract `worker/shelter.test.mjs` pins
(no shelter, no header, only the floor applies). Not needed to close the gap.

**The old comment at the top of `worker/index.mjs`** said caching the locked landing page was intended. That was sound while the floor
was the only switch; it stopped being sound when the floor became a floor (#wbsof). It is rewritten so nobody restores the bug.

**Not done:** copies already stored are not evicted; they expire within 600 s or on a Cloudflare purge. No purge mechanism was built.
