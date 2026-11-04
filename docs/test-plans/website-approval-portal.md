# Feature test plan — website-approval-portal

## Header

| | |
|---|---|
| Feature | One approval portal at /photos/approve tabbed by stream, a new approval activity and card, and a draft state for website pages |
| Backlog item | `docs/backlog.md` → **ONE WEBSITE-APPROVAL PORTAL** (`#7j2qf`, partly done) |
| Branch / worktree | `claude/website-approval-portal` @ `C:\Development\Animal_Shelter_website-approval-portal` |
| Dev server | n/a: not started; checks were gates and database scripts |
| PR | pending: number is known when the PR is opened |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | yes: `0315_website_approval.sql` |
| Tested at SHA | `66b3c29f` plus the docs commit that adds this file |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a tabbed approval portal under one new approval activity, with a draft path for site pages; home-page settings drafts and extra photo tabs are left open and said so
- [x] Files/areas touched listed — `supabase/migrations/0315`, `src/app/photos/approve/*`, `src/app/admin/website/{actions.ts,SitePageForm.tsx,pages/[slug]/page.tsx}`, `src/lib/website/drafts.ts`, `cards.ts`, `catalogue.ts`, dictionaries, manual, four tests and one check script
- [x] Cards affected identified — new `approve_website` (`website.approve`, `photos.approve`, `photos.resident_manage`) and `propose_website` (`website.propose`), given to no role; `approve_photos` and `website.content` behave as before. Admin and signed-out unaffected
- [x] Out of scope written down — site_content drafts screens, medical and Drive photo tabs, the public pages, the events page

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` cleanly before the last gates run
- [x] `node scripts/gates.mjs`, run to a file and read:

```
=== gates: typecheck exited 0 after 44s
=== gates: lint exited 0 after 113s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 115s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — 0315 after 0314; the runner printed `migration numbers: ok`
- [x] `--status` reviewed — 315 applied, 1 pending
- [x] `--dry-run` reviewed — ok
- [x] Applied to dev — `applying 0315_website_approval.sql … ok`, then 316 applied, 0 pending
- [x] File is re-runnable — `if not exists`, `on conflict`, `create or replace`, `drop policy if exists`
- [x] Existing rows still read correctly — no existing table is altered
- [x] Constraints and defaults exercised — `scripts/prove-website-approval.mjs` against dev: propose alone drafts, approve and discard refused 42501 for a proposer, a no-card login refused and reads nothing, approve alone publishes
- [ ] Down-migration — n/a: additive; a new table, functions and rows only
- [x] Production apply plan — release manager applies 0315 before deploying the code that reads it; run `--env production --status` first

## 4. Functional checks

- [x] Happy path works end to end — at database level via the proof script; the screens are covered by build and tests only
- [ ] Data persists — n/a: the proof script reads the live row back after approval
- [ ] Create / edit / delete all exercised — n/a: propose and approve were exercised in the proof script, discard only as refused
- [ ] Empty state renders sensibly — n/a: not driven in a browser
- [ ] Invalid input is rejected — n/a: the approve function rejects unknown columns, not driven
- [ ] Boundary cases checked — n/a: no threshold

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `propose_website` | propose_website_draft | drafts; cannot approve or discard | pass (script) |
| exactly `approve_website` | approve_website_draft, drafts table | sees and publishes | pass (script) |
| no card | propose, drafts table | refused, reads nothing | pass (script) |
| admin | everything | through the Admin short-circuit | n/a: not driven; no Admin rule changed |

- [x] Every login above tested — as stated per row
- [ ] A login that should not have access is blocked server-side — n/a: covered by the no-card row; page URLs not hit in a browser

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the portal keeps its existing route and tile
- [x] Manual updated — the Approving photos topic gained a step describing the tabs and Page changes
- [x] Translatable strings go through the translation path — all new text is in both dictionaries
- [ ] Mobile viewport (375px) — n/a: not driven
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — the build compiles /photos/approve and /admin/website/pages/[slug]; the page-controls and card tests were updated and pass
- [ ] Shared file touched checked from a second page — n/a: dictionaries and routes were not re-opened in a browser
- [x] Nothing merged from `main` during `sync` was broken — gates ran after the merge

## 7. Documentation

- [x] Backlog item note added in `docs/backlog.md` on this branch; the item stays open for what is left
- [x] Decision file `docs/decisions/2026-11-04-website-approval-portal.md`
- [x] `README.md` still accurate — it does not describe this screen
- [ ] **Release notes.** n/a: 0315 is not on production yet, so a note would promise users something they cannot use; the note goes in the PR that applies it
- [x] Commit messages say why
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the proof script and gate output are from this session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted is the tool output, unedited — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Migration and code that reads it together — yes: apply 0315 on production before deploying
- [ ] `--env production --dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: additive only
- [ ] Apply plan — deferred: release manager

### Rollback

- [x] Rollback position stated — redeploy the previous ref; the new table and functions are unused by older code and safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A login holding website.approve through a card other than approve_website would not open the portal (page opens on photos.approve) | accepted, written in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A login holding exactly approve_website sees the four tabs and Publish and Discard on a drafted page change | /photos/approve |
| 2 | A login holding exactly propose_website can open a page, type, and Save as a draft | Admin, Website, a page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are listed and not yet looked at

Manual verification by: pending: the two screen checks in the list above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file
- [ ] Handed to the production release manager — n/a: nothing deploys until the PR merges

Result: pass with accepted defects
