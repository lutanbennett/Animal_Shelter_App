# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): put every write in the fourteen `src/app/management/**` action modules (units, donations, donors, desexing drives, clinics, doctors, fixed outgoings, appeals, contacts, diets, medications, recurring jobs, shelter friends, translations) through `runWriteAction()`; add nothing to `WRAPPED_WRITE_PATHS` |
| Backlog item | `docs/backlog.md` → **PI FAILOVER: (D) … THE SWEEP** (Security, `## Next up`); not ticked, the sweep is not finished after this stream |
| Branch / worktree | `claude/write-paths-management` @ `C:\Development\Animal_Shelter_write-paths-management` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | dffc63d2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — fourteen `actions.ts` modules under `src/app/management/**` and their client callers there; six declared crossings outside that folder (`src/components/{UnitsPanel,CupboardOrder,ArchiveContactControl,TranslationPanel}.tsx`, `src/app/my/MyTaskList.tsx`, `src/app/contacts/[id]/ShelterFriendCard.tsx`); a decision file. No `worker/`, no migration, no change to `runWriteAction()`, `claim_write_request()` or `mayReplayWrite()`
- [x] Roles affected identified — **by card, not by role**: the writes are gated by `donation.receipt`, `website.content`, `clinics.list`, `clinics.doctors`, `reports.cashflow`, `appeal.run`, `appeal.medical_photo`, `contacts.directory`, `stock.medications`, `stock.diets`, `recurring.manage`, `friends.manage`, `translations.manage`, and `reference.types` with the stock card (item settings). **No gate was changed**; every `can(...)` is inside the claimed body exactly where it was
- [x] Anything explicitly **out of scope** written down — nothing added to `WRAPPED_WRITE_PATHS`, so no behaviour change; stream 20's folders, stream 21's migration and the `translations.propose` activity are untouched (decision file sections 4 and 6)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (documents only came in)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (the `0292` functions this calls are proved by `scripts/prove-write-requests.mjs`, not changed here)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Two flows driven as Admin on dev, reached by clicking `/my` → `/management` → `/management/clinics`, with
`requestAnimationFrame` confirmed firing: the **new clinic** form (`createClinic`, through `useWriteForm`) and
the row **Delete** button (`deleteClinic`, through `useWriteCall`). The other sixty-seven writes were **not**
driven — see **Left for manual verification**.

- [x] Happy path works end to end — clinic created ("Created clinic …"), row appeared, then deleted, row gone
- [ ] Data persists — n/a: seen in the list after the server re-render; no separate reload was done
- [ ] Create / edit / delete all exercised — n/a: create and delete were driven (clinics); edit and the other thirteen modules share the same `useWriteCall` / `useWriteForm` shape and are listed under Left for manual verification
- [ ] Empty state renders sensibly — n/a: no rendering code changed
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed; every refusal is returned as before and is now stored by the wrapper
- [ ] Boundary cases checked — n/a: the replay boundary (stored result on a repeated id, body not re-run) is the admin sweep's measured proof of the shared mechanism, which this stream calls and does not change

### Role access matrix

**Not re-run, and deliberately.** No permission check and no control's visibility changed; the analysis is
by card in section 1, not by role.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | clinics create and delete | unchanged | saved, deleted |
| management | — | unchanged | n/a: no gate changed |
| staff | — | retired role | n/a |
| doctor | — | unchanged | n/a: no gate changed |
| volunteer | — | unchanged | n/a: no gate changed |
| signed out | — | unchanged | n/a: no gate changed |

- [ ] Every role above tested — n/a: no permission check or control visibility changed
- [x] A role that should not have access is blocked server-side — every `can(...)` guard sits **inside** the `runWriteAction` body, so a refusal still happens server-side before any write. Confirmed by reading each diff

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a manual reader can see changed
- [ ] Translatable strings — n/a: no new user-facing string; `somethingWentWrong`, `saveUnknown` and `reloadToSave` already exist
- [ ] Mobile viewport (375px) — n/a: no layout changed
- [x] Browser console clean — no console message after the clinic create and delete
- [x] Network clean — both saves completed with no refusal shown and no dev-server error

## 6. Regression

- [x] The pages nearest the change still work — `/my`, `/management` and `/management/clinics` loaded by click-through
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the six crossings were type-checked (typecheck=0) but `/my`, `/contacts/[id]` and the translation panels were not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — only documents were merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: the (D) item stays open; the listing stream and stream 20's modules are not done, and the brief says not to tick it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-write-paths-management.md`
- [x] `README.md` still accurate — it does not describe write paths
- [ ] **Release notes.** — n/a: nothing was added to `WRAPPED_WRITE_PATHS`, so every page behaves exactly as before and no shelter user can notice anything; production is also behind on `0292`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The Drive replay answers were read from `fileReceiptOnDrive()` and `upsertGeneratedFile()`; the before and after counts are the output of `check-wrapped-write-paths.mjs --all`; the module table was built by reading every exported function, not from the check

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

- [x] Rollback position stated — reverting this PR returns the fourteen modules to their earlier shape and changes no runtime behaviour, since nothing was listed. The Pi rollback is `./scripts/pi/deploy-pi.sh --ref <sha>`; neither it nor `wrangler rollback` reverts migrations, and this PR has none

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Press each wrapped control once: unit save/delete/price, donation record and receipt issue/Drive retry/sent/void, donor add/edit/archive, drive and sign-up edits, doctor add/rename/active/merge/delete, fixed outgoings, appeal save/photos/publish/close/gifts, contact add/edit/archive/restore/delete, stock edits and cupboard order, medication label upload/remove, recurring job save/pause/delete/hand over/back and Done/Skip on `/my`, Shelter Friend add/edit/publish/logo/delete, translation approve/clear and label propose/approve/discard | the pages that host them under `/management`, `/my`, `/contacts/[id]` | Lutan |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: only the new-clinic form and the row Delete were driven; the other sixty-seven writes have not been pressed by a person.

## Result

Result: pass

## Evidence

Closing lines of `node scripts/gates.mjs` at `dffc63d2`, unedited:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 41s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 330s
=== gates: test — npm test
=== gates: test exited 0 after 22s
=== gates: build — npm run build
=== gates: build exited 0 after 209s
gates: typecheck=0 lint=0 test=0 build=0
```

`node scripts/check-wrapped-write-paths.mjs --all` on this branch: 16 modules unwrapped, 21 addresses blocked, 127 complete (before, on merged `main` per the brief: 30, 47, 102). Measured on this branch only.
