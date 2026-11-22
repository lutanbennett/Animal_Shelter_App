# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Record the attempt to run the tenancy canary against production, and the UAT run that was possible instead |
| Backlog item | `docs/backlog.md` → `#ykefa` — **deliberately NOT ticked**; its closing condition is unmet |
| Branch / worktree | `claude/canary-production-attempt` @ `C:\Development\Animal_Shelter_canary-production-attempt` |
| Dev server | n/a: one decision file, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, cut from `origin/main` by `worktree.mjs new` |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/decisions/2026-11-22-tenancy-canary-not-run-on-production.md`, recording that `check-tenancy-canary.mjs` refuses `--env production` by a hard-coded guard, what the guard's two stated reasons are worth, and the green untrusted UAT run that was possible instead
- [x] Files/areas touched — that decision file and this plan. **No code, no schema, no backlog edit**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: one document. Nothing is served, imported or rendered
- [x] Out of scope, and deliberately so — **the guard itself.** Making production opt-in is a code change plus a decision of its own; **editing a guard so an item can be ticked is the fault this file exists to avoid.** Also out of scope: `#ykefa`'s wording, which belongs to the backlog manager

### Why a document is the right deliverable here

The step was authorised and attempted. It did not run. **The only thing that makes the attempt worth
anything is the write-up**, because without it the next session either repeats the refused command or —
worse — reads `#ykefa`'s *"one run plus one record"* and assumes the run is a formality.

**The item cannot be ticked and nothing pretends otherwise.** `#ykefa` closes *"when that run is green and
written down"*; one of the two did not happen.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the worktree was created from `origin/main` and nothing was merged in
- [ ] `node scripts/gates.mjs` — n/a: documents-only, so `check-docs-only.mjs` gates the heavy CI jobs off and the four gates have nothing to compile
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] `node scripts/check-decision-dates.mjs` — the CI job `decision-dates` checks a new decision file's name and date; run locally before pushing
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha`**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration. **Nothing was written to any database that survived its own transaction:** the canary ends in `raise`, and the UAT run's own output says *"rolled back, nothing left behind"*

## 4. Functional checks

- [x] **The refusal was read, not inferred** — `exit 2` and the message quoted verbatim, from the command run bare from the main checkout
- [x] **The guard was located in the source and dated** — lines 61–63 of `scripts/check-tenancy-canary.mjs`, added in `a83d220d4` (2026-11-16), the commit that created the file. **Checked that no flag overrides it** rather than assuming
- [x] **Both halves of the guard's stated reason were tested against the situation** — *"a worktree cannot read it"* does not apply (this was the main checkout, which read production twice in the same session); *"the canary plants rows"* does, and is the author's deliberate choice
- [x] **The absence of a written reason was checked, not assumed** — all four canary decision files were grepped for `production` and the guard; none mentions either
- [x] **The UAT run is a real untrusted pass, and the probe proves it** — `is_trusted_caller: false` with `jwt_claims {"role":"anon"}`. Without `--untrusted` the harness is a trusted caller and the per-shelter policies stand aside, which is the trap recorded twice in `docs/decisions/`
- [x] **The handover's own figures were re-measured rather than inherited** — production `435 applied, 0 pending`, no drift; all four deployed addresses `ok` on both halves
- [x] **One claim in the handover was checked and could not be supported** — that the canary *"was exercised on UAT"* before today. `grep` across `docs/decisions/`, `docs/test-plans/` and `docs/releases/` finds no such record. **Written down as unsupported rather than repeated**
- [x] Empty state / invalid input / boundary cases — n/a: a document has no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: one file in `docs/decisions/`
- [x] **No credential value appears in the file.** The production and UAT Management API tokens were used by the scripts and never printed; the file names the projects by ref, which is public in `wrangler.jsonc` and every release record
- [x] **No network value or device identifier** was written into the repository

## 6. Regression

- [x] The pages nearest the change still work — nothing imports `docs/decisions/`; it is not part of any build
- [x] Shared file touched, checked from a second unrelated page — none. `docs/backlog.md` was deliberately left alone, so no other item's wording moves
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked on this branch — **n/a: deliberately not ticked.** `#ykefa`'s condition is unmet, and its wording belongs to the backlog manager, who was sent the finding and the three routes
- [x] Non-obvious design choices as a new file in `docs/decisions/` — **this PR is that file**
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody at a shelter sees a decision file, and nothing about the app changed.** No database kept a single row from either run
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — two exit codes, one quoted refusal, one git commit, four greps and two re-read production commands

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed**, and nothing was changed in any environment. `0.47.10` is live and untouched by it
- [x] It is not a gate and is merged on green without asking
- [ ] Smoke test / UAT project line — n/a: nothing is deployed. The UAT *project* line is in the decision file, read from the canary's own output (`fsjagxmxjosauwmxwype`)

### Rollback

- [x] Rollback position stated — reverting this PR deletes one decision file. **Nothing deployed changes**, and the only loss is the written record of why `#ykefa` cannot close, which is the thing most likely to be re-derived expensively

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (process) | **`#ykefa`'s remaining step prescribes a command the script refuses by design**, so the programme's closing condition cannot be met as written | **recorded, not worked around.** The guard was not touched. Three routes are named in the decision file and the choice is Lutan's or the planner's; the backlog manager holds the item's wording and has been told |
| 2 | low (documentation) | **The guard blocking `#ykefa` had no written reason anywhere** — none of the four canary decision files mentions production | **recorded in this file**, which is now that reason's only home. Worth folding into the canary's own decision file if the guard is ever revisited |
| 3 | low (documentation) | **The handover's claim that the canary "was exercised on UAT" is unsupported in the repository** | **checked and recorded as unsupported.** Today's UAT run is now the first on record |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **Which of the three routes to take** — amend the guard behind an explicit flag, close `#ykefa` on UAT plus a stated limit, or leave it open | `#ykefa` | **Lutan's or the planner's.** Put to him in chat the same day |

**Nothing in this PR itself needs a person to look at it.**

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — both canary runs with their exit codes read from the command, `apply-migrations --status --env production`, `check-deployed-hosts --env production`, `git log -L` on the guard's lines, the four greps, `check-test-plan.mjs --base origin/main` and `check-decision-dates.mjs`
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: one decision file, nothing on screen. The route decision in the table is a judgement, not something to look at

Manual verification by: n/a: one decision file — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the backlog manager holds `#ykefa` and has the finding; Lutan has the three routes

Result: pass with accepted defects
