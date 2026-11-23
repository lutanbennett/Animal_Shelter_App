# The planner preflight asks whether every blocking CI check passes on main (#ckcia)

**Why.** `#bkwai`'s `check-backlog-waiting.mjs` entered the blocking `script-integrity` job on 2026-11-22 and was red on `main` the next morning, before any stream pushed. Nothing re-asks the question once a stream has finished.

**What.** `scripts/check-ci-checks-on-main.mjs` parses `ci.yml` as YAML (a grep counts comments saying "no continue-on-error" as the setting), takes every plain `node scripts/check-*.mjs` step whose job and step lack `continue-on-error: true`, and runs it on the current checkout. `check-planner-preflight.mjs` calls it by default (`--skip-ci-checks` leaves it out and says so).

**Judgement calls.**
- It asserts the *script's outcome*, not the job's wiring. `test-plan` is advisory because its script exits 0 by design, so it is skipped for a different reason below, not flagged.
- Checks that diff against a PR base (`--base`, `origin/...`) or live in PR-only jobs are listed as `skip` and never counted as passed.
- `npm run` steps and shell-conditional steps (`public-views`' guard aside, which is run directly) are not covered.
- Measured 2026-11-23 on Windows: 23 blocking checks pass, 6 skipped, 3m14s. `check-script-integrity` alone exceeds 120s, so the timeout is 300s and a timeout prints as TIMED OUT, not as a failed check.
- Run it from the main checkout on `main`; it answers for whichever checkout it is in.
- `yaml` is a transitive dependency, not in `package.json`; if absent the script prints a note and exits 0.
