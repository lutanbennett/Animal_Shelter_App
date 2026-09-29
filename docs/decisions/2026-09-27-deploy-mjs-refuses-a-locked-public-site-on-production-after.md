# 2026-09-27 — `deploy.mjs` refuses a locked public site on production after the cutover

The cutover moves the `production` block of `wrangler.jsonc` to
`lannacareforanimals.org` and must drop `"PUBLIC_SITE": "locked"` from it,
or the live site opens on a sign-in page (`src/lib/public-site.ts`). That
was written in the `wrangler.jsonc` comment, the README and the 2026-09-25
entry, and enforced nowhere. `scripts/deploy.mjs` now refuses
`--env production` with exit 2 when it would ship that mistake.

- **The condition has two parts, and needs both.** It refuses when the
  `production` block sets `PUBLIC_SITE` `"locked"` **and** its routes no
  longer include `lannacare.org` (taken from `SITE_ORIGINS.uat`, which is
  UAT's host for good). A check on the lock alone would refuse every
  production deploy from today until the cutover, because today's lock is
  correct: `production` serves `lannacare.org`, which is UAT. A guard that
  is wrong every day gets turned off within a day, and then it isn't
  there on the one day it matters. So the guard is *waiting for the
  cutover*, not checking a permanent invariant. Once the cutover has
  dropped the var it never fires again, and it can be deleted then.
- **No escape hatch, no flag and no env var.** The one case a bypass
  would serve is a locked production on the new domain, for example a
  soft launch. That is a one-line change to a file already open at the
  cutover, and it can be a deliberate commit that says why. A bypass
  flag is what people type instead of reading the message, and the
  message already names the fix. If a locked production on the new domain
  is ever wanted, change the guard in the same commit and say so here.
- **It runs first**, before `.env.deploy.production` is loaded. It needs
  only `wrangler.jsonc`, so a config mistake stops before any secrets are
  read, and the check can be exercised from a checkout with no production
  env file (which is how it was verified).
- **Reading `wrangler.jsonc` moved into `scripts/lib/wrangler.mjs`**, with
  `scripts/pi/write-env.mjs` as its other caller. It supports whole-line
  `//` comments only, which is all the file uses. A file it cannot parse
  throws, and that stops both scripts. It never reads as "no lock set",
  which here would mean a silently open site or a guard that
  passes.
