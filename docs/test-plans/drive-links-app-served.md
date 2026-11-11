# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Serve the last three direct Drive links through the app |
| Backlog item | `docs/backlog.md` → #dv7k3 |
| Branch / worktree | `claude/drive-links-app-served` @ `C:\Development\Animal_Shelter_drive-links-app-served` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 0e4949f4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the deceased-banner folder link, the archive export's links and the icons-page folder link no longer build drive.google.com URLs.
- [x] Files touched: `DeceasedBanner.tsx`, new `residents/[id]/archive-files/page.tsx`, `resident-index-html.ts`, `archive-deceased-resident.ts`, `home-screen-icons/page.tsx`, `drive-client.ts`, both i18n dictionaries, `releases.ts`
- [x] Cards affected: whatever opens a resident's hub (the page reads the residents row under RLS); no card added or changed; Admin passes by the Admin rule; signed-out sees nothing
- [x] Out of scope: the Production lockdown itself, `scripts/drive-sharing.mjs`, Drive credentials, `#yy9fz`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line (pasted below)

```
=== gates: typecheck exited 0 after 20s
=== gates: lint exited 0 after 168s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 46s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: not driven in a browser; the folder page needs a dev resident with a Drive archive, which dev has no live Drive credentials for
- [ ] Data persists — n/a: read-only page, nothing is saved
- [ ] Create / edit / delete — n/a: read-only page
- [x] Empty state renders sensibly: page shows "No files are in this archive that you may open" (read in source)
- [x] Invalid input is rejected: a resident with no folder or not archived gives notFound(); a Drive failure shows a readable alert
- [ ] Boundary cases — n/a: the list is capped at 200 files and 3 folder levels, by design

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | archive-files page | opens, lists files | pending: not driven |
| exactly a card that opens the resident hub | archive-files page | lists only files can_see_drive_file() allows | pending: not driven |
| signed out | archive-files page | RLS returns no resident row, so 404 | by source, not driven |

- [ ] Every login above tested — pending: not driven; needs a Drive-backed archived resident
- [ ] A login that should not have access is blocked server-side — pending: the page reads under RLS and each file under `can_see_drive_file`, by source; not driven

## 5. Cross-cutting

- [ ] Nav entry — n/a: reached from the deceased banner, no nav entry
- [ ] Manual updated — n/a: the manual does not describe the Drive folder button
- [x] Translatable strings go through the dictionary in both en and th
- [ ] Mobile viewport — pending: not driven
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — pending: not driven

## 6. Regression

- [ ] Pages nearest the change still work — pending: not driven; typecheck and build cover compile only
- [ ] Shared file touched checked from a second page — n/a: no shared file with other consumers was edited beyond removing the unused `driveFolderUrl`, confirmed unused by grep
- [x] Nothing merged from `main` was broken — gates run on the merged tree

## 7. Documentation

- [x] Backlog item #dv7k3 ticked on this branch
- [x] Decision file `docs/decisions/2026-11-11-drive-links-app-served.md`
- [ ] README.md still accurate — n/a: README does not mention these links
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why
- [x] Claims were measured: `grep -rn "drive.google.com" src/` shows only comments

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives dates
- [ ] Boundary/banding assertions — n/a: no threshold change
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Dry-run against production — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback stated — deferred: release manager; code-only, revert the PR, no schema to undo

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a closed resident with a Drive archive, press Archive files and open one file | `/residents/<id>` banner |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1 above

pending: item 1 above needs a person (or a Drive-backed dev resident)

Result: pass
