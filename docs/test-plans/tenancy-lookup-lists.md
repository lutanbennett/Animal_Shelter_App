# Feature test plan

## Header

| | |
|---|---|
| Feature | Seven lookup lists per shelter |
| Backlog item | `docs/backlog.md` → `#lklst` |
| Branch / worktree | `claude/tenancy-lookup-lists` @ `C:\Development\Animal_Shelter_tenancy-lookup-lists` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | yes |
| Tested at SHA | 32ef5b25d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the seven shelter-chosen lookup lists gain `shelter_id`, scoped policies and per-shelter unique keys
- [x] Files/areas touched listed: `supabase/migrations/0403_lookup_lists_per_shelter.sql`, `docs/tenancy-shared-tables-registry.json`, backlog, decision file
- [x] Cards affected identified: none change; the filter is by shelter, not card; admin and public unaffected on one-shelter production
- [x] Out of scope written down: no app code changed; role/permission tables belong to `tenancy-part10-shelter-roles`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck exited 0 after 19s
=== gates: lint exited 0 after 149s
=== gates: test exited 0 after 51s
=== gates: build exited 1 after 64s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1

[exited with code 0]

build=1 above is the known Next advisory halt (SecurityFatalError, docs/decisions/2026-11-17-next-agent-upgrade-halt.md); npx next build run alone straight after exited 0.
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one (check-migration-numbers ok for 0403)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `drop … if exists` / `create or replace`)
- [x] Existing rows still read correctly after the change (all stamped Lanna; null count checked inside the migration)
- [x] Constraints and defaults exercised in a rolled-back harness: same-name row in a second shelter accepted; shelter-one session saw 0 of shelter two's rows and edited 0; shelter two's cost stayed 999, Lanna's 250
- [ ] Down-migration written — n/a: undo steps are in the file header (drop policies, restore old keys, drop column)
- [x] Production apply plan: `0403_lookup_lists_per_shelter.sql` to project `dbkodyyxxhtygxcxmfcu`, before or with the deploy; app code unchanged

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; the pages read the same rows for the one shelter
- [ ] Data persists — n/a: no UI change
- [ ] Create / edit / delete all exercised — n/a: no UI change; inserts rely on the column default
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected — n/a: no UI change
- [ ] Boundary cases checked — n/a: covered by the harness in section 3

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | lookup admin pages | unchanged | n/a: not browsed, no UI change |

- [ ] Every login above tested — n/a: no UI change
- [ ] A login that should not have access is blocked server-side — n/a: no permission change; the shelter filter was proved in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour a user sees
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: not browsed; policies and defaults checked by catalogue lint (0 flagged, 0 stale) and the export proof
- [ ] Any shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices in `docs/decisions/2026-11-17-per-shelter-lookup-lists.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: one shelter exists, so nobody sees a different list of options
- [x] Commit messages say why, not just what
- [x] Claims were measured: counts and harness output come from live dev runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no banding change
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block, pasted unedited
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: the PR carries no code that reads the new column
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive column, unique keys swapped in one file
- [ ] Apply plan stated: file 0403 to production before the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: schema change is additive; the old unique keys are restorable per the file header

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | check-tenancy-shared-tables.mjs ends with a libuv assertion on Windows after printing its result | accepted: not touched, brief forbids editing the check |

## Left for manual verification

Nothing a person needs to look at.

Automated checks by: Claude  Date: 2026-11-17
Manual verification by: n/a: no UI surface

Result: pass
