# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Recent changes no longer scrolls sideways at 375 px |
| Backlog item | `docs/backlog.md` → "`/admin/recent-changes` scrolls sideways at 375 px" |
| Branch / worktree | `claude/recent-changes-overflow` @ `C:\Development\Animal_Shelter_recent-changes-overflow` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the filter row's wide actor `<select>` no longer pushes the page past 375 px; `max-w-full min-w-0` on the select/inputs and their labels
- [x] Files/areas touched listed: `src/app/admin/recent-changes/page.tsx` (classes only), `src/lib/releases.ts`, `docs/backlog.md`
- [x] Roles affected identified: admin only (`requireAdminUser()`)
- [x] Out of scope: the audit log queries, the Undo button, `actions.ts`, and any other page; the `field` class is local to this page

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`
  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-phone-width.mjs --roles=admin --locales=en --pages=/admin/recent-changes` measured before the change: "1 page view(s) overflow"; after: "No page scrolls sideways."
- [ ] Data persists — n/a: presentational change only
- [ ] Create / edit / delete all exercised — n/a: no CRUD touched
- [ ] Empty state renders sensibly — n/a: no data path touched
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: the long-option case is what the check exercises (the "No login (system or console)" option)

### Role access matrix

- [ ] n/a: access unchanged; only classes were edited

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/recent-changes` | fits at 375 px | no sideways scroll |
| management | n/a | unchanged | unchanged |
| staff | n/a | unchanged | unchanged |
| vet | n/a | unchanged | unchanged |
| volunteer | n/a | unchanged | unchanged |
| signed out | n/a | unchanged | unchanged |

- [ ] Every role above tested — n/a: no access change; only admin can open the page
- [ ] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour or wording changed
- [ ] Translatable strings go through the translation path — n/a: no strings changed (classes only)
- [x] Mobile viewport (375px) — no overflow, measured by `check-phone-width.mjs`; all component actions still at least 44 px
- [ ] Browser console clean — n/a: no script behaviour changed
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [x] The pages nearest the change still work: `/admin/recent-changes` loaded for the admin role at 375 px in the phone-width run
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; `field` is declared inside this page
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: class-only change on a page nobody else edits

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice, two utility classes
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` gained an admin-only line: the audit log now fits on a phone
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — before/after numbers come from the phone-width script's own output

## 8. Pre-production gate

- [ ] deferred: release manager — no deploy has happened for this branch

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

None found.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Look at the filter row on a real phone: selects stay inside the screen and the long option text is truncated, not clipped awkwardly | `/admin/recent-changes` as admin, in a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; for the person who looks

Manual verification by: pending: item 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: pending  Date: —
