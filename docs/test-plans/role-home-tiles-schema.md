# Feature test plan — role-home-tiles-schema

## Header

| | |
|---|---|
| Feature | Schema half of "Choose each role's home tiles in Settings": table `role_home_tiles`, seeded from today's role cards |
| Backlog item | `docs/backlog.md` → **Choose each role's home tiles in Settings** (left open; the app half closes it) |
| Branch / worktree | `claude/role-home-tiles-schema` @ `C:\Development\Animal_Shelter_role-home-tiles-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | yes — `0225_role_home_tiles.sql` |
| Tested at SHA | `e1a8d509` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) only: a table of (role, page path, position), Admin-written at aal2, audited, seeded so no home changes
- [x] Files/areas touched listed — `supabase/migrations/0225_role_home_tiles.sql`, `scripts/check-role-home-tiles.mjs`, `docs/decisions/2026-10-19-role-home-tiles-schema.md`, this plan
- [x] Roles affected identified — none see a change: nothing reads the table yet
- [x] Anything explicitly **out of scope** written down — Settings panel, tile picker, `NavPane` removal, write function, audit-screen labels (decision file, "What the app half must do")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends clean. Exit codes read from the output file:

```
=== gates: build exited 0 after 199s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs`: ok, `0225` against highest `0224`
- [x] `--status` reviewed before applying — dev 225 applied, 1 pending (this file)
- [x] `--dry-run` reviewed — `0225 … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0225_role_home_tiles.sql … ok`
- [x] File is re-runnable — create-if-not-exists, `or replace`, drop-then-create for policies and triggers, and the seed does nothing once the table has rows
- [x] Existing rows still read correctly — nothing existing was altered; a new table only
- [x] Constraints and defaults exercised against real rows — the seed ran against dev's real `role_cards`; `check-role-home-tiles.mjs` ends `all ok`: card→page map equals `cards.ts` for all 25 cards at both clinical scopes; for every role with cards, in English and Thai, seeded paths in order equal `homeTilesForRoles()` output; Admin and public viewer have no rows; the card-less custom role has none
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: `drop table role_home_tiles` reverts it and nothing reads it
- [x] Production apply plan stated — `0225` with the release; seeds from production's `role_cards`; re-run the check against production's data first (decision file)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this table yet
- [ ] Data persists — n/a: no UI surface; seed rows confirmed by query
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no write path yet; the aal2 and fixed-role refusals are not exercised (listed under manual)
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI input yet
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | table (aal2 to write) | Admin only | n/a — policy copied from `role_cards`; no UI to exercise |
| management | nothing | none | n/a — no UI surface |
| other roles | nothing | none | n/a — no UI surface |
| signed out | nothing | none | n/a — `anon` revoked |

- [ ] Every role above tested — n/a: no UI surface, no code path reads the table
- [ ] A role that should not have access is blocked server-side — n/a: not exercised; policies copied from `role_cards` (`0194`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — nothing app-side changed; build gate green
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, the app half closes it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-19-role-home-tiles-schema.md` (seed source is role_cards not jobs, `home_path`, app half's duties)
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: schema only, no surface a shelter user can reach yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the seed source was found by reading `homeTilesBase` and querying dev's roles and cards; the equality by the check script

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output; gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — with the next release; nothing reads it until the app half

### Rollback

- [x] Rollback position stated — older code ignores the table; no revert needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Brief said to seed from jobs and the curated list; on dev those no longer draw any home (role_cards win), so the seed uses role_cards | fixed — recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Writes by a non-Admin, or by Admin without the authenticator step, are refused; a fixed role is refused | only once the app half has a write path |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — its one item cannot be checked until a write path exists

Manual verification by: n/a: no UI surface, nothing reads the table yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
