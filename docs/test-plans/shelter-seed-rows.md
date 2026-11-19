# Feature test plan — shelter-seed-rows

## Header

| | |
|---|---|
| Feature | Schema half of #shsed: a new shelter is seeded with default site_pages, public_stat_switches, bill_kinds, frequency; receipt series function |
| Backlog item | `docs/backlog.md` -> #shsed (ticked) |
| Branch / worktree | `claude/shelter-seed-rows` @ `C:DevelopmentAnimal_Shelter_shelter-seed-rows` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known at creation |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | yes - `0416_seed_new_shelter_defaults.sql` |
| Tested at SHA | `c2b5b5800` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for - creation seeds default pages, switches, bill kinds, frequencies; a definer function sets the receipt series
- [x] Files/areas touched listed - `supabase/migrations/0416_seed_new_shelter_defaults.sql`, `supabase/harness/seed_new_shelter.sql`, `docs/hard-coded-security-registry.json`, `docs/backlog.md` (tick), `docs/decisions/2026-11-19-seed-a-new-shelter.md`, this plan
- [x] Roles affected identified - none: only newly created shelters get rows; no screen or grant changed
- [x] Anything explicitly **out of scope** written down - no src/ change; the caller of the receipt function (a product-admin form) is an app half; group_origins, donation_channels, site_content left unseeded on purpose

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `a9b8e6f6` merged in cleanly (two docs files from the 0.21.0 record)
gates: typecheck=0 lint=0 test=0 build=0

```
=== gates: build exited 0 after 128s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR - n/a: not yet, the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` - `check-migration-numbers.mjs`: ok, 0416 against highest 0415; no other migration PR open
- [x] `--status` reviewed before applying - 416 applied, 1 pending (0416), no drift
- [x] `--dry-run` reviewed - `0416 ... ok`
- [x] Applied to **dev** - `applying 0416_seed_new_shelter_defaults.sql ... ok`
- [x] File is re-runnable - create or replace throughout, owner change guarded; seed_shelter_defaults called twice in the harness changes nothing
- [x] Existing rows still read correctly - no existing table or row changed; product_admin_create_shelter keeps its 0414 body plus one call
- [x] **Exercised against real rows** in a rolled-back harness (`supabase/harness/seed_new_shelter.sql`): output `HARNESS OK: site_pages 8, public_stat_switches 4, bill_kinds 14 (6 children), frequency 10, group_origins 0, cards 0, idempotent, receipts ZZS counter 1, series change refused, non product admin refused`
- [x] Down-migration - not needed: additive; undo steps are in the migration header
- [x] Production apply plan - 0416 with the next release; nothing reads it yet, so any time

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence of the column asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in §3's harness
- [ ] Empty state renders sensibly - n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked - n/a: no UI surface; series format and change refusal are in the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing changed | unchanged | n/a - no policy or grant changed; the functions are gated by is_product_admin() and aal2, proven refused for a non product admin in the harness |
- [ ] Every role above tested - n/a: no policy and no grant changed
- [ ] A role that should not have access is blocked server-side - n/a: no access rule changed; harness proves a non product admin is refused

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated - n/a: no UI surface
- [ ] Translatable strings - n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work - build gate green; nothing in src/ reads the new functions
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought two docs files only; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` - #shsed; searched for related items: #shrow stays open (its absent-row consequences are only partly measured)
- [x] Non-obvious design choices added in `docs/decisions/2026-11-19-seed-a-new-shelter.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** - n/a: no shelter user would notice; only newly created shelters change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the view list came from `pg_depend` on dev, the live definitions from `pg_get_viewdef`, and the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Migration and code that reads it?** - no; consumer none
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated - 0416 on production with the next release

### Rollback

- [x] Rollback position stated - code rollback does not need to revert 0416; nothing reads it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | check-hard-coded-security failed on the three new definer functions until declared in the registry | fixed - recorded under outsideTheCardSystem.productAdmin |


## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
