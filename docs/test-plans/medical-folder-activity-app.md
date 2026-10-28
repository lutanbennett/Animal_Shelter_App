# Feature test plan — medical-folder-activity-app

## Header

| | |
|---|---|
| Feature | App half: filing into the Medical folder asks `photos.medical_add` everywhere (uploader, Move, upload routes, `/medical/photos`) |
| Backlog item | `docs/backlog.md` → **THE RESIDENTS CARD CAN FILE PHOTOS INTO THE MEDICAL FOLDER, AND IT SHOULD NOT** (closed by this PR) |
| Branch / worktree | `claude/medical-folder-activity-app` @ `C:\Development\Animal_Shelter_medical-folder-activity-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | no — `0278` landed in #1029 |
| Tested at SHA | `8707d84a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every place that offers or performs filing into Medical now asks `photos.medical_add`, and `photoCategoriesFor()` falls back to `[]`
- [x] Files/areas touched listed — `src/lib/google/drive-client.ts`, `src/app/residents/[id]/photos/actions.ts`, `src/app/api/residents/[id]/photos/route.ts`, `src/app/api/medical/residents/[id]/photos/route.ts`, `src/app/medical/photos/page.tsx`, the two resident sections, `PhotoGallery.tsx` (comment), `routes.ts`, `jobs.ts`, `releases.ts`, three tests and `check-permission-catalogue.mjs`
- [x] Roles affected identified — a login holding only `photos.resident_add` no longer gets Medical; Management and 2IC hold Add medical photos too, so keep it
- [x] Anything explicitly **out of scope** written down — no migration; the video routes' entry check is unchanged (they validate through `photoCategoriesFor()`); decision file lists it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines:

```
=== gates: build exited 0 after 41s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (`0278` already applied by #1029)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration; the database side was proven by #1029's harness
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration of its own; production still needs `0276`–`0278` before this ships

## 4. Functional checks

- [x] Happy path works end to end — Residents-only login: Shelter passes the folder check on the upload route
- [ ] Data persists — n/a: no stored data changed
- [ ] Create / edit / delete all exercised — n/a: no record is created by this change; the route was called with a deliberately incomplete form
- [ ] Empty state renders sensibly — n/a: a login with no folders gets no uploader; asserted in `add-photos-card.test.mjs`, not viewed
- [x] Invalid input is rejected with a readable message — hand-made Medical request from a Residents-only login: 403 "Your photos can only go in the Shelter folder."
- [x] Boundary cases checked — unit tests: publish without `medical_add` loses Medical; `resident_add` alone and nothing at all give `[]`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: not driven; short-circuit in `can.ts` unchanged | both folders | not driven |
| management | n/a: not driven as a role; unit test covers publish + `medical_add` | four folders | unit test passed |
| staff | n/a: retired role | | |
| doctor | n/a: Add medical photos shape covered by unit test | Medical only | unit test passed |
| volunteer | n/a: Shelter-only shape covered by unit test | Shelter only | unit test passed |
| signed out | n/a: route refuses without a session, unchanged | | |

- [ ] Every role above tested — n/a: one-card logins stand in for roles; only the Residents-only login was driven, the rest are unit tests
- [x] A role that should not have access is blocked server-side — Residents-only login, direct POST to `/api/residents/[id]/photos` with category Medical: 403

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic describes the Medical choice
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: not checked; the one page-less route call returned the expected JSON
- [ ] Network clean — n/a: the only 4xx seen was the intended 403

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every page; `npm test` 307 pass, lint clean
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `drive-client.ts` is read by the routes the tests and build cover; not loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-medical-folder-activity-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a card-tagged line. The decision file records that production still needs `0276`–`0278` before a release is cut, which is the release manager's ordering step, not an outstanding hand edit
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the 403 was read from the running dev route

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: a permission cutoff; both sides asserted in the unit tests (with and without `medical_add`)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates and 403 above are unedited
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration in this PR, but this code reads `0278`, so production must apply `0276`–`0278` before the deploy
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — deferred: release manager, `0276`–`0278` on `dbkodyyxxhtygxcxmfcu` before this deploys

### Rollback

- [ ] Rollback position stated — n/a: code only; `./scripts/pi/deploy-pi.sh --ref <sha>` reverts it, and the schema from #1029 stays additive and harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First gates run red in lint and test: a pinned list of reads and three tests still named the old rule | fixed — updated to the new activity |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as Add medical photos and as Admin: Medical is offered and files; as Residents: no Medical in the uploader or in Move | dev, a resident's Photos tab |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: row 1 above

Manual verification by: pending: a person looking at the Photos tab as Residents, Add medical photos and Admin

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
