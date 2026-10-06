# Feature test plan

Filled from `docs/test-plan-template.md`. A design PR: it writes the page-by-page table and moves nothing, so most lines are `n/a` with the reason. The one manual item is Lutan's agreement.

---

## Header

| | |
|---|---|
| Feature | Apply Lutan's Settings / Management / Shelter Operations rule to every page and propose the moves, as a decision document |
| Backlog item | `docs/backlog.md` → Review which pages belong under Management and which under Settings |
| Branch / worktree | `claude/management-settings-split` @ `C:\Development\Animal_Shelter_management-settings-split` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not used: docs only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (management-settings-split session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item asks for a table of every tile and nav entry with its proposed home, agreed before building; this is that table plus the order of the PRs that follow
- [x] Files/areas touched listed: `docs/decisions/2026-10-07-management-settings-split.md` and this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [ ] Roles affected identified — n/a: no behaviour changes for any role; the document says which roles each proposed move would affect
- [x] Out of scope written down: moving any page, the Shelter Operations landing, guards (owned by `admin-role`), and button markup (owned by `bare-buttons-44px`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 267s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code changed; the table was built from `src/app/NavLinks.tsx`, the two landing pages, `src/lib/permissions/routes.ts` and each page's header comment
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases — n/a: no code

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | nothing moved | n/a |
| management | n/a | nothing moved | n/a |
| staff | n/a | nothing moved | n/a |
| vet | n/a | nothing moved | n/a |
| volunteer | n/a | nothing moved | n/a |
| signed out | n/a | nothing moved | n/a |

- [ ] Every role above tested — n/a: no page or guard changed
- [ ] A role that should not have access is blocked server-side — n/a: no page or guard changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR; the proposal's nav changes are PR 1 of 3
- [ ] Manual updated — n/a: no page moved, so no topic is wrong yet
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Shared file checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged, gates pass

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately left open; the rule is applied and the table is written, but nothing is built, and the brief says to tick only when the review is agreed and complete. The status note goes on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-management-settings-split.md`
- [ ] `README.md` still accurate — n/a: README does not describe the section split
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a design document; no page moved, so nobody would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned — the facts (which pages exist, their guards, that nothing links to the two stubs) were read from the code and grepped; the recommendations are labelled as proposals and the open ones as **ASK**

## 8. Pre-production gate

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output — n/a: the gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after cache purge — deferred: release manager
- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added
- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position: revert the PR; it adds two documents, so production is unaffected either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan agrees (or changes) the five **ASK** rows before any page moves: split medications and diets; cost per unit; Projects/Vets/Contacts home; Shelter Friends; delete the two stubs | `docs/decisions/2026-10-07-management-settings-split.md`, last section |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (management-settings-split session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet, pending Lutan; see the signature below

Manual verification by: pending: Lutan's agreement to the table and answers to the five ASK rows

### Result

- [x] Open defects are either fixed or explicitly accepted above (none found)
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and the PR links it
- [ ] Handed to the production release manager — n/a: nothing ships; the release manager reads it at release time

Result: pass

Release manager acknowledgement: pending
