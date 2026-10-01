# Feature test plan — actions-result-sweep-maintenance

## Header

| | |
|---|---|
| Feature | The Maintenance Server Actions (create, edit, set status, delete job; delete attachment) run inside `runAction()` and return `ActionResult`; `MaintenanceActionResult` and `MaintenanceFormState` folded into it (#441, part 2 — maintenance, the last area; the item is ticked) |
| Backlog item | `docs/backlog.md` → "Server Actions across the app: return a result instead of throwing (#441, part 2)" — **ticked on this branch** — maintenance was the last area; note rewritten |
| Branch / worktree | `claude/actions-result-sweep-maintenance` @ `C:\Development\Animal_Shelter_actions-result-sweep-maintenance` |
| Dev server | **production build**: `next build` (via `gates.mjs`) + `next start -p 3004`. #441 exists only in production, so `next dev` proves nothing |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | the sync merge commit on this branch (gates run after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every exported action in `src/app/maintenance/actions.ts` is wrapped in `runAction()` and returns `{ ok: false, error }` for a refusal, so an unplanned failure (Supabase or Drive rejecting) shows a message with a reference instead of "Minified React error #441"
- [x] Files/areas touched listed — `src/app/maintenance/actions.ts`, its callers `MaintenanceBoard.tsx`, `MaintenanceForm.tsx`, `[id]/MaintenanceJobView.tsx` and (outside the tree, caught by `tsc`) `src/app/my/MyTaskList.tsx`, `src/lib/releases.ts`, `docs/backlog.md`, decisions, this plan. No helper under `src/lib/` changed
- [x] Roles affected identified — staff/admin/management who can open `/maintenance`; a vet is refused by the `requireRole(isShelterRole)` route guard before any action is reachable (unchanged); a volunteer's write is filtered by RLS to zero rows and refused with `notAuthorized` ("You don't have permission to change maintenance jobs."), as before
- [x] Anything explicitly **out of scope** written down — `src/lib/maintenance/*`, `src/lib/placements/*`, `src/lib/archive/*` helpers; what is stored — only how a refusal is returned changed. The closing grep found `throw new Error` only in internal helpers called inside `runAction` bodies, so nothing was filed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main`, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 238s

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

- [x] `next build` produced a real production build (exit 0, all `/maintenance` routes in the route list), not a dev server
- [x] `next start -p 3004` served the built app; unauthenticated `/maintenance` and `/maintenance/new` both returned `307` (to login), so the page guards are unaffected and the server starts
- [ ] **Signed in, triggered 2–3 real refusals on the production build and read the actual message (not "Minified React error #441")** — n/a: genuinely not performed, not a false tick: no signed-in session was available in this sandbox. This is item 1 under "Left for manual verification". The mechanism is the same `runAction`/`ActionResult` proved in a real browser on the Security page (`docs/test-plans/security-action-errors.md`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin / management / staff | job actions | work; refusals readable | not driven live — checks unchanged |
| volunteer | read-only; RLS filters their writes to zero rows | `notAuthorized` refusal, as before | not driven live |
| vet | nothing under `/maintenance` | refused by `requireRole(isShelterRole)` before any action; unchanged | not driven live |
| signed out | nothing | redirected to login | `307` on `/maintenance` and `/maintenance/<id>`, production build |

- [ ] Every role above tested — n/a: signing in as each role needs credentials this sandbox does not have; no role check changed (RLS decides, as before)
- [x] A role that should not have access is blocked server-side — signed-out requests redirect on the production build; inside the actions the role check runs first, now as a returned refusal rather than a throw

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no control, page or wording changed; only what a failure looks like
- [ ] Translatable strings go through the translation path — n/a: no new string; the fallback is the existing `t.common.somethingWentWrong` (EN and TH)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout or markup change
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session was driven; see "Left for manual verification" 2
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: only signed-out `curl` was possible here (clean `307`); see "Left for manual verification" 2

## 6. Regression

- [x] The pages nearest the change still work — `/maintenance` and `/maintenance/[id]` compile and type-check in the production build
- [x] Any shared file touched checked from a second, unrelated page — n/a in effect: nothing shared was touched; `FolderGrid` is used on both `/maintenance` and `/maintenance/[id]` and is type-checked in both
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — ticked, and the "remaining area" note replaced with the completion record
- [x] Non-obvious design choices recorded as a new file, dated — `docs/decisions/2026-10-01-server-actions-return-a-result-not-a-throw-part-2-maintenance.md`
- [x] `README.md` still accurate — n/a: README does not describe action error handling
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line saying a failure while saving, moving, completing or deleting a maintenance job or its photos now shows a short reference instead of a numbered code, and the line says the fix now covers the whole app
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
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched; what the story gallery serves is unchanged

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
| – | – | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in on a production build, cause a refusal or failure and read the message (not "Minified React error #441"): save a job with no title; drag a card to a new status column and set status from the job page; delete a job and a photo; as a volunteer attempt an edit and read "You don't have permission to change maintenance jobs."; as a vet open `/maintenance` and confirm the refusal page | `test.lannacare.org` → `/maintenance`, `/maintenance/<id>` |
| 2 | Browser console and network tab clean during the above; a status change that returns a Drive warning still shows it, on the board, the job page and `/my` | `/maintenance/<id>` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–2 wait for someone with a login

Manual verification by: pending: a signed-in pass on a production build (items 1–2)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect found is fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
