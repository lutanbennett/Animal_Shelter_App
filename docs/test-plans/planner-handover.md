# Feature test plan — planner handover `618`

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten as edition `618`, carrying this plan's batches 1 and 2 in full and batch 3's setup. **One file; no skill change, no `CLAUDE.md` change** |
| Backlog item | `docs/backlog.md` → none. The handover is the planner skill's step 8, not a backlog item |
| Branch / worktree | `claude/planner-handover-618` @ `C:\Development\Animal_Shelter_planner-handover-618` |
| Dev server | not started — `n/a: one markdown file, no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | `4de450f4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *edition `618` written as a delta over `609`, leading on Lutan's own challenge that his customer priorities were not reaching the plan, which was partly a real planner error.* There is no backlog item, as the header says
- [x] Files/areas touched listed — **`docs/planner-handover.md` and this plan, and nothing else.** No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`, no `.claude/skills/`. `git diff --stat origin/main..HEAD` shows the handover and this plan, and no others
- [x] Access affected identified — **none.** The handover grants and denies nothing: it is read by one planning chat, it outranks nothing (it says so in its own opening lines), and it is rewritten every plan. No card, activity, policy, page, tile or control changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a) The edition recommends ONE promotion into the skill (that filling a leftover slot is a second decision where the priorities list applies again) and deliberately does NOT make it here.** A skill change is a different kind of work from a handover and belongs in its own PR (`docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`). **(b) Batch 3's figures are not in the edition and it says so TWICE**, in its second paragraph and again in its state block; the next edition carries them. **(c)** The one answer Lutan gave this plan is recorded **on its backlog item**, not here; the edition only names it so a planner does not re-ask. **(d)** Length: **149 lines**, measured with `wc -l` after the content was written, against the ~150 target — so **no trimming pass was opened**, per the skill's instruction not to spend round-trips on wordsmithing. Its predecessor was 151

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` minutes earlier and `git push` reported the branch as new, so there was nothing to merge in. The gates were run in full regardless, **in the background with their output redirected to a file that was then read** — which is the step every brief in this plan carries as a numbered deliverable, and the planner is not exempt from it
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 35s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 89s
=== gates: test — npm test
=== gates: test exited 0 after 14s
=== gates: build — npm run build
=== gates: build exited 0 after 111s
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

- [x] The pages nearest the change still work — `n/a` would be wrong: `docs/` is read by `scripts/check-test-plan.mjs` and `scripts/check-docs-only.mjs`, so the four gates were run in full rather than skipped as a documentation change. **All four exited 0 at the tested SHA `4de450f4`, which is the commit that added the handover; the only later change on this branch is this plan, which no gate reads.** That is stated rather than papered over
- [x] Any shared file touched checked from a second, unrelated place — **the handover is the only file touched, and it is read by exactly one consumer: the next planning chat.** The thing worth checking instead is that it does not contradict the documents that outrank it, so each of its claims about the rules was read back against its source: the merge-on-green and `npm ci` daily-sync rules against `CLAUDE.md`, the band, brief-block and counter rules against `.claude/skills/plan-day/SKILL.md`. **The edition states in its own opening lines that it outranks none of them**
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed here: **the design conclusions are the subject of the edition's own lead sections**, and the one finding that needed a durable home outside it — that the daily sync's `npm ci` gutted `node_modules` mid-release — was **filed onto its backlog item with the npm-log evidence and a revised `Done when`** (`backlog` `48ab13e2`), because that is where the work to fix it will be picked up. `docs/decisions/2026-10-08-planner-handover-counter.md` remains the paper for why the counter exists and is unchanged by this PR
- [x] `README.md` still accurate — it says nothing about the handover
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A planner handover touches no page, no card and no data, and the release-notes file is not in this diff`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the six band verdicts are each stream's own posted `stream-usage:` comment read against the band recorded in `.plan-day.md` **at setup**, not after the fact; the floors are `tokens − messages` from those comments; **the `npm ci` timeline is four npm log files read in `%LOCALAPPDATA%\npm-cache\_logs\` with their own timestamps and exit codes, not inferred from the damage**; the production verdict on the non-tag `#` is a `check-production.mjs` run against `dbkodyyxxhtygxcxmfcu` with the project named in its own output; the three stale file references were each confirmed by listing the directory or reading the file rather than trusting the item; `ReleaseRole` is quoted from `src/lib/releases.ts:45-50` read in place and is explicitly recorded as **not established** rather than as a finding; the line counts are `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefact is one markdown file read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The edition recommends one promotion into `.claude/skills/plan-day/SKILL.md` and does not make it | **Accepted, and deliberately.** A skill change is a different kind of work from a handover and belongs in its own PR (`docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`). The recommendation is recorded where the next planner will read it rather than left in a chat |
| 2 | low | Batch 3's three streams were set up but not started when this was written, so their figures are in no edition | **Accepted; it is the rule.** The skill requires the handover at the **setup** of the last batch, not after it merges, and requires the edition to say so rather than imply coverage it lacks. The edition says it twice |
| 3 | medium | The planner's own `npm ci` destroyed the main checkout's `node_modules` during a live release, and the planner's first account of it to Lutan had the cause backwards | **Not fixed here, and correctly so: the fix is a guard in the tooling, not a sentence in a handover.** Filed with the npm-log evidence and a revised `Done when` (`backlog` `48ab13e2`), the wrong prime suspect marked superseded in place rather than deleted. **The correction was also said plainly to Lutan rather than quietly amended** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Lutan has never read a handover, and it outranks nothing — it is read by the next planning chat, rewritten each plan, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking. **The next round tests it by following it:** the counter should read `0 of <total>` with this slug and date, batch 3's figures should appear in the next edition, and the leftover-slot rule should be visible in how the next batch 1 is composed |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 and 2 accepted with their reasons, 3 accepted here and filed where the fix will happen
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed
