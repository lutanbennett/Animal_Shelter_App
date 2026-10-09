# Feature test plan — remove-staff-role

## Header

| | |
|---|---|
| Feature | App half of "Remove the Staff role": Staff leaves every role picker, the manual, the acceptance matrix and the home screens |
| Backlog item | `docs/backlog.md` → **Remove the Staff role: Lanna's roles are Admin, Management, 2IC, Maintenance, Medical, Vet and Volunteer** (ticked here) |
| Branch / worktree | `claude/remove-staff-role` @ `C:\Development\Animal_Shelter_remove-staff-role` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | #499; the schema half is #498 (merged 2026-10-09, `2efb73fb`) |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | no — `0173` is #498's, already on `main` |
| Tested at SHA | `ad13d59b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — step (4) of the item: Staff out of Security's Create user, Approve and role-change select, `VALID_ROLES`, the manual's role list, the acceptance matrix and the home screens
- [x] Files/areas touched listed — `src/app/admin/security/` (`CreateUserForm`, `AccessRequests`, `UsersTable`, `actions.ts`); `src/lib/manual/` (`types`, `filter`, `en`, `manual-pdf`) and `src/app/manual/page.tsx`; `src/lib/home/tiles.ts`; `src/lib/auth/app-users.ts`; both dictionaries (one error string); `src/lib/releases.ts`; `scripts/acceptance-matrix.mjs`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-home-screens.mjs`; `docs/role-walkthrough.md`, `docs/backlog.md`, `README.md`
- [x] Roles affected identified — admin: no Staff in any picker; an archived Staff login can be re-roled, then restored. Management, doctor, volunteer: the manual's role list and topic tags lose Staff. Staff: nobody live holds it (dev moved, production checked by Lutan)
- [x] Anything explicitly **out of scope** written down — the outreach setting (lists live roles, so Staff dropped off by itself; not changed, checked below); `APP_ACCESS_ROLES` keeps `staff` because it mirrors `private.has_app_access()`, and no live login can hold Staff; error messages using "staff" as an ordinary word ("Only staff and admins can …"); the old dev check scripts with a synthetic Staff principal (decision file); Security offering 2IC / Head of Maintenance / Head of Medical, which it does not today

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — after #498 merged: one conflict in `docs/backlog.md` (main had reworded this item Vet → Doctor), resolved by keeping main's file and re-applying only this branch's four lines; the merge brought in docs only, so the gates below still stand
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 121s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (#498 carries `0173`)
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration; #498's harness covers the database side
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; see #498 for its release blocker

## 4. Functional checks

- [x] Happy path works end to end — signed in on `localhost:3001` as a disposable Management login: `/manual` Roles at a glance lists Admin, Management, Doctor, Volunteer, and the page has no Staff anywhere; `/releases` shows the new line under Not released yet; `/home` shows Recurring jobs, Intake, Residents, My tasks; console clean on all three
- [ ] Data persists — n/a: nothing new is saved; the role writes are unchanged code paths, and the refusal is #498's trigger
- [ ] Create / edit / delete all exercised — n/a: Security needs a 2-step admin session; left for manual verification below
- [ ] Empty state renders sensibly — n/a: no list that can now be empty
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not checkable in the browser without a 2-step admin (Security, below); server-side `VALID_ROLES` refuses `staff` with "Invalid role." and Restore of a retired-role login returns the new `retiredRole` message, checked by typecheck and by reading the action
- [x] Boundary cases checked — the outreach setting's own query run on dev returns `2IC, Doctor, Head of Maintenance, Head of Medical, Management, Volunteer`: no Staff, no code change
- [x] Acceptance matrix — `node scripts/acceptance-matrix.mjs --check`: `ok — 74 manual topics → 107 activities, 39 walkthrough lines + 3 visitor lines`; the PDF edition generated with `--pdf`, and `node scripts/check-acceptance-pdf.mjs`: `all passed` (its pagination and per-role sheet checks included), with no code change to the PDF builder
- [x] Home screens — `scripts/check-home-screens.mjs`: `all ok` after its Staff cases were removed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security pickers | no Staff offered | left for manual verification (2-step) |
| management | manual, releases, home | no Staff view or tags | checked in the browser |
| doctor | manual | no Staff | same page and filter as management; not separately signed in |
| volunteer | manual | no Staff | same as doctor |
| staff | nothing | retired | #498 |
| signed out | n/a | n/a | n/a — no public page changed |

- [x] Every role above tested — as stated in the table; the ones not signed in share the page checked
- [x] A role that should not have access is blocked server-side — `VALID_ROLES` (server action) and #498's trigger both refuse Staff

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated — role list, role summaries (Management's no longer says "everything staff can do"), every topic's tags, and a new line in Accounts and roles about the retirement and restoring an archived Staff login
- [x] Translatable strings go through the translation path — the one new string, `admin.security.errors.retiredRole`, is in both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: no layout changed; a picker lost an option
- [x] Browser console clean — no errors on `/manual`, `/releases`, `/home`
- [ ] Network clean — n/a: no new request

## 6. Regression

- [x] The pages nearest the change still work — manual, releases and home checked; the manual PDF builder typechecks with the four-role order
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/manual/en.ts` edits limited to the role list, tags and the Security topic; `/releases` reads `isForRole` (now taking any role string) and still filters to Management
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran on it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — with the production and dev outcome; notes added to *A Senior Staff role*, *Roles and permissions each shelter configures* and *Review the staff dry-run report* saying what this changes for each, none of them closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-staff-role-removed.md` (in #498)
- [x] `README.md` still accurate — roles table: Staff marked retired, Management no longer described as "Staff's access plus"
- [x] **Release notes.** — `unreleased` gained a line for Admin and Management: Staff is no longer a role, what Security no longer offers, and how to restore an archived Staff login
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the outreach list from its own query on dev; the matrix and PDF from their scripts; the pages in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates and script output above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; ship it in the same release as #498, whose blocker applies: before `0173` reaches production, nobody live may hold Staff there
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Production backup for a destructive migration — n/a: no migration
- [x] Apply plan stated — #498's `0173` with the release that carries this PR

### Rollback

- [x] Rollback position stated — a code rollback brings the Staff option back to the pickers, and the database (`0173`) refuses it with a readable message; nobody loses access

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Once `0173` refuses a retired role, Restore on an archived Staff login would fail with "something went wrong", and its role select was locked because the login was archived | fixed: the select stays open for a retired role, and Restore says to choose another role first |
| 2 | low | Security can give only the enum roles; 2IC, Head of Maintenance and Head of Medical are not in its pickers | accepted, out of scope: not caused by this change; nobody on production needs moving to one |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Create user's role list has no Staff, and starts on Volunteer | Settings → Security (admin, 2-step) |
| 2 | An access request's role list has no Staff | Settings → Security → Access requests |
| 3 | A user's role dropdown has no Staff; an archived former Staff login shows Staff greyed, its dropdown can be changed, and Restore before that says to choose another role | Settings → Security, users table (dev has 12 archived `@example.test` Staff logins) |
| 4 | *Who may write outreach notes* has no Staff | Settings → Security |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; four Security checks need an admin with 2-step, listed above

Manual verification by: pending: the four items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, with #498's blocker

Result: pass
