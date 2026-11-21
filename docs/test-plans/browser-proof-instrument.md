# Feature test plan

## Header

| | |
|---|---|
| Feature | Streams can drive a browser proof: CLAUDE.md names headless Chrome (playwright-core) with a helper that signs it in from dev-signin, and records why the pane failed |
| Backlog item | `docs/backlog.md` → `#bprf7` |
| Branch / worktree | `claude/browser-proof-instrument` @ `C:\Development\Animal_Shelter_browser-proof-instrument` |
| Dev server | `http://localhost:3002` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | 15b444361 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: CLAUDE.md names the instrument that works for pressing things, with the one command, and the pane failure is diagnosed
- [x] Files touched: `CLAUDE.md` (dev-session section), `scripts/lib/driven-session.mjs` (new), `docs/`; nothing in `src/`, `worker/`, migrations or `dev-signin.mjs`
- [x] Cards affected: none
- [x] Out of scope: CI browser proofs, a pane relay, any change to dev-signin

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` ends with the four exit codes — see the PR body for the pasted line
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: helper signed headless Chrome in as management on :3002, filled Other names on a resident edit page, pressed Save changes (POST 200), reloaded and read the value back
- [x] Data persists — reload showed the saved value, then the original was restored and read back
- [ ] Create / edit / delete all exercised — n/a: tooling; one edit save driven
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected with a readable message — the browser blocked submit on a required empty select until it was set (found while driving; noted in CLAUDE.md)
- [ ] Boundary cases checked — n/a: no input handling added

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| management (dev-signin) | /my, /residents edit | signed in, save works | driven |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side — n/a in effect: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav
- [ ] Manual updated — n/a: developer tooling, not shelter manual
- [ ] Translatable strings go through the dictionaries — n/a: no user strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI surface changed
- [ ] Network clean — n/a: no UI surface changed

## 6. Regression

- [x] The pages nearest the change still work — dev-signin unchanged and still prints its snippet
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` (`#bprf7`)
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-21-driving-a-browser-proof.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: tooling and docs only; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the 180-character loss and the save read-back were run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no banding
- [ ] Evidence pasted into this plan is the actual tool output, unedited — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; no schema changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | the pane cause is measured on one paste only; whether a faithful paste holds 50 minutes is not established | accepted: stated in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing a person needs to look at: no screen changed | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [ ] Manual verification: n/a: no screen a shelter user opens changed

Manual verification by: n/a: no UI surface, tooling and docs only

Result: pass
