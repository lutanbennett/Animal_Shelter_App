# Feature test plan — never-assignable-by-card

## Header

| | |
|---|---|
| Feature | Delete the by-name rule (`NEVER_ASSIGNABLE`, `ASSIGNABLE_KEY_FILTER`) that kept `doctor` and `public_viewer` logins off recurring jobs |
| Backlog item | `docs/backlog.md` → **NEVER-ASSIGNABLE BY ROLE NAME** (ticked) |
| Branch / worktree | `claude/never-assignable-by-card` @ `C:\Development\Animal_Shelter_never-assignable-by-card` |
| Dev server | not started — checked by scripts and gates, see Left for manual verification |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | `b89be63c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the rule is deleted (Lutan's choice), no card, no migration
- [x] Files/areas touched listed — `src/lib/recurring-jobs/eligibility.ts`, `eligibility-load.ts`, `src/lib/auth/app-users.ts`, `src/app/management/recurring-jobs/{page.tsx,actions.ts,RecurringJobForm.tsx}` (comments), two check scripts, the registry, backlog, decision file, `releases.ts`
- [x] Roles affected identified — admin and management see the Assigned to list; doctor logins now appear in it; public_viewer has no cells so a linked job is still refused
- [x] Anything explicitly **out of scope** written down — no card, no migration, Doctor card set untouched, `who-does-what` untouched. Found beyond the brief: `eligibility-load.ts` also carried the rule, and `scripts/check-multi-role-build.mjs` asserted it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged, up to date
- [x] `node scripts/gates.mjs` ends clean, exit codes read from the script's own output:

```
=== gates: build exited 0 after 58s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; `app_users` already joins the role, so `role_key` is never null
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-recurring-job-eligibility.mjs` and `check-multi-role-build.mjs` run the real `canDoJob`: a role that holds the cell is eligible, a role without it is not, whatever its name
- [ ] Data persists — n/a: no data written by this change
- [ ] Create / edit / delete all exercised — n/a: the save check (`whoCannotDo`) still runs; only the by-name filter on the live-login query was removed
- [ ] Empty state renders sensibly — n/a: unchanged
- [ ] Invalid input is rejected with a readable message — n/a: unchanged
- [ ] Boundary cases checked — n/a: unchanged beyond the unlinked-page cases V2, V3, V4, N2 asserted in the script

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | recurring jobs page | unchanged | n/a: not driven in a browser |
| management | recurring jobs page | unchanged | n/a: not driven in a browser |
| staff | — | retired | n/a: role retired |
| doctor | listed in Assigned to; refused linked pages it lacks cells for | as written | script V1 and the table assertions; dev read: Doctor holds 3 cards, none is `recurring_jobs` or `my_tasks` |
| volunteer | unchanged | unchanged | n/a: not driven |
| signed out | nothing | nothing | n/a: no route touched |

- [ ] Every role above tested — n/a: eligibility is a pure function checked per role key by the scripts; no page was driven signed in (see Left for manual verification)
- [ ] A role that should not have access is blocked server-side — n/a: this change removes an offer filter only; the database already checked cards only (`reassign_recurring_job`, `record_recurring_job`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe who a job can be given to by role name
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — typecheck and build compile every importer of the removed symbols; `grep` for both names across `src/` finds none left
- [ ] Any shared file touched checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged, already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; no other open item mentions the removed symbols
- [x] Decision file added: `docs/decisions/2026-10-25-never-assignable-by-card.md`
- [x] `README.md` still accurate — it does not mention the rule
- [x] **Release notes.** — `unreleased` gained an admin/management line: the Assigned to list now includes doctors, and unlinked jobs can go to anyone. Production has one live doctor login, so the picker visibly changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the Doctor and public_viewer card counts were read from dev; the doctor-on-unlinked-job change was found by the scripts failing, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates involved
- [ ] **Boundary or banding change** — n/a: no threshold changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in the same PR — n/a: no migration
- [ ] Production `--dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit or redeploy the previous ref on the Pi; nothing in the database changed, so nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-multi-role-build.mjs` asserted a doctor key never counts | fixed — now asserts it counts by cells |
| 2 | info | With the rule gone, a job with no link (or `/residents`, `/my`) asks for no card, so a doctor or public viewer can be given it. The brief assumed cards alone would exclude them | accepted — Lutan chose delete; stated in the decision file and release note; a card those jobs require would be a separate decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as admin or management, open Recurring jobs: the Assigned to list includes the doctor login, and a job linked to a page the Doctor lacks cells for does not offer them | `/management/recurring-jobs` (dev-signin runs at aal1) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

Manual verification by: pending: row 1 above has not been looked at in a browser

Result: pass with accepted defects
