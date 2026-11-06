# 2026-11-06 — Duplicate migration numbers are refused, on main and across open PRs

Item `#m2q8c`. Two migrations were both numbered `0324` (PR #1333 and #1334) and both shipped, because
`check-migration-numbers.mjs` compared a branch only with `origin/main`, and each branch was cut before the
other merged.

## What was built (`scripts/check-migration-numbers.mjs`, `scripts/lib/migrations.mjs`)

1. **The durable half — a filename read, no network.** Any number shared by two files in the tree being
   checked fails, unless the pair is listed in `KNOWN_DUPLICATES`. Proven offline on a planted list
   (`scripts/fixtures/migration-numbers/`, never a real second migration).
2. **The preventing half — open PRs.** `gh pr list --state open --json number,headRefName,files`; a new file
   whose number another open PR also adds fails, naming the PR. Own branch is skipped. A number unique among
   open PRs passes (`website-switches-schema` holding `0328` is that case). If `gh` cannot answer it warns and
   skips: the filename half still ran, and the hook never touches the network.
3. Runs in CI job `migration-numbers` (now given `GH_TOKEN`); `--no-prs`, `--names-file`, `--prs-file` exist
   for fixtures. Unit tests: `scripts/check-migration-numbers.test.mjs`.

## The ruling on the existing pairs: left as they are

Step zero found **two** duplicate prefixes on `main`, not one: `0191` (`donation_channels`,
`stock_receipts_update_policy`) as well as `0324`. Renumbering is not available: `schema_migrations` records
the filename and both files are recorded in dev and production, so a rename would make the runner see an
unapplied migration and re-run it. The pairs touch unrelated objects, so alphabetical order does not matter.
They are recorded in `KNOWN_DUPLICATES` with the reason, printed as a note on every run, and a *third* file
joining either number, or any other duplicate, fails.

A `--status` that keys on filename sees four distinct names and reports each correctly. Only a tool keying on
the number alone would collide, and none does.
