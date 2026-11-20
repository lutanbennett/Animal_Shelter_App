# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Platform files out of a shelter's Google Drive (`#shfil`) |
| Backlog item | `docs/backlog.md` → `#shfil` (left open: the move of the files is outstanding) |
| Branch / worktree | `claude/platform-drive-folder` @ `C:\Development\Animal_Shelter_platform-drive-folder`, port `3001` |
| Dev server | n/a: scripts, registry and docs only, nothing the dev server renders |
| PR | opened after this commit |
| Tested by / date | Claude Sonnet 5.5 / 2026-11-20 |
| Carries a migration? | No |
| Tested at SHA | 319f79251 |

## 1. Scope and risk

- [x] Change is described in one sentence: the icon-library script writes to a platform Drive folder instead of a shelter's root, a registry and a lint check name every Drive-writing script, and the Pi mirror pulls the platform folder to its own destination
- [x] Files touched: `scripts/sync-home-icons.mjs`, `scripts/drive-partition-tree.mjs`, `scripts/pi/drive-mirror.mjs`, `scripts/lib/runtime-config.mjs`, `scripts/lib/platform-files.mjs`, `scripts/check-platform-files.mjs` (+ test), `.env.example`, `package.json` (lint), `docs/platform-files-registry.json`, a decision file. No `src/`, no `worker/`, no migration
- [ ] Cards affected identified — n/a: operator scripts only; no card, route or page changes, and admin and the signed-out public are unaffected
- [x] Out of scope: the move of the existing files (needs the platform account's credentials, not on this machine), anything run on the Pi, by-hand files in the Drive tree, `backup.mjs` and `BACKUP_DRIVE_FOLDER_ID` (`#civwx`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`:

```
=== gates: typecheck exited 0 after 76s
=== gates: lint exited 0 after 248s
=== gates: test exited 0 after 55s
=== gates: build exited 0 after 201s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no database change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-platform-files.mjs` prints the clean line on the real tree; `node --test scripts/check-platform-files.test.mjs` passes 5 of 5; `check-runtime-config.mjs` agrees the new name is in both the manifest and `.env.example`
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no such feature
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message: `sync-home-icons.mjs` with `PLATFORM_DRIVE_FOLDER_ID` unset names it and says there is nothing to fall back to; the check prints each problem with the file and what to declare
- [x] Boundary cases checked: the check was run against an added `scripts/zz-new-platform-thing.mjs` that writes to Drive and is not in the registry, and exited 1 naming it (pasted in the PR); the test also covers a platform writer that falls back to a shelter root and one that never reads its folder variable

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a: scripts only | nothing in the app | no card, page or route changes | n/a |

- [ ] Every login above tested — n/a: no page or route changes
- [ ] A login that should not have access is blocked server-side — n/a: no page or route changes

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: operator scripts, no user-facing feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: the neighbouring scripts load and the suites that read the same files pass in the gates (`check-runtime-config`, `check-script-exits --strict-widened`, `check-uat-ready.test.mjs`, `drive-map.test.mjs`)
- [x] Shared file touched checked from a second place: `scripts/lib/runtime-config.mjs` is read by `check-runtime-config.mjs` and `check-uat-ready.test.mjs`, both run in the gates; the shelter paths in `drive-partition-tree.mjs` are unchanged (the diff is only the icon prefix line) and the Pi mirror's shelter walk is unchanged when `PLATFORM_DRIVE_FOLDER_ID` is unset
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item: left open on purpose, because the move itself is outstanding; the PR says so for the planner
- [x] Design choices recorded in `docs/decisions/2026-11-20-platform-drive-folder.md`
- [x] `README.md` still accurate: it does not describe the icon script's destination
- [ ] **Release notes.** n/a: operator scripts and a registry; no shelter user, Admin or product administrator would see anything appear, move or disappear
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the check's failure was run, not argued; that the credentials are absent was read from the env files' key names

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager at cut
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test — n/a: no code a deployed Worker or the app runs changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covered at both edges — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: the gates block above is pasted as printed
- [ ] Public pages re-checked — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager at deploy
- [ ] `strip-baked-env` line seen — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: `PLATFORM_DRIVE_FOLDER_ID` is optional and read only by operator scripts and the Pi mirror, not by the Worker

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Fresh backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts only; revert the commit. Nothing was written to Drive or the Pi

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `backup.mjs` still falls back to `Backups/` under the shelter root when `BACKUP_DRIVE_FOLDER_ID` is unset (named in the registry) | deferred: planner to file; not `#shfil`'s to re-point |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The move: create the platform folder, set `PLATFORM_DRIVE_FOLDER_ID` and the `BACKUP_GOOGLE_OAUTH_*` identity, run `node scripts/sync-home-icons.mjs --env production`, then apply the Pi change | planner, per the PR |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Sonnet 5.5  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the move needs the platform account's credentials and the Pi

Manual verification by: pending: the move of the existing icon files and the Pi pull, planner to run

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here ships in a release

Result: pass with accepted defects

Release manager acknowledgement: n/a: no release involved
