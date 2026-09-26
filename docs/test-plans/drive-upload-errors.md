# Feature test plan

## Header

| | |
|---|---|
| Feature | Drive failures in plain words, the logo's message by the logo, and a Drive token check on Settings |
| Backlog item | `docs/backlog.md` → "Bug: uploading a Shelter Friend logo fails … invalid_grant", its code follow-ups |
| Branch / worktree | `claude/drive-upload-errors` @ `C:\Development\Animal_Shelter_drive-upload-errors` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `1ab97dc` (code; the later commit adds the manual lines and this plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a dead Drive token or client now reaches users as "Photo storage is not connected — tell an admin." instead of Google's text, the Shelter Friend logo's message shows by the logo, and Settings shows whether Drive is connected — the three code follow-ups the item lists
- [x] Files/areas touched listed: `src/lib/google/drive.ts` (`DriveNotConnectedError`, `checkDriveConnection`), new `src/lib/google/drive-errors.ts`, `src/app/management/shelter-friends/actions.ts`, `src/app/admin/website/actions.ts`, `src/lib/{maintenance,projects}/drive-sync.ts`, the five upload routes under `src/app/api/` (resident photos, project photos, maintenance / blood-test / procedure attachments), `src/app/contacts/[id]/ShelterFriendCard.tsx`, `src/app/admin/page.tsx` + new `DriveStatus.tsx`, i18n en/th, `src/lib/manual/en.ts`, `src/lib/releases.ts`, new `scripts/check-drive-token.mjs`, docs. No `worker/`, no migration
- [x] Roles affected identified: admin (Settings line, Website photos); admin / management (Shelter Friend logo); every signed-in role that uploads photos or attachments (the message only — access unchanged); signed-out public (nothing)
- [x] Out of scope: the token itself (fixed 2026-09-25, recorded on the backlog item), alerting by email or cron, the Google Cloud one-account item, the 90-day token item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 268s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, driven in the browser pane on :3001 as the dev admin account. **Bad token** (dev server started with `GOOGLE_OAUTH_REFRESH_TOKEN` overridden to a junk value in a throwaway launch config, since removed): Settings shows the red "Photo storage (Google Drive) is not connected — every upload will fail until a new token is set." with `Google OAuth token refresh failed: invalid_grant: Bad Request` under it; on the dev contact "Harness Hardware (Shelter Friends test)", Edit profile → typed into Kind of help → chose a logo → "Photo storage is not connected — tell an admin." directly under the logo row, form still open, typed text still in the field (read back from the input); Cancel, so nothing was saved; `POST /api/residents/<id>/photos` with a 1×1 PNG → `503 {"error":"Photo storage is not connected — tell an admin."}`; server log has `Drive is not connected: Google OAuth token refresh failed: invalid_grant: Bad Request` for each. **Real token**: Settings shows green "Photo storage (Google Drive) is connected."
- [ ] Data persists — n/a: nothing here saves; the Settings line was read after fresh navigations in both modes
- [ ] Create / edit / delete all exercised — n/a: no create/edit/delete added; the logo upload's success path and Remove logo are unchanged apart from where their message shows, and were not re-run against live Drive
- [ ] Empty state renders sensibly — n/a: no list or empty state
- [x] Invalid input is rejected with a readable message: a wrong upload field (`category`) still returns the route's own 400 ("Folder must be one of: …") through the wrapper, not a Drive message; `scripts/check-drive-token.mjs` with a junk token prints `FAIL: token refresh (400): invalid_grant: Bad Request` plus the hint and exits 1, and exits 0 with `.env.local`
- [ ] Boundary cases checked — n/a: no thresholds; the only branch is not-connected vs other Drive error vs non-Drive error, and the first and last were both driven above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings Drive line, logo, uploads | line shows; plain messages | driven — as expected |
| management | logo, uploads | plain messages | not driven separately — same action code as admin |
| staff | uploads | plain message on failure | not driven — route code is role-independent |
| vet | uploads | same | not driven — same |
| volunteer | uploads | same | not driven — same |
| signed out | none of these | refused as before | not re-run — no gate changed |

- [ ] Every role above tested — n/a: no access rule changed; `requireAdminUser` on `/admin`, `assertManagementRole` on the logo and `assertPhotoWriteAccess` on the routes are untouched and run before any Drive call
- [ ] A role that should not have access is blocked server-side — n/a: no new endpoint; the Drive check runs inside the admin-gated `/admin` page only

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): the Photos intro says what "photo storage is not connected" means, and the Settings intro describes the Drive line; both sentences found in `/manual` as rendered on :3001
- [ ] Translatable strings through the translation path — n/a: new strings are UI dictionary entries (en and th), not record prose
- [x] Mobile viewport (375px): `/admin` with the Drive line, `scrollWidth` 375 = `innerWidth`; `/manual` no overflow
- [x] Browser console clean — the only errors were the requests deliberately made to fail under the bad token (502 logo images from the photo proxy, the 400 and 503 above); none with the real token
- [x] Network clean — as above: every non-2xx was a deliberate failure case

## 6. Regression

- [x] Nearest pages still work: `/admin` tiles render under the new line; the contact hub's Shelter Friend card opens, edits and cancels; `/manual`
- [x] Shared files touched (`manual/en.ts`, i18n dictionaries, `drive.ts`) checked from a second page: `/manual` rendered; `/admin` read Settings strings from the dictionary; the build prerendered every page that imports them
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged ("Already up to date."), gates ran on this tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what was done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-26 (which token errors count as "not connected", one helper, wrapped routes, the form-was-not-lost finding, the check on Settings rather than a cron)
- [x] `README.md` updated: setup step names `scripts/check-drive-token.mjs` and the Settings line
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained two lines for shelter users: the plain message plus the Settings line, and the logo message's new place
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured: the bad-token behaviour, the kept draft, the 503 body and the log lines were all observed in the run above; `invalid_grant` for an expired token is from the 2026-09-25 report and reproduced here with a junk token

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`, including that `/admin` says Drive is connected on the Workers build — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added; the check reads the existing `GOOGLE_*` secrets

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts it entirely; no schema, nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The logo's error message showed only below Save, out of sight of the logo — found in the first bad-token run | fixed (message now shows under the logo row) and re-run |
| 2 | minor | `check-drive-token.mjs` hit a libuv assertion on Windows when calling `process.exit(1)` straight after a `fetch` | fixed (`process.exitCode`) and re-run both ways |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai strings (Settings Drive line in all three states, "ที่เก็บรูปภาพยังไม่ได้เชื่อมต่อ — โปรดแจ้งผู้ดูแลระบบ") read naturally | switch to ไทย on `/admin` and on a failed upload |
| 2 | The Settings line reads right to you, and the logo message by the logo on a phone | `/admin`, a Shelter Friend contact on `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: Thai wording and a look at the Settings line and logo message (items 1–2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR is opened from this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release time

Result: pass
