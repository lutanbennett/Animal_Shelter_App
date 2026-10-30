# Feature test plan — record-death-schema

## Header

| | |
|---|---|
| Feature | Schema half of retiring Record a death: `placement.death` joins Manage medical, the `record_death` card is deleted |
| Backlog item | `docs/backlog.md` → **RETIRE THE RECORD A DEATH CARD AND FOLD RECORDING A DEATH INTO MANAGE MEDICAL** (left open: app half outstanding) |
| Branch / worktree | `claude/record-death-schema` @ `C:\Development\Animal_Shelter_record-death-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — `0282_record_death_folded_into_manage_medical.sql` |
| Tested at SHA | `a80c2f8d` |

## 1. Scope and risk

- [x] Change is described in one sentence — the card_grants half of option B: grant `placement.death` to `medical_records` and delete `record_death`
- [x] Files/areas touched listed — `supabase/migrations/0282_*.sql`, `docs/decisions/2026-10-30-record-death-folded-into-manage-medical.md`, this plan
- [x] Roles affected identified — by card: whoever holds `record_death` loses placement.death until Lutan assigns `medical_records` in Settings → Who does what; he chose this
- [x] Out of scope written down — all of `src/`, the walkthrough, the manual and every check script are the app half's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main`
- [x] `node scripts/gates.mjs` ends with all four exits 0 (see PR body for the output)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `check-migration-numbers`: ok, 0282 against 0281
- [x] `--status` reviewed before applying — dev 282 applied, 0 pending, no drift
- [x] `--dry-run` reviewed — `0282 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — `applying 0282_record_death_folded_into_manage_medical.sql … ok`
- [x] File is re-runnable — inserts use `on conflict`, the rest are `delete … where`
- [x] Existing rows still read correctly — `card-grants-applied`: every held card is fully applied wherever it is held
- [x] Constraints exercised in a `begin; … rollback;` harness: `medical_records` → `placement.death` at level 2 (edit) and `facility.enclosures` ≥ read; `record_death` → 0 activities; no rows left in `card_grants`/`card_includes`/`card_features`; role_permissions recomputed. Result: PASS (rolled back); no `zz_h_` roles left behind
- [x] Down-migration not needed — a retirement; the card can be re-created by a new migration, and no data is lost (cards hold no data)
- [x] Production apply plan — apply 0282 with the app half's release, never before; `check-production.mjs card-grants-applied` after

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface; the app half carries it
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `medical_records` | placement.death edit, enclosures read | granted | PASS in harness |
| `record_death` | anything | nothing (card gone) | PASS in harness |
| Admin | everything | unchanged | n/a — answered by `key = 'admin'` in `has_permission()`, not touched; not asserted by the harness |

- [ ] Every role above tested — n/a: assessed by card in the harness; no UI
- [ ] Blocked server-side — n/a: no new access rule, only a grant moved

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: app half's
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest checks still work — `card-lifecycle-enclosures` and `card-grants-applied` green on test
- [ ] Shared file touched checked from an unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately open; the app half and Lutan's card assignment remain
- [x] Decision recorded — `2026-10-30-record-death-folded-into-manage-medical.md`
- [x] `README.md` still accurate — it does not list cards
- [ ] **Release notes.** — n/a: the schema half only; recording a death does not move until the app half ships and Lutan assigns the cards
- [x] Commit messages say why
- [x] Claims were measured — harness and check output, not reasoned

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
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and reading code in one PR? — no; `-- consumer: src/lib/permissions/cards.ts`, which is the app half. Until it lands, `check-card-grants.mjs` is red locally by design
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: deletes only card-assignment rows, re-assignable in Settings
- [x] Apply plan stated — with the app half's release

### Rollback

- [x] Rollback position — code rollback does not revert 0282; to undo, a new migration re-inserts the card; the old code would then simply see a card with no holders

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | `check-card-grants.mjs` red against dev (card_grants vs cards.ts) | accepted — expected until the app half edits cards.ts; cannot run in CI |
| 2 | info | Investigation 2 (edit controls on /residents) not driven: the one-card login can no longer exist | deferred to the app half, written in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
