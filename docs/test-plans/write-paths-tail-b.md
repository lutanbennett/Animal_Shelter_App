# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): put every write in eleven more action modules through `runWriteAction()`, rule on the five GoTrue modules, leave three unwrapped with reasons; add nothing to `WRAPPED_WRITE_PATHS` |
| Backlog item | `docs/backlog.md` → **PI FAILOVER: (D) IS UNBLOCKED … WHAT IS LEFT IS THE SWEEP** (Security) |
| Branch / worktree | `claude/write-paths-tail-b` @ `C:\Development\Animal_Shelter_write-paths-tail-b` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | f8387caf |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — twelve `actions.ts` modules and their client callers under `src/app/{account,admin/status,admin/website,photos,prescriptions,procedures,projects,stocktake,upcoming-visits,weight}`; three new small client components (`CheckNowButton`, `ConfirmEntryForm`, `DismissEntryButton`); `src/lib/prescriptions/record.ts` (the shared prescription write, moved out of a `"use server"` module); one import line in `src/app/assistant/actions.ts`; `scripts/check-wrapped-write-paths.mjs` (a second declaration kind); comments on five unwrapped modules; a decision file. No `worker/`, no migration, no change to `runWriteAction()`, `claim_write_request()` or `mayReplayWrite()`
- [x] Roles affected identified — **by card, not by role**: the writes are gated by `medical.weight`, `medical.prescriptions`, `medical.procedures`, `stock.count`, `system.status`, `website.content`, `website.gallery`, `photos.approve`, `photos.resident_manage`, `projects.publish`, `visit.book`; the account writes need only a signed-in login. **No gate was changed**; every `can(...)` is inside the claimed body exactly where it was
- [x] Anything explicitly **out of scope** written down — nothing added to `WRAPPED_WRITE_PATHS`, so no behaviour change; `management/**` is stream 19's; the three modules left unwrapped (`admin/security`, `admin/security/verify`, `services/desexing`) are ruled on in the decision file, sections 3 and 4

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (stream 19's #1159 and the translations schema #1160 came in)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (the `0292` functions this calls are proved by `scripts/prove-write-requests.mjs`, not changed here; the replay proof on project folders is under section 4)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven as Admin on dev (`dev-signin.mjs admin`, port 3007) with `requestAnimationFrame` confirmed firing, each reached by clicking through, and **each confirmed server-side in `write_requests`** (the id arrived, the claim finished, the stored result is what it should be). Driven: account name, weight create, project folder create, status "Check now", stocktake save, prescription create, **End today**, procedure create, website settings form, public-page hide and show. The rest are listed under **Left for manual verification**.

- [x] Happy path works end to end — all ten flows above saved and, where they redirect, redirected
- [x] Data persists — the weight reading (7.31 kg) and the end-today date showed on the page after the redirect, and a direct count found exactly one project folder of the replayed name
- [ ] Create / edit / delete all exercised — n/a: create and edit were driven (weight, folder, prescription, procedure, account name, website settings, stocktake count, end-today, hide and show); delete (project folder, project and waiting photos, donation channel) was not, and is under Left for manual verification
- [ ] Empty state renders sensibly — n/a: no rendering code changed beyond three buttons that draw the same labels
- [x] Invalid input is rejected with a readable message — the fresh-id control request for a duplicate folder name returned "A folder with that name already exists here." (a stored refusal, replayable the same way)
- [x] Boundary cases checked — **the replay boundary, measured**: the captured "New folder" POST was re-sent twice unchanged and both answered the stored first result with the same `folderId`; the same request with a fresh id reached the body and was refused; one folder of that name exists

### Role access matrix

**Not re-run, and deliberately.** No permission check and no control's visibility changed; this is analysis by card in section 1, not by role.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every flow in section 4 | unchanged | saved |
| management | — | unchanged | n/a: no gate changed |
| staff | — | retired role | n/a |
| doctor | — | unchanged | n/a: no gate changed |
| volunteer | — | unchanged | n/a: no gate changed |
| signed out | `/login`, `/login/forgot` | unchanged | n/a: declared replay-safe, behaviour not changed |

- [ ] Every role above tested — n/a: no permission check or control visibility changed
- [x] A role that should not have access is blocked server-side — every `can(...)` guard sits **inside** the `runWriteAction` body, so a refusal still happens server-side before any write. Confirmed by reading each diff; `changeOwnPassword` keeps its current-password proof inside the body

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a manual reader can see changed
- [ ] Translatable strings — n/a: no new user-facing string; `somethingWentWrong`, `saveUnknown`, `reloadToSave` and `notAllowed` already exist
- [ ] Mobile viewport (375px) — n/a: no layout changed; `CheckNowButton` and `DismissEntryButton` reuse the classes of the controls they replace
- [x] Browser console clean — the dev server log showed no error across the driven flows
- [x] Network clean — every driven save completed with no refusal shown, apart from the deliberate duplicate-name control

## 6. Regression

- [x] The pages nearest the change still work — `/account/password`, `/residents/[id]/weight`, `/residents/[id]/prescriptions`, `/residents/[id]/procedures`, `/projects/[id]`, `/admin/status`, `/admin/website`, `/stocktake` and `/upcoming-visits` all loaded by click-through
- [x] Any shared file touched checked from a second, unrelated page — `RecordRowActions` (shared with diets and prescriptions) was loaded on the resident prescriptions tab and its **End today** button run; the assistant's prescription write now imports from `src/lib/prescriptions/record.ts`, which typechecks and builds, but the assistant card itself was **not** driven
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates re-run after the merge, all four exit 0

## 7. Documentation

- [ ] Backlog item ticked — n/a: the (D) item stays open, since the listing stream (22) is the one that lists. Two follow-ups went to the `backlog` branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-write-paths-tail-b.md`
- [x] `README.md` still accurate — it does not describe write paths
- [ ] **Release notes.** — n/a: nothing was added to `WRAPPED_WRITE_PATHS`, so every page behaves as it did, and production is behind on `0292`, so a note would say something is live that cannot be
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The replay answers and the folder count were read from the running app and the database; the before and after counts are `check-wrapped-write-paths.mjs --all` output; the claim that `finish_write_request()` stores a whole result was read from `0292`; the TOTP secret and temporary password in results were read from the two files. The one claim not measured is `changeOwnPassword`'s replay behaviour, which the decision file says in terms

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

- [x] Rollback position stated — reverting this PR returns the modules to their earlier shape and changes no runtime behaviour, since nothing was listed. The Pi rollback is `./scripts/pi/deploy-pi.sh --ref <sha>`; neither it nor `wrangler rollback` reverts migrations, and this PR has none

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Press once each: calendar entry confirm and dismiss; photos to approve (approve, remove, assign, discard, reassign); the five website uploads and the Drive-backed removals; the remaining project actions (rename, info, publish, move, delete, cover, caption, photo delete); the two alert buttons on `/admin/status` (they send mail); change password (needs the current password) | the pages that host them | Lutan |
| Drive `/admin/security` and `/admin/security/verify` at aal2. **Not changed by this PR**, but the decision file's section 3 depends on what they return | the two screens | Lutan, with an authenticator |
| The assistant's "add a prescription" card, whose write now comes from `src/lib/prescriptions/record.ts` | the assistant panel | Lutan |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: ten flows were driven by Claude on dev; the table above has not been pressed by a person.

## Result

Result: pass

## Evidence

The closing lines of `node scripts/gates.mjs`, run on the merged tree:

```
gates: typecheck=0 lint=0 test=0 build=0
```

`node scripts/check-wrapped-write-paths.mjs --all` on the same tree: modules unwrapped 3, addresses blocked 3, addresses complete 146 of 149, exit 0. The three are `admin/security/actions.ts`, `admin/security/verify/actions.ts` and `services/desexing/actions.ts`, left unwrapped on purpose.
