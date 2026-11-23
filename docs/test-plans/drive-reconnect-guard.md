# Feature test plan: drive-reconnect-guard

## Header

| | |
|---|---|
| Feature | Refuse a Drive reconnect with an account that cannot open the shelter's folder |
| Backlog item | `docs/backlog.md` → #rcwrg |
| Branch / worktree | `claude/drive-reconnect-guard` @ `C:\Development\Animal_Shelter_drive-reconnect-guard` |
| Dev server | `http://localhost:3002` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | c8f8427f4 |

## 1. Scope and risk

- [x] Change is described in one sentence: a live-row Drive reconnect whose token cannot open the recorded folder is refused, not repointed at a new empty folder
- [x] Files touched: src/lib/google/shelter-google-connect.ts, shelter-drive-decide.ts, shelter-google-connect-decide.ts, src/app/admin/GoogleConnect.tsx, en.ts, th.ts, one test
- [x] Cards affected: none; the connect path is Admin-only and unchanged in who may press it. Signed-out public unaffected
- [x] Out of scope: staging a live account change (c), showing the account on the button (b), calendar, the real two-account press

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main already up to date
- [x] `node scripts/gates.mjs`

```
=== gates: typecheck exited 0 after 144s
=== gates: lint exited 0 after 328s
=== gates: test exited 0 after 72s
=== gates: build exited 0 after 210s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number one above main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised against rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path end to end — pending: needs a second Google account on dev (connect, upload a photo, reconnect to a different account); proved instead at the decision layer by shelter-drive-reconnect-guard.test.mjs (folder recorded and unopenable gives refuse)
- [ ] Data persists — n/a: the refusal writes nothing by design
- [ ] Create / edit / delete — n/a: no records created or edited on the refusal path
- [ ] Empty state — n/a: a shelter with no folder recorded still makes one (tested)
- [ ] Invalid input readable message — n/a: wrong_account message added in English and Thai, shown with the connected account; not seen in a browser
- [ ] Boundary cases — n/a: null, blank and recorded folder ids covered in the test

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Connect start/callback | unchanged | n/a: not pressed, needs Google |
| signed out | nothing | unchanged | n/a: route untouched |

- [ ] Every login above tested — n/a: access rules untouched
- [ ] Blocked server-side — n/a: the Admin check in the route is untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual updated — n/a: no new behaviour a user operates
- [ ] Translatable strings — n/a: added to the en and th dictionaries directly, typecheck proves both have the key
- [ ] Mobile viewport — n/a: one sentence added to an existing message line
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] Nearest pages — n/a: build compiles the Settings page; not loaded in a browser
- [ ] Shared file touched — n/a: no shared nav or manual file touched
- [ ] Nothing from main broken — n/a: sync was already up to date

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file docs/decisions/2026-11-23-drive-reconnect-guard.md
- [x] README still accurate
- [ ] **Release notes.** n/a: only reachable by an Admin picking the wrong Google account, and it only blocks a harm; nothing appears or moves
- [x] Commit messages say why
- [x] Claims measured: the verifyDrive behaviour was read in scripts/lib/connect-shelter-drive.mjs; the test ran

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone behaviour — n/a: nothing date-based
- [ ] Boundary edges — n/a: not a banding change
- [ ] Evidence unedited — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret exists in production — n/a: no new variables
- [ ] Migration and code ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup before destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: pure code change; revert the PR, nothing in the database changes

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Connect Drive on one account, upload a photo, reconnect with a different account: refused with the message and photo still loads | dev or test, needs a second Google account |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

- [ ] Manual list is checked by a person — pending: item 1 needs a second Google account

Manual verification by: pending: needs a second Google account on dev

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: PR body links the plan
- [ ] Handed to the release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
