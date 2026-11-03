# Feature test plan — bills-sites-schema

## Header

| | |
|---|---|
| Feature | Schema half of bills for several places: `premises`, `bill_accounts`, `bill_kinds`, `utility_bills`, `general_bills`, nullable place/kind columns on the two existing bill tables, and three new cards |
| Backlog item | `docs/backlog.md` → **Utilities as a kind of bill** and **FOUR SITES, AND AN INVOICE THAT SAYS WHAT IT IS FOR** (both left open, status noted, retitled) |
| Branch / worktree | `claude/bills-sites-schema` @ `C:\Development\Animal_Shelter_bills-sites-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | yes — `0304_bills_owner_types_sites.sql`, `0305_bills_sites_kinds.sql` |
| Tested at SHA | `b8080209` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the schema half: places, accounts, a data catalogue of invoice kinds with Other, utility bills (cost only), general bills, and cards; no screens
- [x] Files/areas touched listed — `supabase/migrations/0304_*`, `0305_*`, `src/lib/permissions/{cards,catalogue}.ts`, both dictionaries (card and activity labels), `scripts/check-cards-count.mjs`, `src/lib/permissions/cards.test.mjs`, `scripts/prove-bills-sites-schema.mjs`, decision file, backlog, this plan
- [x] Cards affected identified — new cards `utility_bills`, `general_bills`, `bill_sites`, held by no role. Existing `bills` card unchanged. Admin unaffected (outside the card system). Signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — all screens, `record_attachment()` cases for the new owner types, Thai kind labels, the route entries for the new cards (all the interface half)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all `0`:

```
=== gates: typecheck exited 0 after 23s
=== gates: lint exited 0 after 186s
=== gates: test exited 0 after 24s
=== gates: build exited 0 after 97s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs` ok: `0304`, `0305` against highest `0303`; this stream holds the batch's only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 304 applied, 0 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — both files `ok`. 0305 does not name the new enum values as typed literals (a `case` on `owner_type::text`), so it does not depend on 0304 and the dry-run limitation did not bite
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable — `if not exists` / `or replace` / `drop … if exists` / `on conflict` throughout
- [x] Existing rows still read correctly after the change — only nullable columns were added to `bills_inbox` and `maintenance_bills`; the proof asserts they are nullable; `can_use_bills_inbox()` and `bill_owner_can()` keep every old case
- [x] **Constraints and defaults exercised against real rows** in a `begin … rollback` harness with the SQL role switched to `authenticated` (`scripts/prove-bills-sites-schema.mjs`): nothing seeded for places/accounts; starting kinds + Other + six utility types present; the utility card writes utility bills and not general bills; a login with no bill card writes nothing; Admin writes both; an Other bill with no place and no account saves; an account gives its bill the account's place and a different place is refused; mid-month `covers_month` and a negative amount are refused; a bill-card holder reads the catalogue and cannot change it; no real role holds a new card. A mutation (card swapped for another) made it fail
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the undo recipe is in the 0305 header
- [x] Production apply plan stated for the release manager — `0304` then `0305` on `dbkodyyxxhtygxcxmfcu` with the next release, before any deploy of the interface half

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; inserts exercised in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; database refusals asserted in §3
- [ ] Boundary cases checked — n/a: no UI; first-of-month and negative-amount checks are in §3

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | all new tables | read and write | pass — harness |
| exactly `utility_bills` | `utility_bills` write; places and kinds read | no write to general bills, places, kinds | pass — harness |
| exactly `bill_sites` | places, accounts, kinds write | no bill writes | pass — harness |
| a login with no bill card | nothing | all refused | pass — harness |
| signed out | nothing | no grant to `anon` | n/a: grants revoked from `anon`; no page |

- [ ] Every login above tested — n/a: no page; each row exercised in the §3 harness through RLS, except `general_bills` as holder (symmetrical policy, asserted only as refused to other cards)
- [ ] A login that should not have access is blocked server-side — n/a: no page; the harness shows the database refusing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: card and activity labels were added to both dictionaries; they show only in Who does what, checked by the lint and Thai-dictionary gates
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every bills page; `check-card-grants.mjs` (all 66 roles hold exactly what their cards require), `check-cards-count.mjs`, `check-permission-catalogue.mjs` and `check-hard-coded-security.mjs` (no coded security outside the Admin bypass) pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no page changed; dictionaries and cards.ts gained keys only
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open for both items; each is retitled to say the schema half shipped and the interface half is open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-03-bills-sites-schema.md`
- [x] `README.md` still accurate — it does not list bill tables
- [ ] **Release notes.** n/a: nothing a shelter user can see changes, there is no screen yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the dry-run behaviour, check outputs and proof results were each run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: `bill_date` default is `current_date` as `0189` had it; nothing new derives a day
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates block above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — the code that reads the activities is only the catalogue and card definitions, which are inert until a role holds a card; `0304`/`0305` apply before deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0304` then `0305` on production before the deploy

### Rollback

- [x] Rollback position stated — purely additive schema, safe to leave; older code ignores the new tables and columns; the Pi `--ref` rollback does not revert migrations and does not need to

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `src/lib/permissions/cards.test.mjs` hard-coded forty-two cards, so the first gates run had `test=1` | fixed — updated to forty-five |
| 2 | low | first draft of `0305` failed `check-hard-coded-security` (select policies went through a helper) and `check-permission-catalogue` (aligned spaces defeated its parser) | fixed in the same PR before any merge |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links this file
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
