# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): list the 146 verified addresses on `WRAPPED_WRITE_PATHS` (the switch-on), match `[id]` segments in `isWrappedWritePath()`, hold back three |
| Backlog item | `docs/backlog.md` → **PI FAILOVER: DONE 2026-11-01 … THE SWEEP IS FINISHED EXCEPT FOR THE THREE DELIBERATE EXCEPTIONS** (Security) |
| Branch / worktree | `claude/write-paths-list` @ `C:\Development\Animal_Shelter_write-paths-list` |
| Dev server | `preview_start` name `dev` → `http://localhost:3001` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | dd14a8e9 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — 146 addresses go on `WRAPPED_WRITE_PATHS`, so the Worker replays a POST on each after the Pi fails to answer it clearly
- [x] Files/areas touched listed — `src/lib/write-requests.ts` (the list, and `isWrappedWritePath()` now treats a `[name]` segment as any one segment, and `"/"` as exact); `worker/origin.test.mjs` and `src/lib/action-result.test.mjs` (two unit tests that assumed the old one-path list); `scripts/check-worker-origin.mjs` (its "unwrapped" subject path and near-miss case, plus one `[id]` case); `docs/backlog.md`; a decision file; this plan. No action module, no `worker/`, no migration, no change to `runWriteAction()`
- [x] Roles affected identified — **by card, not by role**: no permission or control changed; the listing changes only what the Worker does when the Pi does not answer a save
- [x] Anything explicitly **out of scope** written down — the three held-back addresses (`/admin/security`, `/admin/security/verify`, `/services/desexing`); wrapping anything; the nested claim in `assistant/actions.ts`; stream 23's permission change on `/management/translations`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (`0292` is proved by `scripts/prove-write-requests.mjs`, not changed here)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven as Admin on dev (`dev-signin.mjs admin`, port 3001), `requestAnimationFrame` firing, reached by clicking through. **One address was driven: `/projects/[id]`** (a bracketed address, so it also exercises the matcher on a real URL). The other 145 were not driven; the decision file §5 says so.

- [x] Happy path works end to end — "New folder" on `/projects/<uuid>` created the folder and navigated to it
- [x] Data persists — the parent folder page lists the new folder, exactly once
- [ ] Create / edit / delete all exercised — n/a: this PR changes no write; create was driven as the replay subject, the rest are under Left for manual verification
- [ ] Empty state renders sensibly — n/a: no rendering code changed
- [x] Invalid input is rejected with a readable message — the fresh-id control returned "A folder with that name already exists here."
- [x] Boundary cases checked — **the replay boundary, measured**: the captured POST was re-sent twice unchanged and both answered the stored first result (same `folderId`); the same request with a fresh id reached the body and was refused; one folder of that name exists. The matcher: `/residents/42/edit`, `/projects/<uuid>` and `/` are wrapped; `/residents/42/a/b`, `/admin/unitsx`, `/admin/security`, `/admin/security/verify` and `/services/desexing` are not (`check-worker-origin.mjs`: all cases ok)

### Role access matrix

**Not re-run, and deliberately.** No permission check and no control's visibility changed.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/projects/[id]` | unchanged | saved, replayed from stored result |
| management | — | unchanged | n/a: no gate changed |
| staff | — | retired role | n/a |
| doctor | — | unchanged | n/a: no gate changed |
| volunteer | — | unchanged | n/a: no gate changed |
| signed out | `/login` | unchanged | n/a: declared replay-safe, behaviour not changed |

- [ ] Every role above tested — n/a: no permission check or control visibility changed
- [x] A role that should not have access is blocked server-side — every `can(...)` guard is inside the claimed body exactly where it was; nothing here touches one

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a manual reader can see changed
- [ ] Translatable strings — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout changed
- [x] Browser console clean — no error shown during the driven flow
- [x] Network clean — the driven save and its two replays answered 200; the control answered with the deliberate refusal

## 6. Regression

- [x] The pages nearest the change still work — `/my`, `/projects`, `/projects/[id]` loaded by click-through
- [x] Any shared file touched checked from a second, unrelated page — `isWrappedWritePath()` is read only by `worker/origin.mjs` and the two scripts; `check-worker-origin.mjs` exercises the Worker's real `originOrLocal` with the new list
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates re-run after the merge

## 7. Documentation

- [x] Backlog item ticked — the Pi-failover sweep item, retitled to say what is closed and that the three exceptions keep their own items
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-write-paths-list.md`
- [x] `README.md` still accurate — it does not describe write paths
- [ ] **Release notes.** — n/a: a failover that only acts during a Pi outage, and production is behind on `0292`, so a note would promise something not live
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The 149 is `find src/app -name page.tsx` and the check's row count; the 146 is `WRAPPED_WRITE_PATHS.length`; the replay answers were read from the running app; the `[id]` mismatch was shown by calling the matcher before and after

## 8. Pre-production gate

**This change DOES alter runtime behaviour on the Worker** (146 addresses are now replayed after a failed Pi attempt), but nothing is live on production until `0292` is applied there. Deploy-time lines are `deferred:`.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. Best test: Pi stopped, press one save on a resident page, press it again
- [ ] Timezone-sensitive behaviour proved — deferred: release manager. Nothing here derives a date
- [ ] Boundary or banding change covers both edges — deferred: release manager. No threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — deferred: release manager. No public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: release manager. None added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — reverting this PR returns the list to `["/admin/units"]`. The Pi rollback is `./scripts/pi/deploy-pi.sh --ref <sha>`; neither it nor `wrangler rollback` reverts migrations, and this PR has none

## Left for manual verification

| What | Where | Who |
|---|---|---|
| With the Pi stopped (or `ORIGIN_HOST` pointed nowhere), press one save on a resident page and one on a management page; confirm each lands once | test.lannacare.org | Lutan |
| Press once each the other save kinds earlier streams could not drive (calendar confirm, photo approve, website uploads, alert buttons, change password) | the pages that host them | Lutan |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: one address was driven by Claude on dev; the table above has not been pressed by a person.

## Result

Result: pass

## Evidence

`node scripts/check-wrapped-write-paths.mjs` ends `every path on WRAPPED_WRITE_PATHS has all its reachable writes wrapped (146 listed)`; `--all` reports 3 unwrapped addresses (`/admin/security`, `/admin/security/verify`, `/services/desexing`), 146 complete, 149 rows. `node scripts/check-worker-origin.mjs` ends `all cases ok`.

```
gates: typecheck=0 lint=0 test=0 build=0
```
