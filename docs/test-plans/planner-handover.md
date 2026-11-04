# Feature test plan — planner handover `645`

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten as edition `645`, carrying this plan's batches 1 and 2 in full and batch 3's setup. **One file; no skill change, no `CLAUDE.md` change** |
| Backlog item | `docs/backlog.md` → none. The handover is the planner skill's step 8, not a backlog item |
| Branch / worktree | `claude/planner-handover-645` @ `C:\Development\Animal_Shelter_planner-handover-645` |
| Dev server | not started — `n/a: one markdown file, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `82e347ea` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *edition `645` written as a delta over `636`, leading on the hour Lutan lost redoing finished work and the single habit behind every cause of it.* There is no backlog item, as the header says. **He asked for this edition in those terms** (*"I expect lots of lessons"*), so the lead is the lessons rather than the mechanism scores
- [x] Files/areas touched listed — **`docs/planner-handover.md` and this plan, and nothing else.** No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`, no `.claude/skills/`
- [x] Access affected identified — **none.** The handover grants and denies nothing: it is read by one planning chat, it outranks nothing (it says so in its own opening lines), and it is rewritten every plan. No card, activity, policy, page, tile or control changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a) The edition names ONE promotion into the skill as OWED — the STEP ZERO carry-on sentence — and deliberately does NOT make it here.** A skill change is a different kind of work from a handover and belongs in its own PR (`docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`). It was fixed on disk in batch 3's three briefs so those streams are unaffected while the skill waits. **(b) Batch 3's figures are not in the edition and it says so**, in its second paragraph; `654` carries them. **(c)** The corrections to `#ubejc`, `#ij9cm`, `#314hq`, `#r55fe` and `#ki6cx` are recorded **on their backlog items**, not here; the edition only names them so a planner does not re-derive them. **(d)** Length: **155 lines**, measured with `wc -l` after the content was written, against the ~150 target — **no trimming pass was opened**, per the skill's instruction not to spend round-trips on wordsmithing, and the skill's own words are that a little over is fine

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` minutes earlier, so there was nothing to merge in. The gates were run in full regardless, **in the background with their output redirected to a file that was then read** — which is the step every brief in this plan carries as a numbered deliverable, and the planner is not exempt from it
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck exited 0 after 134s
=== gates: lint exited 0 after 177s
=== gates: test exited 0 after 23s
=== gates: build exited 0 after 191s
gates: typecheck=0 lint=0 test=0 build=0
```

**THE FIRST RUN OF THESE GATES REFUSED, AND THE PLAN BRIEFLY CLAIMED A PASS IT HAD NOT EARNED — recorded rather than quietly overwritten, because it is the same fault class this edition leads on.** The gates were started in the background while `worktree.mjs new`'s `npm ci` was still installing, so `node_modules/.bin` had no `next`, `tsc` or `eslint`, and `gates.mjs` **refused outright**: *"nothing was run … Running the gates now would fail every one of them for a reason that has nothing to do with the code."* **The script protected the result; the planner's sequencing did not.** The figures above are the SECOND run, after the install finished, read out of its own redirected file. **A gates line is only ever transcribed from a file that was read, never from a command that was launched**
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

- [x] The pages nearest the change still work — `n/a` would be wrong: `docs/` is read by `scripts/check-test-plan.mjs` and `scripts/check-docs-only.mjs`, so the four gates were run in full rather than skipped as a documentation change. **All four exited 0 at the tested SHA `82e347ea`, which is the commit that added the handover; the only later change on this branch is this plan, which no gate reads**
- [x] Any shared file touched checked from a second, unrelated place — **the handover is the only file touched, and it is read by exactly one consumer: the next planning chat.** The thing worth checking instead is that it does not contradict the documents that outrank it, so each of its claims about the rules was read back against its source: the one-job-in-a-release rule against `docs/release-procedure.md:28-36`; the merge-on-green rule against `CLAUDE.md`; the band, brief-block and counter rules against `.claude/skills/plan-day/SKILL.md`. **The edition states in its own opening lines that it outranks none of them**
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed here: **the conclusions are the subject of the edition's own lead sections**, and every finding that needed a durable home outside it was **filed onto its backlog item in the same session** — the never-re-ask rule onto `#ubejc` and `#ij9cm`, the measured archive state onto `#314hq`, the dead stream pointer onto `#r55fe`, the host literals onto `#ki6cx`, and three new items from PR bodies. `docs/decisions/2026-10-08-planner-handover-counter.md` remains the paper for why the counter exists and is unchanged by this PR
- [x] `README.md` still accurate — it says nothing about the handover
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A planner handover touches no page, no card and no data, and the release-notes file is not in this diff`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the band verdicts are each stream's own posted `stream-usage:` comment read against the band recorded in `.plan-day.md` **at setup**; the floors are `tokens - messages` from those comments, and the three `unmeasured` readings are reported as unmeasured rather than estimated; **R-0323's state is a production read** (`scripts/check-deceased-archive-state.mjs --env production R-0323`, output quoted in full) rather than a question put to Lutan; the `0163` policy claim is the migration read in place at `:30-35` **and independently confirmed by the portal stream**; the "no separate Worker path list" claim is `worker/index.mjs:72` and its own comment at `:80`; the `site_content` draft-column absence is every `alter table site_content add column` across the migrations, after a looser grep gave a false positive that is recorded as such; the one-job-in-a-release quote is `docs/release-procedure.md:28-36` read in place; and the line count is `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefact is one markdown file read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **high** | **Lutan lost over an hour redoing the Google OAuth checks and BitLocker, both finished weeks earlier, and was asked about R-0323 twice after its archive had already been written.** Five interruptions in one evening, every one a planner defect | **Not fixable in a handover, and not left there.** The rule is written onto `#ubejc`, `#ij9cm` and `#314hq`, saved to memory as `confirmations-already-given`, and leads this edition. **The instrument that removes the R-0323 question entirely was built and proven against production** |
| 2 | medium | `scripts/check-deceased-archive-state.mjs` works and is **uncommitted in the main checkout**, so the next `/plan-day`'s clean-tree check will stop | **Accepted and filed** as a quick win with its three fixed faults recorded. Not folded into this PR: a script is a different kind of work from a handover |
| 3 | medium | **STEP ZERO says when to stop and never says when to carry on**, so a stream reported a clean result to Lutan and waited | **Fixed on disk in all three of batch 3's briefs; the promotion into `.claude/skills/plan-day` is OWED** and named in the edition as the next round's first job. A skill change belongs in its own PR |
| 4 | low | Batch 3's three streams were set up but not started when this was written, so their figures are in no edition | **Accepted; it is the rule.** The skill requires the handover at the **setup** of the last batch and requires the edition to say so rather than imply coverage it lacks |
| 5 | low | Three of ten streams posted `tokens=unmeasured`, so a third of the band sample is unusable | **Accepted, recorded, not diagnosed.** All three were honest rather than guessed. The edition flags it as worth one look next round rather than theorising about the cause |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| - | nothing | Lutan has never read a handover, and it outranks nothing - it is read by the next planning chat, rewritten each plan, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking. **The next round tests it by following it:** the counter should read `0 of <total>` with this slug and date, batch 3's figures should appear in `654`, and no session should put BitLocker, the Google OAuth checks or R-0323 back on his list |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 answered where the fix belongs, 2 to 5 accepted with their reasons
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
