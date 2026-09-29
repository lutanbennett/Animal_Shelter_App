# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema half of the resident microchip number: `residents.microchip_number` and `microchip_implanted_on` |
| Backlog item | `docs/backlog.md` → Resident operations: Microchip number on a resident, searchable from a chip scanner (not ticked; batch 10's feature half closes it) |
| Branch / worktree | `claude/schema-microchip-number` @ `C:\Development\Animal_Shelter_schema-microchip-number` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not used: no UI surface) |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-microchip-number session), 2026-09-29 |
| Carries a migration? | yes, `0113_resident_microchip_number.sql` |
| Tested at SHA | `00d8967` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two nullable columns on `residents`, a 15-digit-only check, a partial unique index, and an anon-refusal check in `check-public-views.mjs`; the schema-first step the item specified
- [x] Files/areas touched listed: `supabase/migrations/0113_resident_microchip_number.sql`, `scripts/check-public-views.mjs`, `scripts/check-resident-microchip.mjs`, `docs/backlog.md`, `docs/decisions/2026-09-29-microchip-number-on-residents-15-digits-staff-only.md`, this plan. Nothing under `src/` or `worker/`
- [ ] Roles affected identified — n/a: no code reads or writes the columns yet, so no role sees any change; the only access question (signed-out public) is asserted in section 4's role matrix
- [x] Out of scope written down: entering, showing and searching the number, the scanner box, the archive PDF, the public "Microchipped" flag and the dashboard count, all in `microchip-number-feature` (batch 10). No `public_*` view is changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (migration numbers ok against `origin/main` 07ee98b, highest 0112)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 293s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0112), and no other in-flight branch carries one (batch 9's only slot)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 112 applied, 0 pending, in step with `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0113 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0113_resident_microchip_number.sql … ok`
- [x] File is re-runnable (`add column if not exists`, `drop constraint if exists` then add, `create unique index if not exists`); the harness runs it twice
- [x] Existing rows still read correctly after the change: 82 dev residents, none back-filled (asserted)
- [x] Constraints exercised against real rows in a `begin; … rollback;` harness (`node scripts/check-resident-microchip.mjs`). Asserted: 15 digits with leading zeros accepted and round-tripped with the date; 14 digits, 16 digits, spaces, dashes, a letter, a legacy 9-digit chip and the empty string all rejected; many nulls coexist; a duplicate is rejected on both update and insert and the number is free again once cleared; on a real deceased resident the chip number and implant date are refused (`restrict_violation`) while a bio edit still goes through. Output ended `HARNESS-OK existing rows=82 back-filled=0 | …`
- [x] Down-migration: not needed. Purely additive and nullable; leaving it in place is safe, and nothing reads it until the feature half
- [x] Production apply plan for the release manager: apply `0113_resident_microchip_number.sql` to production (`dbkodyyxxhtygxcxmfcu`) with `node scripts/apply-migrations.mjs --env production` before the feature half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet (database behaviour is covered by the section 3 harness)
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and update were exercised in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads these columns yet
- [x] Invalid input is rejected: the check refuses every non-15-digit variant and a duplicate (harness). A readable message for the user is the feature half's job
- [x] Boundary cases checked: 14 and 16 digits, leading zeros, empty string versus null, legacy 9-digit, duplicate, clearing to free a number

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no code path reads the columns | n/a |
| management | nothing new | as above | n/a |
| staff | nothing new | as above | n/a |
| vet | nothing new | as above | n/a |
| volunteer | nothing new | as above | n/a |
| signed out | both columns on `residents`, every public view and every site table, via `/rest/v1` | refused | refused: 401 on `residents`, 400 (no such column) on each public object; `check-public-views.mjs` printed `ok` for every new line and no `FAIL` |

- [ ] Every role above tested — n/a: only signed-out has any exposure and it was tested; the other roles have no code path to the columns yet
- [x] A role that should not have access is blocked server-side: anon is refused by the API itself (above), not by a hidden control

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface, no code reads this column yet
- [ ] Translatable strings — n/a: no UI surface, no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: covered by the build passing and by `check-public-views.mjs` finding every public view still readable by anon after the migration (no `FAIL`)
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; batch 10's feature half closes it. A note recording the schema half and the 15-digit-only decision is on the item
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-09-29-microchip-number-on-residents-15-digits-staff-only.md` (why the field now exists when 0060 left it out, 15 digits only, locked by default on death, staff-only)
- [x] `README.md` still accurate: it does not describe the resident columns
- [ ] **Release notes.** n/a: nobody would notice a column that nothing reads yet
- [x] Commit messages say why, not just what
- [x] Claims in the commit and `docs/decisions/` were measured: the death lock and the anon refusal are asserted by scripts run against dev, not reasoned from the trigger's source

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date from the clock; `microchip_implanted_on` is a plain `date` that nothing computes
- [ ] Boundary or banding change covers both edges — n/a: the only boundary is exactly 15 digits, and both sides (14 and 16) are asserted
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: the `gates:` lines above are verbatim; the harness output is quoted from its own `HARNESS-OK` line
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: migration only, no code reads it; the feature half ships later and its production apply precedes it
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive nullable columns and an index, nothing rewritten
- [ ] Apply plan stated: `0113_resident_microchip_number.sql` to production, before any deploy of the feature half — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: purely additive schema is safe to leave; `wrangler rollback` is unaffected as no Worker code changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-microchip-number session)  Date: 2026-09-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface, so nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, follows the merge

Result: pass

Release manager acknowledgement: pending
