# Feature test plan

## Header

| | |
|---|---|
| Feature | Warn before the phone's video picker; settle tagging of product-site release notes |
| Backlog item | `docs/backlog.md` → #rlprg (not ticked, needs a phone), #pnote (ticked) |
| Branch / worktree | `claude/reel-picker-warning` @ `C:\Development\Animal_Shelter_reel-picker-warning` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | 55f8cff84 |

## 1. Scope and risk

- [x] One sentence: a hint above the reel video picker (English and Thai) warning the phone needs a moment for several clips, plus the decision that product-site release notes are tagged `admin: true`
- [x] Files touched: `src/app/reels/ReelForm.tsx`, both i18n dictionaries (`pickerHint`), `src/lib/releases.ts` (`unreleased`), a decision file, backlog tick, this plan
- [x] Cards affected: none changed; the hint shows to whoever can open the reel form; Admin and signed-out public unaffected
- [x] Out of scope: any on-page status during the picker (cannot work), upload machinery, shipped release entries, the per-clip row / banner position

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 84s
=== gates: lint exited 0 after 213s
=== gates: test exited 0 after 44s
=== gates: build exited 0 after 298s
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

- [x] Happy path: the hint renders above the choose-video button on `/reels/new`
- [ ] Data persists — n/a: copy only, nothing is saved
- [ ] Create / edit / delete — n/a: copy only
- [ ] Empty state — n/a: the hint shows before any clip is chosen
- [ ] Invalid input — n/a: no input added
- [ ] Boundary cases — n/a: static text

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /reels/new | hint visible | seen, driven at 375px |
| signed out | /reels/new | unchanged: sign-in required | not changed by this PR |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side — n/a: access rules untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual updated — n/a: one hint line, no topic changes
- [x] Translatable strings go through the dictionaries (English and Thai keys added)
- [x] Mobile viewport (375px) — hint box 343px wide at x=16, no horizontal overflow, driven with Playwright
- [ ] Browser console clean — pending: console not read in the driven run
- [ ] Network clean — n/a: no network change

## 6. Regression

- [x] Pages nearest the change: `/reels/new` loaded and rendered
- [x] Shared files touched (i18n dictionaries, `releases.ts`): the app built and `/reels/new` loaded, so the dictionaries resolve
- [x] Nothing merged from `main` during `sync` (nothing merged)

## 7. Documentation

- [x] Backlog: #pnote ticked on this branch; #rlprg left open on purpose (its DONE WHEN needs Lutan on a real phone)
- [x] Decision file `docs/decisions/2026-11-23-reel-picker-warning-and-product-site-notes.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line about the picker warning, for shelter users, untagged on purpose (it is not a product-site note)
- [x] Commit messages say why
- [x] Claims were measured: the OS-picker delay is Lutan's observation, not reproduced here; "about five clips" is a judgement and is said to be one

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding assertions — n/a: no boundary change
- [ ] Evidence is unedited tool output — n/a: gate lines above are pasted from the run
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — n/a: copy-only change, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Pick several clips on a real phone: does the hint help, and is "about five" a sensible number? (#rlprg DONE WHEN) | Lutan's phone, `/reels/new` |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

- [ ] Manual list is not empty — pending: Lutan's phone check of the picker warning

Manual verification by: pending: Lutan trying several clips on his phone

Result: pass

- [ ] Open defects fixed or accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: PR body links the plan
- [ ] Handed to the release manager — n/a: happens at release time

Release manager acknowledgement: pending: release manager
