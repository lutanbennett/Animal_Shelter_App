# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | One unlayered rule in `globals.css`: typed-text inputs, selects and textareas are 16 px below `md`; the 375 px check now measures all of them |
| Backlog item | `docs/backlog.md` → Mobile: "Single-line inputs and selects are 14 px (`text-sm`), so iPhone Safari zooms the page in when one is tapped" |
| Branch / worktree | `claude/inputs-16px` @ `C:DevelopmentAnimal_Shelter_inputs-16px` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | linked from the PR itself |
| Tested by / date | Claude (inputs-16px session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `0ea48116` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: below `md`, every typed-text input, select and textarea is 16 px via one rule in `src/app/globals.css`, so iPhone Safari does not zoom on tap; `scripts/check-phone-width.mjs` now measures inputs and selects too. One deviation: the rule is unlayered, not base-layer, because Tailwind v4 utilities (`text-sm`) beat `@layer base` (decision file)
- [x] Files/areas touched listed: `src/app/globals.css`, `scripts/check-phone-width.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, a decision file and this plan. No form file, route, `worker/` or migration touched
- [x] Roles affected identified: everyone on a phone; the rule is global, so all forms and filter rows. Checked as admin, management, staff, vet, volunteer, head of medical, head of maintenance; signed-out pages are not in the check
- [x] Out of scope written down: widths of the 44 px bare-button notes the check already prints (not failures); the facility map and the layout shell

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 200s

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

- [ ] Happy path works end to end — n/a: class names only; no form logic, action or field name changed. The eight form pages were loaded by the check as staff and rendered; submitting each was not driven (see Left for manual verification)
- [ ] Data persists — n/a: no data path changed
- [ ] Create / edit / delete all exercised — n/a: no data path changed
- [ ] Empty state — n/a: no list changed
- [ ] Invalid input is rejected — n/a: no validation changed
- [x] Boundary cases: before/after on the same pages (admin, English; /residents, /management/diets, /foster, /medical, /vet-visits, /contacts). Before the rule the check failed `/residents` (`q` under 16 px); after, exit 0. Full run, all roles, English: 163 page views, no sideways scroll, no field under 16 px, exit 0. Intake (`/residents/new`) as admin and staff, English and Thai, passes
- [ ] The sideways growth itself was reproduced — n/a: it did NOT reproduce in headless Chromium, before or after: Chromium does not zoom on focus. Only the cause (fields under 16 px) is measured. The decision file records that the Notes-box item fixed textareas only

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the ten forms | unchanged access | n/a: no access rule changed |
| management | the ten forms | unchanged access | n/a: no access rule changed |
| staff | Intake and the pages the role can open | no sideways scroll, no field under 16 px | pass (full check, English; Intake also in Thai) |
| vet | as before | unchanged | n/a: no access rule changed |
| volunteer | as before | unchanged | n/a: no access rule changed |
| signed out | none | unchanged | n/a: no access rule changed |

- [ ] Every role above tested — n/a: no role-dependent behaviour changed; one role was run through the layout check
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: no manual topic describes the box size
- [ ] Translatable strings — n/a: no strings changed; class names only
- [x] Mobile viewport (375px): measured by `scripts/check-phone-width.mjs`, which focuses every field; Intake included. Whether tapping stops zooming on a real iPhone is left for manual verification
- [ ] Browser console clean — n/a: not driven in the browser pane (the pane needs a login); class names only
- [ ] Network clean — n/a: not driven in the browser pane; no request changed

## 6. Regression

- [x] The pages nearest the change still work: the eight form pages above load and measure at 375 px
- [x] Shared files touched (`src/lib/releases.ts`, `docs/backlog.md`, `scripts/check-phone-width.mjs`) re-read after editing; the check's earlier behaviour (overflow, 44 px) still runs and was green on the same pages
- [x] Nothing merged from `main` during `sync` was broken by this branch: see the gates

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-inputs-16px.md`
- [ ] `README.md` still accurate — n/a: it does not describe these forms or the check's internals
- [x] **Release notes.** `unreleased` gained a line in `src/lib/releases.ts`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The unmeasured one (iPhone zoom as the cause of the sideways scroll) is labelled as such

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — n/a: not deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: not a boundary change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys in this PR
- [ ] `strip-baked-env` seen — n/a: nothing deploys in this PR
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; class names and a dev script only, no schema or data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The earlier Notes-box item fixed textareas only; inputs and selects were still 14 px and could have caused the same sideways scroll on other fields | fixed here; the iPhone confirmation is in the manual table |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On your own iPhone, tap into a text box and a drop-down: the page does not zoom in or scroll sideways | Rehome / foster, Intake, a filter row |
| 2 | Intake and the medical forms still look right at 16 px and still save | `/residents/new`, a medical form |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the two items are left for Lutan

Manual verification by: pending: Lutan to tap an input on his iPhone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: deferred: release manager

Result: pass

Release manager acknowledgement: n/a  Date: 2026-10-07
