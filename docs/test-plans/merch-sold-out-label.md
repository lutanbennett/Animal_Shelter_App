# Feature test plan

## Header

| | |
|---|---|
| Feature | Merchandise shop: visible Sold out label, cart check, staff marker |
| Backlog item | `docs/backlog.md` → #lkxwu |
| Branch / worktree | `claude/merch-sold-out-label` @ `C:\Development\Animal_Shelter_merch-sold-out-label` |
| Dev server | `http://localhost:3002` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | f6e0d33aa |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a sold-out product gets a real badge, a sold-out cart line is flagged before the form is filled in, and staff see a marker.
- [x] Files touched: `src/app/shop/merch/{page,ProductCard}.tsx`, `checkout/{page,CheckoutForm}.tsx`, `src/app/management/merch-shop/page.tsx`, `en.ts`, `th.ts`, `releases.ts`, a decision file, the backlog tick. No migration, no worker.
- [x] Cards affected: `run_merch_shop` sees a display-only marker; the public shop is anon and ungated; Admin sees the same marker via its bypass.
- [x] Out of scope: `public_merch_variants` (supplier rule), `place_merch_order()`, `errUnavailable` wording, any new control.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with the gates line:

```
=== gates: typecheck exited 0 after 9s
=== gates: lint exited 0 after 118s
=== gates: test exited 0 after 33s
=== gates: build exited 0 after 41s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: public card shows the badge on photo, dimmed photo and struck price; checkout flags a sold-out line and disables Place order
- [x] Data persists — n/a-equivalent: display only, reloaded page shows the same state
- [ ] Create / edit / delete — n/a: nothing is written by this change
- [x] Empty state: an empty cart still shows the empty message (code path unchanged)
- [ ] Invalid input rejected — n/a: no input added
- [x] Boundary: a product with no shown variants reads sold out on both the public card and the staff marker; a supplier product never does

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /management/merch-shop | marker shown by same code | pending: not signed in as Admin |
| exactly `run_merch_shop` | /management/merch-shop catalogue | marker on a sold-out product | marker seen on Test mug |
| signed out | /shop/merch, /shop/merch/checkout | badge and cart flag | seen |

- [x] Every login above tested — Admin is pending, noted in the table
- [ ] A login that should not have access is blocked — n/a: no access rule changed; the page's `merch.manage` read check is untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic describes the sold-out line
- [x] Translatable strings: `soldOutInCart` and `soldOutPublic` added to both `en.ts` and `th.ts`
- [ ] Mobile viewport — pending: not driven at 375px
- [x] Browser console clean on the pages seen
- [ ] Network clean — n/a: no new endpoints, one extra anon view read on checkout

## 6. Regression

- [x] Pages nearest the change still load: /shop/merch, /shop/merch/checkout, /management/merch-shop
- [ ] Shared file touched — n/a: only the dictionaries, which every page above loads
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-15-merch-sold-out-label.md`
- [ ] `README.md` still accurate — n/a: README does not describe the shop
- [x] **Release notes.** Two lines added to `unreleased`, one for shoppers and one card-tagged `run_merch_shop`
- [x] Commit messages say why
- [x] Claims were measured in the browser, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence pasted is unedited — n/a: gates block above is the run's output
- [ ] Public pages re-checked after purge — deferred: release manager
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Migration dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Staff marker missed a product with no shown variants, which the public card shows sold out | fixed in the second commit |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Admin login and a 375px phone view | /shop/merch, /management/merch-shop |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the one row above

Manual verification by: pending: Admin login and a 375px phone view

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: PR not yet open
- [ ] Handed to the production release manager — pending: release time

Result: pass

Release manager acknowledgement: pending: release
