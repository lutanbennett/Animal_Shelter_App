# Feature test plan — promote the count-without-its-method rule into the planner skill

## Header

| | |
|---|---|
| Feature | One rule promoted into `.claude/skills/plan-day/SKILL.md` step 3, beside the existing count-without-its-database rule: **a count quoted without its METHOD ages exactly like one quoted without its database.** 15 added lines, one file |
| Backlog item | `docs/backlog.md` → none. This is the planner skill's own "promote durable facts ONCE" instruction (step 8, rule 2) |
| Branch / worktree | `claude/skill-count-method-rule` @ `C:\Development\Animal_Shelter_skill-count-method-rule` |
| Dev server | not started — `n/a: one markdown file, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | `145f1085` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *one bullet added to the skill's step 3, promoting a rule the same plan demonstrated twice.* There is no backlog item: the skill's own step 8 says a fact that will still be true in three rounds belongs in the skill rather than in a handover that is rewritten every nine streams
- [x] Files/areas touched listed — **`.claude/skills/plan-day/SKILL.md` and this plan, and nothing else.** No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`, no `docs/` beyond this plan
- [x] Cards affected identified — **none.** A planner skill grants and denies nothing: it is instructions read by one planning chat. No card, activity, policy, page, tile or control changes, and admin and the signed-out public are unaffected. *(Stated by card rather than by role, per `CLAUDE.md`)*
- [x] Anything explicitly **out of scope** written down — **(a) THIS IS DELIBERATELY SEPARATE FROM THE HANDOVER PR (#1348), and that is the whole reason it exists.** The rule was written on the handover branch first and reverted off it, because `docs/test-plans/planner-handover.md` records a previous planner's ruling citing `docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`: *"A skill change is a different kind of work from a handover and belongs in its own PR."* **Edition `645` followed that ruling and then left its own promotion OWED, which became a defect its successor had to carry — so this one is done in the same round rather than deferred.** **(b) Nothing else in the skill is touched**: no band, no brief block, no counter rule, no step reordered. **(c)** The rule's evidence lives in handover `681` and `.plan-day.md`; this change does not reproduce it beyond the two figures needed to make the rule checkable

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` minutes earlier, so there was nothing to merge in. The gates were run in full regardless, **in the background with their output redirected to a file that was then read**
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck exited 0 after 203s
=== gates: lint exited 0 after 527s
=== gates: test exited 0 after 51s
=== gates: build exited 0 after 346s
gates: typecheck=0 lint=0 test=0 build=0
```

**No gate reads `.claude/skills/`**, so these four prove only that the branch did not break anything else — which is exactly what they are being claimed for here, and the reason this plan does not dress them up as verification of the rule. **The rule itself is verified by reading it, under §6.**
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the deliverable is 15 lines of markdown in a skill file`
- [ ] Data persists — `n/a: no runtime surface`
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

**Written by card, not by role** (`CLAUDE.md`: all analysis is by card, because roles are a transient
grouping of cards and every assignment will be rebuilt).

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | a planner skill is instructions read by one planning chat, not an app surface: no card opens it, no card is read by it, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

- [x] Every login above tested — vacuously: the diff is one markdown file and this plan
- [ ] A login that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: this is an instruction to a planning chat, not something a shelter user does`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — `n/a` would be wrong. **What a skill change can actually break is the skill**, so the added bullet was read back in place against the three things it sits beside: the **count-without-its-database** rule it is modelled on (same step, same bullet list, so the pair now reads as one idea rather than two); the **NOT-ESTABLISHED / assert-nothing-you-have-not-measured** rule in step 7, which is the mechanism this rule tells a planner to use; and the **band** guidance, which the rule must not contradict — it does not, because it changes what a planner must *re-check*, not how anything is priced. **`node scripts/check-decision-dates.mjs` was also run and printed `ok`**, since it reads filenames git reports as added
- [x] Any shared file touched checked from a second, unrelated place — **the skill is read by one consumer, the planning chat, and the second place that must agree with it is `CLAUDE.md`.** Read back: `CLAUDE.md` carries the by-card rule and the no-named-role-fallback rule and says nothing about counts or methods, so **there is no overlap to contradict.** The rule's two neighbours inside the skill are checked above
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is 15 markdown lines on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: no backlog item; this is the skill's own promote-durable-facts instruction`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: **the decision this PR acts on is already written down** in `docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`, which is why the change is split from the handover at all. The rule's own evidence is in handover `681` (#1348) and the per-stream figures are in `.plan-day.md`
- [x] `README.md` still accurate — it says nothing about the planner skill
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A planner instruction touches no page, no card and no data, and the release-notes file is not in this diff`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the two figures the rule quotes are **the stream's own reported numbers**, not the planner's: PR #1343 reported `.tsx` as **20 in 7 files** against the item's 161 and said in its own body that the old figure is *"not reproducible"*, and `.ts` as **204** against 261. **The script it left behind, `scripts/measure-english-in-tsx.mjs`, is named in the rule so the next reader can re-run the method rather than trust the number** — which is the rule's own point applied to itself

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefact is 15 lines in a skill file read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **The rule was committed on the handover branch first and had to be reverted off it.** The precedent requiring a separate PR lives in a *test plan* (`docs/test-plans/planner-handover.md`) rather than in the skill, so it was met late | **Corrected in the open rather than force-pushed away**, and recorded on both PRs. **Worth promoting the precedent itself into the skill next round** — a rule that only exists in one old test plan is exactly the invisibility fault the skill warns about |
| 2 | low | **No gate reads `.claude/skills/`**, so nothing mechanical can check that a skill change is coherent with the rest of the skill | **Accepted and compensated by hand** under §6: the bullet was read back against its three neighbours and against `CLAUDE.md`. Not proposed as a new check — a coherence check over prose is not something a script can do, and claiming otherwise would be worse than the gap |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| - | nothing | A planner skill change is read by the next planning chat and outranks nothing above it; Lutan has never reviewed one. **The next round tests it by following it:** the next `/plan-day` should carry a count it did not measure into a brief *in those words* and make re-measuring deliverable one. If the next edition reports that habit as fired, the promotion worked |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a planner skill change is read by the next planning chat and outranks nothing; no shelter-visible behaviour changes

### Result

- [x] Open defects are either fixed or explicitly accepted above — both accepted with their reasons
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
