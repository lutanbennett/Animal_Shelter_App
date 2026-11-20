# A check that every declared host is pinned into the build and onto the Pi (#plhbd)

**What #1749 did:** `scripts/deploy.mjs` now loops over `SITE_HOST_VARS`, and `PLATFORM_HOST` has its own
entry in `scripts/lib/runtime-config.mjs` (`where: pi`, `source: wrangler`), which is how
`scripts/pi/write-env.mjs` picks it up through `PI_WRANGLER_VARS`. Both halves of the fault were already
fixed; nothing asserted that they stay fixed.

**What this adds:** `pinProblems` in `scripts/lib/site-hosts-problems.mjs`, run by `scripts/check-site-hosts.mjs`
(already in CI) with broken-copy cases. It asserts: every `*_HOST` var in `wrangler.jsonc` (bar `ORIGIN_HOST`, the
tunnel name) is in `SITE_HOST_VARS`; every declared site host is in `PI_WRANGLER_VARS`; `deploy.mjs` still loops.

**Why not "every environment declares all three":** `test` and `uat` carry no `PLATFORM_HOST` and are right not to.
The rule asks only about hosts an environment does declare.

**Limit:** it reads files, not the built bundle. Only pressing a button on the live address proves a host.
