# Feature test plan — profile-photo-video-guards

## Header

| | |
|---|---|
| Feature | A video cannot become a resident's profile picture via set_resident_profile_photo() or the delete-attachment fallback |
| Backlog item | `docs/backlog.md` → `#27l6m` (ticked) |
| Branch / worktree | `claude/profile-photo-video-guards` @ `C:\Development\Animal_Shelter_profile-photo-video-guards` |
| Dev server | not started — no UI surface in this PR |
| PR | n/a: not yet — the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | yes — `0313_profile_photo_picture_guards.sql` |
| Tested at SHA | 40caacc7 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item — both remaining routes now refuse a non-picture as the profile picture
- [x] Files/areas touched listed — `supabase/migrations/0313_profile_photo_picture_guards.sql`, `scripts/check-record-attachment-guards.mjs`, `docs/backlog.md` (tick), decision file, this plan
- [x] Cards affected identified — none; no activity, card or grant changes. Admin unaffected
- [x] Out of scope written down — whether the fallback itself is right, and the fallback not skipping a Medical file; both for the planner

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran; its push was rejected by GitHub (500), retried before the PR
- [x] `node scripts/gates.mjs` four-gate line, run in the background and the file read afterwards:

```
=== gates: typecheck exited 0 after 132s
=== gates: lint exited 0 after 265s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 448s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number one above the highest on main — 0313 after 0312; only migration in the batch
- [x] `--status` before: 313 applied, 0 pending; after: 314 applied, 0 pending
- [x] `--dry-run`: `0313_profile_photo_picture_guards.sql … ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`)
- [x] Re-runnable (`create or replace`)
- [x] Existing rows still read correctly — functions only; no data changed
- [x] Exercised against real rows in a rollback harness — `node scripts/check-record-attachment-guards.mjs`: section D failed at D1 before 0313 and holds after; earlier 0306 assertions still hold
- [x] Down-migration not needed: restoring 0277's and 0264's bodies undoes it
- [x] Production apply plan: normal pending file with the release; no code depends on it

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface; database path covered by the harness
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface; delete fallback is in the harness
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface; refusal is in the harness
- [ ] Boundary cases — n/a: no UI surface; only-a-video-left case is in the harness

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly photos.resident_manage (harness login) | set/delete photo functions | photo accepted, video refused | harness: held |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side — permission checks in both functions are unchanged

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: nothing a user can open
- [ ] Translatable strings — n/a: no new string in the app
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no page

## 6. Regression

- [x] Nearest code: record_attachment guards — 0306 assertions in the same harness still pass
- [x] Shared files — none touched
- [x] Nothing broken by main — sync merged nothing

## 7. Documentation

- [x] Backlog `#27l6m` ticked and its title re-read alone: it now says done
- [x] Decision file `2026-11-04-profile-photo-video-guards.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: 0313 is not on production yet
- [x] Commit message says why
- [x] Claims were measured: harness output and gate lines are from the runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — n/a: gates block pasted unedited
- [ ] Public pages re-checked after purge — n/a: no public page change

### Deploy safety

- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env line — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and code that reads it in one PR? n/a: no code reads anything new
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration — n/a: two functions replaced
- [ ] Apply plan — deferred: release manager

### Rollback

- [ ] Rollback position — n/a: restore the 0277 and 0264 function bodies; harmless to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Delete fallback does not skip a Medical file (predates this PR) | deferred to backlog, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [x] The manual list is empty: there is no surface for a person to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet
