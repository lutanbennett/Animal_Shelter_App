# Feature test plan — planner handover `654`

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten as edition `654`, carrying this plan's batches 1 and 2 in full with their actuals, and batch 3's setup. **One file; no skill change, no `CLAUDE.md` change** |
| Backlog item | `docs/backlog.md` → none. The handover is the planner skill's step 8, not a backlog item |
| Branch / worktree | `claude/planner-handover-654` @ `C:\Development\Animal_Shelter_planner-handover-654` |
| Dev server | not started — `n/a: one markdown file, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | `5b062b0f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *edition `654` written as a delta over `645`, leading on the ORDER of the work after Lutan asked why the round was taking so long and then gave the instruction that fixes it.* There is no backlog item, as the header says. **The lead is his instruction rather than the figures**, because nothing done in that round was wrong — it was done in the wrong order and he waited through it
- [x] Files/areas touched listed — **`docs/planner-handover.md` and this plan, and nothing else.** No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`, no `.claude/skills/`
- [x] Access affected identified — **none.** The handover grants and denies nothing: it is read by one planning chat, it outranks nothing (it says so in its own opening lines), and it is rewritten every plan. No card, activity, policy, page, tile or control changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a) Batch 3's figures are not in the edition and it says so**, in its second paragraph; `663` carries them, and the skill requires the handover at the last batch's SETUP rather than at its merge. **(b) The STEP ZERO carry-on promotion into `.claude/skills/plan-day` is still OWED and is still not made here** — it was named as owed by `645`, is fixed on disk in all six of this plan's briefs so no stream is affected, and a skill change is a different kind of work from a handover (`docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`). **(c)** The four findings from PR bodies are filed **on their backlog items** (`#p3k9w`, `#m8x2r`, `#w4s2n`, `#a7r3k`), not here; the edition names them so a planner does not re-derive them. **(d)** The role-shaped instruments (`check-menu-coverage.mjs`, most of `check-production.mjs`) are named as owed for the third edition running and **deliberately not touched** — they are script work, not a handover. **(e)** Length: **215 lines**, measured with `wc -l`, against the ~150 target; **no trimming pass was opened**, per the skill's instruction not to spend round-trips on wordsmithing

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` minutes earlier, so there was nothing to merge in. The gates were run in full regardless, **in the background with their output redirected to a file that was then read** — which is the step every brief in this plan carries as a numbered deliverable, and the planner is not exempt from it
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck exited 0 after 36s
=== gates: lint exited 0 after 94s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 111s
gates: typecheck=0 lint=0 test=0 build=0
```

