# Feature test plan — access-requests-status-card

## Header

| | |
|---|---|
| Feature | An Access requests card on Settings → System status, and a Review access requests task on every admin's My tasks, both showing only how many are waiting and how long the oldest has waited |
| Backlog item | `docs/backlog.md` → "System status: a card showing access requests awaiting approval." |
| Branch / worktree | `claude/access-requests-status-card` @ `C:\Development\Animal_Shelter_access-requests-status-card` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-28 |
| Carries a migration? | no |
| Tested at SHA | `bee1afb` (feature `3d8a50a` + `origin/main` merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the card as the item describes, plus a My tasks row for all admins that Lutan asked for in chat on 2026-09-28 ("a one off task", not a recurring job)
- [x] Files/areas touched listed — new `src/lib/auth/access-requests.ts` (the one definition of "waiting"), `src/lib/status/access-requests.ts` (the check, cached), `src/lib/my-tasks/access-requests.ts` (the task source); edited `src/app/admin/status/page.tsx`, `src/app/admin/security/page.tsx` and `actions.ts`, `src/app/my/page.tsx` and `MyTaskList.tsx`, `src/app/NavPane.tsx` (badge), `src/lib/status/run.ts` (`forgetCached`), `src/lib/my-tasks/types.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`; new `scripts/check-access-requests-card.mjs`. No `worker/`, no migration
- [x] Roles affected identified — admin only. Staff, management, vet and volunteer can't open `/admin/status` and get no task source; signed-out users reach neither page
- [x] Anything explicitly **out of scope** written down — no mail for a waiting request (Lutan chose "card only" in chat, 2026-09-28); the card is not in `runHealthChecks()`, so the alert schedule never sees it; the Security page's list and actions are unchanged apart from calling the shared helper

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts`, because release `0.8.1` was cut on `main` and emptied `unreleased`. Resolved by keeping only this PR's line, after checking by script that every other line on the branch side was already in the `0.8.1` entry (`not in a release: 0`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 355s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the count reads existing `auth.users` and `user_roles` only
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

`node scripts/check-access-requests-card.mjs` against dev and this worktree's
server (`http://localhost:3016`), at `bee1afb`. It makes a throwaway admin
signed in with a password only (aal1 — no 2-step), a throwaway staff login, and
a no-role login with a distinctive name and email, fetches the pages as those
users, and deletes all three at the end. Output, unedited:

```
  ok   an aal1 admin opens /admin/status (200)
  dev already has 0 waiting
  waiting 61 s for the status cache to expire…
  ok   the card counts the new request (1 = 0 + 1)
  ok   the card links to Settings → Security
  ok   the link goes to /admin/security
  ok   no name or email on /admin/status (none)
  ok   the admin opens /my (200)
  ok   My tasks has Review access requests
  ok   the task says 1 waiting
  ok   no name or email on /my (none)
  ok   the My tasks badge counts it
  ok   staff get no card on /admin/status (200)
  ok   staff have no Review access requests task
  ok   no name or email for staff either
  ok   Security still sends an aal1 admin to the step-up (200)
  ok   no name or email in Security's response to an aal1 admin
  archived the requester; waiting 61 s again…
  ok   an archived login is not counted (0 = 0)
  deleted 3 throwaway login(s)

All expectations held.
```

- [x] Happy path works end to end — a new no-role login shows on the card as `1 access requests waiting`… counted, linked to Security, and appears as the admin's My tasks row with the badge
- [x] Data persists — reload the page and the change is still there — the card is read-only; the count was re-read on three separate page loads and each matched the database at that moment
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: nothing on the card or the task writes; granting a role stays on Security, which is unchanged apart from calling the shared helper
- [x] Empty state renders sensibly (no rows yet) — dev had 0 waiting before and after; the "0 = 0" line is the card rendering its none state with no count text
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input. A failed count is a red tile through `runCheck`, as with every other status tile
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — zero and one waiting; an **archived** login (role row with `archived_at`) is not counted. The "oldest" age is whole days from `created_at`, with "the oldest from today" under one day

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/status` card, `/my` task, badge | at aal1: count and age, no name or email | as expected (script) |
| management | neither | `/admin/status` is admin-only (`requireAdminUser`, unchanged); the task source is added only for `role === "admin"` | by code, same branch as staff |
| staff | neither | no card, no task | as expected (script) |
| vet | neither | as staff | by code, same branch as staff |
| volunteer | neither | as staff | by code, same branch as staff |
| signed out | neither | sent to sign in (unchanged) | unchanged — neither page's auth was touched |

- [x] Every role above tested — admin and staff driven by the script; management, vet and volunteer take the same `role === "admin"` false branch as staff, in both `src/app/my/page.tsx` and `src/app/NavPane.tsx`, and `/admin/status`'s `requireAdminUser()` is unchanged
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — staff fetching `/admin/status` directly got no card content

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added; the only nav change is the My tasks badge count, checked by the script
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — a step in System status and a new admin topic "Access requests on My tasks"; the build compiled them. How they read on the page is in the manual list below
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: UI strings are in both dictionaries (`en.ts`, `th.ts`); `/management/translations` is for record text, and nothing here is record text
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven; the card uses the existing `Tile` grid and the task the existing row. Left for manual verification below
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session could be signed in by Claude (that would mean typing a password that goes to Supabase); left for manual verification
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every page the script fetched returned 200; server log showed no errors during the runs

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin/status` (the other sections still render around the card), `/my`, `/admin/security` (still redirects an aal1 admin to the step-up)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `NavPane.tsx` renders on every app page; `/my` and `/admin/status` both loaded with it, the badge rendering on `/my`. `run.ts` gained a function only; `/admin/status`'s health tiles still loaded through it
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green at the merge commit `bee1afb`, and the check script ran at that commit

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-28: count not people, one definition, outside the health report, no mail (Lutan), the derived task (Lutan), cache forgotten on Security changes
- [x] `README.md` still accurate — it does not describe the status tiles or My tasks sources
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. — one admin-only line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "no name or email", "archived not counted", "staff get neither" and "the badge counts it" are each script assertions above; the Security page's streamed 200 redirect was found by running it, and the check adjusted to it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the task's date is `todayIso(created_at)` through the existing shelter-timezone helper, and a request dated either side of midnight is overdue or due today, both of which count towards the badge the same way
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band; the one boundary (zero vs one waiting) was checked in both directions
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added; the count uses the existing service-role key

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — `npx wrangler rollback --env production` removes the card and the task entirely; there is no schema or stored data to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first draft computed the oldest's age with `Date.now()` in a server component, which lint (`react-hooks/purity`) refused | fixed — computed in the count helper and carried as `oldestDays` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The card reads well and sits sensibly at the top of the page, in English and Thai, with someone waiting and with nobody waiting | `/admin/status` as an admin (no step-up needed) |
| 2 | The Review access requests row on My tasks, its wording and the menu badge, in English and Thai; tapping it goes through the step-up to Security, and approving the person clears it | `/my` as an admin |
| 3 | Both at 375px, and the browser console clean | same pages |
| 4 | The two manual passages read well | `/manual` → System status, and My tasks → Access requests on My tasks |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** — n/a: the list is not empty; this is Lutan's to tick after looking

Manual verification by: pending: the four items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass
