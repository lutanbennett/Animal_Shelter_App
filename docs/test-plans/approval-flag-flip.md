# Feature test plan

## Header

| | |
|---|---|
| Feature | approval-flag-flip: text_approval defaults to NULL, INSERT guard, approve-on-save removed |
| Backlog item | `docs/backlog.md` → `#7aev4` (third and last half; not ticked, one clause open) |
| Branch / worktree | `claude/approval-flag-flip` @ `C:\Development\Animal_Shelter_approval-flag-flip` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-09 |
| Carries a migration? | yes: `0346_approval_default_null.sql` |
| Tested at SHA | ee708abf |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: new public text and new photos start "not reviewed" and wait for approval; a plain insert cannot approve; 0217's approve-on-save is gone
- [x] Files/areas touched listed: `supabase/migrations/0346_approval_default_null.sql`, `supabase/harness/0346_approval_default_null_harness.sql`, three `scripts/check-*` files, `src/lib/releases.ts`, `docs/decisions/2026-11-09-approval-flag-flip.md`
- [x] Cards affected identified: `approve_text` (text.approve) now gates INSERT as well as UPDATE; `approve_photos` is now the only way a resident/event/project photo is published; every filing card (resident, adoption news, appeals, events, projects, drives) now produces blank text. Admin passes through has_permission(); the public sees nothing already public change
- [x] Out of scope written down: the `ready_for_adoption` = `is_public_visible` equality, `public_resident_cards` listing every resident (DB-7), shelter_friends/shop_links, production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`; run by me, closing lines pasted unedited:

```
=== gates: typecheck exited 0 after 237s
=== gates: lint exited 0 after 702s
=== gates: test exited 0 after 146s
=== gates: build exited 0 after 676s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0345), and no other in-flight branch carries one (runner printed "migration numbers: ok")
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (347 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok; consumer warnings only, the two src files are in the release after)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`alter … set default`, `create or replace`; re-applied once by hand while testing the old trigger)
- [x] Existing rows still read correctly after the change: public-view check passed 454 ok / 0 fail after, same lines as before; the harness hashes every resident's `text_approval` before and after re-running the flip and finds no change
- [x] Constraints and defaults exercised in a rolled-back harness (`supabase/harness/0346_approval_default_null_harness.sql`, ends HARNESS-OK): default NULL on six tables; omitted column lands NULL; a filer without text.approve still files; INSERT naming public_ok / private_only refused without text.approve; same INSERT succeeds with it; publisher's and script's photo wait; Medical file still approved; no row changed
- [x] Down-migration: not needed as a file; the header gives the undo (restore 0345's and 0318's functions, defaults back to public_ok), and it writes no data
- [ ] Production apply plan stated — pending: the release manager applies `0346` before the deploy; `0343` and `0345` must already be applied on production, and `0343` still is not (see `#k7waq`)

## 4. Functional checks

- [x] Happy path works end to end: a row made after the flip waited, an `approve_text`-only login approved it from Home → Approve public text, and anon then saw it
- [x] Data persists — the row read `public_ok` afterwards in the database
- [ ] Create / edit / delete all exercised — n/a: create and approve only; edit-reset shipped in 0345
- [x] Empty state renders sensibly: queue showed "Nothing is waiting. All the public text has been read."
- [ ] Invalid input is rejected with a readable message — n/a: no input fields in this change; the refusals are database errors proved in the harness
- [ ] Boundary cases checked — n/a: no values, dates or lengths involved

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | n/a: not driven; Admin short-circuit untouched |
| exactly `approve_text` | queue, Approve button | sees the waiting row, approves it | pass |
| holds `resident.register` only (harness) | files a resident | lands NULL; naming public_ok refused | pass (harness) |
| signed out (anon) | public views | blank row 0 profiles; approved row 1 | pass |

- [x] Every login above tested (admin n/a above)
- [x] A login that should not have access is blocked server-side (INSERT naming a state refused in the harness)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the queue's manual topic shipped in 0345; no new screen
- [ ] Translatable strings — n/a: no new interface strings
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: not read separately; the page rendered and the action succeeded
- [ ] Network clean — n/a: not read separately; the action succeeded

## 6. Regression

- [x] Nearest pages checked: `/text/approve`, `/home`; public views via `check-public-views.mjs` (454 ok)
- [ ] Shared file touched checked from a second page — n/a: only `releases.ts` data touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (docs/backlog.md only)

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: `#7aev4` is deliberately NOT ticked, one DONE WHEN clause is open; its title was rewritten on the `backlog` branch and `#r9wtk` annotated there
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-09-approval-flag-flip.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for everyone: new words and photos wait for approval before the website shows them
- [x] Commit messages say why, not just what
- [x] Claims were measured: the three pre-existing fundraising-check failures were reproduced by restoring 0318's trigger on dev and re-running, then re-applying 0346

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change assertions — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: no evidence pasted other than the gates block, which is verbatim
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no code reads this migration's change; it only changes defaults and two triggers
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive or rewriting migration backup — n/a: rewrites no row
- [ ] Apply plan stated — deferred: release manager (`0346` after `0343` and `0345`)

### Rollback

- [ ] Rollback position stated — deferred: release manager; the migration is a default and two functions, undone by restoring them (header)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `check-fundraising-events-schema` has three failures older than this change (attachment update -2, `record_attachment('event')` 23502, "no role holds the card") | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After production gets 0346, add one test animal and confirm it stays off the website until approved | production, after release |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the one production item above, after release

Manual verification by: pending: production check after release

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR's diff
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
