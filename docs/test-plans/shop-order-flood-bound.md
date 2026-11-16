# Feature test plan

## Header

| | |
|---|---|
| Feature | Shop checkout: stock leak fix and open-order cap |
| Backlog item | `docs/backlog.md` → #py2b1 |
| Branch / worktree | `claude/shop-order-flood-bound` @ `C:\Development\Animal_Shelter_shop-order-flood-bound` |
| Dev server | not started; no page was driven |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-11-16 |
| Carries a migration? | yes, 0386 |
| Tested at SHA | 2a5b35e15 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: place_merch_order() no longer takes stock for an order it then refuses, and one email may hold at most 3 unpaid orders
- [x] Files/areas touched listed: supabase/migrations/0386, src/lib/merch/checkout.ts, src/app/shop/merch/checkout/{actions.ts,CheckoutForm.tsx,page.tsx}, en.ts and th.ts dictionaries
- [x] Cards affected identified: none; the checkout is uncarded on purpose and the cap grants no ability. Signed-out public affected, admin not
- [x] Out of scope: Cloudflare rules, the Workers binding, honeypot, auto-expiry of unpaid orders (days are Lutan's call), the sign-in rule

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` — first run's closing lines below; its build failed on a Google Fonts fetch in layout.tsx (module not found, network), not on this change. `npm run build` re-run alone exited 0.

```
=== gates: typecheck exited 0 after 104s
=== gates: lint exited 0 after 359s
=== gates: test exited 0 after 63s
=== gates: build exited 1 after 167s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on main: dev already held other streams' 0384 and 0385, so this took 0386
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev (qxkmhwybjggxvsfxsxbd): applying 0386 … ok
- [x] File is re-runnable (create or replace; grants restated)
- [ ] Existing rows still read correctly — n/a: only a function body changed, no table or column
- [x] Exercised against dev in a begin/rollback-style do block that raised ALL PASS: a refused second line leaves line one's stock at 5; a good order takes 2 (stock 3); three orders with a mixed-case email are accepted; the fourth returns too_many and stock stays 1
- [x] Down-migration: re-apply the 0373 function body; stated in the file header
- [ ] Production apply plan — n/a: production apply is the release manager's; run the migration before deploying the code, since the code maps the new too_many value

## 4. Functional checks

- [x] Happy path works end to end (at database level, see section 3)
- [ ] Data persists — n/a: no browser page was driven; database harness only
- [ ] Create / edit / delete — n/a: only order creation changed, covered by the harness
- [ ] Empty state — n/a: no list or empty state changed
- [x] Invalid input rejected: refused lines and the cap return a message, not a crash
- [x] Boundary cases: exactly 3 open orders allowed and the 4th refused; mixed-case email counted together

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | /shop/merch/checkout | unchanged, uncarded by design | not browser-tested |

- [ ] Every login above tested — n/a: nothing changed about who can reach the page
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed; execute stays service_role only

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: nothing a shelter user reads changed
- [x] Translatable strings: errTooMany added in en.ts and th.ts
- [ ] Mobile viewport — n/a: one error line shown in an existing slot, not rendered in a browser
- [ ] Browser console clean — n/a: no browser check was driven
- [ ] Network clean — n/a: no browser check was driven

## 6. Regression

- [ ] Pages nearest the change — n/a: not loaded; typecheck and tests cover the wiring
- [ ] Shared file touched checked from a second page — n/a: only checkout files and the two dictionaries, which the build compiled
- [x] Nothing merged from main during sync was broken (already up to date)

## 7. Documentation

- [x] Backlog item #py2b1 ticked on this branch
- [x] Decision file docs/decisions/2026-11-16-shop-order-flood-bound.md
- [ ] README — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: a shelter user sees nothing change
- [x] Commit messages say why
- [x] Claims were measured: the leak fix and cap were run against dev; the "stranger can change the email" limit is reasoning and is labelled so

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary assertions — n/a: the cap boundary (3 ok, 4th refused) is asserted in section 3
- [ ] Evidence is unedited tool output — n/a: no table of results pasted beyond the gates block
- [ ] Public pages re-checked — n/a: no public page content changed
- [ ] deploy line ref — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret or env var — n/a: none added
- [ ] Migration and code together — deferred: release manager, apply 0386 before the deploy
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: function replacement only
- [ ] Apply plan stated — deferred: release manager, file 0386 to production before deploy
- [ ] Rollback — n/a: re-apply the 0373 function body; neither Worker rollback nor Pi rebuild reverts the migration, and this one is safe to leave

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | First gates run's build failed on a Google Fonts fetch | accepted: transient, rebuild exited 0 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Place four orders with one email and read the new message | test.lannacare.org checkout |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-16

- [ ] The manual list is checked by a person — pending: someone reads the new message in the browser

Manual verification by: pending: reading the too-many-orders message on the test site

- [ ] Open defects are fixed or accepted — n/a: the one defect is accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: happens at release

Result: pass with accepted defects

Release manager acknowledgement: pending
