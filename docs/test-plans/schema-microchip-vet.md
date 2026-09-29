# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Vet write path for the resident microchip: security-definer function `set_resident_microchip(p_resident_id uuid, p_number text, p_implanted_on date default null)` |
| Backlog item | `docs/backlog.md` → Microchip, second half: vet entry (schema step; not ticked, the feature half closes it) |
| Branch / worktree | `claude/schema-microchip-vet` @ `C:DevelopmentAnimal_Shelter_schema-microchip-vet` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` (not used: no UI surface) |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-microchip-vet session), 2026-09-29 |
| Carries a migration? | yes, `0116_set_resident_microchip.sql` |
| Tested at SHA | `ea8fd46` plus this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one security-definer function that lets staff, admin and a scoped vet set a resident's chip and implant date, refusing a deceased resident, stripping nothing and touching no other column
- [x] Files/areas touched listed: `supabase/migrations/0116_set_resident_microchip.sql`, `scripts/check-resident-microchip.mjs` (extended), `docs/decisions/2026-09-29-vet-microchip-write-via-definer-function.md`, this plan. Nothing under `src/` or `worker/`
- [ ] Roles affected identified — n/a: no code reads or writes the columns yet, so no role sees any change; the only access question (signed-out public) is asserted in section 4's role matrix
- [x] Out of scope written down: the vet form, the procedure prompt, the archive PDF, the public boolean, the dashboard count and the No microchip filter, all in the feature half that branches from `main` after this merges. No RLS policy and no view changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branched from `origin/main` ea8fd46 this session, nothing to merge in; migration numbers ok against it
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 55s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 221s
=== gates: build — npm run build
=== gates: build exited 0 after 672s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0115), and no other in-flight branch carries one (batch 11's only slot)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 115 applied, 0 pending, in step with `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0116 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0116_set_resident_microchip.sql … ok`
- [x] File is re-runnable (`create or replace function`, revoke/grant are idempotent); the harness runs it twice
- [x] Existing rows still read correctly after the change: the function adds no column and changes no row; 82 dev residents, none back-filled (asserted by the 0113 section of the same harness)
- [x] Exercised against real rows in a `begin; … rollback;` harness (`node scripts/check-resident-microchip.mjs`, extended, ends `HARNESS-OK`), under real JWT claims with `set local role`. Asserted: a vet whose clinic holds the resident writes, corrects and clears a chip and every other column of the row is unchanged; a vet on a resident outside their clinic is refused (`insufficient_privilege`); a vet and a staff member on a deceased resident are refused (`restrict_violation`); a duplicate is refused (`unique_violation`); 14-digit, spaced, letter and empty-string numbers are refused (`check_violation`), so nothing is stripped; a volunteer, a vet with no clinic and anon are refused; a refused call leaves the row as it was; staff write within scope is allowed
- [x] Down-migration: not needed. Adds one function and changes no data; `drop function set_resident_microchip(uuid, text, date)` removes it, and nothing calls it until the feature half
- [x] Production apply plan for the release manager: apply `0116_set_resident_microchip.sql` to production (`dbkodyyxxhtygxcxmfcu`) with `node scripts/apply-migrations.mjs --env production` before the feature half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing calls the function yet; its behaviour is covered by the section 3 harness
- [ ] Data persists — n/a: no UI surface; the harness reads the row back after each write
- [ ] Create / edit / delete all exercised — n/a: no UI surface; set, correct and clear were exercised in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected: malformed and duplicate chips are refused by the database through the function (harness). A readable message is the feature half's job
- [x] Boundary cases checked: 14-digit, spaced, letters and empty string refused; null clears; in-scope versus out-of-scope versus deceased; the same chip on a second resident

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `set_resident_microchip` | allowed (not exercised separately: same branch as staff) | n/a |
| management | `set_resident_microchip` | refused: not a role that can update `residents` today | not exercised separately; the role check is an allow-list of admin, staff, vet |
| staff | `set_resident_microchip` | allowed on a live resident, refused on a deceased one | as expected (harness G2e, G3) |
| vet | `set_resident_microchip` | allowed in clinic scope, refused outside it, on a deceased resident, and for a vet with no clinic | as expected (harness G1, G2a, G2b, G4) |
| volunteer | `set_resident_microchip` | refused | refused (harness G4) |
| signed out | `set_resident_microchip` via `/rest/v1/rpc` | refused: execute revoked from anon | refused (harness G4, anon role) |

- [ ] Every role above tested — n/a: admin and management were not driven separately; the function's role test is one allow-list, and staff, vet, volunteer and anon were each driven
- [x] A role that should not have access is blocked server-side: volunteer, a clinic-less vet and anon are refused by the function itself, not by a hidden control

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface, no code reads this column yet
- [ ] Translatable strings — n/a: no UI surface, no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: no page reads the function; the build passing and the harness's 0113 assertions (chip check, unique index, death lock) all still hold with 0116 in the same transaction
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; the feature half closes it. A note recording the function, its signature and the number 0116 is on the item on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-09-29-vet-microchip-write-via-definer-function.md` (why a definer function and not widening `residents` RLS for vets, and what the function does and refuses)
- [x] `README.md` still accurate: it does not describe database functions
- [ ] **Release notes.** n/a: nobody would notice a function nothing calls yet
- [x] Commit messages say why, not just what
- [x] Claims in the commit and `docs/decisions/` were measured: the refusals are asserted by the harness against dev under real JWT claims, not reasoned from the function's source

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
- [ ] Apply plan stated: `0116_set_resident_microchip.sql` to production, before any deploy of the feature half — deferred: release manager

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

Automated checks by: Claude (schema-microchip-vet session)  Date: 2026-09-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface, so nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, follows the merge

Result: pass

Release manager acknowledgement: pending
