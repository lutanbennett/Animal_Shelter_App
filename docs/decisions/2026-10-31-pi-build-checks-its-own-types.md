# The Pi build type-checks its own route types, not the live build's

**Fault.** `deploy-pi.sh` builds into `.next.new` (`NEXT_DIST_DIR`) while `.next` keeps serving.
`next build` type-checks with `tsconfig.build.json`, which inherits `tsconfig.json`'s include of
`.next/types/**/*.ts`. On the Pi that is the **live** build's types: the previous release's
`validator.ts`, which imports every page that release had. A release that deletes a page then fails
`TS2307: Cannot find module '../../src/app/<page>/page.js'` (`0.40.12`, `/admin/frequencies`), and
the build is refused. Because `tsconfig.build.json` uses `extends`, Next's
`writeConfigurationDefaults` bails out before it would add `.next.new/types/**/*.ts`, so the build's
**own** route types were never checked on the Pi at all, on any release. The Worker and `gates.mjs`
build in place into `.next`, regenerate those types first, and were never affected.

**Fix: point the typecheck at `.next.new/types`, not move `.next/types` aside.** The backlog item
offered both. `next.config.ts` now picks the tsconfig by the folder the build writes to:
`.next` (or unset) → `tsconfig.build.json`, unchanged; `.next.new` → `tsconfig.next-new.json`, which
extends `tsconfig.build.json` and replaces its include so it lists `.next.new/types` and excludes
`.next`. Any other `NEXT_DIST_DIR` throws at config load rather than silently checking `.next`.
`deploy-pi.sh` needed only its comment changed.

Why this shape and not moving `.next/types` aside:

- **A failed build leaves `.next` exactly as it was, with nothing to put back.** The fix never touches
  `.next`. Moving aside needs a restore on every way the build can end: `abandon_build`, the
  actions-key failure, `set -e`, and a kernel OOM kill (the build has been killed four times on this
  Pi), which no trap survives. A missed restore leaves the serving build without its types: harmless at
  runtime, but it is exactly the kind of half-state the script exists to prevent.
- **It checks the right thing.** Moving aside would stop the stale check failing, but the include
  would still name `.next/types`, now empty, so the new build's route types would still go unchecked.
  Pointing at `.next.new/types` makes the Pi check the same thing the Worker build checks.

**`tsconfig.json`'s `.next/types/**/*.ts` include stays (deliverable 2).** It is not dead: it is how
every in-place build checks Next's route validator. Measured on this branch: `tsc --listFilesOnly -p
tsconfig.build.json` lists the `.next/types` files after an in-place build, and
`-p tsconfig.next-new.json` lists `.next.new/types` and nothing under `.next/`. Removing it would
drop the route-type check from the Worker build and the gates while fixing nothing on the Pi, because
the Pi no longer reads it.

**Proved locally, not on the Pi.** Add a page, build in place (its import lands in
`.next/types/validator.ts`), delete it, build with `NEXT_DIST_DIR=.next.new`. Before the fix:
`TS2307` on `.next/types/validator.ts`, exit 1. After: exit 0. Outputs are in the PR.

**It protects the release that ships it.** The change is in `next.config.ts` and a tsconfig, which
the build reads from the tree `deploy-pi.sh` has just checked out, so it does not wait a deploy the
way a change to the script itself once did (`2026-10-18-deploy-pi-reexec.md`).

**Left for Lutan, not attempted.** The folders `~/stale-next-types-prod-0.40.11` and
`~/stale-next-types-test-0.40.11` on the Pi, set aside by hand for `0.40.12`, can be deleted once a
later Pi deploy has succeeded. The Pi deploy is his (2026-10-02), and remote writes outside
`deploy-pi.sh` are refused to Claude. The real proof, a Pi deploy on a release that deletes a page,
is also his.
