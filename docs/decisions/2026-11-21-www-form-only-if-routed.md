# 2026-11-21: the hosts check counts an invented www. form only if the environment routes it (#wwwcb)

`siteHosts()` invents a `www.` form for every configured host. `check-deployed-hosts.mjs` then failed a release on
`www.test.lannacare.org` and `www.uat.lannacare.org`, which exist nowhere (no DNS, no route). Any FAIL stops a release, so the
check made every release manager judge an override, and the one who guessed wrong ships `#hostx` again.

**Shape chosen: filter by wrangler `routes`, not by DNS.** `addressesAnsweredOn(vars, routes)` keeps an invented www. form only
when the environment's `routes` list names it. A host set literally in `APP_HOST`/`PUBLIC_HOST`/`PLATFORM_HOST` is always kept.
With no routes given the old behaviour holds (everything checked).

**Why this cannot hide a real fault.** Routes are what the deployment actually serves: if an address is in `routes` it is
deployed, so it still needs its `shelter_hosts` row and its `/auth/callback` entry, and FAILs if either is missing (tests
"a routed www. form with no row or no callback still fails"). A DNS lookup was rejected: a flaky or blocked lookup on the
release machine would silently drop a genuinely deployed address. Measured from the real `wrangler.jsonc`: test -> 1 address,
uat -> 1, production -> 4 (both www. forms, routed).

**Not touched:** `choosePrimaries()`. **#aucbk:** its check is built and was last run by the planner on UAT; the item says tick
when UAT and production have both been run, and production has not, so it stays open. To run after merge, bare:
`node scripts/check-deployed-hosts.mjs --env test|uat|production`.
