# release-prs.mjs asks GitHub about commits it cannot place (2026-10-28)

Three releases running, a squash-merged PR left no `Merge pull request #N` commit, the script exited 1
and the release manager added the PR by hand. Now an added migration or test-plan file with no owning PR
is looked up with `gh api repos/{owner}/{repo}/commits/<sha>/pulls`; a MERGED result is added to the list.

- Every PR prints `[from git]` or `[from github]`, and a summary line says how many came from GitHub.
- An orphan GitHub cannot resolve still exits 1. Not softened.
- Offline, `gh` missing or signed out: nothing resolves, output and exit are exactly as before. The call
  is best-effort and only made when an orphan exists, so a clean range never touches the network.
- Limit, stated honestly: only a squash PR that adds a migration or test plan is discovered. Every PR
  carries a test plan, so this is the same net the cross-check always cast.
- The release's own cut PR counts itself when the range ends at the deployed merge. Proof range ends at
  `0911a1e0^1`: 29 PRs. Ending at the merge gives 30.

`check-docs-only.mjs` now also writes `deps-changed=` to `GITHUB_OUTPUT`, so `ci.yml`'s `audit` condition
resolves (decision 2026-10-25-audit-on-releases-not-every-pr). Nothing about the audit job's
`continue-on-error`, timeout or retry, or `advisories.yml`, was touched.

The `record_intake` seeders in the backlog's line-139 tail were found already fixed (batch 6, #1006).
