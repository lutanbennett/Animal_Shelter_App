# The release paperwork gets a time budget, and a documents PR stops paying for a full CI run

Decided 2026-10-20 by Lutan, immediately after `0.38.0` shipped, in answer to a
release where the deploy was done an hour before the bookkeeping was.

His words: *"we started the release hours ago and it was released at least an hour
ago but all the paperwork seems to be taking a huge amount of time to complete
which is causing these conflicts, how can we speed up the paperwork side"*. Five
changes were put to him with measurements; he chose all five.

## What it actually cost, measured rather than estimated

The hour after `0.38.0` was live on all four targets:

| | |
|---|---|
| Writing three documents | **~45 min** — a 300-line record section, a 300-line handover, a 190-line test plan |
| A second worktree (`npm ci` to hold two `.md` files) | ~4 min |
| `gates.mjs` + CI on a documents-only PR | ~7 min |
| Diagnosing a red check the PR could not have caused | ~5 min |

**The dominant cost was the writing, not the tooling** — and most of the writing
restated something already in `docs/release-procedure.md`, in the record sitting
beside it, or in the previous handover.

## The conflicts were caused by the slowness, which is why this is not just tidying

`0.38.0`'s record PR (#776) changed two markdown files and was blocked **twice**
by `public-views`, a check it could not affect:

1. **A three-minute race.** `public_desexing_drives` was live in the shared dev database at 20:20:27, when CI fetched. The commit adding `0233_desexing_drives.sql` — the only proof of which branch owns that view — was not pushed until 20:23:25. `scripts/lib/public-view-owner.mjs` worked exactly as designed and had no proof to find, so it correctly refused to guess towards a skip and the job failed.
2. **A stale allow-list.** By the time that was diagnosed, the desexing schema PR had merged, so the view was now legitimately `main`'s — and this branch was **23 commits behind**, with an allow-list that predated it. `worktree.mjs sync` fixed it.

**Neither failure was in anything the PR changed.** Both were the cost of a
documents PR being open long enough for the world to move. A faster paperwork
cycle is a smaller target.

Worse, the slowness made the paperwork **wrong**. Two of the record's "still open"
items were closed by other streams while it was being written — `served-bytes.mjs`
explained the asset-byte disagreement outright, and `check-cron-job.mjs` landed as
a purpose-built checker for the retention job. And an inference written into the
handover — that the byte gap "grew from 4 to 28, which makes a rounding artefact
less likely" — was simply wrong: `(await res.text()).length` counts UTF-16 code
units, so the growth was the file changing. **Two data points had been turned into
a trend inside a document.**

## What changed

1. **A documents-only PR skips the heavy CI jobs.** `scripts/check-docs-only.mjs` classifies the diff against its merge base; `ci.yml` gates `check`, `migration-numbers`, `new-policy-role-names`, `script-integrity`, `cards-count`, `audit` and `public-views` on the answer. **`test-plan` is deliberately not gated** — a documents PR still carries a checklist, and that is the one check whose job is to judge a document.
2. **One worktree per release**: the record and handover are written in the cut's worktree after its PR merges.
3. **One PR for the record and the handover.** `0.37.2` used two (#760, #761) and paid two CI cycles.
4. **The handover is a delta with a ceiling** — roughly 100 lines, 150 at the outside. Durable facts get promoted into `release-procedure.md` once instead of recopied each release.
5. **The record is drafted during the deploy waits**, of which there are ~25 unavoidable minutes.

Rules 2–5 live in `docs/release-procedure.md` under "The paperwork has a time
budget too". Rule 1 is in `ci.yml` and the script. A sixth change fell out of the
same conversation and is in `docs/test-plan-template.md`: **the CI-green line is
no longer ticked in a follow-up commit**, because that commit invalidated its own
evidence and cost every PR in the repository a second full CI cycle to transcribe
something GitHub already records permanently. Confirming the run's `headSha`
against HEAD is now a merge step rather than a checklist tick.

## Three things deliberately NOT done

- **`continue-on-error` was not added to anything.** The gate makes jobs *not run* where they cannot apply; it never makes a failure non-fatal. `ci.yml` and `docs/decisions/2026-10-02-scheduled-audit-fails-on-purpose.md` both warn against that, and the `test-plan` history is the worked example of suppressing a job and losing the signal with it.
- **The foreign-branch skip was not loosened.** Its rule — "foreign" needs positive proof, and no proof means fail — is correct, and the race above is not a reason to weaken it. A view this branch created and did not list is exactly what the check exists to catch.
- **No checking was shortened.** The test plans, the mechanical cut verification, the smoke test and the two signatures are untouched. On `0.38.0` they caught a release note that would have shipped invisibly and a public-view narrowing that had to be read in code to be known safe. **Shorten the prose, never the checking.**

## The rule the gate must keep

`check-docs-only.mjs` errs towards running everything: an unreadable diff, a
missing base, a path it does not recognise, all answer `false`. A false
"docs-only" skips real checks on real code, so **the only safe direction to guess
in is "run them"** — the same asymmetry `public-view-owner.mjs` already applies to
"foreign". Its tests assert that asymmetry rather than the happy path.

## One open thread this created

`main` has **no branch protection at all** — read with
`gh api repos/.../branches/main/protection`, which returns `404 Branch not
protected`. So no check is mechanically required, and "never merge past a red
check" is a convention Claude follows from `CLAUDE.md` rather than something the
repository enforces. That is worth Lutan knowing and is **not** a recommendation
to change it: the `test-plan` decision of 2026-10-20 settled that *that* check
stays advisory, and nothing here reopens it.
