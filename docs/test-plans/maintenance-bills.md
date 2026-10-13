# Feature test plan

## Header

| | |
|---|---|
| Feature | Bills on maintenance jobs: Add a bill on a job, the job's actual cost as the sum of its bills, and matching a Bills inbox card to a job |
| Backlog item | `docs/backlog.md` → "Bills on maintenance jobs" (Management) |
| Branch / worktree | `claude/maintenance-bills` @ `C:\Development\Animal_Shelter_maintenance-bills` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-13 |
| Carries a migration? | no (`0189` and `0190` were already applied to dev) |
| Tested at SHA | `5c80c2ec` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item: a job page gets a Bills section (amount, date, note, photos, several per job), the job's Actual cost is the bills' sum, and a Bills card can be matched to a job
- [x] Files/areas touched listed: `src/app/maintenance/[id]/` (page, view, new `MaintenanceBills.tsx`), `src/app/maintenance/bills-actions.ts`, `src/lib/maintenance/bills.ts`, `src/app/bills/` (page, inbox, actions), `src/lib/bills/upload.ts`, `src/components/BillPhotosSection.tsx`, both dictionaries, manual, releases, `scripts/check-bills-roles.mjs`, `scripts/check-maintenance-bills-page.mjs`, `scripts/check-permission-catalogue.mjs`, `scripts/lib/acceptance-matrix-entries.mjs`
- [x] Roles affected identified: Management and Admin gain the Bills section; Head of Maintenance, 2IC, doctor and volunteer must gain nothing
- [x] Anything explicitly **out of scope** written down: a bills total on the board cards, the Director's phone Bills tile (Lutan's call), reading amounts off the photo, and the Heads' typed Estimated and Actual cost fields, which are unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, pasted below as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — for the page: `scripts/check-maintenance-bills-page.mjs` logs in as Management on dev and sees both bills, their total and the typed cost marked unused. The camera and photo upload through Drive were not driven: see Left for manual verification row 1
- [x] Data persists: the script reads bills written to the database back through a fresh login's page render
- [ ] Create / edit / delete all exercised — n/a: create and delete go through buttons that need a person (Left for manual verification row 1); there is no edit
- [ ] Empty state renders sensibly — n/a: the empty line ("No bills on this job yet") needs eyes on a job with no bills; Left for manual verification row 1
- [ ] Invalid input is rejected with a readable message — n/a: the amount goes through `parseBahtAmount` as every other cost does, and a blank amount returns "Enter the amount as a number"; seeing it is Left for manual verification row 1
- [x] Boundary cases checked: a job with bills and a typed cost shows both and names the one used (the script, typed 999 beside 201)

### Role access matrix

Run by `node scripts/check-bills-roles.mjs` and, with real logins and a running dev server, `node scripts/check-maintenance-bills-page.mjs` (21 checks green).

The database layer: `node scripts/check-bills-roles.mjs` against dev: one transaction, always rolled back, each role's own JWT, six principals including the real Head of Maintenance and 2IC roles. Result: 96 checks held, 0 failed. For a bill's amount, the total from `maintenance_job_cost`, adding a bill, and reading a bill's photo, Admin and Management are allowed and every other role is refused.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | job Bills, amounts, add, photos | allowed | allowed (script) |
| management | job Bills, amounts, add, photos | allowed | allowed (script) |
| second_in_command | none of them | refused | refused (script), and a real 2IC login on dev gets no Bills section, no amounts and 403 at the upload route (`scripts/check-maintenance-bills-page.mjs`) |
| head_of_maintenance | none of them | refused | refused (script), and a real Head of Maintenance login on dev: same page result as the 2IC, 21 checks green |
| doctor | none of them | refused | refused (script) |
| volunteer | none of them | refused | refused (script) |
| signed out | none of them | refused | n/a: the job page requires sign-in before this code runs |

- [x] Every role above tested (the database layer, by script)
- [x] A role that should not have access is blocked server-side: the page reads `can(perms, "maintenance.bills")` first and never queries `maintenance_bills` or the cost view without it; the upload route refuses with 403 through `mayFileBill`; the database refuses regardless

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry was added (the brief forbids one)
- [x] Manual updated (`src/lib/manual/en.ts`, topic "Maintenance: adding a bill to a job") and acceptance matrix rows added
- [x] Translatable strings go through the dictionaries: `maintenance.bills` and the new `bills.page` / `bills.errors` strings are in both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: not driven here; it is Left for manual verification row 1
- [ ] Browser console clean — n/a: no browser session was driven; Left for manual verification row 1
- [x] Network clean for the pages the script fetched: the job page returned 200 for all three roles and the upload route 403 for the two Heads

## 6. Regression

- [x] The pages nearest the change still build and type-check: `/maintenance/[id]`, `/maintenance`, `/bills`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `BillPhotosSection.tsx` only had a type widened; the delivery and visit pages that use it were not touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates ran after the merge)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-13-maintenance-bills.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for Management and Admin; nothing is outstanding before a user could see it, since the schema is already applied to dev and production gets it with the release
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured: the role claims come from the script's output (96 checks), not from reading the policies

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the bill date defaults to `todayIso()` on the server, an existing helper, and no new date logic was written
- [ ] Boundary or banding change assertions — n/a: no threshold or band was changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates line, as printed
- [ ] Public pages re-checked — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration; `0189` and `0190` shipped separately
- [ ] `--env production --dry-run` clean — n/a: no migration in this PR; the release manager checks `0189` and `0190` are applied before this deploy
- [ ] Destructive migration backup — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — deferred: release manager (nothing to revert in the database; the code rolls back with the usual Pi rebuild)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Lint failed on the first pass: two page guards in `check-permission-catalogue.mjs` and a missing acceptance-matrix entry for the new manual topic | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As Management on a phone at 375 px: add two bills to one job; the Actual cost shows their sum and the page says the bills are used; type an Actual cost by hand on a job that has bills and see both numbers with the typed one marked unused | `/maintenance/<job>` |
| 2 | At night: add a photo on Bills, type the amount, tap a maintenance job under Likely matches; the card disappears and the job lists the bill | `/bills` then the job |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1 and 2 need a person to look; the Heads' view (old row 3) is now proved by the script

Manual verification by: pending: Lutan to look at the two rows above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit; its body points at this file
- [ ] Handed to the production release manager — n/a: that happens after the PR merges

Result: pass

Release manager acknowledgement: n/a: acknowledged at release time
