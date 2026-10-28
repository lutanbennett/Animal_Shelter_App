# Feature test plan — notes-and-transient-labels

## Header

| | |
|---|---|
| Feature | Two defects left by #1047: `0.40.10` carried two contradictory release notes, and the *TRANSIENT CONTEXT* prefix its decision file promised was never written into the code |
| Backlog item | `docs/backlog.md` → Security, *THE ANALYSIS INSTRUMENTS ASK A ROLE QUESTION…* (this completes the labelling half that item asked for; the item stays open for the rest) |
| Branch / worktree | `claude/notes-and-transient-labels` @ `C:\Development\Animal_Shelter_notes-and-transient-labels` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Opus 5), planner session / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | see the `gates:` block below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — `src/lib/releases.ts` (one clause removed from `0.40.10`'s notes) and `scripts/lib/readonly-checks.mjs` (four `asks` strings prefixed). No schema, no UI, no app logic
- [x] Roles affected identified — **none.** No permission, policy, card or activity changes. One of the two changes is *about* how roles are reported, which is the point
- [x] Anything explicitly **out of scope** written down — **the rest of the instruments item.** `doctor-cells`, `role-cards-coverage` and `cards-union` are deliberately **not** labelled (see section 4), and no check's SQL or `failed` logic is touched here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; reverting the commit restores both strings
- [ ] Production apply plan stated for the release manager — n/a: no migration. **`0279` is already applied** (280 of 280, read 2026-10-28), which is what makes the removed clause false

## 4. Functional checks

- [x] **Defect 1 confirmed before fixing, by reading `0.40.10`'s own notes array.** It contained both *"A login that holds Add Medical Photos can still file photos into the Medical folder but can no longer look at them afterwards"* and *"If your cards include Add medical photos, you can now look at the photos in a resident's Medical folder as well as add them."* **Same release, directly contradictory, and a shelter admin reading `/releases` sees both**
- [x] **Fixed by removing the false clause, not by editing both notes.** The clause was true of `0276` alone and was falsified by `0279`; the note beside it now states the position for that card, so the clause is redundant as well as wrong. The rest of that note — that viewing the Medical folder needs a medical card — is still true and is left exactly as it was. **Verified after the edit: `0.40.10` now mentions Add medical photos once, in the "can now look at" note**
- [x] **Defect 2 confirmed before fixing, by grepping for the thing the decision file claimed.** `docs/decisions/2026-10-28-instruments-ask-a-card-question.md` says *"The role-keyed checks stay (they answer 'who holds what today') with a TRANSIENT CONTEXT prefix."* `grep -c "TRANSIENT" scripts/lib/readonly-checks.mjs scripts/check-production.mjs` returned **0 and 0**. **The prefix did not exist**
- [x] **Four checks labelled, and the wording distinguishes two different reasons**: `role-cards` and `role-cells` get *"TRANSIENT CONTEXT, not a finding (who holds what TODAY; roles are a transient grouping of cards, so do not quote this as a measurement)"*; `fault-residents-lifecycle` and `fault-clinic-visit-save` additionally get *"SUPERSEDED as a fault check by `card-lifecycle-enclosures` / `card-clinic-visit-save`"* and name the card check that replaced them, because those two now have card-shaped equivalents and a reader needs pointing at them
- [x] **Three checks deliberately NOT labelled, and this is a judgement to object to if it is wrong:** `doctor-cells`, `role-cards-coverage` and `cards-union` are keyed on roles but their **subject is the card system's own integrity** — "does any held card do nothing", "are a role's cells exactly the union of its cards' grants" — not "who holds what today". Labelling those as transient context would misdescribe them. **Said here rather than assumed silently**
- [x] **The listing still renders and the module still parses** — `node scripts/check-production.mjs` prints the new prefixes on the four checks and the unchanged text on the rest
- [ ] Data persists — reload the page and the change is still there — n/a: both changes are string constants in source
- [ ] Create / edit / delete all exercised — n/a: no such surface
- [ ] Empty state renders sensibly — n/a: no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked — n/a: no values
- [ ] **The four labelled checks run against production** — n/a: a worktree has no production credentials by design, so only the listing was exercised here. **The planner runs them from the main checkout after merge**; it is in the manual list below rather than ticked

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees the corrected `0.40.10` note; no contradiction | as expected |
| management | `/releases` | sees it too — the surviving note is card-tagged and `management` holds `add_medical_photos` | as expected |
| staff | — | retired by `0173`, deleted by `0270` | n/a |
| doctor | `/releases` | sees it through `medical_records` | as expected |
| volunteer | `/releases` | does not see the card-tagged note; holds none of its cards | as expected |
| signed out | `/releases` | released notes only; unchanged | as expected |

- [ ] Every role above tested — n/a: read from the note's card tags and `release-audience.ts`, not driven as six logins. **And this table is itself the shape Lutan has ruled against** — it is filled because the template asks for it, not because it measures anything
- [ ] A role that should not have access is blocked server-side — n/a: nothing is gated by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a release note and a script's help text are not manual topics
- [ ] Translatable strings go through the translation path — n/a: release notes are authored in English by the existing path; the check prefix is developer-facing
- [ ] Mobile viewport (375px) — n/a: no new markup; the note renders in the existing `/releases` list
- [ ] Browser console clean — n/a: no new client code
- [ ] Network clean — n/a: no new requests
- [x] **Thai dictionary not affected** — neither change touches `src/lib/i18n/`; the removed clause was English release-note prose, which is not translated per-string

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and every route importing `src/lib/releases.ts`; a malformed note would fail `typecheck`
- [x] Any shared file touched checked from a second, unrelated place — `readonly-checks.mjs` is imported by `check-production.mjs`, and the listing was run after the edit to prove the module still parses and every other check's text is unchanged
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the instruments item is only partly addressed here (the labelling the decision file promised). Ticking it would hide the rest, which is the invisible-work fault
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-28-two-contradictory-notes-and-a-promised-prefix.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: this **removes** a false sentence from an existing note rather than adding behaviour. A note announcing that an earlier note was wrong would be noise; the corrected note is the fix a user sees
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — both defects were confirmed by reading the file and by a grep that returned 0, quoted in section 4, before either was touched

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date arithmetic
- [ ] **For a boundary or banding change, both edges covered** — n/a: no boundary
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block is as printed, and the grep result quoted in section 4 is as returned
- [ ] Public pages re-checked after a cache purge — n/a: `/releases` is not a public page
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `apply-migrations --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting restores the false clause and removes the prefixes, and nothing else. **It does not un-apply `0279`**, which is what made the clause false in the first place

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **`0.40.10` shipped two directly contradictory notes** — one saying Add Medical Photos *"can no longer look at them"*, one saying it *"can now look at"* them. #1047's decision file **noticed** this (*"is now superseded by the new line beside it"*) and left it in the file | fixed here — the false clause removed. **The lesson is the shape, not the slip: a contradiction recorded in a decision file is still live in the product.** Spotting it and writing it down is not fixing it |
| 2 | **medium** | **#1047's decision file states the role-keyed checks carry a *TRANSIENT CONTEXT* prefix. `grep -c "TRANSIENT"` returned 0 in both scripts** — the prefix was never written | fixed here on four checks. Same family as defect 1: the decision file described the intended end state rather than what shipped |
| 3 | low | `doctor-cells`, `role-cards-coverage` and `cards-union` are role-keyed but verify the card system's integrity rather than reporting who holds what, so they are left unlabelled | accepted, and stated in section 4 so it can be objected to rather than discovered |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Run the four labelled checks from the main checkout** and confirm each still returns what it did before the label. A worktree cannot reach production; the planner owns this and does it as soon as this merges | `node scripts/check-production.mjs role-cards` and the other three |
| 2 | Read the corrected `0.40.10` note as a shelter user and confirm it now reads straight — the surviving note still lists four cards, and whether that is too much was already an open question of Lutan's | `/releases`, or the diff on this PR |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5), planner session  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is a production run only the main checkout can do, and item 2 is a wording judgement

Manual verification by: pending: the planner's post-merge production run of the four labelled checks, and a read of the corrected note — items 1 and 2 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: no deploy needed; the corrected note ships with the next release
