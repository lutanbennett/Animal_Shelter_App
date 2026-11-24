# Feature test plan

## Header

| | |
|---|---|
| Feature | Recent changes marks an entry made from outside the shelter |
| Backlog item | `docs/backlog.md` → #a4k2p |
| Branch / worktree | `claude/audit-outsider-change` @ `C:\Development\Animal_Shelter_audit-outsider-change` |
| Dev server | `http://localhost:3002` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-24 |
| Carries a migration? | no |
| Tested at SHA | 7234ce859 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Recent changes shows an "Outside the shelter" badge on entries whose actor is a product administrator and not one of the shelter's own logins.
- [x] Files touched: `src/app/admin/recent-changes/page.tsx`, both dictionaries, `src/lib/releases.ts`; no migration, no worker.
- [x] Cards affected: none; the page is Admin-only (outside the card system) and unchanged in who may open it. Signed-out public unaffected.
- [x] Out of scope: what 0438 writes, undo rules, the console.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, all 0:

```
2:=== gates: typecheck — npm run typecheck
11:=== gates: typecheck exited 0 after 41s
13:=== gates: lint — npm run lint
1094:=== gates: lint exited 0 after 155s
1096:=== gates: test — npm test
2076:=== gates: test exited 0 after 35s
2078:=== gates: build — npm run build
2381:=== gates: build exited 0 after 157s
2383:gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: a product-admin change on pcf-proof shows the badge when read as that shelter's Admin (driven, headless Chrome, aal2)
- [x] Data persists — the page reads audit_log fresh on each load; the entry was read back after the write
- [ ] Create / edit / delete exercised — n/a: read-only display change
- [ ] Empty state renders sensibly — n/a: unchanged; no actors means no extra lookup
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases — n/a: the lookup only runs for actors not in the shelter's list, none for an empty page

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/recent-changes | badge on outsider entries | pass |
| exactly one card | n/a: page unchanged, still Admin-only | refused as before | not re-tested |
| signed out | n/a: page unchanged | redirected as before | not re-tested |

- [x] Every login above tested — admin driven; the other two are unchanged code paths (requireAdminUser untouched)
- [ ] A login without access is blocked server-side — n/a: access rule not touched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: one badge on an existing screen, no new topic
- [x] Translatable strings go through the dictionaries (en and th both added)
- [ ] Mobile viewport — pending: badge is an inline span in the existing cell, not looked at at 375px
- [ ] Browser console clean — pending: not read in the headless run
- [ ] Network clean — pending: not read in the headless run

## 6. Regression

- [x] The page's other columns still render (rows printed in the driven run)
- [ ] Shared file touched checked from a second page — n/a: releases.ts and dictionaries only gained one entry each; the build passed
- [x] Nothing merged from main during sync broke this branch (gates green after sync)

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file `docs/decisions/2026-11-23-mark-an-outsider-change.md`
- [ ] README — n/a: not affected
- [x] **Release notes.** An Admin would notice the new label; `unreleased` has an `admin: true` line for it
- [x] Commit messages say why
- [x] Claims were measured: derivation checked by driving the page, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic changed
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence is the tool's actual output — n/a: gates output above is pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager; reverting the commit is enough, nothing in the database changed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | test-shelter-2 could not be used for the proof (another stream holds its Admin slot); used pcf-proof | accepted |
| 2 | low | no own-login row existed on pcf-proof to show the unmarked case side by side | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Badge reads well beside an email on a phone | /admin/recent-changes at 375px |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-24

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: one phone-width look

Manual verification by: pending: phone-width look at the badge

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to the production release manager — pending: at release

Result: pass with accepted defects

Release manager acknowledgement: pending: at release
