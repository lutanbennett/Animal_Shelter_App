# Feature test plan — planner handover `573`

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten as edition `573`, carrying batch 2's results — **plus the change that prompted it: the handover counter is tied to the plan rather than to an independent count of nine** (`.claude/skills/plan-day/SKILL.md`, step 6's counter rule and step 8's trigger), **plus the line-endings trap promoted into the same skill** |
| Backlog item | `docs/backlog.md` → none. The handover is the planner skill's step 8, not a backlog item. **The counter change is Lutan's instruction of 2026-11-02 in chat** (*"can we sync these counters up to avoid confusion"*), not an item either |
| Branch / worktree | `claude/handover-564-amend` @ `C:\Development\Animal_Shelter_handover-564-amend` — **the branch was named before this became `573` rather than an amendment to `564`; the name is stale and the PR says so** |
| Dev server | not started — `n/a: two markdown files, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Daily Planner) / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | `874c58ad` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *edition `573` written, and the handover counter re-tied to the plan boundary so the two nines cannot drift apart.* There is no backlog item, as the header says
- [x] Files/areas touched listed — `docs/planner-handover.md`, `.claude/skills/plan-day/SKILL.md` and this plan. **No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`**
- [x] Access affected identified — **none.** Neither file grants nor denies anything: the handover is read by one chat and outranks nothing, which it says in its own opening lines, and the skill is instructions for a planning session. No card, activity, policy or page changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a)** `CLAUDE.md` still names only the first of the two session-start conditions; recorded on `564`'s plan and still not fixed here, because it does not belong in a handover PR. **(b)** This PR deliberately does **not** amend `564`: the material was first written as a 124-line amendment to a 163-line edition, which **is a new edition in substance**, so `564` was restored untouched with `git checkout --` and `573` written instead. **Length: 150 lines**, measured with `wc -l`, inside the ~150 target — **and the split is what achieved that**, which is the point recorded in the edition itself. **(c)** The skill grows by 44 lines on purpose; promotion is what keeps the handover short

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the branch was created from `origin/main` minutes earlier and `git push` reported the branch as new, so there was nothing to merge in. The gates were run in full regardless
- [x] `node scripts/gates.mjs` ends:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the deliverables are two markdown files`
- [ ] Data persists — `n/a: no runtime surface`
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Access matrix

**Written by card, not by role** (`CLAUDE.md`: all analysis is by card, because roles are a transient
grouping of cards and every assignment will be rebuilt).

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | both files are developer documents read by a planning chat, not app surfaces: no card opens either, no card is read by either, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

- [x] Every card above tested — vacuously: the diff is two markdown files and this plan
- [ ] A card that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: these are documents for the planning chat, not something a shelter user does`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` would be wrong: `docs/` is read by `scripts/check-test-plan.mjs` and `scripts/check-docs-only.mjs`, and `.claude/skills/` is outside both, so the four gates were run in full rather than skipped as a documentation change
- [x] Any shared file touched checked from a second, unrelated place — **the skill is the shared file, and all four edits to it were anchored against text read from the file itself, each with a guard that exits non-zero when the anchor is missing.** All four passed on the first run. **The two counter edits were read in place first** (step 6 at the `Workstreams since handover` line, step 8 at the `At nine or more workstreams` line) so the change lands on the sentences that actually carried the rule rather than beside them. **And the restore was verified, not assumed:** after `git checkout -- docs/planner-handover.md` the script asserted the file contained ``edition `564` `` before writing `573` over it, so no part of the discarded amendment survives
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is two commits of markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item, and the counter change came from Lutan in chat`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: **the design choice is the subject of the edition's own lead section**, which sets out why the plan boundary was kept and the counter moved to it rather than the other way round, and the skill passages carry the reasoning where a planner will meet it. `docs/decisions/2026-10-08-planner-handover-counter.md` remains the paper for why the counter exists at all and is cited by the changed passage
- [x] `README.md` still accurate — it says nothing about the handover or the skill
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A handover and a planning skill touch no page, no card and no data`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the band verdicts are each stream's own posted `stream-usage:` comment read against the band recorded in `.plan-day.md` at setup; the floors are `tokens − messages` from those comments; **the two-nines account is this session's own transcript, with Lutan's words quoted from it**; the five waiting streams were counted from their own reports and the nudges sent; the `test-plan` failures were read from the CI job logs, not inferred; the line-endings cause was established with `git show <rev>:docs/backlog.md | file -` on **both** branches plus `git config core.autocrlf`; the line counts are `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefacts are two markdown files read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The material was first written as an amendment to `564`, reaching **295 lines** before two content cuts took it to 287 | **Fixed, not accepted.** The cuts saved eight lines, which is what showed the approach rather than the prose was wrong. `564` was restored untouched and the material written as `573` at **150 lines**. **Recorded because the lesson generalises: when a trimming pass saves almost nothing, the shape is wrong, not the wording** |
| 2 | low | The branch is named `claude/handover-564-amend`, which is stale | **Accepted.** Renaming would need a force-push for a two-commit documentation branch; the PR body and this plan both say so |
| 3 | — | none | The `CLAUDE.md` session-start gap recorded on the previous two editions **still has not been closed.** Recorded again in section 1 rather than silently fixed here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Lutan has never read a handover, and it outranks nothing — it is read by the next planning chat, rewritten each plan, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking. The skill change is instructions to that same chat, and **the next round tests it by following it**: the counter should read `0 of <total>` and the next edition should fall due at that plan's last batch |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-11-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 fixed, 2 accepted with its reason
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
