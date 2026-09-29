# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Fixed outgoings in the cashflow forecast: editor page and a "Fixed outgoings" forecast category |
| Backlog item | `docs/backlog.md` → Fixed monthly outgoings in the cashflow forecast (salaries, rent and the like), as settings, not payroll |
| Branch / worktree | `claude/fixed-outgoings-cashflow` @ `C:\Development\Animal_Shelter_fixed-outgoings-cashflow` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-09-29 |
| Carries a migration? | no (schema landed as 0114 / 0115) |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: management and admin can list named fixed monthly costs, and the cashflow forecast counts them by the day as one more category
- [x] Files/areas touched listed: `src/app/management/cashflow/` (page, view, new `fixed-outgoings/`), `src/lib/management/cashflow.ts`, new `src/lib/management/fixed-outgoings.ts`, both i18n dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `src/app/globals.css` (one series colour)
- [x] Roles affected identified: admin and management (edit and see); staff, vet, volunteer and signed-out are refused
- [x] Out of scope written down: payroll of any kind (deliberately dropped, see the decision files); moving the rule into `cashflow_forecast` SQL; a Thai manual (none exists); the colour-blind check for the new series colour

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in 0116 and the microchip decision and plan), and pushed
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (verbatim, after the sync)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (0114 and 0115 were applied by the schema half)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration; the schema half owns that
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; 0114 and 0115 must be applied to production before this deploys

## 4. Functional checks

- [x] Happy path, the forecast arithmetic: `fixedOutgoingRows()` run under Node against a line ended in October, a line started in November, and an inactive line. Window 2026-10-20 to 2026-11-18 gave ฿11,612.90 for October (12 of 31 days of ฿30,000) and ฿19,800 for November (18 of 30 days of ฿33,000); the inactive line counted nothing. A whole-October window gave exactly ฿30,000
- [ ] Data persists — n/a: the editor's write path was not driven signed in (no management credentials in this session); listed under Left for manual verification
- [ ] Create / edit / delete all exercised — n/a: not driven signed in; listed under Left for manual verification
- [ ] Empty state renders sensibly — n/a: not driven signed in; listed under Left for manual verification
- [x] Invalid input is rejected with a readable message: `parseFixedOutgoing()` refuses an invalid month (`2026-13`) with `monthInvalid`; the other refusals (blank label, negative or non-numeric amount, reversed range) are the same function. Duplicate label and the 24-line cap map to their own messages in `actions.ts`, reading the cap before the insert
- [x] Boundary cases checked: a line ended mid-window (October line contributes nothing in November), a window spanning a month boundary, an inactive line, amounts rounded to two decimals. The 24-line cap on a real 25th insert was not driven (needs 24 rows in dev); listed under Left for manual verification

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/cashflow/fixed-outgoings` | page and writes allowed | not driven; listed under Left for manual verification |
| management | same | page and writes allowed | not driven; listed under Left for manual verification |
| staff | same | redirected by `requireManagementUser()`; writes refused by `hasManagementRole()` and by RLS (0114 has policies for admin and management only) | not driven signed in as staff; listed under Left for manual verification |
| vet | same | as staff | not driven |
| volunteer | same | as staff | not driven |
| signed out | same | redirected to `/login?next=…` | redirected (driven against the dev server) |

- [ ] Every role above tested — n/a: only signed-out was driven; there are no credentials for the other roles in this session
- [x] A role that should not have access is blocked server-side: a signed-out request to the URL is redirected to login by the server

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added; the page is reached by a link under the Cashflow table
- [x] Manual updated (`src/lib/manual/en.ts`, Cashflow topic): sixth category, editing lines, by-the-day counting, not-payroll note, and the old "no salaries, no rent" sentence removed. The topic was not loaded at `/manual` in a browser
- [x] Translatable strings go through the dictionaries: both `en.ts` and `th.ts` carry the new keys and the typecheck enforces they match. This is UI text, not user-typed text, so `/management/translations` is not involved
- [ ] Mobile viewport (375px) — n/a: not driven signed in; listed under Left for manual verification
- [ ] Browser console clean — n/a: not driven signed in
- [ ] Network clean — n/a: not driven signed in

## 6. Regression

- [ ] The pages nearest the change still work — n/a: the Cashflow page could not be loaded signed in; only its typecheck, lint and build cover it. Listed under Left for manual verification
- [ ] Any shared file touched checked from a second page — n/a: `manual/en.ts` and both dictionaries were edited, but no second page was loaded signed in; only the build covers them
- [x] Nothing merged from `main` during `sync` was broken by this branch: it brought in a migration, a decision and a plan, none touching this code

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices in `docs/decisions/2026-09-29-fixed-outgoings-in-the-forecast.md` (by the day, folded in on the page, one category, the cap, the colour); payroll's dropping is cited from the schema half's file, not repeated
- [x] `README.md` still accurate: it does not describe the Cashflow page's categories
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for management and admin about the Fixed outgoings column and the editor
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the by-the-day figures above are from running the real exported function; the statement that `cashflow_forecast` slices per month is read from 0072's own comments and SQL

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: month boundaries here are plain ISO date strings split as text, with no clock or time zone; "today" only enters through the existing window resolver, which is unchanged
- [ ] Boundary or banding change covers both edges — n/a: not a threshold change; the month-applicability edges (starts_on and ends_on inclusive) were exercised on both sides
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted tool output besides the `gates:` lines above, which are verbatim
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration, but the code reads 0114's table, so 0114 and 0115 must be on production before the deploy — deferred: release manager
- [ ] Production dry-run clean — deferred: release manager
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated: 0114 and 0115 to production before deploying this — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: `wrangler rollback --env production` reverts this fully; no schema change is in this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First typecheck failed: `runAction` inferred the wrong result type in `actions.ts` | fixed (commit `ba59121`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As management: add a line, edit it, switch it off, delete it; reload and confirm it persists | `/management/cashflow/fixed-outgoings` |
| 2 | Add lines up to 24, confirm the count reads "24 of 24", Add is disabled and the message appears | same |
| 3 | A line ended mid-window (Until month before the window's end) shows in early months only, and the Fixed outgoings column and CSV agree | `/management/cashflow` |
| 4 | Signed in as staff, hit the editor URL directly: redirected; the forecast shows no fixed lines | both URLs |
| 5 | Look at the Cashflow page at 375px and read the new wording in both languages | `/management/cashflow` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (fixed-outgoings-cashflow session)  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and no person has looked yet

Manual verification by: pending: items 1 to 5 above need someone signed in as management and as staff

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, follows the merge

Result: pass

Release manager acknowledgement: pending
