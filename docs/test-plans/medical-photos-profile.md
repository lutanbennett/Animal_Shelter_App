# Feature test plan

## Header

| | |
|---|---|
| Feature | A Medical photo cannot be chosen as the profile photo; a vet's resident photos go to Medical only |
| Backlog item | `docs/backlog.md` → "Keep Medical-folder photos off the public website" (profile half) and "A vet's photo upload should be limited to the Medical folder" |
| Branch / worktree | `claude/medical-photos-profile` @ `C:\Development\Animal_Shelter_medical-photos-profile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | #179 |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no — the public-view fallback is a separate schema follow-up (Lutan, 2026-09-27) |
| Tested at SHA | `dee2c70` (after `sync`); later commits on the branch are docs only |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the app refuses choosing a Medical photo as a resident's profile photo, and a vet uploads to Medical with no picker, refused by the route otherwise. The item left block-or-fallback open; blocking was chosen for this PR and the fallback flagged as a follow-up, per the brief and Lutan's answer in chat
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/api/residents/[id]/photos/route.ts`; `src/app/residents/[id]/photos/actions.ts`, `edit/actions.ts`, `edit/EditResidentForm.tsx`, `[section]/page.tsx`; `src/components/PhotoGallery.tsx`, `PhotoUploader.tsx`; new `src/lib/residents/profile-photo.ts`; `src/lib/google/drive-client.ts`, `src/lib/auth/require-role.ts` (now returns the role); both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`; `scripts/check-medical-photos.mjs`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — vet (folder limited); everyone who can set a profile photo (admin, management, staff, volunteer: Medical refused); signed out unaffected (route already refused)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **a Medical photo can still become the profile photo on its own**: `record_attachment` makes a first upload the profile photo whatever its folder, and `delete_resident_photo` falls back to the oldest. On dev 8 residents have one (7 have no other photo; Markey is on the website), and they still show on `/adopt`, the home cards, recent adoptions and `/r/<code>` until the schema follow-up "Public views show no profile photo when it is in Medical" (backlog, added 2026-09-27). The existing 8 were listed, not changed. "Move to folder" not built

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought `0102_vet_doctors_and_vet_accounts.sql`, no overlap with photos)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [x] CI green on the PR (runs the same three) — #179 run 36298671573: check, test-plan and migration-numbers all pass

```
=== gates: typecheck exited 0 after 89s
=== gates: lint exited 0 after 191s
=== gates: build exited 0 after 368s
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change (checked against real dev data) — `node scripts/check-medical-photos.mjs` still ends `HARNESS-OK` (47 gallery rows, view = old view minus Medical) and its new read-only listing prints the 8 residents with a Medical profile photo: Markey (on the website) and 7 others, only White with a photo in another folder
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no schema change; the 0101 harness was re-run unchanged (line above)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

All against `next dev` on :3009, dev database, with throwaway logins `medphotos-vet@example.test` (vet) and `medphotos-staff@example.test` (staff), sessions minted with `auth.admin.generateLink` + `verifyOtp` (no passwords), on a throwaway resident "Harness medphotos" (not public). Left on dev (disposable).

- [x] Happy path works end to end — vet POSTs a Medical photo: `200`, stored with `sub_folder` Medical. Staff: Shelter `200`; in the browser, opened the Shelter photo → Set as profile photo → after reload the Profile badge is on it
- [x] Data persists — reload the page and the change is still there — profile badge on the Shelter photo after reload; `residents.profile_photo_drive_file_id` read back from dev
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature adds refusals to upload and set-profile; delete is unchanged and not touched
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list; the gallery's empty state is unchanged
- [x] Invalid input is rejected with a readable message, not a crash — `setResidentProfilePhoto` run as the staff login against dev: Medical → "A Medical photo can't be the profile photo — Medical photos never appear on the website. Choose a photo from another folder."; Shelter → accepted; a made-up file id → the RPC's own "That photo does not belong to this resident."; profile unchanged after. Staff posting folder `Bogus` → `400 Folder must be one of: Shelter, Medical, Foster, Adoption.`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — vet with no folder and with an adoption update id (no folder) both `403`; `isMedicalFolder` is the 0101 test (case, spaces, null), whose harness covers `medical` and ` Medical `; a Medical photo that already is the profile photo stays labelled "Current profile photo" rather than being hidden (seen in the viewer before switching)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | upload, set profile | all four folders; Medical refused as profile | not driven — same code path as staff (`photoCategoriesForRole` gives every non-vet role all four; the helper does not branch on role) |
| management | upload, set profile | same as admin | not driven — same as admin |
| staff | upload, set profile | all four folders; Medical refused as profile | pass — picker offers Shelter/Medical/Foster/Adoption; Shelter upload `200`; viewer on the Medical photo shows "Medical photos never appear on the website, so one can't be the profile photo." and no Set button; edit picker greys the Medical tile (disabled, labelled Medical); helper refuses Medical server-side |
| vet | upload | Medical only, no picker; route refuses the rest | pass — "Photos you add go in the Medical folder.", no `<select>`; `POST` Shelter / Foster / none / adoptionUpdateId → `403 Your photos can only go in the Medical folder.`; Medical → `200` |
| volunteer | upload, set profile | same as staff | not driven — same code path as staff |
| signed out | upload route | refused | pass — `POST /api/residents/<id>/photos` → `307 /login?next=…` |

