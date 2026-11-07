# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Record that the Pi's Drive mirror is a cache (Lutan's stage-2 decision), and that the Drive buckets cost it one re-pull |
| Backlog item | `docs/backlog.md` → `#svs6c` |
| Branch / worktree | `claude/mirror-repull-note` @ `C:\Development\Animal_Shelter_mirror-repull-note` |
| Dev server | not started — documentation only, no app surface |
| PR | #1373 |
| Tested by / date | Claude (planner session) / 2026-11-07 |
| Carries a migration? | no |
| Tested at SHA | `5d83aecb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — records Lutan's stage-2 decision (the Pi copy is the cache, Drive the fallback) and the one-off mirror re-pull caused by the Drive buckets; `#svs6c`'s open half was exactly "Lutan decides"
- [x] Files/areas touched listed — `docs/pi-hosting.md` (two sections), `docs/decisions/2026-11-07-mirror-is-a-cache.md` (new), `docs/backlog.md` (tick + retitle), this plan. **No code, no scripts, no migration, no `src/`**
- [x] Cards affected identified — **none.** Nothing here reads, grants or denies a card, and no page, control or policy changes. `src/lib/mirror-read.ts` is explicitly a bytes cache that decides nothing about who may see a file; it is unmodified. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — `scripts/pi/drive-mirror.mjs` is NOT touched (pull-only by rule, its header says not to improve it); no change to `noauto` in `/etc/crypttab`; no change to any `GOOGLE_DRIVE_ROOT_FOLDER_ID`; the mirror was not run, and the re-pull will happen on its own nightly timer

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run in this worktree, output read from the file:

```
=== gates: typecheck exited 0 after 45s
=== gates: lint exited 0 after 118s
=== gates: test exited 0 after 44s
=== gates: build exited 0 after 282s
gates: typecheck=0 lint=0 test=0 build=0
```

  **Run before the final `sync`, and deliberately not re-run after it.** The merge that followed brought
  in four commits touching **`docs/backlog.md` and nothing else** (`git diff --stat HEAD...origin/main`),
  so no input to typecheck, lint, test or build changed. Said here rather than left to be assumed.
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no database read or write changes
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only; there is no path a user can walk
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no feature surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**What was verified instead, since the deliverable is the accuracy of the prose.** Every factual claim
added to `docs/pi-hosting.md` and the decision file was read from the code or measured on the Pi, not
reasoned:

- `scripts/pi/drive-mirror.mjs:178` — the skip condition is `prev.modifiedTime === f.modifiedTime && prev.path === want`, which is what makes a moved file re-copy. Read.
- `scripts/pi/write-env.mjs:94` — `MIRROR_DEST` is written for `production` only. Read.
- The three mirror read call sites — `src/app/api/photos/[fileId]/route.ts`, `src/app/api/documents/[fileId]/route.ts`, `src/lib/google/stream-video.ts`. Found by `grep -rln "mirror-read" src/`.
- `src/lib/mirror-read.ts` resolves a file by Drive file id through `_mirror/state.json`. Read.
- `df -h /mnt/lanna-mirror` on the Pi, 2026-11-07: **1.8T size, 1.3G used, 1.7T avail, 1%**. Run.
- `/mnt/lanna-mirror/_mirror/status.json`: `lastSuccess 2026-11-06T21:06:37.602Z`, `{"new":5,"changed":0,"same":1134,"gone":1,"failed":0,"skipped":2}`. Run — this is what establishes that the re-pull has not happened yet.
- `du -sh /mnt/lanna-mirror/*`: `1.3G lanna`, `184K _mirror`. Run.
- The one-re-pull-not-two correction came from the `drive-buckets` session, which had itself switched production's root earlier the same day; it is recorded as its correction rather than as my own measurement.

### Role access matrix

- [ ] Every login tested — n/a: no page, route, control or policy changes, so there is no access that could differ between logins
- [ ] A login that should not have access is blocked server-side — n/a: nothing reachable was added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; nothing under `src/app/`
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this documents the Pi's hosting for whoever maintains the box, not a screen a shelter user meets
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — no pages exist, so the documentation equivalent was done: both edited sections of `docs/pi-hosting.md` were re-read in place after patching, and the heading change was checked for stale references with `grep -rn "stays primary" docs/`
- [x] Any shared file touched checked from a second, unrelated place — `docs/backlog.md` is the shared file. `node scripts/check-backlog-sections.mjs` run after the edit: `ok — 64 open items, all above ## Completed`. The retitled item was re-read whole to confirm it reads correctly without its last paragraph, as `CLAUDE.md` requires
- [x] Nothing merged from `main` during `sync` was broken by this branch — cut from `origin/main` after #1372 merged, and touches documentation only

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#svs6c` ticked and retitled so the title alone says nothing is left to decide, with the old title marked `SUPERSEDED 2026-11-07` in place
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-07-mirror-is-a-cache.md`
- [x] `README.md` still accurate — read; it does not describe the mirror's primary/cache status
- [ ] **Release notes.** — n/a: nothing a shelter user would notice. No behaviour changed at all — the decision ratifies what the code already did, and the rest is documentation for whoever maintains the Pi
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the prose is listed in section 4 with the command that produced it. The two needing care: the re-pull size (**915 files / 1.1 GB**, the Production bucket's own count from the `drive-buckets` stream, not my earlier whole-tree 1.9 GB figure) and the claim that reads do not break (read from `mirror-read.ts` resolving by id, not inferred from "ids are stable")

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no code and no date handling
- [ ] Boundary or banding change covered at both edges — n/a: no logic changes
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: a deploy-time check with no deploy in this PR; the evidence in sections 2 and 4 is pasted from its runs, unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable; `MIRROR_DEST` and `GOOGLE_DRIVE_ROOT_FOLDER_ID` already exist and are untouched here
- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting this commit removes three documents and restores the old `#svs6c` title. It does not and cannot undo anything on the Pi, because nothing was changed there: no service restarted, no environment file edited, no mirror run. The one-off re-pull described here happens on the nightly timer whether or not this PR exists

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `docs/pi-hosting.md`'s heading read *"stage 1 … Drive stays primary"*, which reads as though the app serves no files from the Pi. It does, through three call sites. On 2026-11-07 the `drive-buckets` stream quoted it in good faith and told Lutan the app does not read photos from the Pi | Fixed — the heading now reads *"a cache on the USB drive; Drive stays the source of truth"* and the section names the three call sites |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. The one thing a person might have been asked to check — free space before the next timer fires — was measured instead (1.7 TB free), so there is no handover | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: documentation only, with every claim read from code or measured on the Pi, and no screen for anyone to look at

Manual verification by: n/a: documentation only — no surface for a person to look at, and the figures were measured rather than observed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing to hand over: no deploy, no migration, no production step

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing to deploy
