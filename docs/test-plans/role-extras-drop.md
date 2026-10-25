# Feature test plan — role-extras-drop

## Header

| | |
|---|---|
| Feature | 0261: drop the role_extras table, and drop set_role_cards' ignored p_bundle input together with the app's p_bundle: null |
| Backlog item | `docs/backlog.md` → "Cards carry their own access" part (b), and the URGENT BUG item (stopgap removed) |
| Branch / worktree | `claude/role-extras-drop` @ `C:\Development\Animal_Shelter_role-extras-drop` |
| Dev server | `http://localhost:3009` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | yes |
| Tested at SHA | 080bd337 |

## 1. Scope and risk

- [x] One sentence: removes the table nothing reads since 0257 and the ignored third input of set_role_cards, with the app's p_bundle: null, in one PR so the app and database never disagree on the input list (the 0.40.2 outage)
- [x] Touched: supabase/migrations/0261_*.sql, who-does-what/actions.ts and roles.ts, lib/audit/recent-changes.ts and undo.ts, admin/recent-changes/page.tsx, scripts (dev-signin, check-card-grants, check-2ic-role, facility-map-holders, lib/readonly-checks), decision file, backlog notes
- [x] Roles affected: Admin only (the save on Who does what); no role's access changes, cards-union reports every role exactly the union of its cards
- [x] Out of scope: cards_effective / recompute_role_permissions keep their own ignored p_bundle (cards.ts and the card review streams' files are off limits this batch); production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] 0261 is one above the highest on main (0260); no other in-flight branch carries a migration
- [x] `--status` reviewed: 261 applied, 1 pending before the apply
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev (qxkmhwybjggxvsfxsxbd), recorded in schema_migrations
- [x] Re-runnable: drop function if exists, create or replace, drop table if exists
- [x] Existing rows still read correctly: role-cells and cards-union run against dev after the apply; every role is exactly the union of its cards
- [x] Constraints exercised against real rows: check-card-grants.mjs (rolled back, dev) all ok, including the three photo-approver refusals through the two-input function; a throwaway-role script made the app's exact two-input call through PostgREST for add, reorder and remove (each persisted and read back), and the old three-input call was refused with PGRST202
- [ ] Down-migration — n/a: role_extras held nothing that counts; 0257 already ignores it, and the old three-input function is recreated by 0257 if ever needed
- [x] Production apply plan: file 0261 to dbkodyyxxhtygxcxmfcu at the next release, TOGETHER with the app deploy (see section 8); production still needs 0259 and 0260 first

## 4. Functional checks

- [x] Happy path: add, reorder and remove cards on a throwaway role via the app's exact RPC shape on dev, each result read back
- [x] Data persists: read back from role_cards after every call
- [ ] Create / edit / delete — n/a: covered by the add, reorder and remove calls above
- [ ] Empty state — n/a: no UI surface changed
- [ ] Invalid input — n/a: the photo-approver refusals are exercised by check-card-grants.mjs
- [ ] Boundary cases — n/a: the empty card list and a duplicate card are covered by the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Who does what, Recent changes load | open (Who does what shows its authenticator-step prompt at aal1) | loaded; save needs the authenticator step |
| all other roles | no page or access rule changed | n/a | n/a |

- [ ] Every role above tested — n/a: only Admin reaches these pages and no access rule changed
- [ ] Unauthorised access blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual — n/a: no user-facing wording changed
- [ ] Translatable strings — n/a: two now-unused role_extras labels left in the dictionaries, harmless
- [ ] Mobile viewport — n/a: no layout changed
- [ ] Console clean — n/a: no page behaviour changed
- [ ] Network clean — n/a: no page behaviour changed

## 6. Regression

- [x] Nearest pages checked by loading them: Who does what (opens) and Recent changes (opens)
- [x] Shared files touched (audit lists) loaded from Recent changes; the remaining tables' labels are unchanged in the code
- [x] Nothing merged from main during sync was broken by this branch (gates green after sync)

## 7. Documentation

- [x] Backlog items ticked and annotated: the URGENT BUG item notes the stopgap is gone, the Cards carry their own access item marks part (b) done
- [x] Decision file 2026-10-25-drop-role-extras-and-p-bundle.md
- [ ] README — n/a: nothing in README names the table or the input
- [ ] **Release notes.** n/a: no shelter user would notice; the table was unread and the save fix was already announced with #927, and 0261 is not on production until the next release
- [x] Commit messages say why
- [x] Claims were measured: step-zero greps read in full, dry-run, harness and the RPC proof run on dev

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager (until then test.lannacare.org runs 0.40.2, which still sends p_bundle, so card saves there fail against the migrated dev database)
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager (add, remove, move a card on Who does what)
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold changed
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and reader code together — deferred: release manager. The migration and the app deploy must go out TOGETHER: an app sending p_bundle: null to the two-input function fails with PGRST202, exactly as 0.40.2 did in the other direction
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager (drops an unread table with no live rows that count)
- [ ] Apply plan stated — deferred: release manager (file 0261, project dbkodyyxxhtygxcxmfcu, with the deploy)
- [ ] Rollback — deferred: release manager (0257's three-input function would need recreating; the table is not restored)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Edit to the role-cells query left a stray bracket; found by running the check, which failed on dev | fixed in 080bd337 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the authenticator step: add a card to a role, remove one, move one up and down on Who does what, reload each time, and see them listed on Admin → Recent changes (the dev sign-in session cannot save: it has only the password step) | Who does what, Recent changes on test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is not empty, so only the person who looked may tick this

Manual verification by: pending: Lutan's authenticator-step card save and Recent changes look on Who does what

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the branch at release time

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
