# Feature test plan — adoption-updates-schema

## Header

| | |
|---|---|
| Feature | Adopter-to-resident scope functions (schema half of adoption updates from the adopter) |
| Backlog item | `docs/backlog.md` → #l5gxn (not ticked: large item, this is one half of one part) |
| Branch / worktree | `claude/adoption-updates-schema` @ `C:\Development\Animal_Shelter_adoption-updates-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | yes — 0357 |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two read-only functions say which residents a contact may send an adoption update about; the text approval state the item asked for already exists (0343–0346)
- [x] Files/areas touched listed: `supabase/migrations/0357_adopter_resident_scope.sql`, `scripts/check-adopter-resident-scope.mjs`, `docs/decisions/2026-11-11-adoption-updates-schema.md`, this plan
- [x] Cards affected identified: none — no card, no policy, no role key; admin and the signed-out public are unaffected (functions are not granted to anon)
- [x] Out of scope written down: the adopter login, the approving card, the submission page, video size limit and upload state, Translations wiring (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`; run output pasted below

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0356), and no other in-flight branch carries one (`migration numbers: ok` from the sync step)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (358 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0357 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, revoke/grant only)
- [ ] Existing rows still read correctly after the change — n/a: the migration adds two functions and alters no table, view or row
- [x] Constraints and defaults exercised in a `begin; … rollback;` harness (`scripts/check-adopter-resident-scope.mjs`): only the open Adopt placement's carer is in scope; out after ReturnToShelter; re-adopter in and prior out; archived and other contacts out; unknown contact empty; an unapproved update has `text_approval` NULL (not approved at the epoch), no stamp, and is absent from `public_adoption_updates`
- [x] Down-migration: drop both functions; nothing reads them yet, so nothing else changes
- [x] Production apply plan: apply `0357_adopter_resident_scope.sql` to `dbkodyyxxhtygxcxmfcu` with the next release's migrations; no ordering constraint as nothing reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing calls the functions yet
- [ ] Data persists — n/a: no UI surface, nothing calls the functions yet
- [ ] Create / edit / delete — n/a: no UI surface, nothing calls the functions yet
- [ ] Empty state — n/a: no UI surface; an unknown contact returning no rows is asserted in the harness
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface; archived contact, returned resident and re-adoption are asserted in the harness

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no UI | n/a |
| signed out | functions | execute revoked from public and anon | not exercised, grant by the file |

- [ ] Every login above tested — n/a: no page or route exists; the grant lines are in the migration
- [ ] A login that should not have access is blocked server-side — n/a: the only restriction is the revoke from anon, stated in the file

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code reads the functions; the build gate passed
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates ran after the sync)

## 7. Documentation

- [ ] Backlog item ticked — n/a: #l5gxn is a large item and this is one half of one part; the planner files what remains
- [x] Non-obvious design choices recorded: `docs/decisions/2026-11-11-adoption-updates-schema.md`
- [ ] `README.md` still accurate — n/a: nothing in it describes the changed area
- [ ] **Release notes.** n/a: no user can notice two unread database functions
- [x] Commit messages say why, not just what
- [x] Claims in the commit and decision file were measured: the 0343–0346 state and the placement columns were read from the migrations, and the scope and approval behaviour were run in the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic beyond comparing end_date to null
- [ ] Boundary or banding change — n/a: no threshold or band
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it — n/a: the PR is the migration alone, no code reads it
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive, creates two functions
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: dropping the two functions is the rollback and nothing depends on them

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | the brief assumed the text had no approval state; it has had one since 0343 | fixed by not adding a duplicate; recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — pending: release manager reads it before the deploy

Result: pass

Release manager acknowledgement: pending
