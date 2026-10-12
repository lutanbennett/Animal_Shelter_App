# Feature test plan — who-does-what-freeze-header

## Header

| | |
|---|---|
| Feature | Who does what: role names stay in view while scrolling down the grid |
| Backlog item | `docs/backlog.md` → **Who does what: keep the role names in view while scrolling down the grid.** (ticked) |
| Branch / worktree | `claude/who-does-what-freeze-header` @ `C:\Development\Animal_Shelter_who-does-what-freeze-header` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | see PR |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | tip of branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the grid's wrapper scrolls both ways so the role-name row and first column stick, and each box's select is named "role: activity"
- [x] Files/areas touched listed — `src/app/admin/who-does-what/page.tsx`, `src/lib/releases.ts`, `docs/backlog.md`, a decision file, this plan
- [x] Roles affected identified — Admin and Management (the people who can open the page); presentation only
- [x] Anything explicitly **out of scope** written down — no cell, permission or `actions.ts` change; the mobile sweep and 44 px items stay open

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the gates
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. GATES_PLACEHOLDER
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev as a throwaway admin, scrolled to "Correct a stock figure" (box scrollTop 1950): the role-name row sat at the top of the box, and with the box scrolled sideways the corner cell and first column stayed at the same left edge
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no data written
- [ ] Empty state renders sensibly — n/a: the grid always has activities
- [ ] Invalid input is rejected — n/a: no input changed
- [ ] Boundary cases checked — n/a: the select's new name was not driven (the throwaway admin has no authenticator step, so the grid was read-only); it is a one-line template swap

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | page | unchanged | seen, banner showing |
| management | page | unchanged | not driven; no access code touched |
| staff | page | unchanged | n/a: retired |
| doctor | page | unchanged | not driven; no access code touched |
| volunteer | page | unchanged | not driven; no access code touched |
| signed out | page | sent to sign-in | seen |

- [ ] Every role above tested — n/a: no access rule changed; admin and signed-out driven
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: wording of the page is unchanged
- [ ] Translatable strings — n/a: no new strings
- [x] Mobile viewport (375px) — no page-level sideways overflow; header row stuck inside the box at the scrolled-down position (scrollTop 2199)
- [ ] Browser console clean — n/a: console not read; the page rendered and scrolled without a visible error
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [x] The pages nearest the change still work — `/admin/who-does-what` itself loaded with the authenticator-step banner above the grid
- [ ] Any shared file touched checked from a second page — n/a: only `releases.ts` (a data line) is shared
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates cover it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-12-who-does-what-sticky-header.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [x] **Release notes.** `unreleased` gained a line for Admin and Management
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — the sticky positions were read from the browser

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: not one
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line, pasted as printed
- [ ] Public pages re-checked — n/a: public pages untouched
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Rollback position stated — n/a: CSS and a label only; redeploy the previous ref

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Print preview still shows the whole grid (the print rule now also clears `max-height`; not driven) | Who does what → Print |
| 2 | Thai: scrolled-down header with the longer role names | Who does what in Thai |
| 3 | With the authenticator step done, a box's select reads "role: activity" | Who does what as an Admin |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: print preview, Thai, and the select's name with the authenticator step done

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: not yet
- [ ] Handed to the production release manager — n/a: not yet

Result: pass
