# Feature test plan — doors-need-a-card

## Header

| | |
|---|---|
| Feature | Every view and table that only the front door guarded now asks for the card that does the work (migration 0263, plus the facility-plan image route) |
| Backlog item | `docs/backlog.md` → "EVERY VIEW AND EVERY TABLE MUST REQUIRE A CARD" (ticked) |
| Branch / worktree | `claude/doors-need-a-card` @ `C:\Development\Animal_Shelter_doors-need-a-card` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | yes: 0263, shipped with its proof on purpose (locks and grants must be atomic) |
| Tested at SHA | f0605fc3 |

## 1. Scope and risk

- [x] One sentence: seven views, six tables and the plan-image route stop being readable by any login holding any card, and are gated by the existing rights of the forms that read them
- [x] Touched: supabase/migrations/0263, src/app/api/facility-maps route, docs (decision, backlog, this plan)
- [x] Roles affected: every role holding cards; a card with none of the listed rights loses reads it had no form for. Admin unchanged (outside the card system)
- [x] Out of scope: the 18 public_* views (the public website, anon reads by design), has_app_access(), the stub functions (step 4), trimming over-granted cards (Card review 1), unlinked recurring jobs

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (merge f0605fc3)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0263, next free on main; no other branch carries one
- [x] `--status` reviewed: dev 263 applied, 0 pending before
- [x] `--dry-run` reviewed: ok (it first warned on grants and the gated-view rule; fixed by restating the grants and keeping has_app_access() in the six views)
- [x] Applied to dev: 0263 ok
- [x] Re-runnable: create or replace / drop … if exists
- [x] Existing rows still read correctly: counts per role below match what each role read before for the surfaces its cards need; `role-cards-coverage` and `cards-union` clean on test
- [x] Constraints and defaults exercised in a begin/rollback harness: a DO block impersonated one login per role (set role authenticated + jwt claims) and counted rows on 13 surfaces; anon and service_role checked separately
- [ ] Down-migration — n/a: policies and views restate their old text, recreate from 0262 state if ever needed; no data changes
- [ ] Production apply plan — n/a: the release applies 0263 BEFORE the deploy (app and schema go together); dry-run on production is the release manager's

## 4. Functional checks

- [x] Happy path: head_of_maintenance opens /maintenance/new and the Assigned-to list fills (43 logins); medical_records opens /prescriptions/new for a resident with the medication list (27) filled
- [x] Data persists — n/a in effect: read-side change, no writes
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: a card without the right sees 0 rows by design, shown below
- [x] Invalid input — a login holding a different card reads 0 rows (not an error), shown below
- [ ] Boundary cases — n/a: no thresholds

### Role access matrix

One login per role, read through the database as `authenticated` with that login's claims. Counts are rows readable. Cards of each test role were read back from `role_cards` first (single-card roles named dev_signin_cards_*).

| Role (cards) | Residents views | app_users | maps | rounds / units | translation_queue |
|---|---|---|---|---|---|
| admin (none; bypass) | 99 / 101 | 108 | 3 | 3 / 16 | 24 |
| bills | 0 | 108 | 0 | 0 / 0 | 0 |
| recurring_jobs | 0 | 108 | 0 | 0 / 0 | 0 |
| enclosures | 0 | 0 | 3 | 0 / 0 | 0 |
| medical_records | 99 / 101 | 0 | 0 | 3 / 16 | 0 |
| feed_special_diets | 99 / 101 | 0 | 0 | 3 / 16 | 0 |
| record_weight | 99 / 101 | 0 | 0 | 0 / 0 | 0 |
| dashboard | 99 / 101 | 0 | 0 | 0 / 0 | 0 |
| outreach_notes, website, meme_library, donations_receipts | 0 | 0 | 0 | 0 / 0 | 0 |
| volunteer (view_residents, enclosures, my_tasks) | 99 / 101 | 108 | 3 | 0 / 0 | 0 |
| public_viewer, signed out | 0 | 0 | 0 | 0 / 0 | 0 |

anon: reads public_resident_profiles (1 row) and public_shelter_stats (1 row); refused resident_who_and_where. service_role: reads resident_current_state (101) and resident_who_and_where (101).

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side: the rows come from the database under that login; the plan-image route returns 404 without facility.enclosures (code path, not browser-driven)

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page added
- [ ] Manual — n/a: no manual topic describes these reads
- [ ] Translatable strings — n/a: no text added
- [ ] Mobile viewport — n/a: no layout change
- [x] Console clean on the two driven forms
- [ ] Network clean — n/a: not separately inspected

## 6. Regression

- [x] Driven in the browser with dev-signin logins: /maintenance/new (head_of_maintenance) and /prescriptions/new (medical_records) both render their lists
- [x] `node scripts/check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`; `check-production.mjs role-cards-coverage cards-union --env test` prints "Every held card is covered by its role's access."
- [x] Nothing merged from main during sync was broken (gates)

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md
- [x] Decision file `docs/decisions/2026-10-25-doors-need-a-card.md`
- [ ] README — n/a: nothing in README names these gates
- [ ] **Release notes.** n/a: no card in use today loses a list its forms read; a login holding only unrelated cards (outreach, website, memes, receipts) read residents it had no page for, and units fall back to the stored name where the layout cannot read them
- [x] Commit messages say why
- [x] Claims were measured: the per-role counts above are database output; the grep of consumers listed in the decision file

## 8. Pre-production gate

- [ ] Tested SHA recorded — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches — n/a: nothing deploys
- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — deferred: release manager, anon reads were proven on dev
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reader code together — deferred: release manager, apply 0263 before the deploy
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback — n/a: revert the commit and re-apply the 0262 view and policy text; no data changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | translations.view and translations.manage are held by no card, so translation_queue reads for Admin only | accepted: matches the page; a card is Lutan's to define |
| 2 | low | app_users is readable by every card whose forms name a person, including recurring.do_own | accepted: listed for Lutan's review in the PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open the forms of the cards not driven here (stock delivery, purchasing, photo approval) signed in as a real role | dev, before the release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is not empty — n/a: only the person who looked may tick this, and nobody has yet

Manual verification by: pending: a person opening the stock delivery, purchasing and photo approval forms

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the branch

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
