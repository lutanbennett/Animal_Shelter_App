# Feature test plan

## Header

| | |
|---|---|
| Feature | Serve the five Google fonts from the repository (next/font/local) |
| Backlog item | `docs/backlog.md` → #fntlc |
| Branch / worktree | `claude/fonts-local` @ `C:\Development\Animal_Shelter_fonts-local` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | 4fef97e86 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — layout.tsx loads the five fonts from public/fonts instead of fonts.gstatic.com
- [x] Files/areas touched listed — src/app/layout.tsx, public/fonts/*, docs/decisions, docs/backlog.md
- [x] Cards affected identified — none; every page shares the root layout, signed-out public pages included
- [x] Anything explicitly out of scope written down — no subsetting pipeline; Noto Sans Thai Latin half not shipped

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, all zero. Run with HTTP_PROXY/HTTPS_PROXY pointed at a dead port, so a font fetch would have failed the build:

```
=== gates: typecheck exited 0 after 96s
=== gates: lint exited 0 after 176s
=== gates: test exited 0 after 52s
=== gates: build exited 0 after 199s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] status reviewed before applying — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — public site renders in English and Thai, fonts report loaded
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no data is written
- [ ] Empty state renders sensibly — n/a: no list or data
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | / in EN and TH | fonts load, text renders | pass |

- [ ] Every login above tested — n/a: font loading is identical for every login; only signed out was driven
- [ ] A login that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: only font files changed, layout untouched
- [x] Browser console clean — no errors seen on the pages driven
- [ ] Network clean — n/a: not separately inspected; build proved no font network

## 6. Regression

- [x] The pages nearest the change still work — public home in EN and TH
- [x] Any shared file touched checked from a second page — layout.tsx is shared; English and Thai home both loaded
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md on this branch
- [x] Non-obvious design choices added as docs/decisions/2026-11-19-fonts-served-locally.md
- [x] README.md still accurate
- [ ] **Release notes.** n/a: the pages must render identically; a user sees no change
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: the gates block above is unedited output
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] deploy line ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] production dry-run — n/a: no migration
- [ ] backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; revert the PR, no data or schema involved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

- [ ] The manual list above is empty — n/a: nothing for a person to look at; the pages were driven in the browser

Manual verification by: n/a: nothing left for a person; both languages were driven and seen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
