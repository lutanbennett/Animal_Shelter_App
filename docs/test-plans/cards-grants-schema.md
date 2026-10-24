# Feature test plan — cards-grants-schema

## Header

| | |
|---|---|
| Feature | Schema half of "a card gives the access it needs": `card_grants`, `card_includes`, in-database recompute of `role_permissions`, `set_role_cards` ignores the bundle |
| Backlog item | `docs/backlog.md` → **URGENT, LIVE ON PRODUCTION: a card given to a role does not reliably give that role the access the card needs** (left open, schema-half note added on the backlog branch) |
| Branch / worktree | `claude/cards-grants-schema` @ `C:\Development\Animal_Shelter_cards-grants-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | yes — `0257_card_grants.sql` |
| Tested at SHA | `37d9b9a4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a role's `role_permissions` becomes exactly the union of what its cards require, derived by the database from `card_grants`, however the card was given
- [x] Files/areas touched listed — `supabase/migrations/0257_card_grants.sql`, `scripts/check-card-grants.mjs`, `docs/decisions/2026-10-24-cards-grants-in-the-database.md`, this plan. Nothing in `src/`
- [x] Roles affected identified — every non-fixed role is recomputed. Management, Staff (retired), Doctor and the 2IC lose access no card requires; Head of Medical and the Volunteer should gain what their cards need. Admin and the public viewer are untouched
- [x] Anything explicitly **out of scope** written down — the app half (cards.ts reading the grants, dropping Also allowed, the coverage check), dropping `role_extras`, and the remaining hard-coded rules. **Production is not fixed until `0257` is applied there**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends with all gates 0. Exit codes read directly from the script's own output:

```
=== gates: build exited 0 after 283s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0257` after `0256`; the migration-number check passed on commit; this is the only schema branch in flight
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 257 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok` (one warning: the declared consumer `scripts/check-card-grants.mjs` was not yet on origin/main, which is the safe direction)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0257_card_grants.sql … ok`; 68 `card_grants` rows and 3 `card_includes` rows read back
- [x] File is re-runnable — `create … if not exists`, `or replace`, `drop trigger/policy if exists`, seeds `on conflict do nothing`. Not run a second time against dev
- [x] Existing rows still read correctly after the change — every real dev role recomputed; `check-card-grants.mjs` part 1 proves each of 20 roles equals the union of its cards' grants, worked out independently in JavaScript
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`scripts/check-card-grants.mjs`). Asserted: seed equals cards.ts (68 rows, 3 edges); a direct insert into `role_cards` grants exactly the card's access; an included card flows with the higher level winning; adding, raising and deleting a `card_grants` row reaches every holder; `role_extras` is ignored; a direct delete from `role_cards` removes the access; `p_bundle` is ignored; fixed roles hold no cells before or after and Admin has a login; the photo-approver refusals (no approver; last approver; retired role) still refuse with their messages. Result: all passed, rolled back, no harness roles left
- [x] Down-migration written, or the reason one is not needed is stated — not needed to be safe: additive tables and triggers; old app code keeps working because `set_role_cards` keeps its signature. Restoring lost access means re-giving cards, not a down file
- [x] Production apply plan stated for the release manager — `0257` on `dbkodyyxxhtygxcxmfcu` at release, by Lutan; **it removes access** (the list is in the audit log afterwards, query in the decision file), and the apply tool does not print the per-role NOTICEs

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; behaviour proved in §3's harness
- [ ] Data persists — n/a: no UI surface; rows read back after apply
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, update and delete of grants and role_cards exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; database refusals asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; a role with no cards, and the last approver, are in §3's harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged (fixed role, no cells) | harness: no fixed role holds a cell before or after; an Admin login exists |
| management | pages its cards open | loses access no card requires | n/a — not signed in as; cells compared in harness |
| staff | retired | loses extras | n/a — retired |
| doctor | pages its cards open | loses extras | n/a — not signed in as |
| volunteer | pages its cards open | gains what its cards need | n/a — not signed in as; dev already covered |
| signed out | nothing | nothing | n/a — public viewer is fixed and untouched |

- [ ] Every role above tested — n/a: no UI surface; every role's cells were compared with its cards in §3's harness
- [ ] A role that should not have access is blocked server-side — n/a: no page rule written; writes to the new tables are Admin at 2-step (same policies as role_cards)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader; has_permission() and every policy still read `role_permissions`, whose shape is unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; a SCHEMA HALF DONE note goes on the backlog branch, the app half remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-cards-grants-in-the-database.md`
- [x] `README.md` still accurate — it does not describe cards' bundles
- [ ] **Release notes.** — n/a: the note goes in the PR that closes the production apply
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the dev loss list came from the audit log; the production list is explicitly not claimed, and the Management API dropping NOTICEs was observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates output above is unedited; no deploy output yet
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the app half is a separate PR. Old code keeps working with the new database (same `set_role_cards` signature, `role_extras` still exists)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — deferred: release manager; it rewrites role_permissions and removes access
- [x] Apply plan stated — `0257` on production at release, Lutan's step; read the removed list from the audit log afterwards

### Rollback

- [x] Rollback position stated — code rollback does not revert `0257`; to restore lost access give the role the card that needs it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `check-cards-schema.mjs` will disagree with the database for roles that held extras | deferred to backlog: the app half retires it; `check-card-grants.mjs` replaces it |
| 2 | low | `card_grants` is not in `AUDITED_TABLES` so Recent changes shows it unlabelled | deferred to backlog: needs `src/`, the app half |
| 3 | info | Per-role NOTICEs are not returned by the apply tool | accepted: same facts are in `audit_log`, query in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After production apply: read the removed/added list from `audit_log` and decide which cards to give back | Supabase SQL editor, query in the decision file |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1 is for after the production apply

Manual verification by: pending: Lutan, after the production apply

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
