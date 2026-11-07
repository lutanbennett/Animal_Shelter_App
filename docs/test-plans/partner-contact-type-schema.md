# Feature test plan — partner-contact-type-schema

## Header

| | |
|---|---|
| Feature | Schema half of #xkfsv Partner piece: `Partner` added to `contact_type` (0333) |
| Backlog item | `docs/backlog.md` → #xkfsv (deliberately NOT ticked: the Partner app half and the whole Supplier half remain) |
| Branch / worktree | `claude/partner-contact-type-schema` @ `C:\Development\Animal_Shelter_partner-contact-type-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-07 |
| Carries a migration? | yes — `0333_contact_type_partner.sql` |
| Tested at SHA | `2074767c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one enum value, `Partner`, so a business that helps the shelter need not be filed as a Supplier to become a Shelter Friend
- [x] Files/areas touched listed — `supabase/migrations/0333_contact_type_partner.sql`, `scripts/check-contact-type-partner.mjs`, `docs/decisions/2026-11-07-contact-type-partner.md`, this plan. No `src/`
- [x] Cards affected identified — none change behaviour: no policy or grant changed, and the select policy (0224) does not read the column; the card-driven gates are `photos.shelter_add`, `photos.resident_publish`, `photos.approve`, all unchanged. Admin and signed-out public unaffected (anon refused, proved in the harness)
- [x] Anything explicitly **out of scope** written down — all `src/` work (route, confirm control, queue display) is the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs`: ok, 0333 against highest 0332
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 333 applied, 0 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0333 … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0333_contact_type_partner.sql … ok`
- [x] File is re-runnable — `drop not null` on a nullable column is a no-op
- [x] Existing rows still read correctly after the change — the constraint is only relaxed; no data touched
- [x] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — `check-contact-type-partner.mjs`: HARNESS-OK (Partner inserts, becomes a Friend, unique contact_id holds, old types insert, stock_vendors keeps Vendor and excludes Partner, Partner refused as carer, enum order Carer,Volunteer,Vendor,Partner)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: relaxing a constraint; undo note is in the file
- [x] Production apply plan stated for the release manager — apply 0333 to production before the app half deploys; harmless to current code (nothing writes a Partner)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads Partner yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and assign exercised in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface; the type boundaries are covered in the harness

### Role access matrix

| Card | Can reach | Expected | Result |
|---|---|---|---|
| contacts | contact rows | unchanged | n/a — no policy changed |
| photos.shelter_add | own pending rows | unchanged | n/a — no policy changed |
| none (anon) | nothing | nothing | harness: anon read refused, proxy not public |

- [ ] Every card above tested — n/a: no policy or grant changed; anon and a third login checked in the harness
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed (harness confirms the unchanged refusals)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-public-views.mjs` ran clean against dev with 0333 applied; the build gate compiles every reader
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately not ticked; the Partner app half and the whole Supplier half of #xkfsv remain
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-07-contact-type-partner.md`
- [x] `README.md` still accurate — it does not mention this column
- [ ] **Release notes.** — n/a: schema only; the Partner type a user can choose ships in the app half
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — policies read in 0218/0224/0286/0324; behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the `-- consumer:` warning is expected, the app half is a later PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive, relaxes a constraint
- [x] Apply plan stated — 0333 on production with the next release, before the app half deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert 0333 and does not need to: Postgres cannot drop an enum value, and old code never writes a Partner

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `0334` dropped: nothing in the database enumerates the types, so no second file was needed | accepted — recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads Partner yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
