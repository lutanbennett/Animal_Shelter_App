# Dependabot PRs are carried on a branch, not merged as they stand

2026-10-07, `claude/dependabot-264`.

## What happened

Dependabot PR #264 bumped `actions/checkout` v4 → v7.0.1 and
`actions/setup-node` v4 → v7.0.0 across `ci.yml` and `advisories.yml`. The
backlog item said it was so far behind `main` (47 commits) that `public-views`
would fail on it for a reason that had nothing to do with the bump.

That was wrong, and the reason is worth knowing: **CI on a pull request runs on
the merge commit** (`refs/pull/<n>/merge`), i.e. the PR's change applied to the
current `main`. A stale branch is not tested as stale. `public-views` passed on
#264's run of 2026-10-07 11:21Z, as did every other check except one.

The one red was `test-plan`. A bot cannot write `docs/test-plans/<feature>.md`,
so **every** Dependabot PR fails it, by construction, every month
(`.github/dependabot.yml` is monthly and grouped).

## What we did

Cherry-picked Dependabot's commit (`-x`, authorship kept) onto
`claude/dependabot-264`, added a test plan, and opened that as the PR. #264 is
closed as superseded; Dependabot also closes its own PR once `main` has the
versions it was proposing.

Rather than adding a commit to Dependabot's branch: a human commit on a
Dependabot branch stops Dependabot rebasing it, and it would have meant two PRs
for one change.

Checked before carrying it, so the next one can be checked the same way:

- Both SHAs resolve to the named tags upstream
  (`gh api repos/actions/<name>/git/ref/tags/<tag>`), and the pinning style —
  full SHA, version in a comment — is kept. A bump to a floating tag would be a
  regression.
- Breaking changes v4 → v7: both actions moved to Node 24, which needs runner
  ≥ 2.327.1 (GitHub-hosted runners have it). `checkout` v6 stores credentials
  in a separate file; v7 refuses fork checkouts under `pull_request_target` /
  `workflow_run`, neither of which we use. `setup-node` v5 turns on automatic
  caching only when `package.json` has a `packageManager` field — ours does not,
  and our jobs set `cache: npm` explicitly where they cache.
- The PR's own CI is the real test: a `pull_request` run uses the PR's workflow
  files, so every job ran on the new versions.

## Not done: exempting bot PRs from `test-plan`

The cleaner long-term fix is for `scripts/check-test-plan.mjs` to accept a PR
opened by `dependabot[bot]` that touches only `.github/workflows/` (or only
lockfiles). CLAUDE.md forbids reopening the test-plan exemption without asking
Lutan, so it is **proposed on the PR, not implemented**. Until he decides, the
route for each monthly Dependabot PR is this one: carry it on a
`claude/dependabot-<n>` branch with a plan that is mostly `n/a`.

`test-plan` is not a required check, so #264 could have been merged red. That
was not done because an *expected* red trains people to ignore red, which is
what cost the release manager 45 minutes on 2026-10-07.
