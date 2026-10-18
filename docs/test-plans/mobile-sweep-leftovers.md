# Feature test plan

## Header

| | |
|---|---|
| Feature | The phone-width check can reach Security, a living prescription and the Doctor's pages; three of the four leftover screens checked at 375 px |
| Backlog item | `docs/backlog.md` → "Mobile sweep leftovers" |
| Branch / worktree | `claude/mobile-sweep-leftovers` @ `C:\Development\Animal_Shelter_mobile-sweep-leftovers` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | |
| Tested by / date | Claude, 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | 90612d46 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the script makes a 2-step-verified throwaway admin, a doctor linked to a clinic and a living prescription, and the screens were looked at
- [x] Files/areas touched listed: `scripts/check-phone-width.mjs`, `docs/mobile-sweep-inventory.md`, `docs/backlog.md`, one decision file; no app code
- [x] Roles affected identified: none in the app; the script's throwaway admin (dev only) now holds 2-step-verified admin for one run, see the decision file
- [x] Out of scope: the Doctor's broken landing and role cells, the photo lightbox, the map, the maintenance board

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
  ```
  gates: typecheck=0 lint=0 test=0 build=0
  ```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `check-phone-width.mjs --roles=admin --pages=/admin/security,/prescriptions/{rx}/edit,/medical/photos,/medical/weight` measured all clean in English and Thai
- [ ] Data persists — n/a: a check script, nothing saved for users
- [x] Create / edit / delete all exercised: the script seeds and then removes its rows, login, factor, doctor and prescription; the doctor_clinics cleanup bug found on the first run was fixed and a rerun printed no cleanup warnings
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected with a readable message — n/a: no input handling
- [ ] Boundary cases checked — n/a: the long-name seed rows are the boundary case and were already there

### Role access matrix

- [ ] n/a: no access rule changed

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security, prescription edit, medical photos and weight | fits at 375 px | fits |
| management | n/a | unchanged | unchanged |
| staff | n/a | retired | n/a |
| doctor | `/appointments` | opens with a clinic | still /no-access: dev Doctor role lacks the visits cell |
| volunteer | n/a | unchanged | unchanged |
| signed out | n/a | unchanged | unchanged |

- [ ] Every role above tested — n/a: only the admin and doctor logins the script makes were exercised
- [ ] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no strings
- [x] Mobile viewport (375px) — the point of the change, English and Thai
- [ ] Browser console clean — n/a: no app code changed
- [ ] Network clean — n/a: no app code changed

## 6. Regression

- [x] The pages nearest the change still work: the full public pass of the script ran clean alongside
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: script and docs only

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked on purpose, `/appointments` is still open; a note says which part closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-18-phone-check-verified-admin.md`)
- [ ] `README.md` still accurate — n/a: it does not describe this script
- [ ] **Release notes.** n/a: a dev check script and docs; no screen a shelter user sees changed
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the script's own output, and the dev Doctor role's two cells read from `role_permissions`

## 8. Pre-production gate

- [ ] deferred: release manager — nothing here deploys

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Dev Doctor role holds no `medical.visits` cell, so `/appointments` is refused for every doctor login (the known Doctor landing defect) | deferred to backlog: Lutan's decision, already on the board |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Swipe the users table on a real phone and confirm the role column is reachable | `/admin/security` as a verified admin |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; for the person who looks

Manual verification by: pending: item 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
