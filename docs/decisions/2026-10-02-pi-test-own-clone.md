# 2026-10-02: Test on the Pi runs from its own clone, and the deploy refuses the wrong one

Backlog item "Serve test.lannacare.org from the Pi too". Test's `ORIGIN_HOST` was
empty, so every signed-in test page rendered in the CPU-limited Worker (Cloudflare
1102; it stopped the 2026-10-02 role walkthrough at Pass 0). Pointing it at the Pi
is the fix, with one trap.

## Decision

- **Separate clone.** `deploy-pi.sh` builds in its own checkout and
  `lanna-care.service` serves that folder's `.next`. A test build there would bake
  the dev database's `NEXT_PUBLIC_*` into what production serves at its next
  restart: the same class of fault as #271, invisible afterwards. Test gets
  `~/Animal_Shelter_App_test` and `lanna-care-test.service` (127.0.0.1:3001).
- **The guard is the folder name.** `*_test` is the test clone and nothing else is.
  `--env test` from any other folder, and production/uat from a `*_test` one,
  exit 2 before fetch, build or restart, naming the folder and the right command.
  A test clone holding `.env.deploy.production` or `.env.deploy.uat` also refuses.
  Rejected: a marker file (an existing production clone would need one created by
  hand, and a missing marker fails open or breaks the box).
- **Test must not starve production:** the unit has `Nice=10`, `CPUWeight=50`,
  `MemoryMax=900M`; test installs and builds run under `nice -n 10`; its photo cache
  is `~/photo-cache-test`.
- **WAF:** extend production's rule to both hostnames (free plan: five rules).
- `ORIGIN_KEY` for test goes in `.env.local`, because test's values file is
  `.env.local` (`envFile("test")`); there is no `.env.deploy.test`.

The cost is accepted: the Pi prepares both environments, so a test deploy competes
with production for one box. UAT should get its own answer at cutover, not a third
service here.
