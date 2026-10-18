# Test plan: admin-tables-cards

## Header

| | |
|---|---|
| Feature | Audit log as cards on a phone; appeals progress text contrast |
| Backlog item | `docs/backlog.md` → Wide admin tables on a phone could become cards |
| Branch / worktree | `claude/admin-tables-cards` @ `C:\Development\Animal_Shelter_admin-tables-cards` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | not yet opened |
| Tested by / date | Claude, 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | 819e9f87 |

## 1. Scope and risk

- [x] One sentence: /admin/recent-changes stacks into labelled cards below md, and the appeals list progress text uses app colours
- [x] Touched: src/app/admin/recent-changes/page.tsx, src/app/management/appeals/page.tsx, src/lib/releases.ts, docs
- [x] Roles: admin (audit log), management (appeals list)
- [x] Out of scope: diets, frequencies, immunization-types (inline editors, left as scrolling tables), appeals list layout

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`

gates: typecheck=0 lint=0 test=0 build=0

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above main — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: browser pane refused localhost, see Left for manual verification
- [ ] Data persists — n/a: presentation only, no data changes
- [ ] Create / edit / delete — n/a: presentation only, the log is read-only
- [ ] Empty state — n/a: the empty-state branch of the page is untouched
- [ ] Invalid input — n/a: no input added
- [ ] Boundary cases — n/a: browser pane refused localhost, see Left for manual verification

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | unchanged | access rules not touched | n/a: no access change |

- [ ] Every role tested — n/a: no access change
- [ ] Server-side block — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: layout-only change, no topic describes the table's shape
- [ ] Translatable strings — n/a: labels reuse the existing column heading strings
- [ ] Mobile viewport (375px) — n/a: browser pane refused localhost, see Left for manual verification
- [ ] Console clean — n/a: browser pane refused localhost, see Left for manual verification
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [ ] Nearest pages still work — n/a: build passed; page not loaded, see Left for manual verification
- [ ] Shared file checked from second page — n/a: no shared file touched except releases.ts, which only the build reads
- [ ] Nothing from main broken — n/a: gates passed after sync

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file added: docs/decisions/2026-10-18-admin-tables-cards-log-only.md
- [x] README still accurate
- [x] **Release notes.** `unreleased` gained a line for phone users of Recent changes and Appeals
- [x] Commit messages say why
- [x] Claims were measured: the contrast cause was read from the source (site-ink on app surface), not yet seen on screen

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic changed
- [ ] Boundary or banding assertions — n/a: no threshold logic; the md breakpoint needs a look, see Left for manual verification
- [ ] Evidence is unedited tool output — n/a: only the gates line, pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none found | nothing seen on screen yet | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Audit log at 375 px, just below and above 768 px, light and dark, Thai: every column present, long What, deleted record, entry with no Who | /admin/recent-changes |
| 2 | Appeals progress line ("No donations recorded…") readable in dark and light | /management/appeals |
| 3 | Diets, frequencies, immunization-types unchanged | /admin/diets, /admin/frequencies, /admin/immunization-types |

## Sign-off

- [x] Everything verifiable without human eyes was run: gates, typecheck, lint, build
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items listed above are awaiting a person

Manual verification by: pending: rows 1-3 above, screen checks the browser pane could not do

### Result

- [ ] Open defects are fixed or accepted — n/a: none found
- [ ] Checklist pasted into the PR — n/a: PR not opened yet
- [ ] Handed to the release manager — n/a: not merged

Result: pass with accepted defects

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
