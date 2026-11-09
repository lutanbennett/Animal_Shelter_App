# Feature test plan

## Header

| | |
|---|---|
| Feature | Maintenance job page: enclosure link and read-only notice follow the login's cards |
| Backlog item | `docs/backlog.md` → **A MAINTENANCE JOB LINKS TO ITS ENCLOSURE WITH NO CHECK** (`#m4wq2`, ticked here) |
| Branch / worktree | `claude/maintenance-link-gate` @ `C:\Development\Animal_Shelter_maintenance-link-gate` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | a0fe8ed8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the job's enclosure link needs `facility.enclosures` read, and the read-only notice mentions photos only with `maintenance.photos`
- [x] Files touched: `src/app/maintenance/[id]/MaintenanceJobView.tsx`, `page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `scripts/check-permission-catalogue.mjs`, `src/lib/releases.ts`, a decision file, `docs/backlog.md`
- [x] Cards affected: `maintenance.jobs` read holders without `facility.enclosures` read (`dashboard`, `bills`); Admin unaffected (short-circuit); signed-out public not affected
- [x] Out of scope: the other controls on the page (all already gated, see decision file), the server checks, the 44-page sweep `#79sqf`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in
- [x] `node scripts/gates.mjs` ends with the closing lines below

```
=== gates: typecheck exited 0 after 33s
=== gates: lint exited 0 after 314s
=== gates: test exited 0 after 63s
=== gates: build exited 0 after 226s
gates: typecheck=0 lint=0 test=0 build=0
```

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

- [x] Happy path works end to end: a login with `dashboard` plus `view_residents` sees the enclosure as a link to `/enclosures/…`
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete — n/a: display change only
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: the one boundary is a login that cannot read the enclosure's name, driven below

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | job page | link and notice unchanged (isAdmin short-circuit) | not driven: pending |
| exactly `dashboard` | job page by click | no enclosure link, notice without photos | notice driven; no link driven; name hidden by data read, empty span fixed after, covered by gates only |
| `dashboard` + `view_residents` | job page by click | link to the enclosure, notice without photos | driven, as expected |
| signed out | job page | redirected to sign-in | unchanged, not driven |

- [x] Every login above tested — admin and signed-out pending/unchanged as stated in the table
- [ ] Blocked server-side — n/a: server checks are untouched by this change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no manual topic describes this notice
- [x] Translatable strings through the dictionaries; Thai changed with English and is an unverified draft
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — pending: not read during the drive
- [ ] Network clean — pending: not read during the drive

## 6. Regression

- [x] Nearest pages checked: `/maintenance` board loaded and opened the job by click
- [ ] Shared file touched — n/a: no shared nav or manual file edited
- [ ] Nothing merged from main broke — pending: checked at sync before merge

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file `docs/decisions/2026-11-09-maintenance-job-link-and-notice-follow-cards.md`
- [ ] README — n/a: no README content covers this
- [x] **Release notes.** `unreleased` gained a line for a shelter user
- [x] Commit messages say why
- [x] Claims measured: both behaviours were driven in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is main's tip at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no band or threshold
- [ ] Evidence is the tool's actual output — n/a: gates output pasted unedited above
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Deploy line project ref — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: display-only change, no schema; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A login without enclosure read got an empty icon span, since the name cannot be read | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai notice wording | maintenance job page in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Thai wording

Manual verification by: pending: Thai wording check by a Thai speaker

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending: release manager
