# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): put every write in the 14 `src/app/residents/**` action files through `runWriteAction()`; add nothing to `WRAPPED_WRITE_PATHS` |
| Backlog item | `docs/backlog.md` → **PI FAILOVER: (D) IS UNBLOCKED … WHAT IS LEFT IS THE SWEEP** (Security). Not ticked: the sweep continues in other streams |
| Branch / worktree | `claude/write-paths-residents` @ `C:\Development\Animal_Shelter_write-paths-residents` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | 972b5f1e (plus this plan's own commit) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every write in the fourteen resident action files now goes through `runWriteAction()`, with the forms and callers sending a request id; nothing is listed on `WRAPPED_WRITE_PATHS`
- [x] Files/areas touched listed — the 14 action files; their 5 form components in `src/app/residents/**`; 5 shared callers in `src/components/` (`MicrochipForm`, `BloodTestList`, `ProcedureList`, `ArchiveRecordControl`, `PhotoGallery`) that had to pass the new argument; one decision file. No `worker/`, no `supabase/migrations/`, no change to `src/lib/write-requests.ts`, `action-result.ts` or `use-write-form.ts`
- [x] Roles affected identified — **by card, not by role**: the cards behind placement, resident record, death, microchip, photos, medical archive, blood tests, procedures and adoption news. **No gate was changed**: every `can(...)` stays inside the body where it was inside `runAction`
- [x] Anything explicitly **out of scope** written down — `WRAPPED_WRITE_PATHS` untouched (so no runtime behaviour change); `/residents/[id]` and `/residents/[id]/[section]` stay blocked by other streams' modules; the atomicity limit of a wrapper (decision file §3)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; the `0292` functions this calls are unchanged
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser this stream; see Left for manual verification. Typecheck and build prove the call shapes agree, and `check-wrapped-write-paths.mjs` proves every write is wrapped
- [ ] Data persists — n/a: not driven; no storage code changed
- [ ] Create / edit / delete all exercised — n/a: not driven; see Left for manual verification
- [ ] Empty state renders sensibly — n/a: no rendering code changed
- [ ] Invalid input is rejected with a readable message — n/a: every validation line is unchanged and sits inside the wrapped body
- [ ] Boundary cases checked — n/a: the request-id boundary is the shared mechanism's, proved by stream (C); this stream is a caller

### Role access matrix

Not re-run: no permission check and no control's visibility changed, and a per-role table is analysis by role, which `CLAUDE.md` forbids.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | — | unchanged | n/a: no gate changed |
| management | — | unchanged | n/a: no gate changed |
| staff | — | retired role | n/a |
| doctor | — | unchanged | n/a: no gate changed |
| volunteer | — | unchanged | n/a: no gate changed |
| signed out | — | unchanged | n/a: no gate changed |

- [ ] Every role above tested — n/a: no permission check or control visibility changed
- [x] A role that should not have access is blocked server-side — every guard (`can(...)`) is inside the `runWriteAction` body exactly where it was inside `runAction`; confirmed by reading the diffs

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a reader of the manual can see changed
- [ ] Translatable strings — n/a: no new string; `somethingWentWrong`, `saveUnknown`, `reloadToSave` already exist
- [ ] Mobile viewport (375px) — n/a: no markup changed
- [ ] Browser console clean — n/a: not driven; see Left for manual verification
- [ ] Network clean — n/a: not driven; see Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work — checked by typecheck and a full production build of every route that imports these actions; not loaded in a browser (see Left for manual verification)
- [x] Any shared file touched checked from a second, unrelated page — the five shared components were changed only to pass the request id; `ArchiveRecordControl`, `PhotoGallery`, `BloodTestList`, `ProcedureList` and `MicrochipForm` are used from several pages, and the build compiles all of them. Not loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: the sweep is not finished; follow-ups go on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-write-paths-residents.md` (redirect shape, multi-row answer, kept-id edge)
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: nobody would notice — no visible behaviour changes, and nothing is listed on `WRAPPED_WRITE_PATHS`, so the Worker replays exactly what it replayed before
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The module and address counts are the output of `check-wrapped-write-paths.mjs --all`; the multi-row answer was read from `runWriteAction()` and `0292`, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no threshold, rounding or cutoff changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: no pasted measurement beyond the gates line, which is unedited
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; nothing is listed on `WRAPPED_WRITE_PATHS` by this PR, and no schema changed, so a revert is a plain revert of the code

## Evidence

```
gates: typecheck=0 lint=0 test=0 build=0
```

`check-wrapped-write-paths.mjs --all`: action modules unwrapped 60 → 46; complete addresses 69 → 79; blocked 80 → 69; no `src/app/residents/**` module left unwrapped.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A kept request id from an unknown save can be sent for a different target (another attachment, say) from the same component; the database checks the action name, not its arguments. Fails safe, nothing is written twice | deferred to backlog: a per-target key in `useWriteCall` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Press one write from each style on dev and see it save and the page move on: a placement (Move), Edit resident, a new intake, a photo Delete, and a microchip save. The success path of the nine redirecting actions changed shape (the body returns where to go, then the redirect happens) and was not driven | `http://localhost:3001`, reached by clicking through from `/residents` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: the list is not empty; item 1 is still with a person

Manual verification by: pending: item 1 above, a person pressing one write of each style on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries this file; pasting happens at PR creation
- [ ] Handed to the production release manager — deferred: release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet reached the release manager
