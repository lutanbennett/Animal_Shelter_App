# Feature test plan

## Header

| | |
|---|---|
| Feature | Bills: photos of bills on deliveries and clinic visits, and a Bills inbox page to match them later with the cost |
| Backlog item | `docs/backlog.md` → "Photos of receipts for purchases and clinic visits, with the cost" |
| Branch / worktree | `claude/bills-inbox` @ `C:\Development\Animal_Shelter_bills-inbox` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-13 |
| Carries a migration? | no (schema landed in #566, #569, #574; dev at 192 applied, 0 pending) |
| Tested at SHA | `37c9e4d2` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item: bill photos on Record a delivery and clinic visits, plus a Bills page that matches many photos later and files the cost
- [x] Files/areas touched listed: `src/app/bills/`, `src/app/api/bills/`, `src/lib/bills/`, `src/components/Bill*`, `src/app/deliveries/`, `src/app/clinic-visits/[id]/edit`, Home tiles, `src/lib/google/drive.ts`, both dictionaries, manual, releases
- [x] Roles affected identified: anyone holding `stock.delivery`, `medical.visits` (edit) or `maintenance.bills`; a visiting doctor is fenced out
- [x] Anything explicitly **out of scope** written down: reading the amount off the photo (OCR); bills on maintenance jobs (`maintenance-bills` stream); a Bills tile on the Director's phone home (filed on the backlog branch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (0.28.0 cut), resolved by keeping the Bills line as the only `unreleased` entry
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 77s

gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`. n/a: no migration in this PR (0188-0191 landed earlier)
- [ ] `--status` reviewed before applying. n/a: no migration in this PR
- [ ] `--dry-run` reviewed. n/a: no migration in this PR
- [ ] Applied to dev. n/a: no migration in this PR
- [ ] File is re-runnable. n/a: no migration in this PR
- [ ] Existing rows still read correctly. n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows. n/a: no migration in this PR; the policies those migrations added are exercised by `scripts/check-bills-roles.mjs` (section 4)
- [ ] Down-migration written. n/a: no migration in this PR
- [ ] Production apply plan stated. n/a: no migration in this PR; 0190 and 0191 are already merged, the release manager applies them with the usual runner before this deploys

## 4. Functional checks

`node scripts/check-bills-roles.mjs` against dev printed: `72 checks held, 0 failed.` / `RESULT: GREEN (bills follow the activity of what they are for; the 2IC reaches deliveries and not visits; the doctor reaches none)`.

- [ ] Happy path works end to end. n/a: the browser pane stops at the sign-in page and the session may not enter a password; the server-side half is covered by the role harness, the screens are listed under Left for manual verification
- [ ] Data persists. n/a: as above, handed to the manual list
- [ ] Create / edit / delete all exercised. n/a: the harness exercises filing, matching and the policies; the screens are on the manual list
- [ ] Empty state renders sensibly. n/a: handed to the manual list
- [ ] Invalid input is rejected with a readable message. n/a: handed to the manual list; file type and size checks are in `src/lib/bills/upload.ts` (read)
- [ ] Boundary cases checked. n/a: handed to the manual list

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Bills, bill photos on deliveries and visits | allowed | harness: held |
| management | Bills, bill photos on deliveries and visits | allowed | harness: held |
| second_in_command | Bills and deliveries, not visits | delivery matches only | harness: held |
| head_of_maintenance | per `maintenance.bills` (Management only) | no Bills page | harness: held |
| doctor | none (own_clinic fenced) | refused | harness: held |
| volunteer | none | refused | harness: held |
| signed out | none | refused | harness: held |

- [x] Every role above tested (by `check-bills-roles.mjs`, against the database policies and `record_attachment()`)
- [x] A role that should not have access is blocked server-side (the harness calls the database as that role; upload routes also refuse cross-site and unauthorised callers before Drive is touched)

## 5. Cross-cutting

- [ ] Nav entry correct. n/a: Bills is reached from Deliveries and a Home tile, not a nav entry (see decision file)
- [x] Manual updated (`src/lib/manual/en.ts`), Bills topic; reworded in this pass to say the Home tile is for some roles only
- [x] Translatable strings go through the dictionaries (en and th both gained the same keys; typecheck proves they match)
- [ ] Mobile viewport (375px). n/a: needs a signed-in browser; on the manual list
- [ ] Browser console clean. n/a: needs a signed-in browser; on the manual list
- [ ] Network clean. n/a: needs a signed-in browser; on the manual list

## 6. Regression

- [x] The pages nearest the change still work: the full build compiles every route, and `check-home-screens.mjs` (run by lint) passed for every role's home, which is how the Management home was kept off the Bills tile
- [ ] Shared file loaded from a second page. n/a: no signed-in browser in this session; `HomeTiles.tsx` and `tiles.ts` are covered by `check-home-screens.mjs` for every role instead, and the browser load is on the manual list
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates green after the merge)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (done in an earlier commit); the sweep for other open items is in the PR description
- [x] Non-obvious design choices added: `docs/decisions/2026-10-12-bills-inbox.md`
- [x] `README.md` still accurate (nothing in it describes Home tiles or uploads that changed)
- [x] **Release notes.** `unreleased` has the Bills line, reworded in this pass so it does not promise a Home count to roles that have no tile. The decision file and backlog note record no outstanding manual step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The earlier claim that Management's home carried a Bills tile was wrong; lint's `check-home-screens` measured it and the decision file and manual are corrected

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time. deferred: release manager
- [ ] Deployed SHA matches the tested SHA. deferred: release manager

### On the deployed build

- [ ] Deployed to test. deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`. deferred: release manager
- [ ] Timezone-sensitive behaviour proved. n/a: the Drive folder uses `todayIso()` (the shelter's own day), no new clock logic
- [ ] Boundary or banding change assertions. n/a: no thresholds changed; likely matches use a fixed 14-day window and nearest-day sort
- [ ] Evidence pasted is the tool's actual output, unedited. n/a: the gates lines and harness lines above are pasted as printed
- [ ] Public pages re-checked. n/a: no public page touched; bill photos are never public

### Deploy safety

- [ ] `deploy: production → Supabase project` line read. deferred: release manager
- [ ] `strip-baked-env` line seen. deferred: release manager
- [ ] Any new secret/env var exists in production. n/a: none added (uses the existing `GOOGLE_DRIVE_ROOT_FOLDER_ID`)

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code reading it. n/a: no migration here; the code needs 0190 and 0191 on production first, and the release manager must apply them before deploying
- [ ] Production dry-run. deferred: release manager
- [ ] Destructive migration backup. n/a: additive only
- [ ] Apply plan stated. deferred: release manager (0190 and 0191, before the deploy)

### Rollback

- [ ] Rollback position stated. deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Home tile's waiting count was computed but never drawn (`HomeTiles.tsx` ignored `badge`) | fixed in 37c9e4d2 |
| 2 | Low | Decision file and manual said Management's home has a Bills tile; it does not (the whiteboard list is fixed by `check-home-screens.mjs`) | fixed in 37c9e4d2; tile for the Director filed on the `backlog` branch (deferred to backlog) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Add a bill photo on Record a delivery at desk width and at phone width, save, see it on the delivery | `/deliveries` |
| 2 | Add a bill photo on a clinic visit's Edit page | `/clinic-visits/<id>/edit` |
| 3 | Add several photos on the Bills page, match one to a delivery, one to a visit, make one into a new delivery, delete one; the cost lands on the target | `/bills` |
| 4 | The waiting count shows on the 2IC's Home tile and on the Bills page and drops after matching | `/home` |
| 5 | A visiting doctor sees no Bills | doctor login |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: not yet — five items above are waiting for a person to look

Manual verification by: pending: Lutan to look at the five items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager. n/a: not yet — after the PR is open

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