- [x] Every role above tested — staff, vet and signed out driven; admin, management and volunteer reasoned from the single role branch (`role === "vet"`) and recorded as not driven above
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — vet's non-Medical POSTs `403` from the route, not the form

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `#resident-photos` carries "A vet's photos always go in Medical…", "Medical photos never appear on the website — use Medical for operations, teeth, wounds…", "A Medical photo can't be chosen as the profile photo…"
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: new UI strings are dictionary entries (`en.ts` / `th.ts`), not record text; Thai checked on the vet's photos page instead ("รูปภาพที่คุณเพิ่มจะเก็บในโฟลเดอร์ Medical")
- [x] Mobile viewport (375px) — no overflow, controls reachable — vet's photos page at 375×812, English and Thai: `scrollWidth` not over the viewport, date, line and drop area all reachable
- [x] Browser console clean — no errors or React warnings — only "An invalid form control with name='size' is not focusable", from my forced submit of the edit form on a harness resident with no size (browser validation, not this change)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the 403s and the 400 are the refusals being tested; photos page, edit page and photo proxy all `200` in the dev log

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — resident photos page (staff, vet), photo viewer, Set as profile photo, resident edit page (saved and redirected to the hub), `/adopt` (2 cards), `/manual`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `/manual` loaded; `/adopt` loaded (uses `drive-client.ts`); `assertPhotoWriteAccess()` now returns the role, and its other callers (projects, procedures, maintenance, blood tests) still `await` it and ignore the value — covered by typecheck, not driven
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both ticked; follow-up "Public views show no profile photo when it is in Medical (schema)" added on `backlog`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-27, "A Medical photo cannot be chosen as the profile photo; a vet's photos go to Medical"
- [x] `README.md` still accurate — no README content covers photo folders or profile photos
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. — new line for the profile-photo block and the vet's folder, saying plainly that a first photo filed as Medical still becomes the main photo until the next fix; the earlier line's "being fixed next" promise moved into it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 8 / 7 / Markey / White counts from dev queries; the route's responses, the helper's refusals and the automatic Medical profile on first upload (vet's Medical upload returned `isProfile: true`) were all observed in this session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the upload's date taken is unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold or band; the folder test is shared with 0101, whose harness covers its variants
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block is pasted as printed; route responses and error sentences are copied from the run output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — code only: `npx wrangler rollback --env production` restores the old picker and profile-photo behaviour completely; no data or schema is changed by this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A Medical photo becomes the profile photo automatically (first upload, delete fallback) and shows on the public pages — 8 on dev, 1 public | deferred to backlog — "Public views show no profile photo when it is in Medical (schema)", Lutan's decision 2026-09-27 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A real vet login on a phone: the photos page reads as "this goes in Medical", and an upload from the camera lands in Medical | Resident hub → Photos, as a vet |
| 2 | The Thai wording of the four new sentences reads naturally (Medical kept as the folder's name) | Photos page and viewer in ไทย, as staff and as a vet |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: a vet's photos page on a phone, and the Thai wording

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect is deferred to its own backlog item by Lutan's decision, recorded above
- [x] Checklist pasted into the PR — in #179's description
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass with accepted defects

Release manager acknowledgement: pending
