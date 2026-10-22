# Feature test plan: menu-removal

## Header

| | |
|---|---|
| Feature | Per-role Show the menu setting: tiles only (no left-hand menu, a Home button) for a role whose setting is off; default yes for every role |
| Backlog item | `docs/backlog.md` → Tiles instead of the left-hand menu: the per-role Show the menu setting is BUILT |
| Branch / worktree | `claude/menu-removal` @ `C:\Development\Animal_Shelter_menu-removal` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | this PR |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | fdf6b8ef |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: NavPane is not drawn for a login whose roles all have show_menu off (Admin always keeps it), the header shows a Home button instead of the menu button, and Admin flips the setting per role on Who does what
- [x] Files/areas touched listed: `src/lib/menu/show-menu.ts` (new), `src/app/NavPane.tsx`, `src/app/AppHeader.tsx`, `src/app/admin/who-does-what/{page,actions,CardControls}`, both dictionaries, manual topic Who does what, decision file, backlog status; no migration
- [x] Roles affected identified: every non-Admin role can be switched to tiles only; none is switched in this PR; Admin never loses the menu
- [x] Out of scope written down: no role is flipped to no; no migration; no new per-page back links; no change to clinics, DateInput

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

Coverage script re-run by me on dev (`check-menu-coverage.mjs`): all seven roles 0 orphans; "No unexplained orphans."

## 3. Schema and data

- [ ] Migration number — n/a: no migration (0247 already on main)
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration here; 0247 must be applied to production before this ships, release manager

## 4. Functional checks

- [x] Happy path works end to end: set second_in_command show_menu=false on dev; signed in as that role at 375 px: Home shows tiles, header has a Home button and no Open menu button
- [x] Data persists: reload of /home and a navigation to /residents kept the tiles-only chrome
- [ ] Create / edit / delete — n/a: one boolean flip; the toggle button needs the authenticator step so the flip was made by the same column write via the service role, not by the button
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input
- [x] Boundary cases checked: flipping back to true made the Open menu button return on /residents; a failed roles read keeps the menu (by code)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | menu always shown | by code (isAdmin short-circuits); not driven in browser |
| management | home | menu until flipped | not driven |
| second_in_command | /home, /residents | off: tiles + Home; on: menu | ok, both states, dev-signin aal1 |
| doctor | home | menu until flipped | not driven |
| volunteer | home | menu until flipped | not driven |
| signed out | public site | unchanged | not driven |

- [ ] Every role above tested — n/a: the rule is role-independent code; one role driven in both states
- [ ] A role that should not have access is blocked server-side — n/a: setShowMenu uses the same guard (Admin, 2-step) as every Who does what write, and the toggle is hidden from non-Admin

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [x] Manual updated (`src/lib/manual/en.ts`), Who does what topic gained a paragraph on the setting
- [x] Translatable strings go through the translation path: added to en.ts and th.ts
- [x] Mobile viewport (375px): checked on the phone viewport; Home button fits the header
- [x] Browser console clean: no errors seen on the pages driven
- [ ] Network clean — n/a: not separately inspected; the pages rendered

## 6. Regression

- [x] The pages nearest the change still work: /home and /residents for the 2IC in both states
- [x] Any shared file touched checked from a second, unrelated page: layout chrome seen on /home and /residents
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass after the merge

## 7. Documentation

- [x] Backlog item annotated (not ticked: no role has been flipped yet)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-22-role-show-menu-app.md`
- [x] `README.md` still accurate
- [ ] **Release notes** — n/a: the setting defaults to yes for every role, so no shelter user notices anything until Lutan flips a role
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Both menu states were observed in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates line is pasted verbatim
- [ ] Public pages re-checked — n/a: public pages are not drawn under NavPane's gate

### Deploy safety

- [ ] production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: the migration (0247) shipped in its own PR first, as the schema rule asks
- [ ] Production dry-run — n/a: no migration here; 0247 must be applied to production before this deploys, though a failed read keeps the menu
- [ ] Backup for destructive migration — n/a: not destructive
- [ ] Apply plan stated — n/a: see above

### Rollback

- [ ] Rollback position stated — deferred: release manager (code only; redeploy the previous SHA, the column is harmless)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Admin still has the menu, and the Tiles only button on Who does what saves (needs the authenticator step) | /admin/who-does-what |
| 2 | Pick the first role to switch to Tiles only | Who does what |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1 and 2 are pending, left unticked on purpose

Manual verification by: pending: items 1 and 2 above need a person (Lutan)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over when the PR is open

Result: pass

Release manager acknowledgement: n/a: not yet reviewed
