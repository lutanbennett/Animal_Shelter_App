# Test plan: card-drive-daily-ops

## Header

| | |
|---|---|
| Feature | Card review 1 driven re-pass, `recurring_jobs`, `my_tasks`, `enclosures` and `dashboard`: all 23 numbered walkthrough steps driven in the browser pane after `0268`/`0269` and the #965 app half |
| Backlog item | `docs/backlog.md` → CARD REVIEW 1, THE DRIVEN RE-PASS (this stream covers 4 cards of the re-pass group) |
| Branch / worktree | `claude/card-drive-daily-ops` @ `C:\Development\Animal_Shelter_card-drive-daily-ops` |
| Dev server | `next dev` on port 3005, stopped before the gates ran. Each login read back as one card via `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 1be068d4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: four cards driven as logins holding only that card, every advertised job end to end, findings recorded and nothing fixed
- [x] Files/areas touched listed: `docs/card-access-faults.md` (rows appended under one new heading), `docs/decisions/2026-10-28-card-drive-daily-ops.md`, this plan. No code, no migration
- [x] Roles affected identified: none, documents only; the review is deliberately not about roles
- [x] Out of scope written down: no fixes, no new or proposed cards, the other ten cards owing a re-pass, any check script

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 204s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The review itself is the functional check. Four card-only logins were driven on the dev project, aal1; no page asked for the second step. One of them (`recurring_jobs`) was also used to hand `my_tasks` a job due today. Results are in `docs/decisions/2026-10-28-card-drive-daily-ops.md`.

- [x] Happy path works end to end: a recurring job created, assigned to a login and marked Done from My tasks (twice, once with a note); Enclosures and the dashboard read; every refused page refused
- [x] Data persists: both jobs stayed under "Done today" after leaving and returning to My tasks
- [ ] Create / edit / delete all exercised — n/a: a review of access, not a feature; Create and Done were driven, Edit, Delete and Resume were not
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

- [ ] Every role above tested — n/a: no code changed, and the review is about four cards with no reference to roles
- [ ] A role that should not have access is blocked server-side — n/a: no code changed; refused pages were opened directly (`/operations/medication-list`, `/stocktake`, `/management/cashflow`, `/management/cashflow/fixed-outgoings`) and each went to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: driven at the pane's 1024 px width; no layout changed
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` had nothing new to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item covers many cards and this closes four; it stays open for the planner to record
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-28-card-drive-daily-ops.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: a driven card pass; no user visible change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Each row records what was seen on screen; what was only opened or not driven is labelled, and the decision file lists it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no build change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
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
| 1 | n/a | none in this change. The review's findings are rows in `docs/card-access-faults.md`; none stops a walkthrough step except `dashboard` steps 3 and 4, which are recorded as not met | deferred to backlog: fixed as a set after Lutan reviews the log |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `dashboard` resident figures read 0 while residents exist: confirm against the real count with a login that can see residents | `/management/dashboard` as a `dashboard` login, against `/residents` as an Admin |
| 2 | The Edit link on Appointments is offered to a login that cannot use it | `/upcoming-visits` as a `dashboard` login; press Edit on any visit |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items are outstanding and are carried as `pending:` on the signature line below

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: documents only, nothing to deploy

Result: pass with accepted defects

Release manager acknowledgement: n/a: documents only
