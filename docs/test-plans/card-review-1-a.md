# Test plan: card-review-1-a

## Header

| | |
|---|---|
| Feature | Card review 1, first half: 14 cards read against their wiring |
| Backlog item | `docs/backlog.md` → CARD REVIEW 1 OF 2 |
| Branch / worktree | `claude/card-review-1-a` @ `C:\Development\Animal_Shelter_card-review-1-a` |
| Dev server | not started: documents only |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | fcfa823a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a per-card read of what each of 14 cards advertises against what its bundle grants, recorded as fault-log rows and a decision table, with nothing fixed
- [x] Files/areas touched listed: `docs/card-access-faults.md`, `docs/decisions/2026-10-25-card-review-1-a.md`, `docs/backlog.md`, this plan. No code, no migration
- [x] Roles affected identified: none, documents only; the review is deliberately not about roles
- [x] Out of scope written down: no fixes, no new or proposed cards, the other 14 cards (`-1-b`), the Doctor area, any browser pass

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 228s

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

- [ ] Happy path works end to end — n/a: no UI surface, documents only
- [ ] Data persists — n/a: no UI surface, documents only
- [ ] Create / edit / delete all exercised — n/a: no UI surface, documents only
- [ ] Empty state renders sensibly — n/a: no UI surface, documents only
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no code changed |
| management | nothing new | no change | n/a: no code changed |
| staff | nothing new | no change | n/a: no code changed |
| doctor | nothing new | no change | n/a: no code changed |
| volunteer | nothing new | no change | n/a: no code changed |
| signed out | nothing new | no change | n/a: no code changed |

- [ ] Every role above tested — n/a: no code changed, nothing a role could reach differs
- [ ] A role that should not have access is blocked server-side — n/a: no code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the only conflict-prone file was `docs/backlog.md`, merged automatically, and gates passed after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: the Card review 1 item now says which cards are read and which are left for `-1-b`; it is deliberately not ticked, since half remains. The line-505 finding was not checked and is left open
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-25-card-review-1-a.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: a review, nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Claims are read from named files and lines; the decision file says plainly that no browser pass was run

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
| 1 | n/a | none in this change. The review's own findings are rows in `docs/card-access-faults.md` | deferred to backlog: fixed as a set after Lutan reviews the log |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The "enough" verdicts were read from the wiring, not driven. A person can sign in as a card-only login and confirm the medical-visit booking, visit save and Residents picks | `/clinic-visits/new`, `/upcoming-visits` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person: n/a: the list has one item and only the person who looked may tick this, so it stays open (see the signature)

Manual verification by: pending: a person has not yet driven a card-only login through the visit booking and save

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not merged, so nothing to hand over yet

Result: pass

Release manager acknowledgement: pending: not yet merged
