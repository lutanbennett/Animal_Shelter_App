# Feature test plan — card-boxes-triage

## Header

| | |
|---|---|
| Feature | Triage of `check-who-does-what`'s first reading: three probe fixtures fixed, shared supplier read proved, shop/friends approval default fixed |
| Backlog item | `docs/backlog.md` → `#t4wqp` (ticked: all three halves of its done-when are met) |
| Branch / worktree | `claude/card-boxes-triage` @ `C:\Development\Animal_Shelter_card-boxes-triage` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending: not yet opened at this commit |
| Tested by / date | Claude / 2026-11-14 |
| Carries a migration? | yes — `0376_shop_friends_text_approval_default_null.sql` |
| Tested at SHA | `d73ac4538` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the check's wrong, sticky and faulted boxes are each fixed or recorded with a reason, and doctor's overlisting is written down as expected
- [x] Files/areas touched listed — `scripts/check-who-does-what.mjs`, `scripts/lib/permission-probes.mjs`, `src/lib/permissions/fixed-for-now.ts`, `src/lib/releases.ts`, `supabase/migrations/0376_*.sql`, `docs/backlog.md` (tick), `docs/decisions/2026-11-14-card-boxes-triage.md`, this plan
- [x] Cards affected identified — `manage_shop_page` (`shop.manage`) and `publish_shelter_friends` (`friends.manage`), which can now insert without also holding `text.approve`; `suppliers` (`suppliers.directory`) recorded as shared-read, unchanged. Admin unaffected (outside the card system); signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — no new card, `donation.receipt`, the tenancy lint, the Admin bypass, doctor's cards, i18n files

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (backlog docs only)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all four `0`, pasted as the run printed them:

```
=== gates: typecheck exited 0 after 114s
=== gates: lint exited 0 after 441s
=== gates: test exited 0 after 83s
=== gates: build exited 0 after 244s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0375` → `0376`), `check-migration-numbers.mjs` ok, no other in-flight PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (377 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0376` ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`alter column … set default null` twice is a no-op)
- [x] Existing rows still read correctly — only the column default changes; no row is touched and neither public view selects the column
- [x] Constraints and defaults exercised against real rows — the check's own `shop.manage` edit probe inserts a `shop_links` row as each non-Admin login in a rolled-back harness; before the migration six logins got `P0001`, after it none do
- [x] Down-migration: the file's header gives it (set both defaults back to `'public_ok'`)
- [ ] Production apply plan stated for the release manager — pending: the decision file says next release, before the deploy; the apply is Lutan's release step

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-who-does-what.mjs` re-run after the changes: 392 boxes, 323 obeyed, 0 wrong, 1 sticky (prerequisite rule), 7 shared, 61 inert, 0 faults, 0 unlisted; the remaining red is the expected doctor overlisting only
- [ ] Data persists — n/a: no UI surface; the probes roll back
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface; the shared-read proof covers both the held and not-held side

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything, via `perms.isAdmin` | unchanged | unchanged (the probes use Admin as the control and it was allowed by all) |
| exactly `manage_shop_page` | insert a shop link | allowed without `text.approve` | allowed by the `shop.manage` edit probe at database level; page not driven |
| exactly `publish_shelter_friends` | insert a Shelter Friend | allowed without `text.approve` | same default fixed; not probed by the check, not driven |
| exactly `suppliers` | read suppliers | allowed (its own box) | obeyed |
| a card granting `stock.delivery`, `bills.*` or `friends.*` but not `suppliers` | read suppliers | allowed by design (shared read) | proved shared |
| signed out | nothing here | refused | unchanged, no policy changed |

- [x] Every login above tested — as probes, at database level, not by sign-in
- [ ] A login that should not have access is blocked server-side — n/a: no access rule narrowed or widened; the only change is a column default

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour to explain
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `/` served 200 on the dev server on :3001; `/admin/shop` itself not loaded (no card sign-in driven)
- [ ] Shared file touched checked from a second page — n/a: `fixed-for-now.ts` is read by the Who-does-what grid; the entries added are `shown: false`, so the grid draws nothing new
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought in docs only

## 7. Documentation

- [x] Backlog item `#t4wqp` ticked on this branch
- [x] Design choices recorded in `docs/decisions/2026-11-14-card-boxes-triage.md`
- [x] `README.md` still accurate — nothing in it describes this
- [x] **Release notes.** `unreleased` gained one card-tagged line (`manage_shop_page`, `publish_shelter_friends`); the fix is user-visible for a login with one of those cards and not `text.approve`
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: counts, the shared proof and the migration's effect all come from runs of the check on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: not a boundary change
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is the unedited run
- [ ] Public pages re-checked — n/a: no public view changed

### Deploy safety

- [ ] `deploy: production` ref read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code reading it? — n/a: the migration changes a default; the app inserts the same rows as before
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration needs a backup — n/a: additive default change
- [ ] Apply plan stated — deferred: release manager (file `0376`, production `dbkodyyxxhtygxcxmfcu`, before the deploy)

### Rollback

- [ ] Rollback position stated — n/a: the defaults are set back with the two statements in the migration header; no data changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A login with `shop.manage` or `friends.manage` but not `text.approve` could not add a shop link or Shelter Friend | fixed, `0376` |
| 2 | info | 61 INERT boxes: the yes direction is untested for 12 activities (the probe needs more than the one box) | accepted; for the planner to file |
| 3 | info | doctor `clinicRule` overlisting, so the check stays red | accepted: expected test state |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in holding only the shop card and add a shop link: no refusal | `/admin/shop` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-14

### Manual verification

pending: row 1 above needs a person to press Add on /admin/shop under a shop-card-only login

Result: pass with accepted defects
