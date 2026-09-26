# Feature test plan

## Header

| | |
|---|---|
| Feature | Recurring jobs: Management page and the My tasks loader (feature half of `0095`) |
| Backlog item | `docs/backlog.md` → Resident operations → "Recurring jobs for staff, feeding My dashboard" (with the 2026-09-26 "reassigning one week" addition) |
| Branch / worktree | `claude/recurring-jobs` @ `C:\Development\Animal_Shelter_recurring-jobs` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #160 |
| Tested by / date | Claude (recurring-jobs session), 2026-09-26, signed in as Lutan (admin) in the browser pane |
| Carries a migration? | no — builds on `0095` (#155), already applied to dev and production |
| Tested at SHA | the commit adding this file (browser checks ran on `15dae22` plus the "Next dates" fix in this commit, re-checked after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: management sets up jobs that repeat on a calendar (Management → Recurring jobs, with a preview of the next dates, pause, reassign, and a hand-over for sick weeks and leavers), and each date appears on the assignee's My tasks to be marked done or skipped, staying overdue until it is
- [x] Files/areas touched listed: new `src/app/management/recurring-jobs/` (page, view, form, actions), new `src/lib/recurring-jobs/` (rule, queries, access), new `src/lib/my-tasks/recurring.ts`; changed `src/lib/my-tasks/types.ts`, `src/app/my/` (page, list), `src/app/NavPane.tsx` (badge), `src/app/management/page.tsx` (tile), `src/components/hub-icons.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin and management (the page; recording any job); staff, vet and volunteer (the My tasks section, recording their own dates); signed-out public unaffected
- [x] Anything explicitly **out of scope** written down: no automatic reassignment when a login is archived (the page flags it and offers a one-step hand-over instead); no history page beyond the latest 30 outcomes; job titles are not machine-translated (decisions.md); `NavLinks.tsx` untouched because Management is a single link to its tile page

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in #157 and #158, `0096`/`0097`; no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed, run after the sync:

```
=== gates: build exited 0 after 62s

gates: typecheck=0 lint=0 build=0
```

(Re-run after the "Next dates" fix; the first run, straight after the sync, also ended `typecheck=0 lint=0 build=0`.)

- [x] CI green on the PR (#160): check, migration-numbers and test-plan all passed on e7e338b

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0095` shipped in #155
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (`0095` was already applied to dev and production)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows in a harness — n/a: no migration; `0095`'s own harness (`scripts/check-recurring-jobs.mjs`) covers the rule, triggers and functions this feature calls
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

All on dev in the browser pane, with test jobs created through the form and, where a past date was needed, `overdue_from` moved back with one SQL update (dev data is disposable).

- [x] Happy path works end to end: created "Stocktake of on-hand medication" (Fri + Sat, morning, links to `/stocktake`, two assignees) and "Order and buy medication" (Sat, afternoon, after the stocktake) through the form; both appeared on `/my` for today, the order job saying "Waiting for Stocktake of on-hand medication"; marking the stocktake Done with a note removed it at once, and after the refresh the order job no longer waited
- [x] Data persists: the Done row was in `recurring_job_occurrences` with the note and `done_by` = the signed-in login; the Management page's Recently done listed it after a reload
- [x] Create / edit / delete all exercised: create (above); Edit reopened the stocktake with every field as saved (title, time, link preset, Fri/Sat pressed, start date, both assignees, active) and changing a weekday showed the "starts the missed-dates count again" note; Delete on a job with history was refused with "This job has been marked done or skipped before, so it is kept for the record…"; Pause removed all its rows from `/my`, overdue included; Resume brought today back but not the old overdue dates (`overdue_from` moved to today by the `0095` trigger)
- [x] Empty state renders sensibly: before any job, the page said "No recurring jobs yet…", Handed to someone else "No dates are handed over", Recently done "Nothing has been marked yet"
- [x] Invalid input is rejected with a readable message: the preview reports rule problems in words from `ruleProblem()` (e.g. no weekday ticked), and the server re-checks every field before writing; the delete refusal above is the database's own FK error translated
- [x] Boundary cases checked, against real calendar dates, all through the SQL evaluator:
  - fortnightly Monday starting Wed 7 Oct 2026 → first date **Mon 19 Oct**, then 2 Nov, 16 Nov (the `0095` anchoring)
  - first Monday monthly from 1 Oct 2026 → 5 Oct, 2 Nov, 7 Dec, 4 Jan 2027, 1 Feb 2027, 1 Mar 2027; with every = 2 → 5 Oct, 7 Dec, 1 Feb
  - monthly on day 31 → Wed 30 Sep, Sat 31 Oct, Mon 30 Nov (clamped to the month's last day)
  - overdue: dates 18, 19 and 25 Sep showed as 8, 7 and 1 days late; a skipped 18 Sep left the list
  - future: Fri 2 Oct listed under Coming up with Skip enabled and Done disabled ("Can be marked done on the day")
  - a job with no link shows a plain title, not a link

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/recurring-jobs`, `/my` | everything; can record any job | as expected (signed in as Lutan, admin) |
| management | `/management/recurring-jobs`, `/my` | same as admin | not signed in as this role: same `canManage` gate as every Management page; left for manual verification |
| staff | `/my` | Recurring jobs section with their own dates; no Manage link; `/management/recurring-jobs` redirects | not signed in as this role; left for manual verification |
| vet | `/my` | Recurring jobs section (no maintenance) | not signed in as this role; left for manual verification |
| volunteer | `/my` | Recurring jobs section; can mark their own dates | not signed in as this role; left for manual verification |
| signed out | `/management/recurring-jobs` | redirected to `/login` | as expected: redirected to `/login?next=%2Fmanagement%2Frecurring-jobs` before sign-in |

- [ ] Every role above tested — n/a: only admin and signed-out were available in the browser pane; the other roles are in Left for manual verification
- [x] A role that should not have access is blocked server-side: the page calls `requireManagementUser()` and every write action `assertManagementRole()`; recording goes through `record_recurring_job()`, whose per-role refusals the `0095` harness asserts; signed-out was redirected by hitting the URL directly

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: `NavLinks.tsx` is unchanged on purpose, because Management is one link to its tile page. The new tile was loaded at `/management` and links to `/management/recurring-jobs` with its description; the My tasks badge counted 4, then 3, matching the rows on `/my` each time
- [x] Manual updated (`src/lib/manual/en.ts`): My tasks intro, a new "Doing your recurring jobs" topic, and a new Management topic "Setting up recurring jobs"
- [ ] Translatable strings go through the translation path — n/a: job titles are staff-written instructions, not public text, so there is no translation row (decisions.md); UI strings are in both dictionaries and the Thai page rendered (rule wording, Buddhist-era dates)
- [ ] Mobile viewport (375px) — n/a: checked at the pane's 590 px only; layout is single-column flex-wrap. Left for manual verification on a phone
- [x] Browser console clean — no errors or React warnings (only React DevTools / HMR / Fast Refresh lines)
- [x] Network clean — every request in the dev server log returned 200

## 6. Regression

- [x] The pages nearest the change still work: `/my` still lists and renders the maintenance job ("[mydash] Overdue gate latch", 3 days late, status buttons); `/management/recurring-jobs` in Thai and English
- [x] Shared files checked from a second page by loading it: `/my` (maintenance section with the shared `MyTaskList`, whose `href`/action types changed) and the nav badge on every page (`NavPane`)
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated ("Recurring jobs: the feature")
- [x] `README.md` still accurate (it does not list Management pages)
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for recurring jobs, written for a shelter user
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the dates, the hand-over counts (4 dates, then 1, then 2 jobs moved) and the pause / resume behaviour were all observed on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] Timezone-sensitive behaviour proved — deferred: release manager (check `/my` on `test.lannacare.org` between 00:00 and 07:00 Thai: today's jobs must be the Thai date's. The code takes today from `todayIso()`, which is fixed to Asia/Bangkok, and every rule date comes from SQL `date` arithmetic that `0095`'s harness ran at UTC+14 and UTC−11)
- [ ] For a boundary or banding change, both edges covered — n/a: no existing band changed; the new "days late" and Coming-up window were checked at 1, 7 and 8 days late and at +6 days
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates lines; the dates as the preview printed them)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration; `0095` is already on production (#152's plan)
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` removes the page and the My tasks section together; `0095` stays (additive, and nothing else reads it). Any jobs created meanwhile stay in the tables and reappear on redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Handed to someone else read "claude instead of claude, Lutan" when one of two assignees was covered | fixed: names only the people the cover replaced |
| 2 | low | A job card's team list had a space before each comma | fixed |
| 3 | low | A job card's Next dates still listed today after it was marked done | fixed: dates already done or skipped are left out |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a staff member or volunteer on a job: the Recurring jobs section shows their dates with no Manage link; Done / Skip work; `/management/recurring-jobs` redirects away | `/my` signed in as a staff or volunteer login |
| 2 | A date handed to someone else disappears from the usual person's list (checked as admin) and appears on the cover's with "handed to you" (checked as admin only, on a date handed to the admin) | `/my` as the cover |
| 3 | An archived login on a job: the card shows the name struck through with "(left)", the red banner counts it, and Hand over "From now on" clears it | `/management/recurring-jobs` after archiving a test login |
| 4 | The page and My tasks read well on a phone (375 px) | both pages |
| 5 | The wording of the page, the two manual topics and the Thai strings is right for the shelter | `/management/recurring-jobs`, `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (recurring-jobs session)  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; five items wait for Lutan

Manual verification by: pending: the five items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (#160 description)
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass

Release manager acknowledgement: pending
