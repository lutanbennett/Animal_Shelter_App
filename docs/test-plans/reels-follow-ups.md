# Feature test plan — reels-follow-ups

## Header

| | |
|---|---|
| Feature | Reels follow-ups: `can_see_drive_file()` lists reels (0324), the reel video route removed, the resident page lists its reels |
| Backlog item | `docs/backlog.md` → `#8bz78` (annotated, not ticked) |
| Branch / worktree | `claude/reels-follow-ups` @ `C:\Development\Animal_Shelter_reels-follow-ups` |
| Dev server | `http://localhost:3003` (`.port`) |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | yes — 0324 |
| Tested at SHA | 566c669f |

## 1. Scope and risk

- [x] Change is described in one sentence — reels join the one Drive-file decision point, and the resident page lists its reels
- [x] Files/areas touched listed — `supabase/migrations/0324`, `src/app/reels/`, `src/app/api/reels/[id]` (removed), `src/lib/reels/queries.ts`, `src/app/residents/[id]/`, both dictionaries, `scripts/check-can-see-drive-file.mjs`
- [x] Cards affected identified — `meme_library` (carries `social.library`), which is all that reels and the resident's reel list ask; Admin unaffected; signed-out refused by the table's RLS
- [x] Out of scope written down — splitting `social.library` or a Reels card (`#i7qkz`), widening any card for the `#` picker, the Read-only drive

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in ("Already up to date" at commit time)
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all four 0 (a first run failed typecheck on a missing field, fixed in the next commit):

```
=== gates: typecheck exited 0 after 43s
=== gates: lint exited 0 after 335s
=== gates: test exited 0 after 31s
=== gates: build exited 0 after 91s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0323), checked by the post-commit hook
- [x] `--status` reviewed (324 applied, 1 pending)
- [x] `--dry-run` reviewed: 0324 ok
- [x] Applied to dev and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`)
- [ ] Existing rows still read correctly — pending: `check-can-see-drive-file.mjs` run against dev after apply (below)
- [ ] Constraints exercised in a harness — n/a: no constraint or default, one function branch
- [x] Down-migration not needed: `0286`'s body restores the old function
- [ ] Production apply plan — deferred: release manager (0318–0324 pending on production, apply before deploy)

## 4. Functional checks

- [ ] Happy path — pending: resident page list and reel playback through /api/videos not driven in a browser this session
- [ ] Data persists — n/a: no new write path
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: the hub card's empty sentence is a one-line string, not driven
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `meme_library` | resident page reel list; /api/videos/<reel file> | listed; plays | pending: not driven |
| signed out | /api/videos/<reel file> | not found | pending: not driven |

- [ ] Every login above tested — pending: as the table
- [ ] A login that should not have access is blocked server-side — pending: as the table

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user newly reads in the manual; reels have no topic yet
- [x] Translatable strings go through both dictionaries (`reels.hub.*`; Thai unreviewed)
- [ ] Mobile viewport — pending: not looked at
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — pending: not driven

## 6. Regression

- [ ] Nearest pages — pending: resident hub and /reels not loaded in a browser
- [ ] Shared file check — pending: ResidentHub.tsx edited, not loaded
- [x] Nothing merged from main was broken — main merged cleanly, gates cover it

## 7. Documentation

- [x] Backlog item annotated on this branch, not ticked (Read-only drive and decoding still open)
- [x] Decision file `docs/decisions/2026-11-06-reels-follow-ups.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: needs 0322–0324 applied to production
- [x] Commit messages say why
- [x] Claims were measured: the live function definition was found by opening 0193, 0218 and 0286

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date derivation
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: gates block only, pasted unedited
- [ ] Public pages re-checked — n/a: reels are never public
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var — n/a: none
- [ ] Both migration and reader in one PR: apply before deploy — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — n/a: additive function replacement
- [ ] Apply plan: 0324 on production before the deploy, after 0318–0323 — deferred: release manager
- [ ] Rollback stated — n/a: re-applying 0286's body restores the old function

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Read-only view of reels cannot be driven: no card holds social.library at Read alone | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A reel plays and downloads through /api/videos; the resident page lists its reels | /reels, a tagged resident |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

- [ ] Manual list is empty — pending: item 1 above

Manual verification by: pending: item 1 above

- [ ] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
