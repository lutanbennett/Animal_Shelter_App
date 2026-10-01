# 2026-10-02 — The scheduled advisory scan fails on purpose; the PR scan stays non-blocking

**Context.** `audit` in `ci.yml` ran only on pull requests and is
`continue-on-error: true`, so an advisory published on a quiet day (the Next RCE,
GHSA-vcvr-r3jv-pc5j) was invisible until someone opened a PR.

**Decision.** `.github/workflows/advisories.yml` runs the same command daily
(`npm run audit:prod`, shared with `ci.yml` so the flags cannot drift) and is
**not** `continue-on-error`. A finding fails that workflow and GitHub emails the
person who last edited the cron line. It is a separate workflow so that failure
cannot turn any PR red, and so the schedule does not drag `check` and
`public-views` (which needs secrets) into cron runs.

**Why the two paths differ, and why that is not an inconsistency.** On a PR a red
audit is noise standing on a change that did not cause it, and gets ignored. On a
schedule there is no PR to carry the result: non-blocking would report to nobody,
the status quo with extra steps. Failing is the cheapest thing that reaches a
person. Do not "tidy" the two to match, in either direction.

**Cadence.** Daily, off the hour. A failure that persists until a fix exists is
one email a day, not one per push (the `test-plan` hourly-red history in
CLAUDE.md). A `push: main` trigger was not added: the schedule makes it moot, and
a non-blocking run on main would report to nobody.

**Known limits.** GitHub disables scheduled workflows after 60 days without repo
activity (not a risk while PRs flow); the email goes to whoever last changed the
cron line, so whoever edits it takes over the alert.
