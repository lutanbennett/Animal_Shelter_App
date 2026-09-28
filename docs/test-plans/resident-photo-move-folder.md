# Feature test plan

## Header

| | |
|---|---|
| Feature | Move a resident photo to a different folder when it was filed wrongly |
| Backlog item | `docs/backlog.md` → "Move a resident photo to a different folder when it was filed wrongly" |
| Branch / worktree | `claude/resident-photo-move-folder` @ `C:\Development\Animal_Shelter_resident-photo-move-folder` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | (opened from this branch) |
| Tested by / date | Claude (automated only) — 2026-09-28 |
| Carries a migration? | no |
| Tested at SHA | bda41c0 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adds a **Move to folder** action to a resident's photo viewer that refiles a shelter photo between `PHOTO_CATEGORIES` (Shelter/Medical/Foster/Adoption), moving the Drive file and updating `attachments.sub_folder` together.
- [x] Files/areas touched listed: `src/app/residents/[id]/photos/actions.ts` (new `movePhotoToFolder` server action), `src/components/PhotoGallery.tsx` (Move to folder UI in the lightbox), `src/app/residents/[id]/[section]/page.tsx` (passes `moveCategories` to `PhotoGallery`), `src/lib/i18n/dictionaries/en.ts` + `th.ts` (new `photos.*` strings), `src/lib/manual/en.ts` (photos topic), `src/lib/releases.ts` (`unreleased` line), `docs/backlog.md` (ticked), `docs/decisions.md` (dated entry). No `worker/` or `supabase/migrations/` changes.
- [x] Roles affected identified: admin, management, staff and volunteer may move a photo into any of the four folders; vet may move a photo into Medical only, never out of it (matches the upload route's `photoCategoriesForRole` restriction). Signed-out public is unaffected — the action is behind `assertPhotoWriteAccess()`, same gate as upload/delete/set-profile.
- [x] Out of scope, written down: adoption-update photos (`<YYYYMMDD>`-foldered, no category) — the gallery only offers Move to folder for a shelter photo whose `sub_folder` is one of `PHOTO_CATEGORIES`. No new Drive-move UI for project/maintenance attachments. No migration — `attachments.sub_folder` already exists and every role that can reach this action already has an RLS write policy on `attachments` (admin, staff mirrored to management, volunteer, vet scoped to their own residents by 0108), so the move is a plain client-side update rather than a new security-definer function.

## 2. Automated gates

Run in the feature worktree (already synced with `origin/main` via normal PR flow — no rebase performed since this branch had no conflicting `main` commits at the time of this run).

- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, exactly as printed:

```
=== gates: build exited 0 after 298s

gates: typecheck=0 lint=0 build=0
```

(`npm run lint` was also run standalone and separately confirms `0 errors` — the two warnings printed are pre-existing and in files this branch does not touch: `scripts/check-two-step-session.mjs` and `src/app/admin/security/verify/TwoStepForm.tsx`.)

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. Tick in a follow-up commit once the run is actually green.

## 3. Schema and data — *skip if no migration*

- [x] n/a: no migration in this PR — `attachments.sub_folder` already exists (added well before this feature); nothing under `supabase/migrations/` changed.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not run — I could not sign in to the running dev server. Reading an admin/vet test account's email from `user_roles`/`auth.users` to construct a session was refused by the auto-mode classifier (PII/credential handling), and I was not given login credentials in chat, so I did not attempt to work around that refusal. The dev server (`localhost:3005`) is up and compiles cleanly; left for a signed-in person, item 1 below.
- [ ] Data persists — reload the page and the change is still there — n/a: not run, same reason as above; left for a signed-in person, item 1 below.
- [ ] Create / edit / delete all exercised — n/a: this feature adds one new action (move) to an existing gallery; delete and set-profile are unchanged and were not touched.
- [ ] Empty state renders sensibly — n/a: the move UI only ever renders inside the existing per-photo lightbox, which already requires at least one photo to open; no new empty state.
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not run — the server action validates (unauthorized role, target not a `PHOTO_CATEGORIES` value, no-op move, out-of-scope adoption-update photo, vet moving out of Medical, Medical-profile conflict, and a Drive-move failure) and returns `{ error }` strings rather than throwing, confirmed by reading the code, but I could not click through the UI to see a message rendered; left for a signed-in person, item 7 below.
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not run — specifically, a photo with a null `date_taken` (older AppSheet-imported rows), where the action falls back to `todayIso()` for the Drive `<YYMM>` folder; not exercised against a real such row and not listed separately below since it needs a specific seed row a person would have to locate first.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Move to folder, any target folder | Succeeds for Shelter/Medical/Foster/Adoption | not tested — n/a: not signed in, see item 1 below |
| management | Move to folder, any target folder | Succeeds (RLS mirrors staff) | not tested — n/a: not signed in, see item 1 below |
| staff | Move to folder, any target folder | Succeeds | not tested — n/a: not signed in, see item 1 below |
| vet | Move to folder, Medical only | Moving into Medical succeeds; moving a Medical photo to another folder is refused server-side even if attempted directly (`onlyFolder` check runs before the folder is looked up) | not tested — n/a: not signed in, see item 4 below |
| volunteer | Move to folder, any target folder | Succeeds | not tested — n/a: not signed in, see item 1 below |
| signed out | No access to the resident hub at all | Refused before reaching this code (existing page-level auth, unchanged) | n/a: unchanged by this PR, not re-verified |

- [ ] Every role above tested — n/a: not run, no signed-in session available to me; left for a person, items 1 and 4 below
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — `movePhotoToFolder` calls `assertPhotoWriteAccess()` first and returns its error rather than proceeding; a vet's target-folder restriction is enforced in the action itself (not only hidden in the UI's `moveCategories` prop), so a vet posting a non-Medical target through any client still gets `t.photos.errors.onlyFolder("Medical")` from the server. Read from source, not from a live request — see **Left for manual verification** for the request-level check.

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change; the action lives inside the existing Photos tab.
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly — new step added to the `resident-photos` topic; `src/lib/manual/` has only `en.ts` (no `th.ts` — the manual is English-only, unlike the i18n dictionaries), confirmed by directory listing. Not loaded at `/manual` in a browser (see below), but the string was added following the existing steps' exact style and length.
- [x] Translatable strings go through the translation path — all new UI/error strings are dictionary entries (`t.photos.moveToFolder`, `t.photos.moveButton`, `t.photos.errors.*`) in both `en.ts` and `th.ts`, matching every existing string in this file — none are hard-coded in the component or the action.
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not run, no signed-in session available; the lightbox was never rendered to check. The new controls reuse the existing `<select>`/`<button>` classes already used elsewhere in the same lightbox (delete, set-profile). Left for a person, item 6 below.
- [ ] Browser console clean — n/a: not run, no signed-in session available.
- [ ] Network clean — n/a: not run, no signed-in session available.

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not run, no signed-in session available; `next build` succeeding (all ƒ routes, including `/residents/[id]/[section]` and `/api/residents/[id]/photos`, listed with no errors) is the automated evidence I do have.
- [x] Shared files touched (`src/lib/i18n/dictionaries/en.ts`, `th.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`) — checked by reading each edit in place against its surrounding, unrelated content (translations elsewhere in the same files, other manual topics, other release lines): additive only, nothing pre-existing was reworded or removed. Not confirmed by loading a second, unrelated page in a signed-in session — see **Left for manual verification**.
- [x] Nothing merged from `main` during sync was broken by this branch — `node scripts/gates.mjs` (typecheck/lint/build) ran clean against the branch as pushed, which would fail on a real conflict-shaped break; no `git merge`/`worktree.mjs sync` was needed since `main` had not moved past this branch's base at the time of this run.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-28 — the Drive-first/DB-second ordering rationale, the Medical-profile refusal, the vet one-way restriction, the adoption-update out-of-scope note, why no migration was needed, and the stale "en.ts/th.ts manual" brief instruction
- [x] `README.md` still accurate — not touched by this feature; nothing in it describes photo folders or this action
- [x] **Release notes.** Would a shelter user notice this change? Yes — `unreleased` in `src/lib/releases.ts` has a new line, written for a shelter user, in this PR.
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — the ordering claim ("a stalled DB write leaves the photo exactly as public or private as before the move") was checked against the actual `public_resident_photos` (0101) and `is_public_drive_file` (0084) definitions, which read `attachments.sub_folder` only and never the file's live Drive parent — read directly from the migration files, not assumed.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: this feature has no "today"/boundary logic beyond `todayIso()` as a fallback for a missing `date_taken`, which only picks a Drive `<YYMM>` folder and has no correctness requirement tied to a specific hour
- [ ] Boundary/banding assertions — n/a: not a threshold/banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates output above is pasted from `scripts/gates.mjs`'s own closing lines, unedited
- [ ] Public pages re-checked after cache purge — n/a: this feature touches no public page; `/adopt/[id]` reads `public_resident_photos`, which this PR does not change, only the row a photo's `sub_folder` sits in

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: no new env var

