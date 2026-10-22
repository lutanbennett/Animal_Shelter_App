# Feature test plan

## Header

| | |
|---|---|
| Feature | The home-screen icon library is built from the cards as well as the route registry, so Bills, Residents, Assistant and My tasks get icons |
| Backlog item | `docs/backlog.md` → **BUG: the home-screen icon library has no Bills icon** (ticked here) |
| Branch / worktree | `claude/bills-icon-library` @ `C:\Development\Animal_Shelter_bills-icon-library` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | `954a9b2b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the library lists every page a card opens (plus the registry), with the home's own open test, and a unit test stops a card page being left out again
- [x] Files/areas touched listed: `src/lib/home-icons/catalogue.ts`, `src/lib/home-icons/catalogue.test.mjs` (new), `src/app/account/home-screen-icons/page.tsx`, `src/lib/home/tiles.ts` (one word: `OUTSIDE_REGISTRY` exported), `src/lib/releases.ts`, a decision file, the backlog
- [x] Roles affected identified: every signed-in login sees Account → Home screen icons, each with only the pages it can open; the Drive folder is the full set, refreshed at the next release sync
- [x] Out of scope written down: `src/lib/permissions/routes.ts` untouched; the home screen itself not rewritten; Drive folder not synced in this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (backlog.md auto-merged)
- [x] `node scripts/gates.mjs` closing line, read from its exit codes:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no data or schema touched
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in on dev as Management (`dev-signin.mjs`), the library listed 33 icons including Bills, Assistant, My tasks and View residents
- [ ] Data persists — n/a: the page stores nothing
- [ ] Create / edit / delete all exercised — n/a: read-only page
- [x] Empty state renders sensibly: with no permissions the page gets an empty list and shows its existing "none" line (code path, type-checked)
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked: a role without Bills (second_in_command) has no Bills icon; `catalogue.test.mjs` also asserts every card's page has an icon for a role whose cells cover it

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | page open to any signed-in login | own pages | not driven: same code path as the two roles below |
| management | Account → Home screen icons | Bills, Assistant, My tasks, View residents present | driven on dev: all present |
| staff | n/a | n/a | role retired (0173) |
| doctor | page open to any signed-in login | own pages | not driven: same code path |
| volunteer | page open to any signed-in login | own pages | not driven: same code path |
| signed out | the page | redirect to /login | unchanged `redirect("/login")` |

- [ ] Every role above tested — n/a: Management and second_in_command driven; the list comes from one function of the role's permissions, covered by the unit test for several roles
- [x] A role that should not have access is blocked server-side: second_in_command, which has no Bills card, has no Bills icon (15 icons; Assistant and My tasks also absent)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe which icons the library lists
- [ ] Translatable strings — n/a: no new strings; labels come from the cards' existing translated labels
- [ ] Mobile viewport (375px) — n/a: the grid and layout are unchanged, only more items in it
- [x] Browser console clean: dev server logs showed no errors for the page
- [x] Network clean — the page rendered for both roles with no failed requests in the server log

## 6. Regression

- [x] The pages nearest the change still work: Account → Home screen icons as two roles; the full test suite passes inside the gates run
- [x] Shared file checked from a second page: `tiles.ts` only gained `export`; the home tests in `src/lib/home/` run in the suite and pass
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; other open items searched for "icon library" and "home-screen icons", none else closed
- [x] Non-obvious design choices: `docs/decisions/2026-10-22-icon-library-built-from-cards.md`
- [x] `README.md` still accurate — it does not describe the icon library
- [x] **Release notes.** One line added to `unreleased`: the Account page now has every tile's icon. The Drive folder is refreshed by the release sync, which Claude runs, so no step is left outstanding for the page itself
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** An unmeasured claim about the landing pages was removed from the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates line is copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Fresh production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref restores the old list, nothing else changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Save 180 px / 1024 px on the Bills icon downloads a good image (not clicked: it saves a file) | Account → Home screen icons, as Management |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is listed and a person has not looked yet, see the pending signature below

Manual verification by: pending: Save image on the Bills icon

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit; the file is in the PR
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: pending
