# Feature test plan

## Header

| | |
|---|---|
| Feature | Per-shelter calendar credentials: schema half |
| Backlog item | `docs/backlog.md` → `#calsh` |
| Branch / worktree | `claude/calendar-per-shelter-schema` @ `C:\Development\Animal_Shelter_calendar-per-shelter-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | yes |
| Tested at SHA | 9156ebc83 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a service-role-only table holding each shelter's Google Calendar credentials and calendar id as ciphertext, plus its decision record
- [x] Files/areas touched listed: `supabase/migrations/0409_shelter_calendar_credentials.sql`, decision file, backlog note, this plan
- [x] Cards affected identified: none; no login holds any grant on the table; admin and public unaffected
- [x] Out of scope written down: everything under `src/` (reader, refusal, sweep, poll, status RPC) belongs to the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck exited 0 after 64s
=== gates: lint exited 0 after 366s
=== gates: test exited 0 after 99s
=== gates: build exited 1 after 152s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1

build=1: next/font could not fetch Fraunces and Geist from Google Fonts (this machine had no route to fonts.googleapis.com or registry.npmjs.org); a second `npx next build` failed the same way. No source file changed in this PR. CI runs the build with network.
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0409; 0408 is carried by `scheduled-writer-visibility`), check-migration-numbers ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) on 2026-11-18 about 01:55 UTC and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `drop policy if exists`)
- [ ] Existing rows still read correctly — n/a: new empty table, no existing rows
- [x] Constraints and defaults exercised in a `begin; … rollback;` harness on dev, result `ALL ASSERTIONS HELD (policies=4)`: a second shelter on an already-used calendar id is refused; two rows with no calendar id are accepted; a second row for one shelter is refused; `token_status='bogus'` is refused and the default is `unchecked`; `authenticated` and `anon` get `insufficient_privilege` reading, and `authenticated` writing; deleting a shelter cascades its row; exactly four policies exist
- [ ] Down-migration written — n/a: undo is `drop table shelter_calendar_credentials`, in the file header
- [x] Production apply plan: `0409_shelter_calendar_credentials.sql` to project `dbkodyyxxhtygxcxmfcu` with the next release; nothing reads it yet

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI or code reads the table yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface; the database-level rejections are in section 3
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin included | nothing | no grant on the table | n/a: no UI surface; refusal asserted for authenticated and anon in section 3 |

- [x] Every login above tested: the two database roles logins run as, in the section 3 harness
- [x] A login that should not have access is blocked server-side: `insufficient_privilege` on select and insert, asserted in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user sees
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks still pass, run on dev: `check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer` 0 flagged and 0 stale; `check-card-grants.mjs` all passed; `check-tenancy-shared-tables.mjs` 114 scoped, 12 unscoped, 12 recorded (then the known libuv assertion); `check-card-catalogue-writes.mjs --env test` ok
- [ ] Any shared file touched checked from a second page — n/a: no source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item note added in `docs/backlog.md` on this branch (item left open: app half)
- [x] Design choices in `docs/decisions/2026-11-18-per-shelter-calendar-credentials.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: schema only; a shelter connects its own calendar in the app half
- [x] Commit messages say why, not just what
- [x] Claims were measured: the lint, the checks and the harness are live dev runs; the key's absence from `.env.local` was grepped

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
- [ ] Any new secret/env var exists in production — n/a: none read yet; the app half reuses `DRIVE_CREDENTIALS_KEY`

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no code reads the table yet
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive new table
- [ ] Apply plan stated: file 0409 to production with the release — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: drop the empty table

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 2 | medium | Build gate exited 1 here: Google Fonts and the npm registry were unreachable from this machine; no source changed | accepted: CI's build is the evidence
| 1 | low | check-tenancy-shared-tables.mjs ends with a libuv assertion on Windows after printing its result | accepted: known artefact, not touched |

## Left for manual verification

Nothing a person needs to look at.

Automated checks by: Claude  Date: 2026-11-18
Manual verification by: n/a: no UI surface

Result: pass with accepted defects
