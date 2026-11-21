# Feature test plan

## Header

| | |
|---|---|
| Feature | Driven proofs for the per-shelter logo: a transparent PNG through the photo proxy, and a second shelter's public site |
| Backlog item | `docs/backlog.md` → `#shlog` |
| Branch / worktree | `claude/shelter-logo-proof` @ `C:\Development\Animal_Shelter_shelter-logo-proof` |
| Dev server | `http://localhost:3006` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | 4921d4d62 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: proof only plus a decision file; the answer is that Drive's 160px rendition flattens a transparent PNG onto black
- [x] Files touched: `docs/` only; nothing in `src/`, `worker/` or migrations
- [x] Cards affected: none
- [x] Out of scope: any fix to the flattening (needs its own stream)

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

- [x] Happy path works end to end: logo uploaded, saved, reloaded and read back; proxy bytes measured
- [x] Data persists — the card read "Replace logo" after a reload and the column held the id
- [ ] Create / edit / delete all exercised — n/a: upload only; replace and remove were not pressed
- [x] Empty state renders sensibly — the second shelter shows its name with no image
- [x] Invalid input is rejected with a readable message — the second shelter's upload was refused: "Photo storage is not connected"
- [ ] Boundary cases checked — n/a: no code changed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (dev-signin), both shelters | /admin/website | logo card present | driven |

- [ ] Every login above tested — n/a: only Admin was driven; no card-only login pressed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav
- [ ] Manual updated — n/a: no behaviour changed
- [ ] Translatable strings go through the dictionaries — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI changed
- [ ] Browser console clean — n/a: no UI changed
- [ ] Network clean — n/a: no UI changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing in src changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken — see the PR body

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` (`#shlog`)
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-21-shelter-logo-driven-proof.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: the logo card was already noted by #1790; nothing a user sees changed here
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: bytes read with sharp, not eyeballed

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
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

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

- [ ] Rollback position stated — deferred: release manager; nothing shipped

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | a transparent PNG logo is flattened onto black by the 160px photo rendition, a black square on the public header | deferred to backlog: needs its own stream, planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing further: the black box is already shown by the proof | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [ ] Manual verification: n/a: no screen changed by this PR

Manual verification by: n/a: proof only, no code changed

Result: pass with accepted defects
