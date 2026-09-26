# Test plan — my-dashboard

## Header

| | |
|---|---|
| Feature | My tasks (`/my`): the signed-in person's open maintenance jobs, grouped overdue / due today / coming up / no date, with the team, quick status changes through the existing action, and a menu badge, as the app's home page after sign-in and from "Open the app"; built on a common `MyTask` shape so later sources plug in |
| Backlog item | `docs/backlog.md` → My dashboard — "what I need to do today", starting with my maintenance jobs |
| Branch / worktree | `claude/my-dashboard` @ `C:\Development\Animal_Shelter_my-dashboard` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this branch; see the PR page |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `0bcb031` (browser checks, role matrix, gates); `6969a6b` after the home-page change (landing checks, gates) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a `/my` page, first in the menu for every role, listing every maintenance job the reader is on that isn't Completed, grouped by due date, with status, place, team and a link to `/maintenance/[id]`, quick status changes through `setMaintenanceStatus` (no new write path), an empty state, and the common task shape for later sources
- [x] Files/areas touched listed: new `src/app/my/{page.tsx,MyTaskList.tsx}`, new `src/lib/my-tasks/{types.ts,maintenance.ts}`; `src/app/NavLinks.tsx` (one entry + badge title), `src/app/NavPane.tsx` (badge count), `src/components/hub-icons.ts` (icon), `src/lib/maintenance/queries.ts` (`ids` filter on the loader), `src/lib/auth/next-path.ts` + `app-access.ts` (landing: `/my`), `src/app/adopt/PublicHeader.tsx` (Open the app), `src/app/account/password/actions.ts` (continue after a forced change), `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `README.md`, `docs/decisions.md`, `docs/backlog.md`. No `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: admin, management, staff (see and change their jobs); volunteer (sees their jobs, read-only); vet (menu entry and empty state — no maintenance access); public viewer and signed out (refused by the existing proxy)
- [x] Anything explicitly **out of scope** written down: the other sources (vet trips, medications, stock orders) and their assignees; recurring jobs (separate backlog item); landing was raised on the PR and Lutan decided it (2026-09-26): `/my` is the app's home, `/` stays the public home — done in this PR. `src/lib/manual/th.ts` does not exist (the manual is English only), so there is no Thai manual topic to add

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date." at `0bcb031`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. At `0bcb031` (output was piped through `tail`, which cut the typecheck and lint lines; the closing line carries all three exit codes):

```
=== gates: build exited 0 after 478s
gates: typecheck=0 lint=0 build=0
```

  At `6969a6b` (after the home-page change; sync "Already up to date."):

```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 100s
=== gates: build exited 0 after 161s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: `check`, `migration-numbers` and `test-plan` all passed at `6ec00fe`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; assignment (0063) and due date (0033) already exist
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the page reads existing `maintenance` / `maintenance_assignees` rows unchanged
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

All in the built-in browser against `next dev` on :3006, dev database. Throwaway logins made for this — `mydash-staff`, `mydash-volunteer` and `mydash-empty` `@example.test` — signed in with sessions minted by `auth.admin.generateLink` + `verifyOtp` (no passwords), and six `[mydash]` jobs: overdue (Not started), due today (In progress, team of staff + volunteer), due in 10 days (Blocked, zone-wide), undated (team of staff + volunteer), a Completed one and one assigned only to the volunteer. Left on dev (disposable).

- [x] Happy path works end to end: as staff, `/my` showed Maintenance (4) in four groups — Overdue, Due today, Coming up, No due date — each row with its code, zone › enclosure (or Zone-wide), due date, "With Mydash Volunteer" on the team jobs, and the four status buttons with the current one highlighted. The Completed job and the volunteer-only job were not listed. The title links to `/maintenance/[id]`; Open the board goes to `/maintenance?assignee=me`
- [x] Data persists — the overdue job set to In progress was still In progress after the refresh; the due-today job marked Completed left the list and stayed gone after navigating back to `/my`; Undo put it back to In progress, and it was there after reload
- [x] Landing (Lutan's decision on the PR): signed in as staff, "Open the app" on `/adopt` has `href="/my"` and clicking it opened My tasks; signed out, then a password sign-in at `/login` (no `?next=`) as the dev test admin landed on `/my` with the empty state. Not driven: `?next=` still winning and the forced-password "continue" — both only swap the constant, `signedInLandingPath()`'s `next ?? DEFAULT_SIGNED_IN_PATH` is unchanged
- [x] Create / edit / delete all exercised (whichever the feature has): the only write is the status change, through the existing `setMaintenanceStatus` — driven for In progress, Completed, and Undo back to In progress. The badge went 2 → 1 → 2 with them
- [x] Empty state renders sensibly: `mydash-empty` (staff, no jobs) sees "Nothing is assigned to you right now." and no badge on the menu entry
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no free input; the only input is a status button, whose value is one of the four statuses, and the action validates it as before
- [x] Boundary cases checked: a zone-wide job (no enclosure) reads "Lifecycle › Zone-wide"; a job with no due date lands in No due date; the due-date groups tested at fixed instants with the real `dueBucket()` and `todayIso()` under both `TZ=Asia/Bangkok` and `TZ=UTC` — 23:59:59 Thai on the 25th, 00:00 and 06:59 Thai on the 26th (the window where UTC still says the 25th), year end and the 2028 leap day, each with the day before, the day itself and the day after. Every run gave overdue / today / later / none identically under both zones:

```
--- TZ=UTC
23:59:59 Thai on the 25th                          today=2026-09-25  2026-09-24=overdue  2026-09-25=today  2026-09-26=later  null=none
00:00 Thai on the 26th                             today=2026-09-26  2026-09-25=overdue  2026-09-26=today  2026-09-27=later  null=none
06:59 Thai on the 26th (UTC still says the 25th)   today=2026-09-26  2026-09-25=overdue  2026-09-26=today  2026-09-27=later  null=none
00:00 Thai, 1 Jan (year end)                       today=2027-01-01  2026-12-31=overdue  2027-01-01=today  2027-01-02=later  null=none
00:00 Thai, 29 Feb 2028 (leap day)                 today=2028-02-29  2028-02-28=overdue  2028-02-29=today  2028-03-01=later  null=none
```

### Role access matrix

Admin and management: the `mydash-staff` login's `user_roles.role` switched on dev between requests (the proxy reads the role per request), `/my` fetched with its session cookie. Vet: `mydash-empty` switched to `vet` and loaded in the browser. Both logins were switched back to `staff` afterwards.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/my` | 200, own four jobs, status buttons | pass (200, 4 jobs, 16 status radios) |
| management | `/my` | 200, own four jobs, status buttons | pass (200, 4 jobs, 16 status radios) |
| staff | `/my` | 200, own four jobs, status buttons; badge | pass (browser and fetch) |
| vet | `/my` | menu entry, empty state, no maintenance query | pass ("Nothing is assigned to you right now.", no errors) |
| volunteer | `/my` | own jobs incl. one not on staff's list, status shown, no buttons | pass (Overdue: "Someone else's job"; Due today; No due date — status text, no buttons) |
| signed out | `/my` | sent to sign-in | pass (307 → `/login?next=%2Fmy`) |

