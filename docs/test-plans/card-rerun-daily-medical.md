# Test plan: card-rerun-daily-medical

## Header

| | |
|---|---|
| Feature | Card review 1 driven re-pass, `administer_medication`, `record_weight` and `add_medical_photos`: all 16 numbered walkthrough steps driven in a browser after `0265` and `0267` |
| Backlog item | `docs/backlog.md` → CARD REVIEW 1, THE DRIVEN RE-PASS OVER THE FIRST 14 CARDS (this stream covers 3 of the 14) |
| Branch / worktree | `claude/card-rerun-daily-medical` @ `C:\Development\Animal_Shelter_card-rerun-daily-medical` |
| Dev server | `next dev` on port 3002, stopped before the gates ran. Dev schema 270 applied, 0 pending; each login read back as one card via `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | 11b029f4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three cards driven as logins holding only that card, every advertised job end to end, findings recorded and nothing fixed
- [x] Files/areas touched listed: `docs/card-access-faults.md` (ten earlier rows marked in place, five rows appended), `docs/decisions/2026-10-27-card-rerun-daily-medical.md`, this plan. No code, no migration
- [x] Roles affected identified: none, documents only; the review is deliberately not about roles
- [x] Out of scope written down: no fixes, no new or proposed cards, the other 11 of the first 14 cards, the Doctor area

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 117s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration (read only, to record the dev schema state: 270 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The review itself is the functional check. Three card-only logins were driven on the dev project at the pane's width, aal1; no page asked for the second step. Results are in `docs/decisions/2026-10-27-card-rerun-daily-medical.md`.

- [x] Happy path works end to end: Medication list read; a weight saved and read back; a recurring job marked done from My tasks; a photo uploaded and confirmed on the resident's Photos page. Every refused page refused
- [x] Data persists: the weight read back as "Last time: 4.6 kg, 27 Oct 2026" and "Today already has 4.6 kg"; the job stayed under "Done today" after a reload; the photo showed as Medical, 27 Oct 2026 on the resident's Photos page
- [ ] Create / edit / delete all exercised — n/a: this is a review of access, not a feature; the cards' own saves (weight, job done, photo upload) were driven, and none of the three offers a delete
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected with a readable message — n/a: no input changed
- [ ] Boundary cases checked — n/a: no input changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no code changed |
| management | nothing new | no change | n/a: no code changed |
| staff | nothing new | no change | n/a: no code changed |
| doctor | nothing new | no change | n/a: no code changed |
| volunteer | nothing new | no change | n/a: no code changed |
| signed out | nothing new | no change | n/a: no code changed |

- [ ] Every role above tested — n/a: no code changed, and the review is about three cards with no reference to roles
- [ ] A role that should not have access is blocked server-side — n/a: no code changed; each card's refused pages were opened directly (`/maintenance`, `/stocktake`, a resident's own page) and `/residents/export` returned 403 for all three

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: driven at the pane's width; no layout changed
- [ ] Browser console clean — n/a: no UI change (the console showed no errors on the Medication list)
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` had nothing new to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item covers 14 cards and 11 are still to be driven; it stays open, and the planner records this stream's three cards on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-27-card-rerun-daily-medical.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: a verification pass; nothing changes for a user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Each row records what was seen on screen; what was only read (`administer_medication`'s lack of `recurring.do_own`) is labelled "read", and the decision file lists what was not driven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no build change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only evidence is the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy for this change
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy for this change
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documents only; reverting the merge removes them, nothing else is affected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | none in this change. The review's own findings are rows in `docs/card-access-faults.md`; none stops a walkthrough step | deferred to backlog: fixed as a set after Lutan reviews the log |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The uploaded Medical photo's tile is blank on the resident's Photos page: whether that is the generated test PNG, the dev Drive link or a real fault | Ong Thong (R-0011), Photos, as a login holding `view_residents`; then the file in Drive |
| 2 | `administer_medication` cannot be handed a recurring job by its grants (read, not driven) | assign it a job from a `recurring_jobs` login, then My tasks |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items are outstanding and are carried as `pending:` on the signature line below

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: documents only, nothing to deploy

Result: pass with accepted defects

Release manager acknowledgement: n/a: documents only
