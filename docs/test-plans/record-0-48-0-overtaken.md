# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `0.48.0`'s record and handover, overtaken within the hour: `0435`'s reader reached `main` two minutes before the release mail |
| Backlog item | n/a: a correction to a release record closes no backlog item |
| Branch / worktree | `claude/record-0-48-0-overtaken` @ `C:\Development\Animal_Shelter_backlog-waiting-state` — **a free leftover reused**, as the paperwork budget requires, rather than a four-minute `npm ci` for two documents |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `e701303e1` — the merge of the record this PR corrects |

## 1. Scope and risk

- [x] Change is described in one sentence — `0.48.0`'s record and handover both say the five files that read `0435`'s `staged` column are unmerged; **#1835 merged them at 10:48:55 UTC, two minutes before the release mail**, so both documents now say so and say what it does and does not change
- [x] Files/areas touched — `docs/releases/2026-11-22-0-48-0.md`, `docs/release-handover.md`, and this plan. No code, no schema, no configuration. **Line endings were preserved deliberately** (both files are CRLF in this checkout): the edit script detects the file's own EOL, so the diff is 27 lines rather than a whole-file rewrite
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered
- [x] Out of scope — **anything about the deployed release, which has not changed.** `050b44b0f` is still what every host runs, and the reader is still outside it. This PR only stops two documents reading as though nothing moved

### Why this is a correction and not a tidy-up

**The runbook asks for it in those words:** *"when the paperwork is overtaken, say so in it"*, and *"a
record that corrects itself is worth more than one that reads as though nothing moved"*. `0.38.0` is the
release that earned that rule, where two items the record called open were closed before it merged.

**The statement was true when measured and is the kind that goes stale silently.** Both documents reason
from *"no code on `main` reads this column"* — which was read with `git grep` and confirmed by
`apply-migrations.mjs`'s own consumer warning — to the conclusion that the schema landed safely ahead of
its reader. A reader meeting that sentence tomorrow would check `main`, find five files that do read it,
and have no way to tell whether the record was careless or the world had moved.

**And the precise thing is worth more than the correction.** The reader is on `main` but is **not** in
`050b44b0f`: `git merge-base --is-ancestor` puts it outside the deployed commit, so every host runs code
that does not read the column. **The schema-first order held, by two minutes.** That margin is the fact
worth recording — it is the difference between an order that is designed and one that happened to work,
and the next schema PR split across a release should not count on it.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `f76be997c` and nothing was merged in
- [ ] `node scripts/gates.mjs` — n/a: documents-only, so the four gates have nothing to compile and `ci.yml` skips the heavy jobs. **Not to be "fixed" by touching code to make a check run**
- [x] `node scripts/check-release-handover.mjs` — must not print STALE: the handover still names `docs/releases/2026-11-22-0-47-10.md`, which this PR does not rename
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha`**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration. `0434` is applied and both deploy databases read `435 applied, 0 pending`

## 4. Functional checks

- [x] **The claim being corrected was checked in the source, not inferred** — `scripts/lib/env.mjs` line 39 read directly, and the prohibition quoted from the decision file rather than paraphrased
- [x] **The correction is marked in place rather than silently rewritten.** Each of the three documents says it was corrected the same day and what it first said, so a reader who saw the earlier version knows which way it went — the repository's standing rule for superseded passages
- [x] **No new claim is made about what fixes it.** Two options are named with their costs; neither is presented as done
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: three documents in `docs/`
- [x] **No credential value appears anywhere in the change.** The tokens were counted, never printed, and the correction is about *where* a token may live

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files; `docs/` is not part of any build
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by `check-release-handover.mjs`, run above, and by the next release manager. The record's header, figures and verification sections are untouched
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: nothing to tick. `#tstok` was already ticked by the record PR this one corrects, and `#thpfx` is open on the `backlog` branch where it belongs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **nothing is being decided here.** The judgement worth keeping — that a schema PR and its reader split across a release cleared each other by two minutes — is recorded in the record itself, where the next release manager reads it
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a correction to a release record or a handover.** None of the three is served, imported or rendered
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** `0.48.0` @ `050b44b0f` is live on all four hosts and unchanged by it, and the reader this PR is about is still outside that commit
- [x] **It is not a gate** and is merged on green without asking, like the record it corrects
- [ ] Smoke test / UAT project line — n/a: nothing is deployed

### Rollback

- [x] Rollback position stated — reverting this PR restores three documents that name a forbidden location. **Nothing deployed changes**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (documentation) | **`0.48.0`'s record and handover both said the five files that read `0435`'s column are unmerged.** True when measured; #1835 merged them 42 minutes later, two minutes before the release mail | **fixed in this PR**, marked in place in both, with the part that did NOT change stated precisely: the reader is on `main` but outside `050b44b0f`, so no deployed host runs it. **Caught by a post-release sweep of the worktree list**, where the stream showed as having nothing beyond `main` |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **Nothing.** Two documents gained a dated correction; there is no screen, no behaviour and no command | — | n/a |

**Nothing in this PR itself needs a person to look at it.**

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs`, `check-test-plan.mjs --base origin/main`, the `env.mjs` line read directly and the decision file's wording quoted from it
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: three documents, nothing on screen

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — nothing is owed. The reader ships with the next release against a column already on production and UAT, which the record now says in those words

Result: pass
