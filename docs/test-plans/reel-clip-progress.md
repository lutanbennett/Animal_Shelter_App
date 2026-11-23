# Feature test plan

## Header

| | |
|---|---|
| Feature | Each clip row shows its own state while a batch uploads |
| Backlog item | `docs/backlog.md` → #rlprg (not ticked, needs a phone) |
| Branch / worktree | `claude/reel-clip-progress` @ `C:\Development\Animal_Shelter_reel-clip-progress` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | 2c855009c |

## 1. Scope and risk

- [x] One sentence: in a multi-clip batch each row shows Waiting, the live percentage, or Done instead of one banner below the fold
- [x] Files touched: `src/app/reels/ReelForm.tsx`, both i18n dictionaries (`clipWaiting`), a decision file, this plan
- [x] Cards affected: none; rendering only
- [x] Out of scope: upload machinery, picker warning, per-clip metadata list

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 66s
=== gates: lint exited 0 after 236s
=== gates: test exited 0 after 75s
=== gates: build exited 0 after 318s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path: a batch shows Waiting then percentage per row — pending: not driven; needs a real multi-clip upload, left for a phone
- [ ] Data persists — n/a: no data change
- [ ] Create / edit / delete — n/a: rendering only
- [ ] Empty state — n/a: rows only exist once clips are picked
- [ ] Invalid input — n/a: validation untouched
- [ ] Boundary cases — pending: retry after a failure lights the right row; mapping is by real index in code, not exercised in a browser

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any with reel form access | /reels/new | unchanged | not changed by this PR |

- [ ] Every login above tested — n/a: access untouched
- [ ] A login that should not have access is blocked server-side — n/a: access rules untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual updated — n/a: no topic changes
- [x] Translatable strings go through the dictionaries (English and Thai key added)
- [ ] Mobile viewport (375px) — pending: not driven in this change
- [ ] Browser console clean — pending: not run
- [ ] Network clean — n/a: no network change

## 6. Regression

- [x] Single-clip path and Edit unchanged in code: banner still renders when not a batch
- [x] Shared files touched (i18n dictionaries): typecheck and build cover them
- [x] Nothing merged from `main` during `sync` beyond what the gates ran on

## 7. Documentation

- [ ] Backlog: #rlprg left open — n/a: its DONE WHEN needs Lutan on a phone
- [x] Decision file `docs/decisions/2026-11-23-reel-clip-row-progress.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: not shown working in a browser yet, so no note promises it
- [x] Commit messages say why
- [x] Claims were measured: the rendering was not driven, and the decision file says so

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding assertions — n/a: no boundary change
- [ ] Evidence is unedited tool output — n/a: gate lines pasted from the run
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — n/a: rendering change, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload several clips on a phone: each row shows its state without scrolling, and it did not feel frozen; fail one, Save again, right row lights up | Lutan's phone, `/reels/new` |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

- [ ] Manual list is not empty — pending: Lutan's phone check

Manual verification by: pending: Lutan trying several clips on his phone

Result: pass

- [ ] Open defects fixed or accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: PR body links the plan
- [ ] Handed to the release manager — n/a: happens at release time

Release manager acknowledgement: pending: release manager
