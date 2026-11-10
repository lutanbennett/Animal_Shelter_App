# Feature test plan

## Header

| | |
|---|---|
| Feature | Control sweep 12: read-opened pages, plus the #t3n9r proof |
| Backlog item | `docs/backlog.md` → #79sqf (retitled, not ticked), #t3n9r (narrowed, not ticked) |
| Branch / worktree | `claude/read-opened-pages-drive` @ `C:\Development\Animal_Shelter_read-opened-pages-drive` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 1ddd6626 |

## 1. Scope and risk

- [x] Change is described in one sentence: a sweep for notices and gate/action mismatches on the 26 read-opened pages, with two dev drives and no code change
- [x] Files touched: `docs/backlog.md`, `docs/decisions/2026-11-10-control-listing-sweep-12.md`, this plan; no app code
- [x] Cards affected: none changed; `meme_add` was driven as a one-card login
- [x] Out of scope: the 24 undriven pages, `/memes/make`, anything outside the 26

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, all 0

```
=== gates: typecheck exited 0 after 138s
=== gates: lint exited 0 after 349s
=== gates: test exited 0 after 42s
=== gates: build exited 0 after 379s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `meme_add` login, `/memes` → Add a meme (`/memes/new`), image, resident Test 1, Save meme, `/memes/[id]` lists Test 1
- [x] Data persists — the saved meme opened on its own page after the save
- [ ] Create / edit / delete all exercised — n/a: only create was the proof asked for
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected — n/a: no UI change
- [ ] Boundary cases checked — n/a: no UI change

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | not driven | n/a: no UI change | n/a |
| exactly `meme_add` | `/memes`, `/memes/new`, `/memes/[id]` | controls drawn match the activity their action asks; tagged resident named | as expected |
| signed out | not driven | n/a: no UI change | n/a |

- [ ] Every login above tested — n/a: only the `meme_add` login was driven; the other 24 pages are recorded as undriven in the decision file
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: no strings changed
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed
- [ ] Shared file touched checked from a second page — n/a: no shared code touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates above ran after the sync)

## 7. Documentation

- [x] Backlog items retitled in `docs/backlog.md` on this branch to say what is left
- [x] Decision recorded in `docs/decisions/2026-11-10-control-listing-sweep-12.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no user-visible change, docs only
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The decision file separates what was driven from what was only read

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager
- [ ] Boundary or banding change assertions — deferred: release manager
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager
- [ ] Deploy-safety line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var exists in production — deferred: release manager
- [ ] Migration ordering — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none found | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing for a person; the 24 undriven pages are a next stream, not a check here | |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

Result: pass

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: release manager

Release manager acknowledgement: pending: release manager
