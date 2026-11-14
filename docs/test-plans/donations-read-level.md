# Feature test plan — donations-read-level

## Header

| | |
|---|---|
| Feature | Decide whether `donation.receipt` becomes levelled; decision: leave it yes/no, no code change |
| Backlog item | `docs/backlog.md` → **`donation.receipt` is a yes/no activity** (`#v3qlt`, ticked as settled by not changing) |
| Branch / worktree | `claude/donations-read-level` @ `C:\Development\Animal_Shelter_donations-read-level` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence: a decision file and a backlog tick recording that `donation.receipt` stays yes/no
- [x] Files/areas touched listed — `docs/decisions/2026-11-14-donations-read-level.md`, `docs/backlog.md`, this plan
- [x] Cards affected identified — none: `donations_receipts` and `run_appeals` unchanged; admin and signed-out unaffected
- [x] Out of scope written down — no new activity, card, migration or caller change; a separate totals activity is left for the day a shelter asks

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: docs-only change, run in the finishing sequence
- [ ] `node scripts/gates.mjs` — n/a: no code, schema or dictionary changed; only docs files differ from `main`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration
- [ ] Down-migration — n/a: no migration, nothing to undo
- [ ] Production apply plan — n/a: no migration, production unaffected

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface changed
- [ ] Data persists — n/a: no UI surface changed
- [ ] Create / edit / delete — n/a: no UI surface changed
- [ ] Empty state — n/a: no UI surface changed
- [ ] Invalid input — n/a: no UI surface changed
- [ ] Boundary cases — n/a: no UI surface changed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | n/a — no access rule changed |
| exactly `donations_receipts` | `/management/donations` | unchanged | n/a — no access rule changed |
| exactly `run_appeals` | `/management/campaigns` | unchanged | n/a — no access rule changed |
| signed out | nothing | unchanged | n/a — no access rule changed |

- [ ] Every login above tested — n/a: no policy, grant, catalogue or card changed
- [ ] A login that should not have access is blocked — n/a: nothing changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings added, so no Thai to review
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages still work — n/a: no code differs from `main`
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [ ] Nothing merged from `main` during sync was broken — n/a: docs-only branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#v3qlt`, with the reason in the tick
- [x] Non-obvious design choices in `docs/decisions/2026-11-14-donations-read-level.md`
- [x] `README.md` still accurate — it does not describe this activity
- [ ] **Release notes.** n/a: no shelter user would notice, nothing visible changed
- [x] Commit messages say why, not just what
- [x] Claims in the decision were measured: caller list from `grep -rln "donation.receipt"` across `src/`, `scripts/`, `supabase/migrations`; cards read in `cards.ts`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager
- [ ] Boundary or banding change — deferred: release manager
- [ ] Evidence is unedited tool output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy:` ref line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — deferred: release manager
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing — no surface changed | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-14

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no surface changed, nothing for a person to look at

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none
- [ ] Checklist pasted into the PR — pending: PR does not exist at this commit
- [ ] Handed to the production release manager — pending: after merge

Result: pass
