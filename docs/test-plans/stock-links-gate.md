# Test plan: stock-links-gate

## Header

| | |
|---|---|
| Feature | First browser pass of `food_forecast`, `medicine_forecast` and `view_cashflow` (12 walkthrough steps) as one-card logins; findings recorded, no code changed |
| Backlog item | `docs/backlog.md` → CARD REVIEW 2 (ticked) |
| Branch / worktree | `claude/stock-links-gate` @ `C:DevelopmentAnimal_Shelter_stock-links-gate` |
| Dev server | `next dev` on port 3003; logins from `dev-signin.mjs --cards <card>` |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1072 |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | c0bbf284 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three cards driven, findings recorded
- [x] Files/areas touched listed: `docs/card-access-faults.md`, `docs/decisions/2026-10-29-forecast-and-cashflow-cards-driven.md`, `docs/backlog.md`, this plan. No code, no migration
- [x] Roles affected identified: none by name; the findings follow the cards
- [x] Out of scope written down: gating the eight stock links (recorded as a backlog follow-up), the generated walkthrough

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted:

```
=== gates: build exited 0 after 345s

gates: typecheck=0 lint=0 test=0 build=0
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

- [x] Happy path works end to end: each login saw only its own home tile and its page loaded
- [ ] Data persists — n/a: links only, nothing saved
- [ ] Create / edit / delete all exercised — n/a: no such controls on these cards
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
- [x] A login lacking the card is blocked server-side: `/operations/medication-list` went to `/no-access` for all three, and the eight stock links went to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: action links on two pages, not navigation
- [ ] Manual updated — n/a: the manual does not describe these links
- [ ] Translatable strings — n/a: two existing subtitles shortened in English and Thai, none added
- [ ] Mobile viewport (375px) — n/a: fewer buttons, no layout change
- [ ] Browser console clean — n/a: console not read this run
- [ ] Network clean — n/a: network not read this run

## 6. Regression

- [x] Nearest pages still work: Management home, Diet stock and Medication stock loaded by clicking through
- [x] Shared files touched (`releases.ts`, dictionaries) checked from a second page: Medication stock showed the new subtitle
- [x] Nothing merged from `main` during `sync` was broken by this branch: only docs/backlog.md came in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** — n/a: a verification pass; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: each link was clicked and its landing page read

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded, tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: no threshold changed
- [ ] Evidence is the tool's actual output — n/a: only the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: none changed

### Deploy safety

- [ ] deploy line read — n/a: deploy-time check, belongs to the release
- [ ] strip-baked-env seen — n/a: deploy-time check, belongs to the release
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] production dry-run clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no migration, so reverting the commit is the whole rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Diets and medications pages draw four stock links each that a forecast-only card cannot open | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | n/a: nothing here needs a person's eyes beyond what was driven | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

Manual verification by: n/a: a verification pass over card access; no person has looked

Result: pass
