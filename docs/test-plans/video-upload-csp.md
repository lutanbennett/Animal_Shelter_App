# Feature test plan — video-upload-csp

## Header

| | |
|---|---|
| Feature | The Worker's CSP now lets the browser send a video to Google Drive; the retry count resets on progress; the failure message stops blaming the connection |
| Backlog item | `docs/backlog.md` → `#vib7j` (NOT ticked: the Worker deploy closes it) |
| Branch / worktree | `claude/video-upload-csp` @ `C:\Development\Animal_Shelter_video-upload-csp` |
| Dev server | not used for proof — `next dev` has no Worker in front of it and sends no CSP, so it cannot show this fix |
| PR | n/a: not yet — the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | c38449ee |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item — add `https://www.googleapis.com` to `connect-src`, fix the retry reset, reword `connectionLost`
- [x] Files/areas touched listed — `worker/security-headers.mjs`, `worker/security-headers.test.mjs`, `src/lib/uploads/resumable-video.ts`, `en.ts` and `th.ts` (one string each), decision file, this plan
- [x] Cards affected identified — none; no activity, card or grant changes. Admin and the signed-out public unaffected
- [x] Out of scope written down — no other CSP directive, the photo path and `src/lib/google/` untouched; no CSP review

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran after the gates; origin/main brought only a docs/backlog.md change, so the gated code is unchanged
- [x] `node scripts/gates.mjs` four-gate line, run in the background and the file read afterwards:

```
=== gates: typecheck exited 0 after 216s
=== gates: lint exited 0 after 375s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 261s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` — n/a: no migration
- [ ] `--dry-run` — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: needs the Worker's header in front of a real Drive upload; `next dev` sends no CSP. Covered by test of the header's content; the real upload is a manual row below
- [ ] Data persists — n/a: no data written by this change
- [ ] Create / edit / delete — n/a: no UI change
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input rejected — n/a: no input handling changed
- [ ] Boundary cases — n/a: the retry reset is one condition (probe shows more bytes held than before); not driven against Drive

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | n/a: no access rule changed | n/a | n/a |

- [ ] Every login above tested — n/a: no access rule changed
- [ ] A login that should not have access is blocked server-side — n/a: the start and finish routes are untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: no behaviour the manual describes changed
- [x] Translatable strings — `connectionLost` reworded in both dictionaries (Thai is ours and unread by a Thai speaker)
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console — n/a: not driven; see manual row
- [ ] Network — n/a: not driven; see manual row

## 6. Regression

- [x] Nearest code: the other users of `CSP` — `node --test worker/*.test.mjs` runs in the gates' test step
- [ ] Shared files — n/a: none of NavLinks, manual or shared libs touched
- [x] Nothing broken by main — see sync line

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked on purpose; the Worker deploy is what closes `#vib7j`
- [x] Decision file `2026-11-04-video-upload-csp.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: needs the Worker deployed before a user could upload a video
- [x] Commit message says why
- [x] Claims were measured: the test run and the gate lines; the cause is Lutan's console message; what could not be measured (CSP log, past successes) is written as not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: Lutan (Worker deploy is his)
- [ ] Smoke-tested on test — deferred: Lutan, upload a video
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — n/a: gates block pasted as printed
- [ ] Public pages re-checked after purge — n/a: no public page change

### Deploy safety

- [ ] deploy line read — deferred: Lutan
- [ ] strip-baked-env line — deferred: Lutan
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and code in one PR? n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: revert the commit and redeploy the Worker; nothing persistent changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the Worker deploy, upload a real video (ideally a large iPhone .MOV) on a resident's Photos/Videos tab; it should finish and appear. If it still fails, read the browser console for a blocked host | the live site |
| 2 | Read the Worker logs for csp-report lines since 2026-10-20 and note any host besides googleapis.com | Cloudflare dashboard / `wrangler tail` |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [ ] Manual list handled — n/a: not done by Claude, left to Lutan's own upload after the Worker deploy (row 1 above)

Manual verification by: pending: Lutan's own upload after the Worker deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and accounts for each deliverable
- [ ] Handed to the production release manager — n/a: the Worker deploy is Lutan's, and he does the upload check himself

Result: pass

Release manager acknowledgement: n/a: not yet released
