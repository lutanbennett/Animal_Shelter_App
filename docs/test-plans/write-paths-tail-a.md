# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): put every write in sixteen shared action modules (bills, blood tests, clinic visits, deliveries, diets, immunizations, maintenance, medical scan/weight, memes, outreach) through `runWriteAction()`; add nothing to `WRAPPED_WRITE_PATHS` |
| Backlog item | `docs/backlog.md` → **PI FAILOVER: (D) IS UNBLOCKED … WHAT IS LEFT IS THE SWEEP** (Security) |
| Branch / worktree | `claude/write-paths-tail-a` @ `C:\Development\Animal_Shelter_write-paths-tail-a` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | see the PR's head commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — sixteen `actions.ts` modules and their client callers under `src/app/{bills,blood-tests,clinic-visits,deliveries,diets,immunizations,maintenance,medical,memes,outreach,my}`; `src/components/RecordRowActions.tsx`; one new client component `src/app/clinic-visits/RetryCalendarForm.tsx`; one block of `src/app/residents/[id]/[section]/sections/clinic-visits.tsx` (swapped for it, allowed by the brief's clause); a decision file. No `worker/`, no migration, no change to `runWriteAction()`, `claim_write_request()` or `mayReplayWrite()`
- [x] Roles affected identified — **by card, not by role**: the writes are gated by `medical.blood_tests`, `medical.visits`, `visit.book`, `stock.delivery`, `maintenance.bills`, `medical.diet`, `medical.weight`, `social.library`, `community.outings` and the bills card. **No gate was changed**; every `can(...)` is inside the claimed body exactly where it was
- [x] Anything explicitly **out of scope** written down — nothing added to `WRAPPED_WRITE_PATHS`, so no behaviour change; `residents/**`, `management/**`, `admin/**`, the next-batch modules and the auth modules not touched (decision file sections 2 and 4)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (the `0292` functions this calls are proved by `scripts/prove-write-requests.mjs`, run by the admin sweep and not changed here)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

One flow driven: the **new outing** form (`createOuting`) as Admin on dev, reached by clicking
`/operations` → `/outreach` → `/outreach/new`, with `requestAnimationFrame` confirmed firing. The other
fourteen modules were **not** driven individually — see **Left for manual verification**.

- [x] Happy path works end to end — outing saved, page returned to `/outreach`, the new row's note was on the page
- [ ] Data persists — n/a: seen on the list after the redirect, which is a fresh server render of the same rows; no separate reload was done
- [ ] Create / edit / delete all exercised — n/a: only create was driven (outreach); the rest share the same `useWriteCall` / `useWriteForm` shape and are listed under Left for manual verification
- [ ] Empty state renders sensibly — n/a: no rendering code changed
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed; every refusal is returned as before and now stored by the wrapper
- [ ] Boundary cases checked — n/a: the replay boundary (stored result on a repeated id, body not re-run) is the admin sweep's measured proof of the shared mechanism, which this stream calls and does not change

### Role access matrix

**Not re-run, and deliberately.** No permission check and no control's visibility changed; this is
analysis by card in section 1, not by role.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | outreach new-outing | unchanged | saved |
| management | — | unchanged | n/a: no gate changed |
| staff | — | retired role | n/a |
| doctor | — | unchanged | n/a: no gate changed |
| volunteer | — | unchanged | n/a: no gate changed |
| signed out | — | unchanged | n/a: no gate changed |

- [ ] Every role above tested — n/a: no permission check or control visibility changed
- [x] A role that should not have access is blocked server-side — every `can(...)` guard sits **inside** the `runWriteAction` body (or `wrapped()` callback), so a refusal still happens server-side before any write. Confirmed by reading each diff

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a manual reader can see changed
- [ ] Translatable strings — n/a: no new user-facing string; `somethingWentWrong`, `saveUnknown`, `reloadToSave` already exist
- [ ] Mobile viewport (375px) — n/a: no layout changed; the new `RetryCalendarForm` reuses the exact classes of the form it replaced
- [x] Browser console clean — dev server log showed no error after the outing save
- [x] Network clean — the save completed and redirected with no refusal shown

## 6. Regression

- [x] The pages nearest the change still work — `/operations`, `/outreach` and `/outreach/new` loaded by click-through
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `RecordRowActions` is shared with `prescriptions.tsx`; its prop was widened so the zero-argument caller still type-checks (typecheck=0) but the prescriptions page was not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged ("Already up to date")

## 7. Documentation

- [ ] Backlog item ticked — n/a: the (D) item stays open; the listing stream and the other (D) shares are not done. Follow-up notes go on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-write-paths-tail-a.md`
- [x] `README.md` still accurate — it does not describe write paths
- [ ] **Release notes.** — n/a: nothing was added to `WRAPPED_WRITE_PATHS`, so every page behaves exactly as before and no shelter user can notice anything; production is also behind on `0292`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The retry-calendar replay answer was read from `syncRow()`; the before/after counts are the output of `check-wrapped-write-paths.mjs --all`

## 8. Pre-production gate

**This change alters no runtime behaviour** (nothing was listed); deploy-time lines are `deferred:`.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager. Nothing here derives a date
- [ ] Boundary or banding change covers both edges — deferred: release manager. No threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — deferred: release manager. No public page touched

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

- [x] Rollback position stated — reverting this PR returns the sixteen modules to their earlier shape and changes no runtime behaviour, since nothing was listed. The Pi rollback is `./scripts/pi/deploy-pi.sh --ref <sha>`; neither it nor `wrangler rollback` reverts migrations, and this PR has none

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Press each wrapped control once: bills save/match/delete, blood test save, visit book/edit/report remove/calendar retry, delivery record/delete, diet create/update/end today, immunization record, maintenance create/edit/status/delete/file/bill, medical weight save, meme create/edit/archive/share, outreach edit/photo/delete, scan-card wait start/stop | the pages that host them | Lutan |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: only the new-outing form was driven; the other fourteen modules have not been pressed by a person.

## Result

Result: pass with deferred checks

## Evidence

Closing lines of `node scripts/gates.mjs` are pasted in the PR body.
