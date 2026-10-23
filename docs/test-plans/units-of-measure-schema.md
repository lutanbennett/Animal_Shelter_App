# Feature test plan — units-of-measure-schema

## Header

| | |
|---|---|
| Feature | Schema half of units of measure as data: `units` table (tags, archive), seed incl. `each`, write-time check on `diet_types.unit` / `medication.dose_unit` |
| Backlog item | `docs/backlog.md` → **Units of measure become a list Admin edits in the app** (left open, status note added) |
| Branch / worktree | `claude/units-of-measure-schema` @ `C:\Development\Animal_Shelter_units-of-measure-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | yes — `0252_units_of_measure_are_data.sql` |
| Tested at SHA | `cbaf9bd2` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item — the schema half: a `units` table with tags and archive, seeded, with a write-time check
- [x] Files/areas touched listed — `supabase/migrations/0252_*.sql`, `scripts/check-units-schema.mjs`, `docs/decisions/2026-10-23-units-of-measure-are-data.md`, `docs/backlog.md` (status note), this plan; nothing in `src/`
- [x] Roles affected identified — none see a change; the trigger changes what a save of a unit does, but the app only offers the existing list today
- [x] Out of scope written down — the Units screen, forms reading the table, deleting DIET_UNITS/DOSE_UNITS, manual and release line are the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends as below:

```
=== gates: build exited 0 after 210s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0251), none other in flight — `worktree.mjs sync` printed "migration numbers: ok"
- [x] `--status` reviewed before applying — 252 applied, 1 pending
- [x] `--dry-run` reviewed — first run flagged a missing grant (fixed); second ok
- [x] Applied to **dev** and recorded — `applying 0252 … ok`
- [x] File is re-runnable (`if not exists`, `or replace`, `drop … if exists`, `on conflict do nothing`)
- [x] Existing rows still read correctly — dev units in use (g, can, cup, ml, tablet) are all seeded; the trigger does not touch untouched rows
- [x] Constraints exercised in a `begin; … rollback;` harness — `node scripts/check-units-schema.mjs`: all 12 ok (reads, write refused for volunteer, admin write, legacy row saves, unknown/wrong-list/archived refused, archived stays on row, `each` accepted). It caught one real bug (`new.dose_unit` on diet_types), fixed before applying
- [x] Down-migration — not needed: additive; the only thing removed is the redundant `medication_dose_unit_check`, which the trigger replaces
- [x] Production apply plan — `0252` on production before the app half deploys; consumer header names the app half's files

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this table yet
- [ ] Data persists — n/a: no UI surface; asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads this table yet
- [ ] Invalid input is rejected with a readable message — n/a: no UI input yet; the database refusals are asserted in the §3 harness
- [ ] Boundary cases checked — n/a: no UI surface; case-insensitive match (`EACH`) is in the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | units | read, write | ok — harness `admin_write` |
| management | units | read only | n/a — not separately run; same policy as volunteer |
| staff | units | read only | n/a — as above |
| doctor | units | read only | n/a — as above |
| volunteer | units | read only | ok — harness `volunteer_reads`, `volunteer_write_refused` |
| signed out | nothing | nothing | n/a — policies are `to authenticated` only; no anon grant |

- [ ] Every role above tested — n/a: admin and volunteer run; other signed-in roles share the volunteer's outcome by the same policy
- [ ] A role that should not have access is blocked server-side — n/a: no UI; the write refusal is the harness's `volunteer_write_refused`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the app half writes it
- [ ] Translatable strings — n/a: no strings; Thai names are in the rows
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader; no `src/` change. Dev still has all existing units valid
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; a status note says the schema half is done
- [x] Decision file — `2026-10-23-units-of-measure-are-data.md` (trigger not constraint, dropped check, gate, no kg)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a seeded table nothing reads is invisible to a shelter user; the app half carries the line
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — dev unit usage came from a query; behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is the tool's actual output** — deferred: release manager, for the deploy output; the gates and harness output here are unedited
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] Migration and code that reads it? — no; consumer header names the app half's files, so `0252` must be on production before that feature deploys
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive; only a redundant check dropped
- [x] Apply plan stated — `0252` on production with the next release, before the app half deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert `0252` and need not: older code ignores the table, and the trigger only refuses units not in the seed, which the old app never offers

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry-run: table had no grant | fixed — grants added |
| 2 | medium | Trigger read `new.dose_unit` on diet_types and failed | fixed — `to_jsonb`; caught by the harness before apply |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads this table yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
