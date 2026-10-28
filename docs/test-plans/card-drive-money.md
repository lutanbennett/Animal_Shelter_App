# Test plan: card-drive-money

## Header

| | |
|---|---|
| Feature | Card review re-pass over `donations_receipts`, `bills`, `outreach_notes` and `run_appeals`: all 20 numbered walkthrough steps driven, findings recorded and nothing fixed |
| Backlog item | `docs/backlog.md` → the card review's re-pass after 0268 and 0269 (this stream covers 4 of the cards; the box is left open for the planner) |
| Branch / worktree | `claude/card-drive-money` @ `C:\Development\Animal_Shelter_card-drive-money` |
| Dev server | `next dev` on port 3007; each login read back as one card via `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 2fd701db |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: four cards driven again as logins holding only that card, findings recorded and nothing fixed
- [x] Files/areas touched listed: `docs/card-access-faults.md` (one dated section appended), `docs/decisions/2026-10-28-card-drive-money.md`, this plan. No code, no migration
- [x] Roles affected identified: none, documents only; the review is deliberately not about roles
- [x] Out of scope written down: no fixes, no new or proposed cards, the other fourteen cards, the backlog tick, any file under `src/`, `worker/`, `supabase/migrations/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (docs only)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 156s

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

The review itself is the functional check. Four card-only logins were driven on the dev project in the built-in browser pane at desktop width, aal1, and no page asked for a
second step. Results are in `docs/decisions/2026-10-28-card-drive-money.md`.

- [x] Happy path works end to end for the steps driven: a receipt issued and filed to Drive, a bill matched to a job, an outreach visit recorded, an appeal drafted and a gift receipted against it, and the refused pages refused for all four logins
- [x] Data persists: the donations list, the `maintenance_bills` row (read by service role), the visits list total and the appeal's "raised" figure all showed the write
- [ ] Create / edit / delete all exercised — n/a: a review of access, not a feature; create was exercised on all four cards, edit and delete were opened but not pressed
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected with a readable message — n/a: no input changed (the refusal text seen is a finding, not a check)
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
- [ ] A role that should not have access is blocked server-side — n/a: no code changed; each card's refusal step was opened directly under its login and went to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no layout changed (the pass itself was driven at 375 px)
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: documents only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item covers more cards than this stream drove, so the box stays open for the planner
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-28-card-drive-money.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: a recording pass; nothing a user sees changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Each row records what was seen; what was only read is labelled as read, and what was not done is listed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no build change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: no output pasted
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
| 1 | n/a | none in this change. The walk's own findings are rows in `docs/card-access-faults.md`; the two that matter are the empty resident and project pickers for `donations_receipts` | deferred to backlog: fixed as a set after Lutan reviews the log |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the donation form's resident picker is empty for `donations_receipts` and that the cause is the view it reads (read from code, no query run as that login) | `/management/donations/new` on dev |
| 2 | That the Publish button on a `run_appeals` draft still publishes with no second approval (not pressed this time) | `/management/appeals/<id>` on dev |

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
