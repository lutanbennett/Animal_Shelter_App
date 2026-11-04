# Test plan: bills-inbox-one-question

## Header

| | |
|---|---|
| Feature | bills-inbox-one-question |
| Backlog item | `docs/backlog.md` → `#h9ble`, `#kcswm` |
| Branch / worktree | `claude/bills-inbox-one-question` @ `C:\Development\Animal_Shelter_bills-inbox-one-question` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | c2a80117 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

`/bills` is a wall of thumbnails; a tile opens a dialog with the full pages and one question, then that type's fields. Touched: `src/app/bills/BillsInbox.tsx`, `src/lib/bills/upload.ts` (comment only), both dictionaries, manual, release note. Cards: every card that opens `/bills` (`general_bills`, `utility_bills`, `bills`, deliveries and visits cards); no policy change, Admin unaffected. Out of scope: schema, cards, `general_bill` added to the owner list.

## 2. Automated gates

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

- [x] `node scripts/gates.mjs` four gates, all zero; closing lines as printed:

```
=== gates: typecheck exited 0 after 36s
=== gates: lint exited 0 after 369s
=== gates: test exited 0 after 21s
=== gates: build exited 0 after 137s
gates: typecheck=0 lint=0 test=0 build=0

```
- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (one backlog conflict resolved)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: no new data; the filed bill is gone from the list after refresh, which is the existing record action
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet) — n/a: unchanged code path, the "Nothing waiting" box is the same as before
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: form fields and server actions unchanged
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: form fields and server actions unchanged

Driven on dev at `http://localhost:3001` with a login holding exactly `general_bills`: wall showed 2 tiles; opening one showed the full image, the question, and only general kinds (Materials, Cleaning products, a custom kind, Other); chose Other, pressed Record this bill: the tile left, count went 2 to 1, dialog closed. Not driven: a multi-photo bill and a PDF tile (none in dev data; covered by code reading).

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: not driven; the page's access check is unchanged | | |
| exactly `general_bills` | `/bills` | wall, general kinds only, no new-delivery link | as expected |
| signed out | `/bills` | redirect to login | unchanged code, not driven |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the page and action checks are untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`
- [x] Translatable strings go through the translation path, checked at `/management/translations`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven; tiles are a 3-column grid and the dialog is full width with a scrolling overlay
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file with other pages touched beyond dictionaries and the release note
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: `/home`, `/bills`.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: README does not describe the Bills screen
- [x] **Release notes.** Would a shelter user notice this change? Yes: `unreleased` in `src/lib/releases.ts` has a line for it, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic changed
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates output, unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive migration only: a fresh backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; app-only change, revert the PR, no schema to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `bills.page.addHint` still says photos become "a card below" | deferred to backlog (for the planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A multi-photo bill and a PDF among the tiles, and the Thai wording | `/bills` on dev or test |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

- [ ] The manual list above is empty, or every item in it was checked by a person. — n/a: pending, see list

Manual verification by: pending: multi-photo bill and PDF tile on dev, and Thai wording review

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over when released

Result: pass with accepted defects

Release manager acknowledgement: pending
