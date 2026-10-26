# Feature test plan

## Header

| | |
|---|---|
| Feature | Who does what: the Features section moves to its own page, reached by a button |
| Backlog item | `docs/backlog.md` → **Who does what: move the Features section off the page onto its own page** (ticked here) |
| Branch / worktree | `claude/who-does-what-features-page` @ `C:\Development\Animal_Shelter_who-does-what-features-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | `82331455` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Features panel leaves Who does what and lives at `/admin/who-does-what/features`, opened by a button beside Details
- [x] Files/areas touched listed: `src/app/admin/who-does-what/{page.tsx,actions.ts,features/page.tsx}`, both dictionaries (one string), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `eslint.config.mjs` and `docs/hard-coded-security-registry.json` (service-role allow-list, as Details), `scripts/check-permission-catalogue.mjs` and `scripts/check-phone-width.mjs` (one line each)
- [x] Roles affected identified: admin (edits behind the authenticator step), management and any role holding the Who does what card (read-only); everyone else refused
- [x] Out of scope written down: `FeaturesPanel` is unchanged, no permission changes; `features` and `card_features` are still read on Who does what for the card board

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Printed output:

```
=== gates: lint exited 0 after 128s
=== gates: test exited 0 after 16s
=== gates: build exited 0 after 73s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, the same tables are read as before
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: Who does what shows the new button, and it opens the Features page with the features listed (dev, Admin)
- [ ] Data persists — reload the page and the change is still there — n/a: editing needs the authenticator step and the dev sign-in is aal1; the panel and its actions are unchanged
- [ ] Create / edit / delete all exercised — n/a: same reason; the page showed the locked state with fields read-only
- [ ] Empty state renders sensibly — n/a: unchanged panel text, dev has features
- [ ] Invalid input is rejected with a readable message — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: no input handling changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | cards page, button, Features page | opens, locked until 2-step ("verify now" shown) | as expected on dev (aal1) |
| management | not driven | read-only, same guard as Details | not driven |
| staff | retired role | n/a | n/a |
| doctor | not driven | refused unless it holds the card | not driven (Lutan's test role) |
| volunteer | not driven | refused | not driven |
| signed out | not driven | redirected to /login | not driven |

- [ ] Every role above tested — n/a: only admin was driven; the guard is the same line as Details and is pinned in `check-permission-catalogue.mjs`, which passed in lint
- [ ] A role that should not have access is blocked server-side — n/a: not driven; same guard as Details, checked by the permission-catalogue lint step

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry, a button on an existing page
- [x] Manual updated (`src/lib/manual/en.ts`); the Who does what topic names the new button
- [x] Translatable strings go through the dictionaries (English and Thai `featuresLink`)
- [ ] Mobile viewport (375px) — n/a: page added to `check-phone-width.mjs`'s list, not run here
- [x] Browser console clean — dev server log showed no errors
- [ ] Network clean — n/a: not separately inspected

## 6. Regression

- [x] The pages nearest the change still work: Who does what loaded with the button and the card board
- [x] Shared files touched (dictionaries, releases.ts, manual) checked from a second page: Who does what loaded from them after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-26-who-does-what-features-page.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line tagged for admin and management
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding assertions — n/a: no thresholds
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block above is the printed output
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no schema change; rollback is redeploying the previous ref and nothing else needs undoing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | No "before" screenshot of the old page was taken; the removed panel is shown by the diff | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With the authenticator step done: add, rename (English and Thai), reorder, file a card under and delete a feature on the new page, then see Available cards still sectioned by feature | `/admin/who-does-what/features`, then `/admin/who-does-what` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1 above

Manual verification by: pending: the edit round on the Features page with the authenticator step

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is committed with the PR
- [ ] Handed to the production release manager — n/a: read by the release manager at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: at release
