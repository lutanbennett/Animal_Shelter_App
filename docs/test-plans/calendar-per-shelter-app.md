# Feature test plan

## Header

| | |
|---|---|
| Feature | Per-shelter calendar: reader and refusal (app half) |
| Backlog item | `docs/backlog.md` → `#calsh` |
| Branch / worktree | `claude/calendar-per-shelter-app` @ `C:\Development\Animal_Shelter_calendar-per-shelter-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | cafa8d42b |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the clinic-visit sweep sends each visit to its own shelter's calendar and refuses a non-Lanna shelter with none; `calendar-sync.ts` reads no `GOOGLE_*` itself
- [x] Files/areas touched listed: `src/lib/clinics/calendar-sync.ts`, `src/lib/google/shelter-calendar-decide.ts`, `shelter-calendar-credentials.ts`, its test, `eslint.config.mjs`, `docs/hard-coded-security-registry.json`, decision file
- [x] Cards affected identified: none; this picks which calendar the server writes to and grants no access; admin and public unaffected
- [x] Out of scope written down: the Admin status RPC (needs a migration), the screen to connect a calendar, and the poll, import and status tile for other shelters

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck exited 0 after 17s
=== gates: lint exited 0 after 195s
=== gates: test exited 0 after 43s
=== gates: build exited 0 after 93s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip if no migration

- [ ] Migration number is one above the highest on `main` — n/a: no migration; 0409 was the schema half
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works: unit test shows a shelter with its own row resolves to its own calendar and decrypted token
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is refused: a shelter with no or an incomplete row is not_configured, a dead token is dead
- [x] Boundary cases checked: Lanna with no row keeps the environment; an incomplete row is refused even for Lanna; no shelter key is refused

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login | n/a | no new page or control | n/a: server-side sweep only, no UI |

- [ ] Every login above tested — n/a: no UI surface
- [ ] A login that should not have access is blocked server-side — n/a: grants no access

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user sees
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks still pass: `check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`; typecheck and lint clean
- [ ] Any shared file touched checked from a second page — n/a: the poll, import and status tile keep their default of the environment calendar, unchanged in behaviour; not loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: `#calsh` stays open: no screen yet lets a shelter connect a calendar, and the Admin RPC, poll and import remain
- [x] Design choices in `docs/decisions/2026-11-18-per-shelter-calendar-app.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no shelter can connect its own calendar yet (no save screen), so nobody would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: the tests, gates and security check are live runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change assertions — n/a: no banding change
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block, pasted from the run
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none new; reuses `DRIVE_CREDENTIALS_KEY`

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: code reads 0409's table, which is already applied to dev; production gets 0409 with the release, and the reader only queries it for a shelter, with Lanna falling back to the environment
- [ ] `--dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; the table stays empty

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The poll, import and status tile still read only Lanna's calendar | accepted: for the planner to file |

## Left for manual verification

Nothing a person needs to look at.

Automated checks by: Claude  Date: 2026-11-18
Manual verification by: n/a: no UI surface

Result: pass with accepted defects
