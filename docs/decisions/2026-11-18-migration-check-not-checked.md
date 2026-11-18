# 2026-11-18: the migration-number check says NOT CHECKED when it cannot see open PRs (`#mnchk`)

## The fault, as it was printed

`calendar-per-shelter-schema` was stopped on 2026-11-18 during a GitHub API outage. In order:

```
migration numbers: open-PR check skipped — gh could not list PRs (Post "https://api.github.com/graphql": net/http: TLS handshake timeout).
migration numbers: note — 0191 is shared by … (known, left as is)
migration numbers: note — 0324 is shared by … (known, left as is)
migration numbers: a new migration must be numbered one past the highest on origin/main … 0409_shelter_calendar_credentials.sql: it leaves a gap … Rename it to 0408_… git mv …
```

The excuse came first and the verdict last. `0408` was held by a sibling branch (what the skipped half would have seen) and dev already held both rows, so following the `git mv` would have collided with a live row and orphaned the applied `0409`.

## What changed

When the open-PR read fails and the tree has a new migration file, `scripts/check-migration-numbers.mjs` prints `NOT CHECKED — <why>`, names the files it did not judge, says "not a pass and not a finding: no rename is advised", and exits **2**. Same words and convention as `check-release-order.mjs` and `check-tenancy-canary.mjs`. With the half intact nothing changed. `--gh-fails` is a fixture flag so a test can drive the path without a real outage.

Proved both ways against a throwaway git repo (`scripts/check-migration-numbers.test.mjs`): same real gap, `--gh-fails` gives exit 2, no `git mv`; `--prs-file` gives exit 1 with the rename as before.

## Exit code (deliverable 5)

Callers: the pre-commit hook (`--staged`) and CI job `migration-numbers`. The hook never reads PRs, so this path is unreachable there and an outage cannot stop a commit. In CI, exit 2 turns the job red during an outage; the cost is a re-run, and the alternative is a green job that checked half. Exit 2 also differs from a refusal (1), so the message and the code both say which state it is. **When no new migration file exists the check still exits 0 even if gh fails**: there is nothing to number, and an outage must not block unrelated PRs.

## Known-duplicate notes (deliverable 6)

Moved below the verdict, in every outcome. They are known and unchanged; the line that matters should not scroll past them.
