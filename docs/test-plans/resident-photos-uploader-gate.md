# Feature test plan

## Header

| | |
|---|---|
| Feature | resident-photos-uploader-gate |
| Backlog item | `docs/backlog.md` → #q8h4v, #r6v8k |
| Branch / worktree | `claude/resident-photos-uploader-gate` @ `C:\Development\Animal_Shelter_resident-photos-uploader-gate` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | 16d617a6 |

## 1. Scope and risk

- [x] Change is described in one sentence: the photos tab draws the uploader only for a login holding photos.resident_add, and the gallery captions Private only apart from waiting
- [x] Files touched: photos.tsx, PhotoGallery.tsx, lib/photos/approval-state.ts, lib/adoption-updates/options.ts (select), both dictionaries, releases.ts, the existing gallery test, decision file
- [x] Cards affected: the card carrying photos.resident_add (uploader); any card seeing a Private only photo (caption). Admin sees both through the Admin bypass; signed-out public is not affected
- [x] Out of scope: route checks, policies, can_approve_photos(), migrations, adoption-updates controls, the public adopt gallery

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (docs only)
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 195s
=== gates: lint exited 0 after 465s
=== gates: test exited 0 after 43s
=== gates: build exited 0 after 367s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] apply-migrations --status — n/a: no migration
- [ ] apply-migrations --dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration (reads the existing 0318 approval column)
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — pending: not driven in a browser this session; see manual table
- [ ] Data persists — n/a: display-only change, nothing is written
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — pending: not driven in a browser this session
- [ ] Invalid input — n/a: no input added
- [ ] Boundary cases — n/a: unrecognised approval value covered by approval-state.ts reading (widen to Not on the website); no executable test beyond source assertions

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | photos tab | uploader and all captions | pending: not driven |
| exactly the add-resident-photos card | photos tab | uploader shown | pending: not driven |
| a folder card without photos.resident_add | photos tab | no uploader | pending: not driven |
| signed out | photos tab | refused | n/a: unchanged, not driven |

- [ ] Every login above tested — pending: not driven in a browser
- [ ] Blocked server-side — n/a: no server check changed; route still refuses (route.ts:45, :98)

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic describes these captions
- [x] Translatable strings go through the dictionaries (en and th)
- [ ] Mobile viewport — pending: not driven
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — pending: not driven

## 6. Regression

- [ ] Nearest pages — pending: not driven; source tests and build pass
- [ ] Shared files loaded from a second page — pending: not driven
- [x] Nothing merged from main during sync was broken (docs only)

## 7. Documentation

- [x] Backlog items #q8h4v and #r6v8k ticked on this branch
- [x] Decision file docs/decisions/2026-11-08-resident-photos-uploader-gate.md
- [ ] README.md — n/a: nothing in it describes these controls
- [x] **Release notes.** Two lines added to `unreleased`; the caption note says it shows once the Private only answer is live
- [x] Commit messages say why
- [x] Claims were read from source (route.ts lines quoted), not reasoned

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence is unedited tool output — n/a: gates block above is pasted unedited
- [ ] Public pages re-checked — n/a: public adopt gallery untouched
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets exist — n/a: none added
- [ ] Migration and reading code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager (code only, nothing to revert in the database)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Thai strings unreviewed | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Drive the photos tab with a one-card login for the add card and with a folder-only card; uploader shown vs absent | resident Photos tab, port 3011 |
| 2 | A Private only, a public and a never-reviewed photo each caption correctly (dev only until 0318 is on production) | resident Photos tab |
| 3 | Review the Thai wording | Photos tab in Thai |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

- [ ] Manual list is empty or checked — pending: items above need a person

Manual verification by: pending: the three items in Left for manual verification

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — pending: PR not open yet
- [ ] Handed to the release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
