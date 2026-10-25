# Feature test plan — the card save is verified, and the Doctor count is the evidence

## Header

| | |
|---|---|
| Feature | Closes the one question `0.40.4` left open, in the three documents that still record it as unknown: the card save on Who does what **is** verified on production, and the Doctor role's moving card count is the evidence |
| Backlog item | n/a: nothing in `docs/backlog.md` carries this. It is a correction to release paperwork merged hours earlier in #940 |
| Branch / worktree | `claude/card-save-verified` @ `C:\Development\Animal_Shelter_card-save-verified` |
| Dev server | n/a: documents only, no runnable surface |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | `6f4fc9957a163a3d37b43b695742ce0b8c5eef71` (#940's merge, the tip of `main`) |

## 1. Scope and risk

- [x] One sentence: Lutan confirmed he has exercised the card save on Who does what, with the Doctor role's changing cards as the evidence, so three documents stop saying it is unknown and stop inviting the question again
- [x] Touched: `docs/decisions/2026-10-25-doctor-is-the-test-role.md`, `docs/release-handover.md`, `docs/releases/2026-10-25-0-40-4.md`, `docs/test-plans/card-save-verified.md` (this file)
- [x] Roles affected: none — no code, no schema, no permission change
- [x] Out of scope: the `doctor-cells` check itself, which is deliberately unchanged — whether it should keep asserting `0230`'s 13 cells against a role in active use is Lutan's call, not a release manager's

**The risk this closes is a documented one.** `CLAUDE.md`'s "Answering a decision on a backlog item"
records `assistant-retention` being parked as blocked by nine consecutive `/plan-day` runs because its
title still said a decision was pending, so Lutan was asked three times for answers he had already
given twice. The same shape was live here: `0.40.4`'s paperwork said the card save was unknown and
explicitly told the next session to ask him.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in effect: the worktree was created from `origin/main` at `6f4fc995` and `main` has not moved since, so there was nothing to merge in
- [x] `node scripts/gates.mjs` run on this branch

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. It is read on the PR before merging

## 3. Schema and data — *skip if no migration*

Skipped: no migration.

## 4. Functional checks

- [x] Happy path: each of the three documents now reads correctly **without** its superseded passage, which is the specific test `CLAUDE.md` sets — a reader skimming any one of them finds no open question and no instruction to ask
- [x] **Every surviving mention of the Doctor role was re-read, not just the one that prompted the change.** This caught a line #940 missed: the handover's "In flight and open" still called the Doctor count *"the most important open item"* with *"the new doctor cards as the remedy"*, which is the sentence that would have had someone restore the cards
- [ ] Data persists — n/a: documents, no writes
- [ ] Create / edit / delete — n/a: no write path
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [x] Boundary cases: the handover's 150-line ceiling is held exactly at **150** after the edits

### Role access matrix

n/a: no surface added, no permission changed.

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page added
- [ ] Manual — n/a: no manual topic describes release paperwork
- [ ] Translatable strings — n/a: no user-facing text
- [ ] Mobile viewport — n/a: no layout
- [ ] Console clean — n/a: no runnable surface
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] Nothing merged from `main` during sync was broken — gates above, and `main` had not moved
- [x] `grep -n -i doctor docs/release-handover.md` re-read in full afterwards: all nine surviving mentions agree with each other and with the decision file. No line still frames the count as a fault, an open item, or something to remedy
- [x] The decision file's claim is quoted from Lutan verbatim rather than paraphrased, so a later reader can see it is his statement and not a session's inference — which is exactly what went wrong the first time

## 7. Documentation

- [x] Backlog item ticked — n/a in effect: no backlog item carries this
- [x] Non-obvious design choices: the change **is** to a decision file, `docs/decisions/2026-10-25-doctor-is-the-test-role.md`, which now records both the answer and why the red check is the evidence. No second file is warranted for a correction to the first
- [ ] `README.md` still accurate — n/a: nothing in `README.md` names these documents
- [ ] **Release notes.** `n/a: release paperwork. These are three documents describing a release that already shipped; no shelter user can see a decision file, a handover or a release record, and this PR changes no code, page or string.`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — and that is the point of this PR. The claim being removed was *reasoned* (no session had recorded the check, therefore it was not done) and wrong. The claim replacing it is Lutan's own statement, quoted. **The general fault is written into the decision file: a measurement can prove what a release did not do without supplying a cause, and inventing the cause is how a session undoes a person's work**

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` — `6f4fc995`
- [x] Deployed SHA matches the tested SHA — n/a in effect: **nothing deploys from this PR.** Production and test are both on `0.40.4` @ `2374d15d` and are untouched by it

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys from this PR
- [x] Smoke-tested on `test.lannacare.org` — n/a in effect: no runnable change. For the record, `0.40.4` itself was smoke-tested and the results are in `docs/releases/2026-10-25-0-40-4.md`
- [ ] Timezone-sensitive behaviour — n/a: no date logic in a Markdown document
- [ ] Boundary/banding — n/a: no threshold in code
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates` line is verbatim; the line count and the `grep` sweep were run, not estimated
- [ ] Public pages re-checked — n/a: no deploy, no cache to purge

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var — n/a: none

### Migration ordering — *skip if no migration*

Skipped: no migration.

### Rollback

- [x] Rollback position stated, including what it does not cover: **reverting this PR restores three documents to their #940 text and nothing else** — no code, no schema, no deployed artefact. The only cost of a revert is that the false "unknown" comes back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | #940's handover still called the Doctor count *"the most important open item"* with *"the new doctor cards as the remedy"* in "In flight and open" — the START HERE correction was made but this one was missed, and acting on it would have restored `0230`'s 13 cells and destroyed work in progress | fixed in this PR, and found by re-reading **every** mention rather than the one that prompted the change |
| 2 | low | The same stale "genuinely unknown" wording appeared in all three documents, so correcting one would have left two inviting the question | fixed: all three changed together |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty, and that is a real answer: this PR adds no surface a person needs to look at, and the one
judgement it rests on — whether the card save has been exercised — **is Lutan's own statement**, which
is the thing a manual check would have gone looking for.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [x] The manual list above is not empty — n/a: the list is empty, because nothing here has a surface to look at

Manual verification by: n/a: no surface to inspect; the one fact this PR records was stated by Lutan in chat on 2026-10-25 and is quoted verbatim

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in effect: this session is the production release manager

Result: pass

Release manager acknowledgement: Claude, 2026-10-25 — `0.40.4` has no open item.
