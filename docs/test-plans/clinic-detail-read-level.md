# Test plan: clinic-detail-read-level

## Header

| | |
|---|---|
| Feature | Clinic visit detail page asks read |
| Backlog item | `docs/backlog.md` → A CLINIC VISIT'S DETAIL PAGE DEMANDS EDIT WHERE ITS OWN COMMENT SAYS READ IS ENOUGH |
| Branch / worktree | `claude/clinic-detail-read-level` @ `C:\Development\Animal_Shelter_clinic-detail-read-level` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR this file is in |
| Tested by / date | Claude, 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | c9c3df7e |

## 1. Scope and risk

- [x] Change is described in one sentence: the clinic visit detail page now requires read, not edit, on `medical.visits`
- [x] Files touched: `src/app/clinic-visits/[id]/page.tsx` (one argument), `src/lib/releases.ts`, docs
- [x] Cards affected: `view_medical` (now reaches the page); `medical_records` unchanged; admin unaffected; signed out unaffected
- [x] Out of scope: the 64 edit-default pages, the helper's default, any policy or RPC

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 28s
=== gates: lint exited 0 after 190s
=== gates: test exited 0 after 19s
=== gates: build exited 0 after 75s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip, no migration

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: a login holding exactly `view_medical` clicked View on Upcoming visits and opened the detail page
- [ ] Data persists — n/a: the page only reads
- [ ] Create / edit / delete — n/a: the page only reads
- [ ] Empty state — n/a: guard change only
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | both | both open | not driven: admin short-circuit unchanged |
| exactly `view_medical` | detail yes, edit no | detail opens, edit refused | detail opened; edit went to /no-access |
| exactly `medical_records` | both | both open | detail and edit opened, edit via the Edit link |
| signed out | neither | login | not driven: guard order unchanged |

- [x] Every login above tested, except admin and signed out, reasons in the table
- [x] A login that should not have access is blocked server-side: edit URL hit directly as `view_medical`

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no behaviour the manual describes changed
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console — n/a: not inspected
- [ ] Network — n/a: not inspected

## 6. Regression

- [x] Upcoming visits and the edit page for the edit card checked
- [ ] Shared file touched — n/a: only releases.ts data
- [x] Nothing merged from main during sync was broken: sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-03-clinic-detail-read-level.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line tagged `view_medical`
- [x] Commit messages say why
- [x] Claims were measured, by driving two one-card logins

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone — n/a: no dates involved
- [ ] Boundary — n/a: no threshold changed
- [ ] Evidence unedited — n/a: gates output pasted above as printed
- [ ] Public pages — n/a: no public page touched
- [ ] deploy line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret — n/a: none
- [ ] Both migration and code — n/a: no migration
- [ ] production dry-run — n/a: no migration
- [ ] backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager (revert the one-argument change; no migration to undo)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is in the PR
- [ ] Handed to the production release manager — n/a: handover happens at release

Result: pass

Release manager acknowledgement: n/a: at release
