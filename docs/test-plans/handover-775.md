# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `775` |
| Backlog item | n/a: a handover closes no backlog item |
| Branch / worktree | `claude/handover-775` @ `C:\Development\Animal_Shelter_handover-775`, port `3002` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-28 |
| Carries a migration? | No |
| Tested at SHA | this commit |

## 1. Scope and risk

- [x] Change is described in one sentence — `docs/planner-handover.md` is replaced with edition `775`, a delta against `774`, covering the twenty-five planned streams merged since it
- [x] Files/areas touched — `docs/planner-handover.md` and this plan. **No code**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: one markdown file read by one chat. Nothing is served, imported or rendered; no card, route or gate changes
- [x] Out of scope — the skill-file edits earlier editions have carried, and `#dnsgp`'s cause, which is Lutan's
- [x] **It outranks nothing, and says so in its own opening lines.** A wrong line is corrected by its successor, which is why this PR merges on green without a review round-trip

### Twenty-five streams across two days, and why sixteen are overdue

The counter is **nine merged PLANNED streams since the previous edition, across plans and chats** (Lutan,
2026-11-20). He was offered this edition twice on 2026-11-27 and answered **"Not now"** and **"Still not
now"**, both times mid-batch, and said yes on the third offer once the buildable backlog had emptied.
**Nothing was lost by waiting**, because every figure sits on its own merged PR — which is the mechanism
his ordering depends on.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before the gates
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it
- [ ] `node scripts/check-release-guards.mjs` — n/a: it guards a release cut's data, and this PR changes none
- [ ] CI green on the PR — pending: the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] **`audit` will show `skipped`**, because this PR changes no `package.json`. **Skipped is not a pass** — it means nothing was checked, on purpose

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration
- [x] **Every figure was read, not recalled** — all twenty-two `stream-usage:` comments read from their merged PRs with `gh pr view <n> --json comments` in two passes (#1908–#1913, then #1914–#1920; #1896–#1907 were read on 2026-11-27 and are quoted from `.plan-day.md`'s recorded table), and each floor computed as `tokens − messages` from those two fields
- [x] **The three streams with no figure are named as such, not guessed** — #1923, #1924 and #1925 merged after the day's single measurement slot, so the handover says they are read next morning and says where from
- [x] **Live readings are quoted with their method and date** — `drive-mirror.service` read `failed` over the mesh on 2026-11-28; `scripts/drive-move-to-shelter-account.mjs:92` read on `main`; `cards.ts`'s `residents` card read on `main`; `check-release-handover.mjs` run

## 4. Functional checks

- [x] **Every claim about these two days traces to something read in this session** — the thirteen figures from their PRs; the three `buildable` tags from a scripted scan of `docs/backlog.md`; `#rlprg`'s ticked state and `reels-multi-upload`'s `NO PR EVER` from `gh pr list --state all --head`; the held worktree's holder from `list_sessions`
- [x] **`774`'s own errors are corrected rather than carried** — it called `#rqv5c` buildable when Lutan had made it the Director's, and it listed the release handover as stale when `0.50.0` has since made it current. Both are named as `774` being wrong, in its own section
- [x] **The planner's own faults are reported as its own** — the `#dnsgp` tag left reading `buildable` after its buildable half shipped, and findings left on a ticked item
- [x] **THE 2026-11-26 HYPOTHESIS IS CHECKED AND REPORTED AS NOT FIRING, WHICH IS THE POINT OF WRITING ONE DOWN.** `774` predicted +10–15k for a band naming an open design question; a second complete set of thirteen contradicts it, and **no band row was changed** on the strength of either result
- [x] **The one figure outside band is reported with its size, not rounded up into a trend** — #1918, 2.7k over, 1.5%
- [ ] Empty state / invalid input / boundary cases — n/a: a document has no inputs
- [ ] A signed-in browser read — n/a: nothing here is served or rendered

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no gate

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: one markdown file, English, not served

## 6. Regression

- [x] The pages nearest the change still work — none: the file is not imported or rendered. The gates' typecheck and build cover that nothing references it
- [x] Shared file touched, checked from a second unrelated page — **nothing reads this file but a person**, re-confirmed rather than inherited: the only handover script is `check-release-handover.mjs`, which reads the *release* handover and was run today
- [x] Nothing merged from `main` was broken by this branch — `sync` ran before the gates

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a handover ticks nothing. **Today's backlog edits were made on the `backlog` branch** (`#dupnx` filed, `#gcln7` answered, `#dnsgp` retagged) **or by the PRs that closed their items**
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **the handover is itself the write-up**
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a planner handover.** It is not served, imported or rendered and no behaviour changes
- [x] Commit messages say why, not just what
- [x] **161 lines against the ~150-line target.** Over by eleven, named here rather than left for the next edition to discover; 13 lines shorter than `774`

## 8. Pre-production gate

- [ ] Deployed SHA / smoke test / UAT project line — n/a: **a handover deploys nothing**

### Rollback

- [x] Rollback position stated — reverting this PR restores edition `774`, which is wrong about `#rqv5c`'s ownership and about the release handover being stale. **Nothing live changes either way**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (process) | **One worktree cannot be cleared.** `console-host-attach-schema` refused `done` twice; Windows holds it and the holder is an unrelated session | **recorded, not forced.** Named in the handover's first turn and in Still owed; `--force` is explicitly not the fix |
| 2 | low (band table) | **`774`'s +10–15k hypothesis has now failed twice** and is still in that edition's text where a reader may apply it | **recorded with the evidence.** `775` says do not apply it and recommends retiring it by name after one more complete set |
| 3 | medium (process) | **Findings reported by a stream were written onto the item it had just ticked**, where nothing re-reads them | **fixed for this instance** (`#dupnx` filed, now building) **and written up as a lesson** so the next planner moves them rather than re-deriving the fault |
| 4 | low (handover) | **161 lines against a ~150-line target** | **recorded.** §7 names it |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | Nothing. A handover is read by the next planner chat, and its first reader is its test | `docs/planner-handover.md` | **n/a by design** |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (planner session)  Date: 2026-11-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one document, not served, imported or rendered, so there is no screen to look at

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the next planner chat reads `775` instead of `774`

Result: pass with accepted defects
