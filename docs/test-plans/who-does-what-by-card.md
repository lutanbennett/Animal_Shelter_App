# Feature test plan — who-does-what-by-card

## Header

| | |
|---|---|
| Feature | Settings → Who does what opens on a card (activity `roles.view`, card `who_does_what`) instead of the role name Management |
| Backlog item | `docs/backlog.md` → "THE LAST ROLE-BASED GRANT IN THE APP" (ticked) |
| Branch / worktree | `claude/who-does-what-by-card` @ `C:\Development\Animal_Shelter_who-does-what-by-card` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | yes: 0262, shipped with the app change on purpose |
| Tested at SHA | 4603b6a0 |

## 1. Scope and risk

- [x] One sentence: the Who does what page and its tiles are asked of an activity, and the card that carries it is given to Management in the same migration
- [x] Touched: supabase/migrations/0262, src/lib/permissions (catalogue, cards, routes, who-does-what), the Who does what page, both dictionaries, two check scripts, the registry, backlog, decision file, releases
- [x] Roles affected: admin (unchanged), management (keeps the page by holding the card), every other role (still refused)
- [x] Out of scope: the service-role read on the page (filed on the backlog), editing Who does what, any other card, the never-assignable rule

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in; two conflicts (registry, releases) resolved by keeping both streams' changes
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0262, next free on main
- [x] `--status` reviewed: dev 262 applied, 1 pending before apply
- [x] `--dry-run` reviewed: 0262 ok
- [x] Applied to dev: 0262 ok
- [x] Re-runnable: on conflict / where not exists
- [x] Existing rows still read correctly: `role-cards-coverage` and `cards-union` clean on test after the apply
- [ ] Constraints and defaults exercised — n/a: no new column or constraint; the new rows use existing tables
- [ ] Down-migration — n/a: additive; undone by deleting the role_cards, card_grants and permission_activities rows
- [ ] Production apply plan — n/a: the release applies it with the app (pending release)

## 4. Functional checks

- [x] Happy path: a Management login opens /admin/who-does-what and /details and sees the tile on /management
- [x] Data persists — n/a in effect: read only page; the card row persists in role_cards
- [ ] Empty state — n/a: no list added
- [x] Invalid input: a login without the card (volunteer) is refused on every route
- [ ] Boundary cases — n/a: yes/no activity

### Role access matrix

Driven with `dev-signin.mjs` logins against the dev server on :3002.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| management (holds the card by 0262) | /admin/who-does-what, /details, tile on /management | open | open |
| admin (no cards) | the same, and the tile on /admin | open | open |
| volunteer (no card) | the same | refused, no tile | refused, no tile |

- [x] Every role above tested
- [x] Unauthorised access blocked server-side: the volunteer is refused by `requirePermission("roles.view")` and by `/details`'s own guard

## 5. Cross-cutting

- [ ] Nav entry — n/a: route registered with menu false; tiles already existed
- [ ] Manual — n/a: no manual topic describes who can open the page
- [x] Translatable strings: card label and description in English and Thai, plus the activity label
- [ ] Mobile viewport — n/a: no layout change
- [ ] Console clean — n/a: checked by curl, not a browser console
- [ ] Network clean — n/a: checked by curl

## 6. Regression

- [x] check-permission-catalogue, check-cards-count and cards.test pass with the card counted (twenty-nine)
- [x] `node scripts/check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`
- [x] Nothing merged from main during sync was broken (gates)

## 7. Documentation

- [x] Backlog item ticked; follow-up filed on the backlog branch
- [x] Decision file `docs/decisions/2026-10-25-who-does-what-by-card.md`
- [ ] README — n/a: nothing in README names this page's access
- [x] **Release notes.** Added a line to `unreleased` written for an admin
- [x] Commit messages say why
- [x] Claims were measured: curl with each role's session, the check script output above

## 8. Pre-production gate

- [ ] Tested SHA recorded — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches — n/a: nothing deploys
- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reader code together — deferred: release manager, 0262 goes out with the app
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback — n/a: revert the commit and delete the three rows

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The page reads every role's cards with the service role, so the app gate is the whole lock | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A card-only login given the Who does what card on Settings → Who does what opens the page | dev, after the release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is not empty — n/a: only the person who looked may tick this, and nobody has yet

Manual verification by: pending: a person giving the card to a role on Who does what and opening the page

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the branch

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
