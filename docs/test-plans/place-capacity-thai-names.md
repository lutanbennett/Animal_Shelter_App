# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Production data: occupied enclosures' capacity set to their current resident count; Thai names (`name_th`) for every zone and enclosure |
| Backlog item | none: requested directly in chat by the shelter owner ("Data updates to Production", items 1 and 2) |
| Branch / worktree | `claude/place-capacity-thai-names` @ `C:\Development\Animal_Shelter_place-capacity-thai-names` |
| Dev server | not used: data-only migration, no code changed |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | yes: `0159_place_capacity_and_names_th.sql` |
| Tested at SHA | the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence: migration 0159 sets `enclosures.capacity` to the number of residents whose active placement is there, for every occupied non-Lifecycle enclosure, and fills `zones.name_th` / `enclosures.name_th` where blank
- [x] Files/areas touched listed: `supabase/migrations/0159_place_capacity_and_names_th.sql` and this plan. Nothing under `src/` or `worker/`
- [x] Roles affected identified: everyone who reads the Enclosures page or the map (capacity and "full" figures), and anyone using the Thai locale (place names)
- [x] Out of scope written down: the 22 empty enclosures keep their existing capacity (owner's choice in chat, 2026-10-07); the Lifecycle pseudo-enclosures stay with no capacity; existing `name_th` values are never overwritten

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch cut from `origin/main` today, nothing to merge in
- [ ] `node scripts/gates.mjs` — n/a: no TypeScript, lint or build input changed (SQL and Markdown only)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0158), and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed: dev `158 applied, 1 pending`; production refuses a branch checkout by design, so its status is read from `main` after merge (section 8)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0159_place_capacity_and_names_th.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0159_place_capacity_and_names_th.sql … ok`
- [x] File is re-runnable: the capacity update touches only rows that differ; the name updates fill only `name_th is null`
- [x] Existing rows still read correctly: `name` (the key for Drive paths and Lifecycle matching) is never touched; Lifecycle rows unchanged
- [x] **Exercised against real production rows** in a `begin; … rollback;` harness through the Management API (project `dbkodyyxxhtygxcxmfcu`). Asserted with `raise exception`: no occupied non-Lifecycle enclosure has capacity different from its resident count; no zone or enclosure is left with `name_th` null; no Lifecycle enclosure gained a capacity; no empty enclosure lost its capacity. Output: `201 [{"occupied_capacity":231,"residents_in_enclosures":231}]`
- [x] Down-migration not needed: a data fix replacing guessed values. The previous capacities are AppSheet's "Maximum Residents" in `appsheet-export/latest/Enclosures.csv` if ever wanted back
- [x] Production apply plan: after merge, from the main checkout, `node scripts/apply-migrations.mjs --env production --dry-run`, then `node scripts/apply-migrations.mjs --env production`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code changed; the pages that read `capacity` and `name_th` already shipped. How the data looks after apply is under Left for manual verification
- [ ] Data persists — n/a: written by migration and asserted in the section 3 harness
- [ ] Create / edit / delete — n/a: no new action; Admin → Enclosures and Zones still edit both fields
- [ ] Empty state — n/a: empty enclosures deliberately untouched, asserted in section 3
- [ ] Invalid input rejected — n/a: no input surface
- [ ] Boundary cases — n/a: covered by the section 3 assertions (Lifecycle rows, empty enclosures, existing Thai names kept)
- [ ] Every role tested — n/a: no role-gated surface changed
- [ ] A role without access is blocked server-side — n/a: no new route

## 5. Cross-cutting

- [ ] Nav, manual, translation path, mobile, console, network — n/a: no UI or code change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code change
- [ ] Shared files checked from a second page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken — n/a: no sync needed

## 7. Documentation

- [ ] Backlog item ticked — n/a: not a backlog item; requested in chat
- [ ] Decision file — n/a: the reasoning (empty enclosures untouched, Thai names only fill blanks) is in the migration's header
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: data change only, no app code ships; it goes live when the migration is applied, independent of any release
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages were measured, not reasoned**: the 231 = 231 figure is the harness output above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: no deploy; migration only
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy

### On the deployed build

- [ ] Deployed to test and smoke-tested — n/a: no deploy
- [ ] Timezone-sensitive behaviour — n/a: nothing reads the date
- [ ] Boundary assertions cover both edges — n/a: not a boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after cache purge — n/a: public pages do not show capacity or Thai place names

### Deploy safety

- [ ] Deploy target ref, strip-baked-env, secrets — n/a: no deploy

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: migration only, filling columns that already exist and are already read
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — run from the main checkout after merge, 2026-10-07: `0158_map_rooms_permission.sql … ok`, `0159_place_capacity_and_names_th.sql … ok`. `0158` was still pending on production and so was dry-run and applied in the same pass, ahead of `0159`; both then applied clean, leaving production at 159 applied, 0 pending, matching `origin/main`
- [x] Rewriting migration: it rewrites `capacity` values only; the old values are in `appsheet-export/latest/Enclosures.csv` and the pre-change snapshot taken 2026-10-07, so no full backup is needed for one integer column
- [x] Apply plan stated: `0159_place_capacity_and_names_th.sql` to production `dbkodyyxxhtygxcxmfcu` right after merge; no deploy involved

### Rollback

- [x] Rollback position stated: no code to roll back. Capacities can be re-edited on Admin → Enclosures or restored from the AppSheet export; Thai names can be edited or cleared on Admin → Zones / Enclosures

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai names read naturally to staff, in particular Blue as สีฟ้า rather than สีน้ำเงิน | Enclosures page and map with the locale set to Thai |
| 2 | Occupied enclosures show as full | `/enclosures` on production |

Both items were checked by Lutan on production on 2026-10-07, after `0159` was
applied, and confirmed as expected.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

Manual verification by: Lutan Bennett  Date: 2026-10-07

Lutan read the Thai names and the Enclosures page on production after `0159`
was applied and confirmed the data is as expected. He asked in chat for his
confirmation to be recorded here, so Claude wrote this line; Claude did not
perform this check.

Result: pass
