# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `0.49.0`'s record, overtaken the same afternoon: its largest test gap closed, and the icon sync it left running finished |
| Backlog item | n/a: a correction to a release record closes no backlog item |
| Branch / worktree | `claude/record-49-overtaken` @ `C:\Development\Animal_Shelter_proof-lines-strict` — **a free leftover reused**, as the paperwork budget requires, rather than a four-minute `npm ci` for one document |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `838c483cc` — the merge of #1856, which closed the gap this PR records |

## 1. Scope and risk

- [x] Change is described in one sentence — `0.49.0`'s record named the money page its largest test gap and left `sync-home-icons` running; **both resolved the same afternoon**, so the record now says so in a *What changed after this record merged* section rather than reading as though neither moved
- [x] Files/areas touched — `docs/releases/2026-11-23-0-49-0.md` and this plan. No code, no schema, no configuration. **Line endings preserved deliberately** (the record is CRLF in this checkout): the edit script detects the file's own EOL, so the diff is 42 lines rather than a whole-file rewrite
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered
- [x] Out of scope — **#1842's own plan**, which is where the sign-off itself belongs and where it went (#1856). **That separation is deliberate, not tidiness:** `check-test-plan` holds a ticked release-notes line to the PR's own diff unless the PR touches nothing but `docs/test-plans/`, so combining the sign-off with this record edit would have forced an untick of a line #1842 ticked correctly

### Why this is two PRs and not one

**The sign-off and the record correction are the same news, and they still had to be split.**
`check-test-plan` holds a **ticked** release-notes line to the PR's own diff — unless the PR touches
nothing but `docs/test-plans/`, which is the case it special-cases for exactly this, a sign-off recorded
after merge. #1842 ticked that line **correctly**, because that PR really did add the note this release
published.

**So a combined PR fails, and the only way to make it pass would be to untick a true line.** That is
falsifying history to satisfy a checker, which is the opposite of what the checker is for. The sign-off
therefore went alone in #1856, and this PR carries the record edit. **Two documents-only CI runs, about a
minute each** — the cost paperwork rule 3 warns about is two runs for a record and a handover *written at
the same moment from the same facts*, which these are not.

**What the record is being corrected to say**, both from the runbook's *"when the paperwork is overtaken,
say so in it"*:

- **Gap 1 closed**, and the record now names who did which half — the 375px view driven by Claude, the
  Thai read by Lutan — rather than recording it as one job done by nobody in particular.
- **`sync-home-icons` finished, exit 0, `536 created`.** The record said it was still running and
  deliberately not waited for, which was true. **`0 unchanged` is the number worth keeping**: the Drive
  folder held none of these images beforehand, so this was the **first successful run**, which is what
  two releases of a missing `PLATFORM_DRIVE_FOLDER_ID` would produce. The record's finding moves from
  inferred-from-a-partial-run to closed.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `838c483cc` and nothing was merged in
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
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **nothing is being decided here.** The judgement worth keeping — that a sign-off and its record correction must be split because `check-test-plan` would otherwise force an untick of a true line — is recorded in section 1, where the next person to record a late sign-off will meet it
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a correction to a release record or a handover.** None of the three is served, imported or rendered
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** `0.49.0` @ `9fc01bdc6` is live on all four hosts and unchanged by it; this PR edits one record of a release that already shipped
- [x] **It is not a gate** and is merged on green without asking, like the record it corrects
- [ ] Smoke test / UAT project line — n/a: nothing is deployed

### Rollback

- [x] Rollback position stated — reverting this PR restores three documents that name a forbidden location. **Nothing deployed changes**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (documentation) | **`0.49.0`'s record said the money page had not been looked at by a person, and that `sync-home-icons` was still running.** Both true when written; both stopped being true the same afternoon | **fixed in this PR**, in a *What changed after this record merged* section, with the strikethrough left in place on the superseded line so a reader can see it moved rather than that it was always so |

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
