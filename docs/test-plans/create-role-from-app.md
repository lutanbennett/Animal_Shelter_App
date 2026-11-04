# Test plan: create-role-from-app

## Header

| | |
|---|---|
| Feature | Create a role from Settings → Who does what |
| Backlog item | `docs/backlog.md` → #b3y4z |
| Branch / worktree | `claude/create-role-from-app` @ `C:\Development\Animal_Shelter_create-role-from-app` |
| Dev server | not started (see Left for manual verification) |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | c2a8d7d0 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Admin (authenticator step) can create a card-less custom role on Who does what.
- [x] Files touched: who-does-what/actions.ts, page.tsx, CreateRoleForm.tsx, role-key.ts (+test), en/th dictionaries, manual, releases, decision file, backlog tick. No migration, CardControls.tsx untouched.
- [x] Cards affected: none change behaviour; the control is Admin-only like every write on the screen. Signed-out public unaffected.
- [x] Out of scope: editing, archiving, renaming roles, the retired scope columns, any default cards.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (a docs/backlog.md-only change)
- [x] `node scripts/gates.mjs` closing lines, from my run before the sync (the sync brought in only docs/backlog.md):

```
=== gates: typecheck exited 0 after 72s
=== gates: lint exited 0 after 275s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 244s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration, only inserts into existing roles table
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: aal2 required, no authenticator on dev sign-in; the form is hidden at aal1
- [ ] Data persists — n/a: aal2 required, no authenticator
- [ ] Create / edit / delete exercised — n/a: aal2 required, no authenticator
- [x] Empty state renders sensibly: the existing home line for a card-less role was read in src/app/home/page.tsx
- [x] Invalid input is rejected with a readable message: blank, too long, no English letter, reserved key and duplicate key each have a message (code read; key derivation unit-tested)
- [x] Boundary cases checked: role-key.test.mjs covers spaces, punctuation, leading digit, Thai-only, empty

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin with authenticator | Create a role | control drawn | not driven |
| admin at aal1 / card-only login | no control | not drawn (canEdit false) | not driven |

- [ ] Every login above tested — n/a: not driven in the browser, listed under Left for manual verification
- [x] A login without Admin is blocked server-side: createRole checks hasAdminRole and hasTwoStep, and roles' insert policy is Admin at aal2

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [x] Manual updated (src/lib/manual/en.ts, Who does what topic)
- [x] Strings in both dictionaries (en.ts and th.ts); typecheck enforces matching shape
- [ ] Mobile viewport — n/a: not driven, see manual list
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] Nearest pages still work — n/a: not loaded in a browser; build and tests pass
- [ ] Shared file loaded from a second page — n/a: shared files touched only by additions (dictionaries, manual, releases); build passes
- [x] Nothing merged from main during sync was broken: the sync brought only docs/backlog.md

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md on this branch
- [x] Decision file docs/decisions/2026-11-04-create-role-from-app.md
- [ ] README still accurate — n/a: README does not describe this screen
- [x] **Release notes.** unreleased gained an Admin-only line.
- [x] Commit messages say why
- [x] Claims were measured: the retired-column claim by check-hard-coded-security output, the legacy_role claim by reading 0181

## 8. Pre-production gate

- [ ] Tested SHA is main tip at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary assertions — n/a: no banding or threshold
- [ ] Evidence is tool output — n/a: gates output pasted unedited above
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration with code — n/a: no migration
- [ ] prod dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position stated — deferred: release manager (redeploy the previous ref with scripts/pi/deploy-pi.sh; no schema to revert)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With the authenticator step done as Admin: create a role, see it open with no cards, then delete it; confirm a card-only login sees no Create control | Settings → Who does what |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: row 1 is pending

Manual verification by: pending: Create press and card-only login need the authenticator step and a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR links to this file
- [ ] Handed to the production release manager — n/a: release manager reads the PR

Result: pass
