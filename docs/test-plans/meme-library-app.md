# Test plan: meme-library-app

## Header

| | |
|---|---|
| Feature | Meme library stage 1, app half: `/memes`, a meme's page, Add a meme, resident Memes list, Meme library card, Drive Memes folder |
| Backlog item | `docs/backlog.md` → "Meme library, stage 1" (ticked in this PR; stage 2 untouched) |
| Branch / worktree | `claude/meme-library-app` @ `C:\Development\Animal_Shelter_meme-library-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude, 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | 483b2fa6 |

## 1. Scope and risk

- [x] One sentence: the visible half of the meme library on the 0223 tables, gated by `social.library`; matches the brief and the schema decision file
- [x] Touched: `src/app/memes/**`, `src/lib/memes/**`, `src/app/api/photos/[fileId]/route.ts`, resident hub and page, `cards.ts`, `routes.ts`, both dictionaries, manual, releases, matrix entries, card-count checks
- [x] Roles affected: any role holding `social.library` (Admin only today); signed-out visitors (refused); roles without it (refused)
- [x] Out of scope: the meme maker (stage 2), granting `social.library` to any role, PhotoGallery, home tiles, anything public

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged; one conflict in `releases.ts` (two new lines) resolved by keeping both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration; 0223 is already on main and applied to dev
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR
- [ ] Re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Rolled-back harness — n/a: no schema change; 0223's own harness is `check-social-shares-schema.mjs`
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; 0223 applies with the release

## 4. Functional checks

- [x] Happy path: on dev at 375 px, added a meme (fake PNG, title, both captions, tags, two residents), recorded a Facebook share with a link and note, and an Instagram share
- [x] Data persists: reloaded the meme page and the library; shares, residents and tags still there
- [x] Create / edit / delete: created, edited the title, recorded and listed shares, archived and brought back (no delete by design)
- [x] Empty state: Memes list on a resident with no memes reads "No memes feature this resident yet."
- [x] Invalid input: blank title and missing image are refused with a sentence; the form's own required checks fire
- [x] Boundary cases: tags de-duplicated and lower-cased, https-only link, Thai caption, `form.test.mjs` covers title, caption and link limits

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | library, meme page, add, edit, archive, shares | everything (holds the activity) | covered by the disposable role below |
| disposable role with `social.library` Edit | all of the above | everything | pass |
| disposable role without it (resident.record Read only) | `/memes`, resident Memes list, image | refused, no list drawn, image 404 | pass |
| management, 2IC, volunteer, doctor | `/memes` | refused: nobody holds the activity | pending: manual, follows from the cells |
| signed out | `/memes`, a meme image | redirect to login; image `404 Photo not found.` | pass |

- [x] Every role above tested or marked
- [x] A role that should not have access is blocked server-side: the image route and the resident list gate on the server; page guards pinned in `check-permission-catalogue.mjs`

## 5. Cross-cutting

- [x] Nav entry: a registry entry under Management (no sidebar entry added, as the item asked for a card)
- [x] Manual updated: topic "Memes: adding one and recording where it went", and its matrix entries
- [x] Both dictionaries carry every string; the Thai library and meme page were read in the browser
- [x] Mobile viewport (375 px): no horizontal overflow, controls reachable
- [x] Browser console clean apart from the Drive 502 for a seeded fake file id that does not exist in Drive (not this change)
- [x] Network clean for the feature's pages

## 6. Regression

- [x] Checked: resident hub (with and without the library), `/memes`, the photo route for a public photo path (unchanged code path), Who does what card count
- [x] Shared files touched (`cards.ts`, `routes.ts`, dictionaries, `ResidentHub.tsx`) checked by loading the resident page as a role without the library
- [x] Nothing merged from `main` during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch; searched `meme`, `social`, `social_shares`, `Drive`: stage 2 stays open, the photo-posted item is another stream's
- [x] Decision file `docs/decisions/2026-10-18-meme-library-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line that says what the library does and that only Admin can open it until Admin ticks the Meme library card onto a role (the 0.25.0 truth rule: the note states the outstanding step instead of promising every user a library they cannot open)
- [x] Commit messages say why
- [x] Claims were measured: the signed-out image refusal and the role refusals were run in the browser and with curl

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: the share date defaults to the shelter's today in the browser's form and the database; no new day logic
- [ ] Boundary or banding assertions — n/a: no thresholds beyond input limits, covered by form.test.mjs
- [ ] Evidence is the tool's actual output — n/a: only the gates line is pasted
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] New secret exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code together — n/a: no migration in this PR; 0223 must be applied to production before this ships
- [ ] Production dry-run clean — deferred: release manager
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — deferred: release manager applies 0223 before the deploy

### Rollback

- [ ] Rollback position stated — n/a: code-only; rebuild on the Pi with `deploy-pi.sh --ref <sha>`; the tables are additive and can stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `can_see_drive_file()` does not know `memes`; the photo route asks the table directly | accepted: fold into the next schema PR (decision file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Download saves the image on a real phone, and a real photo-library upload works (HEIC from an iPhone) | a phone signed in as a role holding the library, once Lutan has ticked the card |
| 2 | Drive shows a Memes folder under the shelter root holding the two fake test files | Google Drive |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: items 1 and 2 above need a person with a phone and Drive

Manual verification by: pending: Download on a real phone and the Drive Memes folder

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to the production release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
