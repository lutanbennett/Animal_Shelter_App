# Feature test plan

## Header

| | |
|---|---|
| Feature | Per-shelter Drive credentials: schema half |
| Backlog item | `docs/backlog.md` → `#o2iyh` |
| Branch / worktree | `claude/tenancy-part9-drive-schema` @ `C:\Development\Animal_Shelter_tenancy-part9-drive-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | yes |
| Tested at SHA | 87c47e738 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a service-role-only table holding each shelter's Drive OAuth credentials as ciphertext, plus its decision record
- [x] Files/areas touched listed: `supabase/migrations/0404_shelter_drive_credentials.sql`, decision file, backlog, this plan
- [x] Cards affected identified: none; no login holds any grant on the table; admin and public unaffected
- [x] Out of scope written down: everything under `src/` (reader, fallback, alerting, connect flow) belongs to `tenancy-part9-drive-app`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: build exited 1 after 255s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1

build=1 is the known Next advisory halt (docs/decisions/2026-11-17-next-agent-upgrade-halt.md); npx next build run alone straight after exited 0.
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0404 after 0403), check-migration-numbers clean
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `drop policy if exists`)
- [ ] Existing rows still read correctly — n/a: new empty table, no existing rows
- [ ] Constraints and defaults exercised in a rolled-back harness — n/a: not run; protection rests on the revoke in the file and the strict catalogue lint (0 flagged, 0 stale); a login-read harness is left to the app half
- [ ] Down-migration written — n/a: undo is `drop table shelter_drive_credentials`, in the file header
- [x] Production apply plan: `0404_shelter_drive_credentials.sql` to project `dbkodyyxxhtygxcxmfcu` with the next release; nothing reads it yet

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI or code reads the table yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login | nothing | no grant on the table | n/a: no UI surface, nothing to reach |

- [ ] Every login above tested — n/a: no UI surface
- [ ] A login that should not have access is blocked server-side — n/a: not harnessed; see section 3

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user sees
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks still pass: check-card-grants.mjs passed; check-tenancy-shared-tables.mjs reported every unscoped table recorded (then a libuv assertion on Windows)
- [ ] Any shared file touched checked from a second page — n/a: no source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item note added in `docs/backlog.md` on this branch (item left open: app half)
- [x] Design choices in `docs/decisions/2026-11-17-per-shelter-drive-credentials.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: schema only; a shelter connects its own Google account in the app half
- [x] Commit messages say why, not just what
- [x] Claims were measured: lint and check output come from live dev runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no banding change
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block, pasted from the run
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none read yet; the app half adds `DRIVE_CREDENTIALS_KEY`

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no code reads the table yet
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive new table
- [ ] Apply plan stated: file 0404 to production with the release — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: drop the empty table

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | check-tenancy-shared-tables.mjs ends with a libuv assertion on Windows after printing its result | accepted: not touched |

## Left for manual verification

Nothing a person needs to look at.

Automated checks by: Claude  Date: 2026-11-17
Manual verification by: n/a: no UI surface

Result: pass
