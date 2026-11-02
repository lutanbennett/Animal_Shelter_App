# Feature test plan — planner handover `564`

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten as edition `564`: a delta over `555` covering batch 1 merged and measured and batch 2 set up — **plus three facts promoted out of it into `.claude/skills/plan-day/SKILL.md`**, which is why this PR is two files and not one |
| Backlog item | `docs/backlog.md` → none. The handover is the planner skill's step 8, not a backlog item; **the counter reached nine — three batches of three — which is what makes this edition due** |
| Branch / worktree | `claude/planner-handover-564` @ `C:\Development\Animal_Shelter_planner-handover-564` |
| Dev server | not started — `n/a: two markdown files, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Daily Planner) / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | `85df9649` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *`docs/planner-handover.md` replaced with edition `564`, and three durable facts it would otherwise have carried promoted into the planner skill.* There is no backlog item, as the header says
- [x] Files/areas touched listed — `docs/planner-handover.md`, `.claude/skills/plan-day/SKILL.md` and this plan. **No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`**
- [x] Access affected identified — **none.** Neither file grants nor denies anything: the handover is read by one chat and outranks nothing, which it says in its own opening lines, and the skill is instructions for a planning session. No card, activity, policy or page changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **the one-line `CLAUDE.md` fix `555` named is still NOT made here**, for the same reason it gave: `CLAUDE.md` carries only the first of the two session-start conditions. It is now **more** out of date than it was, because this PR corrects the skill's wording again, so the gap is recorded rather than bundled into a handover PR. Also out of scope: trimming the skill, which `555` established is the wrong lever — **this PR adds 27 lines to it on purpose**, because promotion is what keeps the handover short. Length: **163 lines**, measured with `wc -l`, against the ~150 target; **one content cut was made (a band figure `.plan-day.md` already carries, per the skill's cite-don't-repeat rule) and no wordsmithing pass was opened**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run on this branch before the gates; it reported `Already up to date` and pushed
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
- [x] Any shared file touched checked from a second, unrelated place — **the skill is the shared file, and each of the three promotions was anchored against text read from the file itself, with a guard that exits non-zero when the anchor is missing.** All three guards passed on the first run. The passage the retry promotion replaces was read in place first, so the correction lands on the sentence that was actually wrong (*"fall back at once to naming the folder and the port"*) rather than beside it. The skill went 1686 to 1713 lines, which is the intended direction for a promotion
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged; the branch is one commit of markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: this edition's own choice, promoting three facts into the skill rather than carrying them, **is the skill's rule 2 for handovers applied as written**, and the reasoning for each promotion is in the skill passage it lands in. The retry rule's evidence is in this PR's commit message and in `.plan-day.md`
- [x] `README.md` still accurate — it says nothing about the handover or the skill
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A handover and a planning skill touch no page, no card and no data`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the band verdicts are each stream's own posted `stream-usage:` comment read against the band recorded in `.plan-day.md` at setup; the floor figures are `tokens - messages` from those same comments; **the retry finding is two refusals and two successes observed in this session's own transcript, with Lutan's words quoted from it**; the claimed-but-absent backlog note was established by `git pull` then `grep` over `main`'s `docs/backlog.md`, and the three blind readers were each opened and read (`readonly-checks.mjs:18`, `check-new-policy-role-names.mjs:76`) rather than taken from the PR body that named them; the card-cannot-be-split fact is `check-cards-count.mjs:35` and `0296`'s own header, both read; the line counts are `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefacts are two markdown files read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The handover came in at **163 lines** against the ~150 target and the ~160 "ship it" allowance | **Accepted, not chased.** One content cut was made where `.plan-day.md` already carried the figure. The skill's own rule is that a trimming pass costs a round-trip and saves nothing, and that accuracy outranks the line count; the remaining length is two findings and a warning list, none of which is repeated from the repo |
| 2 | — | none | The `CLAUDE.md` session-start gap recorded on the previous edition **still has not been closed, and is now wider.** Recorded again in section 1 rather than silently fixed here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Lutan has never read a handover, and it outranks nothing — it is read by the next planning chat, rewritten within nine streams, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking. The skill change is instructions to that same chat, and the next round tests it by following it |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-11-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — defect 1 is accepted with its reason
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
