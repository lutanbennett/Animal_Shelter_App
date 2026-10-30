# Feature test plan — record-death-app

## Header

| | |
|---|---|
| Feature | App half of retiring Record a death: `cards.ts` matches 0282, `placement.death` is in Manage medical |
| Backlog item | `docs/backlog.md` → **RETIRE THE RECORD A DEATH CARD AND FOLD RECORDING A DEATH INTO MANAGE MEDICAL** (ticked: both halves done) |
| Branch / worktree | `claude/record-death-app` @ `C:\Development\Animal_Shelter_record-death-app` |
| Dev server | http://localhost:3001 |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no — 0282 merged in #1088 |
| Tested at SHA | `72350e00` |

## 1. Scope and risk

- [x] Change is described in one sentence — delete `record_death` from `cards.ts` and add `placement.death` to the `medical_records` bundle
- [x] Files/areas touched listed — `cards.ts`, both dictionaries, `card-walkthrough.md`, `check-cards-count.mjs`, `ResidentHub.tsx` (a comment), `releases.ts` (one old note's card tag), backlog, decision file
- [x] Roles affected identified — by card: whoever held `record_death` loses the activity until Manage medical is assigned (Lutan's choice)
- [x] Out of scope written down — no migration, nothing applied to production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main`
- [x] `node scripts/gates.mjs` ends with all four exits 0 (see PR body)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded — n/a: 0282 already applied by #1088
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: 0282 goes out with the release in which Lutan assigns the cards

## 4. Functional checks

- [x] Happy path — a login holding only `medical_records` sees the Manage medical tile and a resident hub with Record death
- [ ] Data persists — n/a: the death write itself was not pressed (disposable-data rule; action checks unchanged)
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: no UI surface changed
- [ ] Invalid input — n/a: no form changed
- [ ] Boundary cases — n/a: none

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `medical_records` only | `/residents`: Download, Log immunizations, Book clinic visit; no New resident, no row pencil | only what the card can do | PASS |
| `medical_records` only | hub: Record death, Send to hospital, medical Add/Log buttons; no Edit/Move/Foster/Adopt | only what the card can do | PASS |
| Admin | everything | unchanged | n/a: `perms.isAdmin` short-circuit, not touched |

- [x] Every card above tested — one-card login `--cards medical_records`
- [ ] Blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: none changed
- [x] Manual updated — checked: the Recording a death topic is keyed by `placement.death`, names no card, so nothing to fold
- [x] Translatable strings — retired card strings removed from en and th
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not inspected
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] Nearest checks still work — `check-card-grants` (all passed), `check-card-walkthrough`, `check-cards-count`
- [ ] Shared file touched checked from an unrelated page — n/a: `releases.ts` one tag only, typechecked
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked — both halves done
- [x] Decision recorded — `2026-10-30-record-death-app-half.md`
- [x] `README.md` still accurate — it does not list cards
- [ ] **Release notes.** — n/a: 0282 is not on production yet — the note belongs to the release that applies it and in which Lutan assigns the cards
- [x] Commit messages say why
- [x] Claims were measured — check output and a driven one-card login

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: public site unaffected

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? — n/a: no migration here; 0282 must be applied with this code
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: no migration here
- [ ] Apply plan stated — 0282 with this release

### Rollback

- [x] Rollback position — reverting this code leaves 0282 applied, so `check-card-grants` would go red again; revert only with a migration

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | `tsc` reports missing `PageProps`/`LayoutProps` globals in untouched files | accepted — pre-existing, not from this change |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none beyond the owed Lutan decision: where should a recorded death show afterwards (walkthrough TODO) | card walkthrough, Manage medical step 12 |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty — empty: nothing needs a person's eyes

Manual verification by: n/a: driven by Claude on a one-card dev login; no person looked

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