**The gates were started only AFTER the worktree's own `npm ci` had finished**, which is the sequencing fault `645`'s plan recorded against itself: gates launched while the install was still running have no `next`, `tsc` or `eslint` in `node_modules/.bin`, and `gates.mjs` refuses outright rather than reporting a false red. **The figures above were transcribed from the redirected output file after reading it**, never from the command that launched it
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the deliverable is one markdown file`
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
| *(none)* | nothing changes | the handover is a developer document read by a planning chat, not an app surface: no card opens it, no card is read by it, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

- [x] Every card above tested — vacuously: the diff is one markdown file and this plan
- [ ] A card that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: this is a document for the planning chat, not something a shelter user does`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` would be wrong: `docs/` is read by `scripts/check-test-plan.mjs` and `scripts/check-docs-only.mjs`, so the four gates were run in full rather than skipped as a documentation change. **All four exited 0 at the tested SHA `5b062b0f`, the commit that added the handover; the only later change on this branch is this plan, which no gate reads**
- [x] Any shared file touched checked from a second, unrelated place — **the handover is the only file touched, and it has exactly one consumer: the next planning chat.** What is worth checking instead is that it does not contradict the documents that outrank it, so each claim about the rules was read back against its source: merge-on-green and the backlog-section rule against `CLAUDE.md`; the floor formula, the four ways a figure is worthless, the priorities-panel precedence and the handover-at-setup rule against `.claude/skills/plan-day/SKILL.md`; the "a card must never do nothing" rule against `CLAUDE.md` and `src/lib/home/tiles.ts`. **The edition states in its own opening lines that it outranks none of them**
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: **the conclusions are the subject of the edition's own lead sections**, and every finding needing a durable home outside it was filed in the same session — `#w4s2n` and `#a7r3k` as new backlog items on the `backlog` branch (`e04caa1f`), `#p3k9w` and `#m8x2r` earlier the same day, and the ordering instruction saved as the memory `deliverable-first-paperwork-after`. `docs/decisions/2026-10-08-planner-handover-counter.md` remains the paper for why the counter exists and is unchanged by this PR
- [x] `README.md` still accurate — it says nothing about the handover
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A planner handover touches no page, no card and no data, and the releases file is not in this diff`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — every band verdict is the stream's own posted `stream-usage:` comment read against the band recorded in `.plan-day.md` **at setup**; #1297's figure is `get_usage` on its live session with `context.session` echoed back and checked against the id passed, and is labelled as the fallback rather than as a comment; #1298's figure is recorded as **not a reading** because its own comment says `compacted=yes rescoped=yes`; the floors are `tokens - messages` from those same comments; the nineteen `isDeceased` files are `grep -rln isDeceased src` run and listed, not estimated; the 23 `/api` route handlers are `find src/app/api -name route.ts | wc -l`; R-0323's state is a production read quoted in full from `scripts/check-deceased-archive-state.mjs --env production`; the `0310` scope is that migration's own header read in place; the starred item is the `ArtifactData` read of `priorities/ranking` with its timestamp; and the line count is `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefact is one markdown file read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **high** | **Lutan asked why the round was taking so long.** Batch 2's worktrees and briefs were finished early; he then waited through the actuals capture, five backlog edits, a deep source read and a notes script that crashed on its own quoting before being told which folders to open | **Fixed as a rule, and followed in this round.** His instruction — *"Priority should be to do what I ask first, paperwork can be fixed after you finish what I ask for"* — leads the edition and is saved as the memory `deliverable-first-paperwork-after`. This round handed over batch 3 before writing any of its records |
| 2 | medium | **The main checkout still cannot build.** `guarded-install.mjs` failed EPERM on the SWC binary and left `node_modules` half-deleted; the holder is a defunct `next start -p 3100` pair (pids 76628, 87036) that only Lutan can stop, and he has been away from the laptop since | **Filed as `#m8x2r` and named in the edition.** Not fixable from here: the classifier refused the process stop as *Interfere With Workloads*. **It blocked no stream** — each worktree has its own `node_modules` — but it will block a release cut, `gates.mjs` in the main checkout and `scripts/deploy.mjs` for the cutover |
| 3 | medium | **One stream merged without posting a `stream-usage:` comment** (#1297), so its figure had to come from `get_usage` on a session that happened not to be archived yet | **Recorded, not patched.** The fallback worked and is labelled as the fallback; the edition says plainly that it is a race and the comment is not. Every brief already carries the comment as a numbered step |
| 4 | medium | **One of six figures is not a reading at all** (#1298: `compacted=yes rescoped=yes`), so the band sample for this plan is five, not six | **Accepted and reasoned.** Banking it would have read as a 48% under-run on the batch's largest estimate. The edition states the figure, states why it is excluded, and does not theorise about the cause |
| 5 | low | **A shell heredoc died on `unexpected EOF` while composing a brief**, hours after a JS template literal died on backticks in the same kind of prose. Nothing was written either time, but both cost round-trips | **Fixed as a habit and written into the edition:** write each prose block with the Write tool, concatenate with `cat`, and lift the mandatory blocks with `sed -n <range>` from the previous batch's brief |
| 6 | low | Batch 3's three streams were set up but not started when this was written, so their figures are in no edition | **Accepted; it is the rule.** The skill requires the handover at the **setup** of the last batch and requires the edition to say so rather than imply coverage it lacks |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| - | nothing | Lutan has never read a handover, and it outranks nothing — it is read by the next planning chat, rewritten each plan, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking. **The next round tests it by following it:** the counter should read `0 of <total>` with slug `663`, batch 3's figures should appear in `663`, `#dklvq` should be at the front of the next plan, and no session should ask him about R-0323 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-05

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 and 5 fixed, 2 filed and Lutan's, 3, 4 and 6 accepted with their reasons
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
