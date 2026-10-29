# Test plan: vet-cards-drive

## Header

| | |
|---|---|
| Feature | First browser pass of `record_vet_care`, `record_microchip`, `adoption_news` and `add_while_recording` (21 walkthrough steps) as one-card logins; findings recorded, no code changed |
| Backlog item | on the `backlog` branch, not yet on `main`: DRIVE THE FOUR VET CARDS CREATED BY 0281 (not ticked here; the planner ticks it) |
| Branch / worktree | `claude/vet-cards-drive` @ `C:\Development\Animal_Shelter_vet-cards-drive` |
| Dev server | `next dev` on port 3001; logins from `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: four cards driven, findings recorded
- [x] Files/areas touched listed: `docs/card-access-faults.md`, `docs/decisions/2026-10-29-vet-cards-driven.md`, this plan. No code, no migration
- [x] Roles affected identified: none by name; the findings follow the cards
- [x] Out of scope written down: gating the hub's Book clinic visit link and deciding where add_while_recording is used (both filed on the backlog branch), the generated walkthrough

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted:

```
GATES_HERE
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written, or reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: each login saw only its own home tile, and each card's save worked and read back
- [x] Data persists — the saved rows showed on the resident's own pages after the save
- [ ] Create / edit / delete all exercised — n/a: create and edit were driven, no card here deletes
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected — n/a: no input changed
- [ ] Boundary cases checked — n/a: no input changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: findings follow cards, not roles |
| management | nothing new | no change | n/a: findings follow cards, not roles |
| staff | nothing new | no change | n/a: findings follow cards, not roles |
| doctor | nothing new | no change | n/a: findings follow cards, not roles |
| volunteer | nothing new | no change | n/a: findings follow cards, not roles |
| signed out | nothing new | no change | n/a: findings follow cards, not roles |

- [ ] Every role above tested — n/a: each card was tested on a login holding only it
- [x] A login lacking the card is blocked server-side: `/operations/medication-list` and `/medical/photos` went to `/no-access` for the cards that do not hold them, and the hub's Book clinic visit link went to `/no-access` for `record_vet_care` (a defect)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour changed
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport (375px) — n/a: no layout changed
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] Nearest pages still work — n/a: no code changed
- [ ] Shared file touched checked from a second page — n/a: no code changed
- [x] Nothing merged from `main` during `sync` was broken by this branch: only docs and backlog came in, none of it touched here

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item is on the `backlog` branch and not yet on `main`; the planner ticks it
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** — n/a: the four vet cards are held by no login and production is two migrations behind (0280, 0281 pending); nothing a user can see changed
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: each control was pressed and each landing page read

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded, tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only
- [ ] Smoke-tested on test — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: no threshold changed
- [ ] Evidence is the tool's actual output — n/a: only the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: none changed

### Deploy safety

- [ ] deploy line read — n/a: no deploy for this change
- [ ] strip-baked-env seen — n/a: no deploy for this change
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] production dry-run clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documents only; reverting restores nothing functional

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Resident hub draws Book clinic visit for a card holding medical.visits but not visit.book; it ends on /no-access | deferred to backlog |
| 2 | low | add_while_recording has no screen that uses it | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | n/a: nothing here needs a person to look beyond what was driven | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty, nothing for a person to look at

Manual verification by: n/a: a verification pass over card access; no person has looked

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR as a file
- [ ] Handed to the production release manager — n/a: no deploy for this change

Result: pass with accepted defects
