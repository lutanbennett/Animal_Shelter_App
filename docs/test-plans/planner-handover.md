# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `771` |
| Backlog item | n/a: a handover closes no backlog item |
| Branch / worktree | `claude/planner-handover` @ `C:\Development\Animal_Shelter_planner-handover`, port `3003` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this commit |

## 1. Scope and risk

- [x] Change is described in one sentence — `docs/planner-handover.md` is replaced with edition `771`, a delta against `770`, covering the nine planned streams merged since it
- [x] Files/areas touched — `docs/planner-handover.md` and this plan. **No code**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: one markdown file read by one chat. Nothing is served, imported or rendered; no card, route or gate changes
- [x] Out of scope — the `scheduled_writer_runs` read named as owed, and the skill-file edits `770` listed
- [x] **It outranks nothing, and says so in its own opening lines.** A wrong line is corrected by its successor, which is why this PR merges on green without a review round-trip

### The nine streams span two plans, and that is stated

Seven merged from the fifteenth plan and two from the sixteenth. **The counter is nine merged PLANNED
streams since the previous edition, across plans and chats**, which is Lutan's own rule of 2026-11-20.
`#1817` is excluded by name because he created and ran that stream himself.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before the gates; `Already up to date`, then pushed
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: build exited 0 after 151s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] **The four exit codes come from the summary line, which carries all four.** The output was tailed, so the three per-gate lines above `build` scrolled off; `gates: typecheck=0 lint=0 test=0 build=0` is `gates.mjs`'s own final assertion. **Said plainly rather than reconstructing lines that were not captured**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] `node scripts/check-release-guards.mjs` — n/a: it guards a release cut's data, and this PR changes none
- [ ] CI green on the PR — pending: the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] **`audit` will show `skipped`**, because this PR changes no `package.json`. **Skipped is not a pass** — it means nothing was checked, on purpose

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration
- [x] **Every figure was read, not recalled** — all nine `stream-usage:` comments read from their merged PRs in one pass with `gh pr view <n> --json comments`; the nine floors computed from those two fields; the deployed SHA and the six applied migrations from `docs/releases/2026-11-21-0-47-9.md`
- [x] **Production readings are quoted with their method and date** — `check-deployed-hosts.mjs` on all three environments, `check-production.mjs role-cards` and `translations-open`, `wrangler secret list --env production`, and a Management API read of `scheduled_writer_runs`. Each is named in the handover where it is used

## 4. Functional checks

- [x] **Every claim about today traces to something read in this session** — the three stale items were each settled by reading the file the item named (`two-step.ts`, `0428_shelter_state.sql`, `releases.ts` line 107); the deploy near miss by a `--plan` run; `label-drafts: ok` by reading the row
- [x] **The planner's two defects are reported as its own**, not softened: a session started on already-merged work, and a stream instructed to write a release note that already existed
- [x] **The one figure that is not evidence is excluded and labelled.** `#1823` is `rescoped=yes` because this planner changed its brief twice; it has a row, a number and an explicit "not a reading"
- [x] **The band hypothesis is carried forward unchanged, with its counterweight named.** Two undershoots support it, `#1818` does not, and **no band row was changed**
- [x] **"Open them" is recorded as UNRESOLVED, not as a new rule.** The handover tells the next planner to default to the 2026-11-03 rule unless Lutan says otherwise in words
- [ ] Empty state / invalid input / boundary cases — n/a: a document has no inputs
- [ ] A signed-in browser read — n/a: nothing here is served or rendered

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no gate

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: one markdown file, English, not served

## 6. Regression

- [x] The pages nearest the change still work — none: the file is not imported or rendered. The gates' typecheck and build cover that nothing references it
- [x] Shared file touched, checked from a second unrelated page — **nothing reads this file but a person**, re-confirmed rather than inherited from edition `768`'s plan: the only handover script is `check-release-handover.mjs`, which reads the *release* handover
- [x] Nothing merged from `main` was broken by this branch — `sync` reported `Already up to date`

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a handover ticks nothing. **Today's ticks were made on the `backlog` branch** (`#aucbk`, `#wwwcb`, `#plhbd`, `#aaqtl`, `#nxtqs`) **or by the PRs that closed them**
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **the handover is itself the write-up**
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a planner handover.** It is not served, imported or rendered and no behaviour changes
- [x] Commit messages say why, not just what
- [x] **184 lines against the ~150-line target.** Shorter than `770` (284) and `768` (230), still over. Named here rather than left for the next edition to discover

## 8. Pre-production gate

- [ ] Deployed SHA / smoke test / UAT project line — n/a: **a handover deploys nothing**

### Rollback

- [x] Rollback position stated — reverting this PR restores edition `770`, which is wrong about `#9l7xf` (answered since), the release (`0.47.10` shipped) and the seven held worktrees (five cleared). **Nothing live changes either way**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (process) | **The skill-file edits are owed for a seventh consecutive edition.** `770` carried them and nothing in `.claude/skills/plan-day/` has changed | **recorded, not fixed here.** Edition `771` does not repeat the list; it is in `770` and in `.plan-day.md` |
| 2 | low (handover) | **184 lines against a ~150-line target** | **recorded.** §7 names it; it is 100 lines shorter than its predecessor |
| 3 | medium (instrument) | **Why a scheduled writer skipped or failed cannot be read by any script**, which cost ~20 minutes of inference today | **recorded in the handover, not filed as an item.** Named so the next planner can file it or build it |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | Nothing. A handover is read by the next planner chat, and its first reader is its test | `docs/planner-handover.md` | **n/a by design** |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (planner session)  Date: 2026-11-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one document, not served, imported or rendered, so there is no screen to look at

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the next planner chat reads `771` instead of `770`

Result: pass with accepted defects
