# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Medication label photo: Upload / Replace / Remove label, shown on Management → Medications, the stocktake sheet and the Record a delivery form |
| Backlog item | `docs/backlog.md` → Medical records → Medication label photos, a card-by-card stocktake on phones, and Stocktake only for the people who do it — **part (1) feature half only**; item stays open |
| Branch / worktree | `claude/medication-label-feature` @ `C:\Development\Animal_Shelter_medication-label-feature` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-02 (automated and code-level only; no browser session) |
| Carries a migration? | no (uses `0129`, merged as #304) |
| Tested at SHA | `3090a64` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: management can upload, replace and remove a photo of a medication's label, and it shows as a thumbnail on the Medications table, the stocktake sheet and the delivery form. Parts (2) and (3) are not here
- [x] Files/areas touched: `src/app/management/medications/{actions.ts,page.tsx,MedicationsTable.tsx}`, `src/app/api/photos/[fileId]/route.ts`, `src/app/stocktake/{page.tsx,StocktakeSheet.tsx}`, `src/app/deliveries/{page.tsx,RecordDeliveryForm.tsx}`, `src/components/MedicationLabelThumb.tsx` (new), `src/lib/management/stocktake.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. No migration, no `worker/`
- [x] Roles affected: upload/replace/remove is admin and management; the thumbnail is seen by anyone who can open the stocktake sheet (staff, volunteer too) or the delivery form (staff); not signed-out public, not vet
- [x] Out of scope: the Diets tab (decision file says why), the phone cards (part 2), who sees Stocktake (part 3), raising the 15 MB limit

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: not yet run at this commit; to be run before the PR is opened
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: typecheck exited 0 after 18s
=== gates: lint exited 0 after 219s
=== gates: build exited 0 after 330s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0129` is already on `main`
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: `0129` was applied by #304
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: the new selects read a nullable column; not run against rows
- [ ] Constraints exercised in a harness — n/a: no constraint added
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: `0129` must already be on production before this deploys; the release manager confirms it (the pages select the column and would error without it)

## 4. Functional checks

No browser session could be driven: the built-in browser refused navigation to `localhost:3006`, and signing in would mean typing a password. Nothing below that needs a page is ticked.

- [ ] Happy path works end to end — n/a: not driven; left for manual verification (items 1–3)
- [ ] Data persists — n/a: not driven; left for manual verification (item 1)
- [ ] Create / edit / delete all exercised — n/a: not driven; upload, replace and remove are item 1
- [ ] Empty state renders sensibly — n/a: not driven; the thumbnail component returns nothing without a file id (read in code), confirmed by item 3
- [x] Invalid input is rejected with a readable message, not a crash — by reading the action against the Shelter Friend logo action it copies: no file, wrong type, over 15 MB (`t.admin.website.errors.fileTooLarge`, also refused in the browser first by `runUploadAction`), unreadable bytes, Drive not configured and Drive failure each return `{ ok: false, error }`; none throws. Not exercised at runtime
- [ ] Boundary cases — n/a: not driven; a 15 MB+ file and a HEIC photo are item 4

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Upload / Replace / Remove; thumbnails | allowed | not driven — manual item 5 |
| management | same | allowed | not driven — manual item 5 |
| staff | thumbnails on stocktake and deliveries only | write refused by `hasManagementRole()` and RLS | not driven — manual item 5 |
| vet | none | no stocktake or deliveries access; no thumbnail | not driven |
| volunteer | thumbnail on stocktake | write refused | not driven |
| signed out | none | `/api/photos/<id>` 404 | not driven — manual item 6 |

- [ ] Every role above tested — n/a: no login driven; left for manual verification
- [x] A role that should not have access is blocked server-side: the write is guarded in the action by `hasManagementRole()` (not by hiding a button), and RLS on `medication` allows writes only to management and admin (0129 decision file). Read from code, not run

**Public exposure, checked in code:** `0129` adds no `public_*` view column and does not touch `is_public_drive_file`; `label_drive_file_id` appears only in the migration, the medication actions, the three pages above and the proxy's non-public list. The proxy serves a non-public file only after `canSeeInternalFile` finds the row through the caller's own RLS, with `private, no-store`. A signed-out request therefore gets "Photo not found." Not requested over HTTP — manual item 6.

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated: new step in "Managing medications" (roles admin, management), a line in "Doing a stocktake" and in "Recording a delivery". `th` has no manual file. Not read at `/manual`
- [ ] Translatable strings — n/a: the label strings are UI chrome in the dictionaries, both `en` and `th`; no database text is translatable here
- [ ] Mobile viewport (375px) — n/a: not driven; manual item 2
- [ ] Browser console clean — n/a: no browser session; manual item 1
- [ ] Network clean — n/a: no browser session; manual item 1

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not loaded; build compiled every route and typecheck passed, but nothing was rendered. Manual item 3
- [x] Shared files touched: `manual/en.ts` and `releases.ts` (expected trivial conflicts) and the dictionaries, only by insertion; the build compiling them is the check, not a load of a second page
- [ ] Nothing merged from `main` during `sync` was broken — n/a: sync not yet run

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked, parts (2) and (3) remain; a status line naming this branch was added instead
- [x] Non-obvious design choices added as `docs/decisions/2026-10-02-medication-label-photo.md` (return shape, folder, proxy, size, Diets not wired, phones)
- [ ] `README.md` still accurate — n/a: it does not describe uploads at this level
- [x] **Release notes.** `unreleased` gained a line written for shelter users about the label photo
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — except that the 160 px rendition is used, which is read from the code and not measured in a network log (manual item 1)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (upload a real photo through the Workers build; Drive upload is the part that differs from `next dev`)
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold or banding
- [ ] Evidence is the tool's actual output — n/a: the only evidence is the gates lines above, pasted as printed
- [ ] Public pages re-checked — n/a: no public page reads the column

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added (`GOOGLE_DRIVE_ROOT_FOLDER_ID` already exists)

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration in this PR, but the code needs `0129` on production first — release manager confirms
- [ ] Production dry-run — n/a: no migration in this PR
- [ ] Production backup — n/a: additive nullable column
- [ ] Apply plan stated — n/a: `0129` applies before this deploys; release manager

### Rollback

- [x] Rollback position: revert the PR. Photos already uploaded stay in Drive under `Medications/Labels` and in the column, harmlessly. `0129` is left in place

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first `gates` build exited 4 during "Running TypeScript" with no error text, when the session was paused; a clean re-run exited 0 | accepted — interrupted, not a type error |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a real photo on a medication; reload and it persists; Replace changes it; Remove takes it away. Console and network clean; thumbnail requests use `?w=160` | `/management/medications` as admin or management |
| 2 | Same page on a phone-width screen (375px): Show the page anyway, tap Upload label, the camera offers | `/management/medications` |
| 3 | The thumbnail shows on the stocktake sheet's Medications tab and on the delivery form after picking that medication; a medication with no photo looks as before; the Food tab is unchanged | `/stocktake`, `/deliveries` |
| 4 | A file over 15 MB, and a non-image file, give the readable message and change nothing | `/management/medications` |
| 5 | Staff and volunteer logins see the thumbnail but have no Upload/Replace/Remove buttons (the page itself is management-only) | `/stocktake` |
| 6 | Signed out, open `/api/photos/<the label's file id>` → "Photo not found." | any private window |

## Sign-off

### Automated

- [x] Every automated check listed above was actually run

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; this is Lutan's to tick after looking

Manual verification by: pending: the six items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above

Result: pass
