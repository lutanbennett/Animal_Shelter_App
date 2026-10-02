# 2026-10-02: The Pi ships releases, not whatever is on `main`

Backlog item "Every guard on the deploy is on the copy nobody is served by".
`scripts/pi/deploy-pi.sh` reset the Pi to `origin/main` and rebuilt, with none of
the checks `scripts/deploy.mjs` makes. The Pi is what users are served; the Worker
answers only when the Pi times out.

## Decision (Lutan, 2026-10-02)

**Release-shipping.** The Pi is a release target like the Worker, not a continuous
deployment of `main`. Production and uat refuse a commit unless `unreleased` is
empty, `package.json` names the newest release, and the database holds every
migration the commit carries. `--env test` stays unguarded.

Rejected: continuous from `main`. Its merit is speed (the 30 September sign-in fix
reached users quickly), but the cost was observed, not theorised: every note in
`0.11.0` was live before it was cut, so `/releases` described what people already
had and the release-time test-plan check had no step to hang on. Speed for a real
emergency is kept by `--force`, which is loud and on record, not by making the
unguarded path the default.

## How

- The rules and messages live once, in `scripts/lib/release-guards.mjs`;
  `deploy.mjs` and the new `scripts/pi/guard-release.mjs` both call it, so the two
  deploy paths cannot drift again. The schema check reuses
  `deployedMigrations` / `missingFromDatabase` / `appliedMigrations` unchanged.
  "Could not ask" is still a warning, never a refusal.
- `deploy-pi.sh` runs the guard right after checking out the commit and before
  `npm ci` / `build` / `restart`, so a refusal leaves the running service untouched.
- `--force "reason"`: the reason is mandatory, every overridden problem is printed
  in a banner, and a line is appended to `~/lanna-deploy-overrides.log` (outside the
  checkout, so the reset cannot erase it). The next release record must mention it.
  There is no forcing past a missing reason.
- **Rollback is now written down.** Production's rollback is
  `deploy-pi.sh --ref <sha>` on the Pi (rebuild, minutes, Worker answers meanwhile;
  guards still apply, so a cut-release commit passes). `wrangler rollback` reverts
  only the Worker fallback. Neither reverts migrations. Corrected in
  `docs/pi-hosting.md`, `docs/release-smoke-test.md`, `docs/test-plan-template.md`
  and `README.md`. Per-feature test plans and `docs/decisions.md` (frozen) still
  carry the old wording as a record of what was said at the time; the backlog's
  "four release records" turned out not to state it (only `2026-10-01.md`, which
  states it correctly).

## Not exercised

`deploy-pi.sh` runs on the Pi. The decision logic and the guard script's `test` and
`--force`-without-reason paths are covered by `scripts/check-release-guards.mjs`;
a real guarded deploy on the Pi is left for manual verification.
