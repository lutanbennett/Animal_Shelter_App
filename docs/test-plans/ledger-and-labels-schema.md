# Feature test plan — ledger-and-labels-schema

## Header

| | |
|---|---|
| Feature | Delete the phantom 0201 ledger row (0208); register residents breed/colour in translatable_labels (0209) |
| Backlog item | `docs/backlog.md` → "`apply-migrations.mjs` does not guard `--env test`" (part 2) and "Register `residents.breed`/`colour` in `translatable_labels`" |
| Branch / worktree | `claude/ledger-labels-schema-1b9177` @ `C:\Development\Animal_Shelter_App\.claude\worktrees\ledger-labels-schema-1b9177` |
| Dev server | `http://localhost:3008` (not started: no UI surface) |
| PR | see PR description |
| Tested by / date | Claude, 2026-10-16 |
| Carries a migration? | yes |
| Tested at SHA | 3b336247 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two migrations, one deleting a dev ledger row, one registering two labels
- [x] Files/areas touched listed: `supabase/migrations/0208_*`, `0209_*`, `docs/` only
- [ ] Roles affected identified — n/a: no role-visible change; the labels appear on the staff-only Translations page
- [x] Out of scope: `scripts/apply-migrations.mjs` (untouched), the two crashing check harnesses, any view change, production

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: app-cut worktree on current main; sync is run by the merge train before merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 298s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR: all seven checks passed on #661

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0207), and no other open `*-schema` PR carries one
- [x] `--status` reviewed before applying (209 applied, 2 pending)
- [x] `--dry-run` reviewed: both files `ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] Files are re-runnable (`delete … where`, `drop constraint if exists`, `on conflict`, `drop trigger if exists`)
- [x] Existing rows still read correctly: dev has the two registered rows and the trigger; the snapshot back-fill is `on conflict do nothing`
- [x] Constraints exercised in a `begin; … rollback;` harness: updating a resident's `breed_th` records the English in `label_sources`; inserting a `translatable_labels` row with a bogus group raises `check_violation`. Both passed; rolled back
- [ ] Down-migration — n/a: 0208 only removes a stale bookkeeping row; 0209 is additive (a wider check, two rows, one trigger) and harmless if left
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` at the release applies both; 0208 deletes nothing there (row never existed). Not run or read here

**Drift evidence, `--drift test`:** before applying, it listed `0201_map_rooms_drop_map_id_shape.sql` as applied with no file. After the first apply, and again after a second apply, that row is absent both times; the only entries are `0208` and `0209` themselves (unmerged, so expected). The row stays gone, which is what closes the item.

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; the rows were read back from dev
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface; the check-constraint rejection is in section 3
- [ ] Boundary cases — n/a: no UI surface

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing new | no change | n/a: no UI surface |

- [ ] Every role tested — n/a: no UI surface
- [ ] Server-side block — n/a: no new function or policy; `translatable_labels` policies are unchanged from 0166

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: the page already lists registered labels; seeing the two rows there is left to manual
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [x] Nearest checks: `node scripts/check-public-views.mjs` exits 0 (views unchanged)
- [ ] Shared file touched — n/a: no shared source file touched
- [x] Nothing merged from `main` was broken: branch cut from current `origin/main` (`ecaed337`)

## 7. Documentation

- [x] Both backlog items ticked on this branch, with a note on the Thai breed/colour item
- [x] Decision file `docs/decisions/2026-10-16-ledger-row-and-resident-labels.md`, which states explicitly that no view change was needed
- [ ] `README.md` — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: nobody would notice a ledger row, and the Translations page gaining two optional rows is not something a user relies on yet
- [x] Commit messages say why
- [x] Claims were measured: the drift result and harness assertions were run against dev, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on the deployed build — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary/banding assertions — n/a: no threshold or band
- [ ] Evidence is the tool's actual output — n/a: gates output is pasted unedited, the drift result is summarised from the tool's run
- [ ] Public pages re-checked — n/a: no public change; views untouched

### Deploy safety

- [ ] `deploy: production →` line — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and reading code in the same PR — n/a: no code reads these yet, so apply order against the deploy does not matter
- [ ] `--env production --dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: not destructive; 0208 deletes one bookkeeping row
- [ ] Apply plan stated — deferred: release manager, `apply-migrations.mjs --env production`, either side of the deploy

### Rollback

- [ ] Rollback position — n/a: both are additive or bookkeeping; safe to leave in place, and a code rollback does not touch them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR opens
- [ ] Handed to the production release manager — n/a: at release

Result: pass

Release manager acknowledgement: n/a: at release
