# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Record why the per-shelter export proof's catalogue rebuild is sufficient, and its limit |
| Backlog item | `docs/backlog.md` → `#expgp` |
| Branch / worktree | `claude/shelter-export-proof` @ `C:\Development\Animal_Shelter_shelter-export-proof` |
| Dev server | not started — no rendered surface |
| PR | see PR |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a decision file recording in checkable terms why the catalogue rebuild is sufficient, plus a header comment in `scripts/shelter-export.mjs`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/decisions/2026-11-18-export-proof-catalogue-rebuild.md`, a comment in `scripts/shelter-export.mjs`, `docs/backlog.md` tick, this plan
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — `n/a: no code path changes; a script comment and documents only`
- [x] Anything explicitly out of scope written down — out of scope: staff logins (Lutan answered "data only" 2026-11-17), building a migrations-based proof

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`
- [ ] CI green on the PR — `pending: merged only on full green against this head commit`

## 3. Schema and data — *skip if no migration*

Skipped: no migration.

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration`
- [ ] Constraints and defaults exercised against real rows — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: comment and documents only, nothing executes differently`
- [ ] Data persists — `n/a: no stored data`
- [ ] Create / edit / delete all exercised — `n/a: no feature surface`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no fields`

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: repository documents, not served by the app |
| exactly `<no card applies>` | n/a | n/a | n/a: no card governs reading repository files |
| signed out | n/a | n/a | n/a: nothing from `docs/` is served |

- [ ] Every login above tested — `n/a: not reachable from the app`
- [ ] A login that should not have access is blocked server-side — `n/a: no URL exists for these files`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: internal tooling documentation`
- [ ] Translatable strings — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: nothing loaded in a browser`
- [ ] Network clean — `n/a: no pages`

## 6. Regression

- [x] The pages nearest the change still work — none exist; the script's only change is a comment line
- [x] Any shared file touched checked from a second page — no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#expgp` ticked, with a note pointing to the decision file
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-18-export-proof-catalogue-rebuild.md`
- [x] `README.md` still accurate — unchanged and not affected
- [ ] Release notes. Would a shelter user notice this change? — `n/a: internal export tooling documentation; nothing a shelter user sees`
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were read from the code (`insertSql` names its columns; `schemaSql` reads the live catalogue), not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: release manager — nothing deployed here`
- [ ] Timezone-sensitive behaviour proved — `deferred: release manager — no date logic`
- [ ] For a boundary or banding change, assertions cover both edges — `deferred: release manager — no banding change`
- [ ] Evidence pasted into this plan is the tool's actual output — `deferred: release manager`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `deferred: release manager`
- [ ] `strip-baked-env` seen in the deploy output — `deferred: release manager`
- [ ] Any new secret/env var exists in production — `deferred: release manager — none added`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — `deferred: release manager — neither`
- [ ] Production dry-run clean — `deferred: release manager — no migration`
- [ ] Destructive migration backup fresh — `deferred: release manager — no migration`
- [ ] Apply plan stated — `deferred: release manager — none`

### Rollback

- [ ] Rollback position stated — `deferred: release manager — revert the PR; no deploy-side effect`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The proof cannot show triggers, defaults or RLS firing during a load into a migrations-built database | accepted — recorded in the decision file with the mitigation |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | no surface |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `n/a: the list is empty, nothing to look at`

Manual verification by: n/a: no surface to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — recorded by being in the PR

Result: pass with accepted defects

Release manager acknowledgement: pending: not required, docs-only
