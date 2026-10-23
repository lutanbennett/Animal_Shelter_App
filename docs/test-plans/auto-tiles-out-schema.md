# Feature test plan — auto-tiles-out-schema

## Header

| | |
|---|---|
| Feature | Schema half of removing the automatic home tiles: seeds `role_cards` with the cards that keep the tiles Lutan chose, so the app half can delete the code that added them |
| Backlog item | `docs/backlog.md` → **URGENT, LIVE ON PRODUCTION: the Volunteer home shows an Operations tile nobody chose** (left open: the app half is the next PR) |
| Branch / worktree | `claude/auto-tiles-out-schema` @ `C:\Development\Animal_Shelter_auto-tiles-out-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | #881 |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | yes — `0251_seed_cards_for_removed_automatic_tiles.sql` |
| Tested at SHA | tip of `claude/auto-tiles-out-schema` (cut from `origin/main` `96b4ba8b`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — inserts the `role_cards` rows for the tiles Lutan chose to keep, none for Operations or Management
- [x] Files/areas touched listed — `supabase/migrations/0251_seed_cards_for_removed_automatic_tiles.sql`, `docs/decisions/2026-10-23-seed-cards-for-removed-automatic-tiles.md`, this plan
- [x] Roles affected identified — volunteer, head_of_maintenance, head_of_medical, management, second_in_command gain cards; no role's cells change
- [x] Anything explicitly **out of scope** written down — the code removal, the two new cards and the unit test are the app PR; the production apply and deploy are Lutan's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from `origin/main` `96b4ba8b` minutes earlier, nothing to merge
- [x] `node scripts/gates.mjs` ends green, exit codes read from its own output:

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [x] CI green on the PR — every check on #881 passed except `test-plan`, which was red only for this line; read from `gh pr checks 881`

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0251` against highest `0250` on `origin/main`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 251 applied, 1 pending, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0251_seed_cards_for_removed_automatic_tiles.sql … ok`; `--status` lists it as applied here
- [x] File is re-runnable — `on conflict (role_id, card) do nothing`
- [x] Existing rows still read correctly after the change — `check-home-cards.mjs` before and after: every role's `role_permissions` hash identical, 0 `FAIL` lines
- [x] Constraints and defaults exercised against real rows — the insert ran against the real dev roles; the unique key and the fixed-role guard are the only constraints and the insert joins `roles.kind <> 'fixed'`
- [x] Down-migration written, or the reason one is not needed is stated — the file header says how to revert: delete the listed card/role pairs
- [x] Production apply plan stated — before the app half deploys; roles are matched by key so a missing role is skipped

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing reads these rows differently until the app PR
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | pages | unchanged | permissions hashes identical before and after |

- [ ] Every role above tested — n/a: no policy or grant changed; hashes compared for every role
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-home-cards.mjs` ran with 0 failures against dev with the file applied
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: left open on purpose; the app half closes it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-23-seed-cards-for-removed-automatic-tiles.md`
- [x] `README.md` still accurate — it does not list role_cards rows
- [ ] **Release notes.** — n/a: nothing a user would notice until the app half, which carries the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the tile list came from running the old logic against the dev roles; the safety claim from the hash comparison

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; the code that reads role_cards already exists, and the app half follows
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: inserts only
- [x] Apply plan stated — on production before the app half is deployed

### Rollback

- [x] Rollback position stated — delete the inserted pairs; they are ordinary cards the existing code already understands

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing visible changes until the app half

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