- [x] Every role above tested; also `public_viewer`: 307 → `/`
- [x] A role that should not have access is blocked server-side: signed out and `public_viewer` are redirected by the proxy on a direct `GET /my`. A volunteer's status change would be refused by RLS in `setMaintenanceStatus` as it is from the board; the page doesn't offer the buttons (`action: null`)

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — My tasks is first for staff, volunteer and vet (seen), and admin/management (same list; `/my` loaded for both); the badge shows the due-today-or-overdue count (2 for staff, 2 for the volunteer) and disappears at 0 (`mydash-empty`)
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: new "My tasks" section with "Seeing what's assigned to you", in the contents and on the page; the menu description in Getting started now names My tasks first
- [ ] Translatable strings go through the translation path — n/a: no new user-typed text; the page shows job titles through the existing approved-translation lookup (0057, `localizedFromRow`), and its own labels are in both dictionaries (Thai checked on the page)
- [x] Mobile viewport (375px) — no overflow, controls reachable: `/my` in Thai as staff, `scrollWidth` 385 = `innerWidth` 385, status buttons wrap under each job
- [x] Browser console clean — no errors on `/my` (staff, volunteer, empty, vet) or `/manual`
- [ ] Network clean — n/a: not inspected request by request; every page load and status change above returned its content, and the dev server log showed no errors

## 6. Regression

- [x] The pages nearest the change still work: `/maintenance?assignee=me` (Open the board), `/maintenance/[id]` (title link), `/manual`
- [x] Shared files checked from a second, unrelated page by loading it: the menu (`NavLinks.tsx`, `NavPane.tsx`) on `/manual` with all its other entries and the footer group; `maintenance/queries.ts`'s new `ids` filter is additive, and `/maintenance` loaded the board as before
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync was "Already up to date."

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-26, "My tasks (`/my`): one task shape, one loader per source" — the contract the next source builds against
- [x] `README.md` still accurate: `src/lib/my-tasks/` added to the project structure
- [x] **Release notes.** One line added to `unreleased`: My tasks, at the top of the menu, with the badge
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "several seconds" for the Drive move behind Completed was seen in the browser (the banner arrived only after the action returned, which is why it was moved ahead of it); the date grouping was run at fixed instants under two zones (§4); the role behaviour was driven. The one reasoned claim — that a server component can't pass a closure to a client component — is how React Server Components work, stated as the reason for the design

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (a staff login with jobs sees them on `/my`, grouped, with the badge)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: release manager, for the deployed half. The logic half is proved above (§4, fixed instants under `TZ=UTC`); `/my` and the badge both take "today" from `todayIso()`, which is Asia/Bangkok whatever the runtime's zone
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the only band is the day itself, and §4 asserts the day before, the day and the day after at each boundary instant
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, for the deploy output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed; `/my` is behind sign-in

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; it reads 0033 and 0063, both on production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. Code-only: `npx wrangler rollback` fully reverts it; status changes made from `/my` meanwhile are ordinary maintenance edits and stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | "Marked Completed — Undo" appeared only after the action returned, several seconds after the row had gone (the Drive folder move) | fixed: shown as soon as the button is pressed, cleared on error |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The page reads well to someone who does the jobs: the group names, the status buttons beside each job, the badge's meaning (due today or overdue) | `/my` as a staff login with jobs |
| 2 | The Thai wording of the new labels (งานของฉัน, the group names, "ร่วมกับ …", the Undo line) | `/my` with ไทย selected |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: Lutan Bennett — confirmed in chat ("looks good"); line written by Claude at their request  Date: 2026-09-26

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links `docs/test-plans/my-dashboard.md` and summarises it; the file is the record
- [ ] Handed to the production release manager — n/a: not yet — handed over at release time

Result: pass

Release manager acknowledgement: pending: at release time
