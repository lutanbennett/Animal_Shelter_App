# Feature test plan — planner handover `546`, amended

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` **amended in place**: `546` first covered batches 9 and 10, and batch 11 merged eighteen minutes after it did. It now carries nine streams in three batches, and two sections that had gone stale within the hour are corrected |
| Backlog item | `docs/backlog.md` → none. **The counter is 3 of 9, so this is NOT the next edition falling due** — it is a correction to the live one, which merged before the batch it should have measured |
| Branch / worktree | `claude/handover-546-amend` @ `C:\Development\Animal_Shelter_handover-546-amend` |
| Dev server | not started — `n/a: one markdown file, no runtime surface` |
| PR | #1169 |
| Tested by / date | Claude (Daily Planner) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `cede6773` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *one file, `docs/planner-handover.md`, amended so edition `546` carries batch 11.* There is no backlog item, as the header says
- [x] Files/areas touched listed — `docs/planner-handover.md` and this plan. **No `src/`, no `scripts/`, no `supabase/migrations/`, no `worker/`, no workflow, no `CLAUDE.md`, and not the planner skill**
- [x] Access affected identified — **none.** The handover grants and denies nothing: it is read by one chat and outranks nothing, which it says in its own opening lines. No card, activity, policy or page changes. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **the two standing mitigations this edition now names as promotion candidates are deliberately NOT promoted here**: editing the skill changes every future session, and batch 13 has a stream for trimming it. The dial fact that the previous version of this line deferred **has since been promoted, in #1167.** Nothing in this PR touches the skill or `CLAUDE.md`. Length: **181 lines** against the ~150 target, measured with `wc -l` — **over, and accepted as defect 1 below rather than chased**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run on this branch before the gates; output in the PR body
- [x] `node scripts/gates.mjs` ends:

```
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
| *(none)* | nothing changes | `docs/planner-handover.md` is a developer document read by the next planning chat, not an app surface: no card opens it, no card is read by it, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

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

- [x] The pages nearest the change still work — `n/a` would be wrong: `docs/` is read by `scripts/check-test-plan.mjs` and `scripts/check-docs-only.mjs`, so the four gates were run in full rather than skipped as a documentation change
- [x] Any shared file touched checked from a second, unrelated place — the predecessor's claims were checked against the repo rather than carried, and **two of them did not survive**: `537` said to band at `medium` because twenty-one streams had ignored a Sonnet/low recommendation, and all six streams since ran `sonnet`/`low`; and its own lead subject was not tested at all this round, which `546` says in those words rather than reporting it as fired. Every figure in `546` has a named source: the band verdicts are computed from the `stream-usage:` comments against the bands in `.plan-day.md`, the floor figures are `tokens − messages` from those same comments, the `(D)` remainder is from `check-wrapped-write-paths.mjs --all` on merged `main`, the one-address path list is `src/lib/write-requests.ts:87` read directly, and the server-side import count is from a script run over `src/`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is one commit of markdown on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: the handover is the skill's step 8, not a backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a` would be wrong, but no new file is needed: the choice this edition makes about itself, leading with the ruling-becomes-an-instrument finding rather than with the dial change, is stated in its own opening and is its subject matter. **The fact it names for promotion is deliberately not applied here**, for the reason given in section 1
- [x] `README.md` still accurate — it says nothing about the handover
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. This is a handover document read by one planning chat; it touches no page, no card and no data`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the three band misses in the lead table are computed from the streams' own posted usage lines; the "one address" in the path list was read from the file; the "exactly one server-side importer" figure replaced a first measurement that returned dozens and meant nothing, and `546` says so rather than quoting the larger number; the line count is `wc -l`

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code, no schema, no Worker change, no secret, no env var; the artefact is one markdown file read by a planning chat`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **181 lines against the skill's ~150 target** | **accepted, not chased.** The skill says a little over is fine, 200+ is the signal to cut content, and that a trimming pass is the most expensive place to spend the budget the number protects. One pass was attempted and saved **five lines for a round-trip**, which is the named anti-pattern. This edition carries three batches rather than two; the real lever is promotion, which is batch 13's stream |
| 2 | low | **The gates refused twice before they would run** — `node_modules/.bin` had no `next`, `tsc` or `eslint` | **fixed, and the cause was mine.** `worktree.mjs new` was started with a bare `&` and its `npm ci` was then raced by a second one, leaving `node_modules` half-written (`ENOTEMPTY` on two packages). Neither `npm ci`, `Remove-Item -Recurse -Force` nor the first `rm -rf` cleared it, and **no process held the folder** — checked properly with `Win32_Process` command lines after a first check wrongly filtered on `Path`, which for a node process is `node.exe`'s own location rather than its working directory. A second `rm -rf` pass cleared it and the install then succeeded, so it was a filesystem transient. **The script refusing with a precise reason, instead of reporting four false failures, is the behaviour the silent-check rule is after** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Lutan has never read a handover, and it outranks nothing — it is read by the next planning chat, rewritten within nine streams, and a wrong one is corrected by its successor rather than by a reviewer. That is why `CLAUDE.md` lets its PR merge without asking |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-11-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing for a person to look at and nothing is being signed for

Manual verification by: n/a: a handover is read by the next planning chat and outranks nothing; `CLAUDE.md` exempts its PR from review for that reason

### Result

- [x] Open defects are either fixed or explicitly accepted above — there are none
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass

Release manager acknowledgement: n/a: nothing in this PR is deployed
