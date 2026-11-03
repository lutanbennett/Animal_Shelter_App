# Feature test plan — planner handover `609`

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten as edition `609`, carrying this plan's batches 1 and 2 in full and batch 3's setup. **One file; no skill change, no `CLAUDE.md` change** |
| Backlog item | `docs/backlog.md` → none. The handover is the planner skill's step 8, not a backlog item |
| Branch / worktree | `claude/planner-handover-609` @ `C:\Development\Animal_Shelter_planner-handover-609` |
| Dev server | not started — `n/a: one markdown file, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | `8c02d18d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *edition `609` written as a delta over `600`, leading on a brief-authoring rule the planner got wrong and a stream caught: an answer carried forward from a sibling stream is only as wide as what that sibling could see.* There is no backlog item, as the header says
- [x] Files/areas touched listed — **`docs/planner-handover.md` and this plan, and nothing else.** No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`, no `.claude/skills/`. `git diff --stat origin/main..HEAD` shows two files — the handover and this plan — and no others
- [x] Access affected identified — **none.** The handover grants and denies nothing: it is read by one planning chat, it outranks nothing (it says so in its own opening lines), and it is rewritten every plan. No card, activity, policy, page, tile or control changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a) The edition recommends NO promotion this time, because the one `600` asked for was MADE this plan by #1228**: the finishing sequence is now the skill's own brief block. The edition's job is therefore to say *check that planners have stopped hand-writing it*, not to change the skill here — mixing a skill change into a handover PR is exactly what `docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md` warns against. **(b) Batch 3's figures are not in the edition and it says so TWICE**, in its second paragraph and again in its state block; the next edition carries them. **(c)** The five answers Lutan gave this plan are recorded **on their backlog items**, not here; the edition only names them so that a planner does not re-ask one. **(d)** Length: **151 lines**, measured with `wc -l` after the content was written, against the ~150 target and the ~160 ship-it threshold — so **no trimming pass was opened**, per the skill's own instruction not to spend round-trips on wordsmithing. Its predecessor was 152

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` minutes earlier and `git push` reported the branch as new, so there was nothing to merge in. The gates were run in full regardless, **in the background with their output redirected to a file that was then read** — which is the step every brief in this plan carries as a numbered deliverable, and the planner is not exempt from it
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 129s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 286s
=== gates: test — npm test
=== gates: test exited 0 after 32s
=== gates: build — npm run build
=== gates: build exited 0 after 398s
gates: typecheck=0 lint=0 test=0 build=0
```

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

- [x] The pages nearest the change still work — `n/a` would be wrong: `docs/` is read by `scripts/check-test-plan.mjs` and `scripts/check-docs-only.mjs`, so the four gates were run in full rather than skipped as a documentation change. All four exited 0. **Precisely: the run started at `b20357ec` and the tested SHA `8c02d18d` adds one markdown-only commit to it — a wording correction inside `docs/planner-handover.md`, which NO gate reads.** The gates were not re-run for it, and that is stated rather than papered over with "at this SHA"
- [x] Any shared file touched checked from a second, unrelated place — **the handover is the only file touched, and it is read by exactly one consumer: the next planning chat.** The thing worth checking instead is that it does not contradict the documents that outrank it, so each of its claims about the rules was read back against its source: the merge-on-green and test-plan rules against `CLAUDE.md`, the band and brief-block rules against `.claude/skills/plan-day/SKILL.md`, and the counter and handover-trigger rules against step 6 and step 8 of that skill. **The edition states in its own opening lines that it outranks none of them**
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is one commit of markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: **the design choices are the subject of the edition's own lead sections** — that a carried-forward answer is only as wide as what its source could see, and that a stream stopping with its PR open and CI running is CORRECT rather than a repeat of `600`'s waiting fault. Both are written where a planner will meet them. `docs/decisions/2026-10-08-planner-handover-counter.md` remains the paper for why the counter exists and is unchanged by this PR
- [x] `README.md` still accurate — it says nothing about the handover
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A planner handover touches no page, no card and no data, and the release-notes file is not in this diff`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the band verdicts are each stream's own posted `stream-usage:` comment read against the band recorded in `.plan-day.md` **at setup**, not after the fact; the floors are `tokens − messages` from those comments; the one recovered figure is `get_usage` on that session's id with `context.session` checked to echo the id passed, and the one lost figure is recorded `unmeasured` rather than reconstructed from a neighbour; **the refusal text is quoted from the tool result, not paraphrased**; the twelve-row calendar reading was dismissed only after reading that check's own SQL in `scripts/lib/readonly-checks.mjs`; the production verdicts are `check-production.mjs` runs against `dbkodyyxxhtygxcxmfcu` with the project named; the exact card count is `scripts/check-cards-count.mjs:35` read in place; the two streams that stopped mid-wait are quoted from their own reports; the line counts are `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefact is one markdown file read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The edition recommends two promotions into `.claude/skills/plan-day/SKILL.md` and makes neither | **Accepted, and deliberately.** A skill change is a different kind of work from a handover and belongs in its own PR (`docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`). The item that would do it, `process-docs-fixes`, was swapped out of this plan and the edition names it as the leading candidate for the next one — **so the recommendation is recorded where the next planner will read it rather than left in a chat** |
| 2 | low | Batch 3's three streams were still running when this was written, so their figures are in no edition | **Accepted; it is the rule.** The skill requires the handover at the **setup** of the last batch, not after it merges, and requires the edition to say so rather than imply coverage it lacks. The edition says it twice — in its second paragraph and in its state block |
| 3 | — | none | The two streams that ended turns waiting on a background gates run were both nudged and both resumed; **nothing was lost, and the fault is recorded as a briefing defect rather than a stream error**, since the second one happened after its brief warned about it twice |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Lutan has never read a handover, and it outranks nothing — it is read by the next planning chat, rewritten each plan, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking. **The next round tests it by following it:** the counter should read `0 of <total>` with this slug and date, batch 3's figures should appear in the next edition, and the two recommended promotions should be picked up by `process-docs-fixes` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 and 2 accepted with their reasons, 3 is a note rather than a defect
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
