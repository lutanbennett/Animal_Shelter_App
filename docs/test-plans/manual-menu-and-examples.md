# Feature test plan

## Header

| | |
|---|---|
| Feature | manual-menu-and-examples |
| Backlog item | `docs/backlog.md` → #qtgb4, #566lo |
| Branch / worktree | `claude/manual-menu-and-examples` @ `C:\Development\Animal_Shelter_manual-menu-and-examples` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 29e94d1a |

## 1. Scope and risk

- [x] A manual topic flagged `needsMenu` is hidden from a login with no menu; a new Home screen topic keeps the tiles content; confirm-and-offline examples are ones anyone can meet
- [x] Touched: `src/lib/manual/{en,types,for-topic,manual-pdf}`, `src/app/manual/page.tsx`, `src/app/manual/pdf/route.ts`, a unit test, `releases.ts`, backlog ticks
- [x] Cards affected: none (content marking only; no card gains or loses access). Admin has a menu always, so unaffected; signed-out not applicable (manual needs sign-in)
- [x] Out of scope: menu behaviour (`show-menu.ts`, `NavPane`), Thai manual (English only), migrations

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (a conflict in `unreleased` was resolved by keeping this PR note; main had emptied it in a release cut)
- [x] `node scripts/gates.mjs` ran on the merged tree; closing lines as printed:

```
=== gates: typecheck exited 0 after 30s
=== gates: lint exited 0 after 281s
=== gates: test exited 0 after 38s
=== gates: build exited 0 after 78s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

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

- [x] Happy path: tiles-only login's manual hides Finding your way around and Release notes, shows Home screen and confirm-and-offline
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: read-only content
- [ ] Empty state — n/a: static content
- [ ] Invalid input — n/a: no input
- [x] Boundary: default `hasMenu` true leaves every other topic and every script caller unchanged (unit test, 15 pass)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | manual | sees every topic | pending: a mistyped sign-in snippet signed the session out; covered by `showMenuForLogin()` returning true for Admin and the unit test, not driven on screen |
| tiles-only login (`show_menu` off) | manual | menu and release-notes topics hidden (hidden=until-found), Home screen and confirm shown | pass |
| signed out | manual | sign-in required | n/a: unchanged |

- [x] Every login above tested — admin on-screen part is pending, see the table
- [ ] A login that should not have access is blocked server-side — n/a: hiding content is not access; nothing is granted or denied

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [x] Manual updated and reads correctly at `/manual`
- [ ] Translatable strings — n/a: manual is English only, no dictionary string touched (`check-thai-dictionary.mjs` clean)
- [ ] Mobile viewport — n/a: text-only change
- [ ] Browser console clean — pending: not read in this run
- [ ] Network clean — pending: not read in this run

## 6. Regression

- [x] `check-cards-have-topics.mjs`: every card opens a manual topic (56 of 56)
- [x] Shared `manual/en.ts` checked by loading `/manual`
- [ ] Nothing merged from main broken — n/a: no merge needed until sync

## 7. Documentation

- [x] Backlog items #566lo and #qtgb4 ticked on this branch
- [x] Decision: `docs/decisions/2026-11-10-manual-topics-need-a-menu.md`
- [ ] `README.md` still accurate — n/a: no README content about this
- [x] **Release notes.** `unreleased` gained a line for the manual change; nothing waits on a deploy or hand edit
- [x] Commit message says why
- [x] Claims were measured: hidden attribute read in the browser

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding — n/a: no thresholds
- [ ] Evidence is unedited tool output — n/a: no pasted evidence beyond the gates block
- [ ] Public pages re-checked — n/a: public site untouched
- [ ] Deploy target line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Both a migration and code reading it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager; content-only change, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Admin still sees Finding your way around and Release notes in the manual | /manual as Admin |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Admin view

Manual verification by: pending: Admin's manual view not driven on screen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
