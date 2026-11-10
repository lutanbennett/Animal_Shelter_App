# Feature test plan: drive-unshare

## Header

| | |
|---|---|
| Feature | `scripts/drive-sharing.mjs`: report, remove and restore "anyone with the link" on one environment's Drive tree |
| Backlog item | `docs/backlog.md` → #yy9fz (not closed by this PR) |
| Branch / worktree | `claude/drive-unshare` @ `C:\Development\Animal_Shelter_drive-unshare` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | a5fad683 plus the commit carrying this plan |

## 1. Scope and risk

- [x] Change is one sentence: a re-runnable script that reports, removes and restores `anyone` sharing on a Drive tree; it matches the item
- [x] Files touched: `scripts/drive-sharing.mjs`, `docs/decisions/2026-11-10-drive-unshare.md`, this plan. No app code, no migration
- [x] Cards affected: none change. The receipt path was exercised with a login holding exactly `donations_receipts` (activity `donation.receipt`); admin and signed-out are not affected
- [x] Out of scope: app code for the three links still going to drive.google.com, production Drive credentials, and #98se8

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs`, closing lines as printed:

```
=== gates: typecheck exited 0 after 44s
=== gates: lint exited 0 after 117s
=== gates: test exited 0 after 22s
=== gates: build exited 0 after 121s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path: the report on UAT walked 347 folders and 916 files with 0 failures; after the parent link was removed the same report showed 0 shared
- [x] Re-run safe: the report is read-only and was run twice; `--remove` against inherited permissions failed cleanly with Google's reason and changed nothing
- [ ] Data persists — n/a: the script stores nothing
- [ ] Create / edit / delete all exercised — pending: `--restore` was never exercised, because `--remove` could not delete an inherited permission (see the decision file)
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected with a readable message: missing `--env`, `--env production`, `--remove` with `--restore`, and `--env test --remove` without `--shared-tree-ok` were each run and exit 2 with a message, changing nothing
- [ ] Boundary cases — n/a: no user-entered data; Drive paging follows `nextPageToken` and the 1,263-item UAT tree was walked in full

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page changed | n/a | n/a |
| exactly `donations_receipts` | issue a receipt, download its PDF, open its Drive copy via `/api/documents/<id>` | all work with no Google account | issued LCA0009013; PDF 200, 148,900 bytes, `%PDF-`; document route 200 |
| signed out | n/a: no page changed | n/a | n/a |

- [x] Every login above tested — the one that applies
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: an operator script, not a user feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI surface changed
- [ ] Network clean — n/a: no UI surface changed

## 6. Regression

- [x] Nearest pages checked: `/management/donations`, `/management/donations/new` and the receipt page, as `donations_receipts`
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken: all four gates pass after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: #yy9fz stays open; this builds the tool and rehearses it
- [x] Design choices recorded in `docs/decisions/2026-11-10-drive-unshare.md`
- [ ] `README.md` still accurate — n/a: it does not describe this script
- [ ] Release notes — n/a: no shelter user would notice a script change
- [x] Commit messages say why
- [x] Claims were measured: the inherited permission was read from `permissionDetails.inherited` and the receipt path was run on dev; the residents CSV export was only read in code

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no boundary change
- [ ] Evidence pasted is the tool output, unedited — n/a: only the gates output is pasted, as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: the script is not deployed
- [ ] `strip-baked-env` seen — n/a: the script is not deployed
- [ ] New secret or env var in production — n/a: none added

### Migration ordering

- [ ] Migration and code together — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: nothing is deployed; to undo the Drive change, re-add `anyone: reader` on the LCA Health System folder

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | `--remove` cannot remove a permission inherited from a parent; the parent has to change | accepted: recorded in the decision file |
| 2 | Medium | Three links still go to drive.google.com directly (archived-resident folder, archive export file, home-screen-icons folder) | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On UAT with a real session: a resident photo loads and a receipt Open on Drive works | uat.lannacare.org |
| 2 | Production still opens its photos and receipts after the parent link was changed | lannacareforanimals.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan to check the two rows above

Manual verification by: pending: Lutan to check the two rows above on UAT and production

### Result

- [ ] Open defects are either fixed or explicitly accepted above — pending: defect 2 is deferred to the backlog, awaiting Lutan on the three links
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over