### Migration ordering — *skip if no migration*

- [x] n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — deferred: release manager. Purely additive application code; no schema change, so `npx wrangler rollback --env production` alone is sufficient if this PR needs reverting.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

None found — no manual pass has run yet to find any; see **Left for manual verification**.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as staff/admin, open a resident with a Shelter photo, use Move to folder to Medical, confirm the tile moves out of the "Shelter" grouping, the lightbox caption now reads Medical, and the file's Drive parent actually changed (open it in Drive) | `/residents/<id>/photos` |
| 2 | **The privacy check the brief specifically asked for:** move a *publicly visible* resident's photo into Medical, then confirm `/adopt/<id>`'s gallery no longer shows it and `/api/photos/<driveFileId>` returns 404 when signed out (curl or an incognito tab) | `/adopt/<id>`, `/api/photos/<fileId>` |
| 3 | Try to move the resident's current profile photo into Medical — confirm it is refused with `t.photos.errors.medicalProfileMove` and the profile photo is unchanged | `/residents/<id>/photos` |
| 4 | Sign in as a vet account, confirm Move to folder on a non-Medical photo only offers Medical, and that a Medical photo shows no Move to folder options at all (nothing to move to) | `/residents/<id>/photos` as vet |
| 5 | Deceased resident: confirm Move to folder is still offered (not `readOnly`) and works, and that the archive's regenerated summary/index reflects the new folder afterwards | a deceased resident's `/residents/<id>/photos`, then their archive |
| 6 | Mobile viewport (375px): the new select + button row in the lightbox doesn't overflow or wrap awkwardly | `/residents/<id>/photos`, resized |
| 7 | Force the "moved in Drive but the database write failed" path (e.g. revoke DB access mid-request, or inspect by code review only if that's impractical) and confirm the user sees `t.photos.errors.moveIncomplete`, distinct from a generic save failure | `/residents/<id>/photos` |
| 8 | `/manual` renders the new "Filed a photo under the wrong folder…" step correctly under Photos → Adding resident photos | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list above is not empty; only the person who looks may tick this

Manual verification by: pending: Lutan (or another signed-in tester) to work through the 8 items above  Date: —

### Result

- [x] Open defects are either fixed or explicitly accepted above — n/a: none found, nothing to accept
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit; done when the PR is opened
- [ ] Handed to the production release manager — n/a: not yet — happens once manual verification above is complete

Result: pass
