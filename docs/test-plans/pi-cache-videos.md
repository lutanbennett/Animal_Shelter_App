# Test plan: pi-cache-videos

## Header

| | |
|---|---|
| Feature | Staff (non-public) videos are streamed from the Pi's Drive mirror, with Range support, when present, else Drive as before |
| Backlog item | `docs/backlog.md` → Architecture, "SERVE STAFF FILES FROM THE PI'S LOCAL COPY AS A CACHE" (videos part) |
| Branch / worktree | `claude/pi-cache-videos` @ `C:\Development\Animal_Shelter_pi-cache-videos` |
| Dev server | port 3005 (not started: dev has no MIRROR_DEST, so the path is off by design) |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | 7c152c2b |

## 1. Scope and risk

- [x] Change is described in one sentence: a streamed, range-aware read path from the Drive mirror in the video route, after the authorisation checks, headers unchanged
- [x] Files touched: `src/lib/mirror-read.ts` (+ test), `src/app/api/videos/[fileId]/route.ts`, backlog, decision file 2026-10-29-pi-mirror-videos.md
- [ ] Roles affected identified — n/a: no access rule changed; the same checks run first
- [x] Out of scope: documents/attachments (no route serves them; they open in Drive), comparing modifiedTime, any change to the mirror script, any migration

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: origin/main was already merged in when run
- [x] `node scripts/gates.mjs` ends clean. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised against real rows — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: unit test streams a video by id: whole file, bytes=1-, bytes=-1, over-long end, 416
- [x] Data persists — n/a-equivalent checked: read only, nothing written (test confirms files untouched)
- [ ] Create / edit / delete — n/a: read path only
- [ ] Empty state — n/a: no UI
- [x] Invalid input: gone entry, unknown id, __proto__, ../ escape, non-video extension and missing file are all misses
- [x] Boundary cases: MIRROR_DEST unset, and set with no state.json, both return a miss

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: authorisation code unchanged and runs before the disk read |
| management | n/a | n/a | n/a: as above |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: as above |
| volunteer | n/a | n/a | n/a: as above |
| signed out | n/a | n/a | n/a: as above |

- [ ] Every role above tested — n/a: no gate changed; mirror read sits after them in the route
- [ ] A login without access is refused by the database — n/a: not re-tested, unchanged code path

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual updated — n/a: no user-facing change until the Pi mirror runs
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: dev has no mirror; the Drive path is unchanged

## 6. Regression

- [x] Nearest check re-run: the full test suite inside gates
- [ ] Shared file touched — n/a: none of the frequently shared files touched
- [x] Nothing merged from main was broken by this branch

## 7. Documentation

- [x] Backlog item annotated: videos done; documents need a proxy decision (own item); timings still open
- [x] Decision file: `2026-10-29-pi-mirror-videos.md`
- [x] README.md still accurate
- [ ] **Release notes.** n/a: the read path ships; the Pi mirror install and first run are outstanding
- [x] Commit messages say why
- [ ] Claims measured — n/a: no timing claimed; the phone timing is pending in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line
- [ ] Public pages re-checked — n/a: public path untouched

### Deploy safety

- [ ] Production ref line read — n/a: nothing deployed by this PR
- [ ] strip-baked-env seen — n/a: nothing deployed by this PR
- [ ] New secret/env var — n/a: MIRROR_DEST is a path written by write-env.mjs on the Pi, not a secret

### Migration ordering

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting removes the read path; Drive is untouched and still primary

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | modifiedTime not compared; an in-place edited document is stale until the next mirror run | accepted: stated in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Play a resident video with MIRROR_DEST set and the mirror mounted; confirm it plays, seeks, and timing | Pi, after the mirror install |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty — n/a: it holds the Pi check

Manual verification by: pending: Lutan, after the Pi mirror is installed and run

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
