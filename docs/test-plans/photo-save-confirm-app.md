
# Feature test plan — photo-save-confirm-app

## Header

| | |
|---|---|
| Feature | App half of #40oz4: save a photo with no animal and no place, a Done control, a no-place queue row, Folder select hardening |
| Backlog item | `docs/backlog.md` → #40oz4 (Part A done; Part B not reproduced, so the item stays open) |
| Branch / worktree | `claude/photo-save-confirm-app` @ `C:\Development\Animal_Shelter_photo-save-confirm-app` |
| Dev server | http://localhost:3002 |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-07 |
| Carries a migration? | no (0332 already merged and applied to dev) |
| Tested at SHA | `da294ae8` |

## 1. Scope and risk

- [x] Change is described in one sentence — `/photos/add` can store a photo with neither animal nor place, with a Done control that confirms it
- [x] Files/areas touched listed — `src/app/api/photos/pending/route.ts`, `src/app/photos/add/{AddPhotosFlow,page,uploadPending}`, `src/app/photos/approve/PendingQueue.tsx`, `src/lib/photos/pending.ts`, both dictionaries, `releases.ts`
- [x] Cards affected identified — `add_photos` (photos.shelter_add) files; `photos.approve` reviews; gate is exactly the route's `photos.shelter_add || photos.resident_publish` + Shelter
- [x] Anything explicitly **out of scope** written down — assign/discard actions untouched; no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with origin/main
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration (status: 334 applied, 0 pending)
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: 0332 applied by PR #1378
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a rollback harness — n/a: baseline `check-pending-photos-null-enclosure.mjs` still HARNESS-OK
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: 0332 must be live on production before this deploys; stated for the release manager

## 4. Functional checks

- [x] Happy path works end to end — card-only login: took a photo, pressed Save for later, saw "To be named later" tick, Done, "Stored: 1 photo is saved. 1 is waiting…"
- [x] Data persists — the photo appears on /photos/approve → Who's in the photo (as Admin)
- [ ] Create / edit / delete all exercised — n/a: assign/discard not changed
- [x] Empty state renders sensibly — no-place row says "No one to suggest" rather than looking broken
- [x] Invalid input is rejected — route still 400s a present non-uuid and 404s an unresolved uuid (code unchanged for those branches)
- [x] Boundary cases checked — enclosure absent (new, works); picker shows 2 residents on a card-only login and on Admin

### Role access matrix

| Card | Can reach | Expected | Result |
|---|---|---|---|
| add_photos only | /photos/add, Save for later, POST /api/photos/pending | allowed | works |
| add_photos only | Folder select | not drawn (one folder) | sentence only |
| Admin | Folder select | four options, readable, EN and TH | works |
| none | POST /api/photos/pending | 403 | unchanged code path |

- [x] Every card above tested — as far as listed
- [x] A login that should not have access is blocked server-side — 403 branch unchanged and runs before any Drive call

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: manual topic for Add photos not changed; for the planner
- [x] Translatable strings go through the translation path — en and th added
- [ ] Mobile viewport (375px) — pending: not driven at phone width
- [x] Browser console clean — no errors seen during the drive
- [ ] Network clean — n/a: upload requests succeeded; not audited beyond that

## 6. Regression

- [x] The pages nearest the change still work — /photos/approve renders both a with-place and a no-place row
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken — up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked, Part B not reproduced; item rewritten to say only that is open
- [x] Non-obvious design choices in `docs/decisions/` — `2026-11-07-photo-save-confirm-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** — added to `unreleased`; no manual step outstanding
- [x] Commit messages say why
- [x] **Claims measured, not reasoned** — driven on screen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence unedited** — deferred: release manager
- [ ] Public pages re-checked — n/a: public site unaffected

### Deploy safety

- [ ] `deploy: production →` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: code only; depends on 0332 already merged
- [ ] Production dry-run — deferred: release manager (0332 must be applied first)
- [ ] Production backup — n/a: no migration here
- [x] Apply plan stated — 0332 before this deploys

### Rollback

- [ ] Rollback position stated — n/a: code-only; reverting leaves null-enclosure rows, which old code reads fine as a left join

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Part B blank Folder dropdown not reproducible on Admin EN/TH | accepted — options hardened, needs Lutan's phone |
| 2 | info | Queue heading says "tagged to an enclosure" for no-place photos too | deferred to backlog (planner) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | pending: the Folder dropdown on Lutan's own phone/login is no longer blank | /photos/add as Admin |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-07

### Manual verification

- [ ] Manual list is empty or checked by a person — pending: Lutan's phone check of the Folder dropdown

Manual verification by: pending: Lutan to look at the Folder dropdown on his phone

### Result

- [x] Open defects fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
