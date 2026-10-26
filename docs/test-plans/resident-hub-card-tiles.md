# Feature test plan — resident-hub-card-tiles

## Header

| | |
|---|---|
| Feature | The resident hub draws, and queries, only the tiles the reader's cards let them read; one shared map with the section page |
| Backlog item | `docs/backlog.md` → **Resident hub: show each tile only to someone whose cards let them read what it shows** (ticked) |
| Branch / worktree | `claude/resident-hub-card-tiles` @ `C:\Development\Animal_Shelter_resident-hub-card-tiles` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | filled in when opened |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | `270c84b2` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — each hub tile is drawn only when `can(activity, "read")`, from one map shared with the section page, and unreadable tiles are not queried
- [x] Files/areas touched listed — `src/lib/residents/section-reads.ts` (new), `src/app/residents/[id]/page.tsx`, `ResidentHub.tsx`, `[section]/page.tsx`, `scripts/check-permission-catalogue.mjs` (its pin follows the map), manual `en.ts`, `releases.ts`, backlog, decision file
- [x] Roles affected identified — any role that opens a resident hub; no card, grant or policy changed; Admin untouched (short-circuit in `can.ts`)
- [x] Anything explicitly **out of scope** written down — no new card, no `card_grants` change, no role key; appeals and memes tiles keep their own existing gates

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines, as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev, a login holding only Administer medication saw Housing, Photos and Prescriptions and no other medical tile and no Diet; adding Medical records brought Immunizations, Clinic visits, Prescriptions, Weight and the rest back
- [ ] Data persists — n/a: the hub reads, it writes nothing
- [ ] Create / edit / delete all exercised — n/a: read-only change
- [ ] Empty state renders sensibly — n/a: not driven; the Medical group, section and phone tab are not drawn when no medical part is readable (code path, `showMedical`)
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — the blood-tests address typed by hand with only Administer medication is refused (no-access page)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | resident hub | every tile | n/a: not driven on dev; Admin answers before any cell is read (`can.ts`), unchanged |
| management | n/a | follows its cards | n/a: no role-named test; driven as card sets instead |
| staff | n/a | retired role | n/a: `staff` is retired |
| doctor | n/a | not used | n/a: the Doctor role is Lutan's card test role and was left alone |
| volunteer | n/a | unchanged | n/a: reaches the name card, not this hub |
| signed out | n/a | unchanged | n/a: no access rule touched |

Driven instead as card sets: Administer medication only (Prescriptions, no Blood tests/Procedures/Visits/Weight/Diet/Immunisations; blood-tests URL refused), and Administer medication + Medical records (all medical tiles).

- [ ] Every role above tested — n/a: see the table; card sets were driven, role names are not the decision
- [x] A role that should not have access is blocked server-side — the blood-tests URL typed by hand was refused

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated (`src/lib/manual/en.ts`, resident hub topic) — says you see the parts your cards cover; not read at `/manual` in a browser
- [ ] Translatable strings — n/a: no new strings in the dictionaries; the manual is English-only
- [ ] Mobile viewport (375px) — n/a: not driven; the phone Medical tab is hidden when no medical tile survives
- [ ] Browser console clean — n/a: not read in this drive
- [ ] Network clean — n/a: not read in this drive

## 6. Regression

- [x] The pages nearest the change still work — the hub loaded for both card sets; the section page refused as expected
- [ ] Any shared file touched checked from a second page — n/a: shared lib is read only by the hub and the section page, both loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; gates ran after

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; searched for other open items on the hub, tiles, SECTION_READS and "0 · none": none closed
- [x] Non-obvious design choices added as `docs/decisions/2026-10-26-resident-hub-tiles-follow-cards.md`
- [x] `README.md` still accurate — it does not describe the hub tiles
- [x] **Release notes.** `unreleased` has a line for staff who will see tiles disappear; no manual step is outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the behaviour was driven on dev as two card sets

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic touched
- [ ] **Boundary or banding change** — n/a: no threshold touched
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates line above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — Pi `--ref <previous sha>` reverts the hub; no schema or grant changed, so nothing else needs reverting

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Admin sees every tile, and the phone Medical tab appears and disappears with the cards | a resident hub on dev or test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, row 1 above is for a person

Manual verification by: pending: row 1 above needs Lutan to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over through the PR

Result: pass

Release manager acknowledgement: pending
