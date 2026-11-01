# Every PR merges on green, feature PRs included

Lutan's decision, **2026-11-01**, asked directly by the Daily Planner and answered in one word:
*merge on green.*

## The question, and why it was put to him

Batch 6's three streams — #1143, #1144 and #1145 — **merged themselves** on 2026-10-31 between 23:13
and 23:14, each having first checked that the CI run's commit matched its own head and each having
posted its `stream-usage:` comment before merging. Nothing went wrong. But `CLAUDE.md`'s merge train
said *"Once the user says so, merge it"* for a feature PR, so three streams had just done something the
rules told them not to do.

That is a fork with only two honest ends: either the behaviour was wrong and the briefs needed
tightening, or the rule was wrong and should go. **It is his call, so he was asked, as one question
with two buttons.** He chose merge on green.

## What changed in `CLAUDE.md`

Three places, because the old rule was written in three:

1. **The merge train, step 4** — *"Once the user says so, merge it — except for a release's own two
   PRs"* became *"Then merge it yourself as soon as every check is green — every PR, feature PRs
   included. Do not ask."*
2. **The section that used to be the exception** was *"Release PRs and the handovers merge without
   asking"*. It is now **"Every PR merges on green"**, with the general rule at the top and the release
   history kept underneath, because that history is the reasoning that was eventually applied to
   everything.
3. **The closing line of that section** said *"Everything else still needs his go: feature PRs are
   unchanged"*. It is **marked superseded in place rather than deleted**, as the backlog's own
   convention requires — a session reading an older decision file or test plan will meet the old rule
   and needs to know which way it went. The half of that line which still holds is called out: **a red
   check is never merged past, on any PR.**

Nothing else in the repository needed changing. `grep` over every `.md` and `.mjs` outside
`docs/decisions/`, `docs/releases/` and `docs/test-plans/` found no other statement of the old rule;
in particular the `plan-day` skill and `docs/release-procedure.md` carry none.

## What did NOT change, and this is the part worth re-reading

The merge is still conditional, and the conditions are unchanged:

- **Every check green on the PR's own head commit**, read rather than assumed:
  `gh run view <id> --json status,conclusion,headSha`. A green run against an older commit is not a
  green run, and silent CI on a pushed commit means the PR has gone CONFLICTING.
- **`audit` showing `skipped`** on a PR with no `package.json` change is normal **and is not a pass.**
- **A red check is never merged past.** A red `test-plan` is always somebody's real mistake and never
  "nobody has signed yet". A red `audit` on a PR that ran it is a real finding.
- **Major versus minor, and the production Worker deploy, are still his** — 2026-10-13 and 2026-10-02,
  untouched by this.
- **No auto-merge switch, and still do not add one.** The mechanism is this rule. GitHub's and the
  app's switches would merge a PR nobody had read the checks on, and a second mechanism doing the same
  job is one more thing to keep in step. The 2026-10-13 reasoning holds exactly as written.
- **The gates, the seven CI checks and the test plans are all exactly as they were.** What was removed
  is Claude *waiting* for a yes on a PR that has already passed every one of them — the same thing the
  release PRs stopped waiting for in October.

## The three batch-7 briefs were corrected before their sessions opened

`write-paths-admin`, `thai-hardcoded-strings` and `manual-access-by-cards` had their worktrees and
briefs created earlier the same day, and each brief ended *"Then wait for Lutan's go before
`gh pr merge`"*. All three were rewritten with the new rule and its conditions **before Lutan opened
the sessions**, so no stream read the superseded instruction. Worth recording because it is the
recurring hazard of this setup: **a brief is a copy of the rules, and a copy goes stale the moment the
rules move.** A brief written before a decision and read after it is a rule nobody chose.

## No backlog item

This closes nothing, because it was never filed as an item — it came out of a question asked while
reporting batch 6. Said here rather than inventing a tick.
