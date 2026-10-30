# The PR `audit` job was meant to run only when the package list changes (as built it never runs); every release audits

2026-10-25. Lutan asked: *"If the audit check always fails in a CI and is ignored is it actually adding value?"*
and *"Should we consider the Audit advisory goes on each production release not on every build — what would the
risk be in doing that"*. He chose this version: *"yes put that in the backlog please"*.

## What changed

1. **`ci.yml`:** the PR `audit` job was meant to run only when the diff touches `package.json` or `package-lock.json`.
   **CORRECTED 2026-10-27: as built, it never runs on any PR. SUPERSEDED 2026-10-28: #1041 made `check-docs-only.mjs` write `deps-changed`, so it now runs on a PR touching the package list (see `2026-10-30-claude-md-audit-paragraph.md`).** Its `if` (`ci.yml:248`) needs the `changes` job to report
   `deps-changed` as `true`. The `changes` job passes that value on (`ci.yml:44`), but `check-docs-only.mjs` only prints it
   (`:97`) and writes just `docs-only` to the job output (`:107–108`), so the value is always empty and the test is never met.
   That is why a release cut, which does change `package.json`, still showed `audit` as skipped on 0.40.3 to 0.40.6.
   Nothing was unguarded: the release step below is the check, and it has run on every release. The job was left alone on
   purpose; whether to write the missing value is Lutan's call. The rest of this item describes the intent.
   `check-docs-only.mjs` (already classifying the diff against the merge base) gained a `deps-changed` output
   and the `changes` job exposes it; `audit` is gated on it instead of on "not documents-only". An unreadable diff
   counts as changed, so the failure direction is "audit anyway". A PR that skips it shows the job as *skipped*.
   `continue-on-error: true`, the 90 s timeout and the one retry
   (`2026-10-22-audit-job-inconclusive-is-not-red.md`) are exactly as they were.
2. **`docs/release-procedure.md`:** a step before any production deploy runs `npm run audit:prod` on the release
   SHA. A high or critical needs either a decision file saying it is not reachable or a fix, otherwise the release
   stops. The result goes in the release record (`docs/release-smoke-test.md` has the line).
3. **`CLAUDE.md`:** the "red `audit` check" section says the scope changed and why.

## What this supersedes, and what it does not

It supersedes `CLAUDE.md`'s *"Do not change either audit workflow"* **for the PR job's trigger only**, on Lutan's
decision. Unchanged: `advisories.yml` is not touched (the daily run still fails on purpose,
`2026-10-02-scheduled-audit-fails-on-purpose.md`), the PR job still cannot block a merge, and `npm audit fix
--force` is still never run.

## The residual risk, as put to Lutan and accepted

A dependency PR is still audited. The only gap is a **new** advisory published about something already merged:
the daily run catches it within a day, and the release step before production catches it at the latest.

Not included (offered, not chosen): a list of already-assessed advisory ids the job ignores until a review date.

Verified: `check-docs-only.test.mjs` covers `depsChanged`. That a `src/`-only PR shows `audit` skipped and a
lockfile PR runs it can only be seen on a real run of this PR (src/-free, so skipped) and on the next dependency PR.
