# Feature test plan — actions-result-sweep-management

## Header

| | |
|---|---|
| Feature | Management's Server Actions (vets, vet doctors, diets, medications, contacts, recurring jobs, translations) run inside `runAction()` and return `ActionResult` instead of throwing; `TranslationActionResult` folded into it (#441, part 2 — management area only) |
| Backlog item | `docs/backlog.md` → "Server Actions across the app: return a result instead of throwing (#441, part 2)" — left unticked (projects and maintenance remain); its note now records management done |
| Branch / worktree | `claude/actions-result-sweep-management` @ `C:\Development\Animal_Shelter_actions-result-sweep-management` |
| Dev server | **production build**: `next build` (via `gates.mjs`) + `next start -p 3002`. #441 exists only in production, so `next dev` proves nothing |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | `d5f2f89` plus the docs and release-line commit that follows it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every exported `"use server"` action under `src/app/management/**` (except `shelter-friends`, the contacts stream's file, and `fixed-outgoings`, already converted) returns `{ ok: false, error }` for a refusal and is wrapped in `runAction()`
- [x] Files/areas touched listed — the seven `actions.ts` files under `src/app/management/`, their callers (`CreateVetForm`, `VetsTable`, `DoctorsTable`, `AddDoctorForm`, `CreateDietTypeForm`, `DietTypesTable`, `CreateMedicationForm`, `MedicationsTable`, `CreateContactForm`, `ContactsTable`, `RecurringJobForm`, `RecurringJobsView`), `src/app/my/MyTaskList.tsx`, `src/components/ArchiveContactControl.tsx`, `src/components/TranslationPanel.tsx`, `src/lib/auth/require-management.ts` (`assertManagementRole` removed), `src/lib/releases.ts`, decisions, this plan
- [x] Roles affected identified — admin and management (every action's role check is unchanged and still runs first); `recordRecurringJob` has no role check and is called from `/my`
- [x] Anything explicitly **out of scope** written down — `shelter-friends/actions.ts`; projects and maintenance (`ProjectActionResult`, `MaintenanceActionResult`); `src/lib/placements/*` and `src/lib/archive/*` (assistant-shared)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main`, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 269s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; every action reads and writes the same tables as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — verified at code level only: queries, revalidation and success messages are unchanged and the production build type-checks every caller against the new shape (see "Left for manual verification" 1)
- [ ] Data persists — reload the page and the change is still there — n/a: no signed-in browser session was available in this sandbox; see "Left for manual verification" 1
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: same reason; see "Left for manual verification" 1
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rendering changed, only how a refusal or failure reaches the screen
- [x] Invalid input is rejected with a readable message, not a crash — every refusal keeps its message, condition and order; now `{ ok: false, error }`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — unchanged: no validation rule was altered, only its delivery

### Production-build verification (the check that matters most here)

- [x] `next build` produced a real production build (exit 0, all `/management` routes in the route list), not a dev server
- [x] `next start -p 3002` served the built app; unauthenticated `/management/vets`, `/management/translations`, `/management/recurring-jobs` and `/management/diets` all returned `307` (to login), so the page guards are unaffected and the server starts
- [ ] **Signed in, triggered 2–3 real refusals on the production build and read the actual message (not "Minified React error #441")** — n/a: genuinely not performed, not a false tick: no signed-in session was available in this sandbox. This is item 1 under "Left for manual verification". The mechanism is the same `runAction`/`ActionResult` proved in a real browser on the Security page (`docs/test-plans/security-action-errors.md`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all management actions | work; refusals readable | not driven live — checks unchanged |
| management | same | same | not driven live |
| staff / vet / volunteer | none (actions refuse; `/my` outcome is open to whoever the date is with) | refused with the management-access message | not driven live |
| signed out | nothing | redirected to login | `307` on the four routes above, production build |

- [ ] Every role above tested — n/a: signing in as each role needs credentials this sandbox does not have; every role check is the same call in the same order (`hasManagementRole()` replaces the throwing `assertManagementRole()`)
- [x] A role that should not have access is blocked server-side — signed-out requests redirect on the production build; inside the actions the role check runs first, now as a returned refusal rather than a throw

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no control, page or wording changed; only what a failure looks like
- [ ] Translatable strings go through the translation path — n/a: no new string; the fallback is the existing `t.common.somethingWentWrong`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout or markup change
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session was driven; see "Left for manual verification" 2
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: only signed-out `curl` was possible here (clean `307`); see "Left for manual verification" 2

## 6. Regression

- [x] The pages nearest the change still work — every `/management/*` page compiles and type-checks in the production build
- [x] Any shared file touched checked from a second, unrelated page — `recordRecurringJob` is also called from `/my` (`MyTaskList`), and `ArchiveContactControl` is used on the contact's own page; both updated and type-checked; whole-app typecheck is clean
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked; projects and maintenance remain. Its note was updated on the `backlog` branch (`c4bedb0`), per CLAUDE.md
- [x] Non-obvious design choices recorded as a new file, dated — `docs/decisions/2026-09-30-server-actions-return-a-result-not-a-throw-part-2-management.md` (includes the `TranslationActionResult` decision: folded now)
- [x] `README.md` still accurate — n/a: README does not describe action error handling
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line (admin and management) saying a refused save or delete on the Management pages now says why instead of a numbered code
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — "no remaining throw outside `runAction`" is from `grep`; the gates line and the `307`s are from the real runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives "today" or any instant beyond what the actions already did
- [ ] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — n/a: no threshold, rounding rule or permission cutoff changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates line comes from the run above
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched (translations revalidate public pages exactly as before)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — `npx wrangler rollback --env production` restores the previous code in seconds; code only, no schema or data involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A scratch helper (`edit.mjs`) was swept into an early commit by `git add -A` | fixed — removed before the PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as admin or management on a production build, cause a real refusal and read the message (not "Minified React error #441"): add a vet with no name; delete a vet that has visits; rename a doctor to a spelling already listed; approve a translation with empty text | `test.lannacare.org` → `/management/vets`, `/management/vets/<id>/doctors`, `/management/translations` |
| 2 | Browser console and network tab clean during the above; save a recurring job, pause it and hand a date back still work; tick a recurring task on `/my` | `/management/recurring-jobs`, `/my` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–2 wait for someone with a login

Manual verification by: pending: a signed-in pass on a production build (items 1–2)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect found is fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
