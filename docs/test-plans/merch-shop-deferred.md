# Feature test plan — merch-shop-deferred

## Header

| | |
|---|---|
| Feature | The three merchandise-shop pieces `0369` deferred: `place_merch_order()` (one-transaction checkout), a `page:shop-merch` hide key with its own Website switch and menu entry, and audit triggers on `merch_products`, `merch_orders` and `merch_order_parts` |
| Backlog item | `docs/backlog.md` → **THREE PIECES OF MERCHANDISE-SHOP SCHEMA WORK, DEFERRED ON PURPOSE** (`#m3kpq`, ticked) |
| Branch / worktree | `claude/merch-shop-deferred` @ `C:\Development\Animal_Shelter_merch-shop-deferred` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | yes — `0373_merch_shop_deferred.sql` |
| Tested at SHA | `05be868f2` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the checkout places an order through one database function, the Director can hide the merchandise shop without hiding the affiliate shop (and it has a menu entry), and three `merch_*` tables carry audit triggers
- [x] Files/areas touched listed — `supabase/migrations/0373_merch_shop_deferred.sql`, `src/lib/merch/checkout.ts`, `src/lib/merch/shop.ts`, `src/lib/public-pages.ts`, `src/app/adopt/PublicHeader.tsx`, `PublicFooter.tsx`, `src/app/sitemap.ts`, the three `src/app/shop/merch/**` pages, `src/lib/audit/recent-changes.ts`, both dictionaries, `src/lib/releases.ts`, `docs/hard-coded-security-registry.json` (wording), `docs/backlog.md`, the decision file and this plan
- [x] Cards affected identified — `website` (Settings → Website → Pages gains a card; it already holds `website.content`) and `run_merch_shop` (its order and product changes now appear in Recent changes, read by Admin). The signed-out public sees a new menu and footer entry once a product is shown. Admin is unaffected
- [x] Anything explicitly **out of scope** written down — the exchange-rate screen and `RATES_AS_OF` (`shop.ts`), pricing and payments, `src/app/admin/website/`'s resident counts, cashflow

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; "Already up to date"
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — `gates: typecheck=0 lint=0 test=0 build=0`, read from the output file
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: `ok — 0373_merch_shop_deferred.sql (against origin/main, highest 0372_animal_reports.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 374 applied, 1 pending (the dry run's own header)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0373_merch_shop_deferred.sql … ok`; only the expected consumer warnings (the merchandise code is not in release 0.45.0 yet)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0373_merch_shop_deferred.sql … ok`, from this branch
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `create or replace function`, `drop constraint if exists` then add, `drop trigger if exists` then create; the dry run and the real apply both ran it clean
- [x] Existing rows still read correctly after the change — the existing `site_content` row satisfied the restated check (all earlier values are still in the list); the existing T-shirt product still lists on the public page
- [x] **Constraints and defaults exercised against real rows** on dev, through the service role against the real function and tables (not a rollback harness: the point was the committed result): an order for more than the shelf holds is refused (`unavailable`), an empty cart is `empty`, a valid order for 2 of 3 leaves stock 1 and writes one order, one shelter part and one item at ฿250, and **an order whose insert violates a check (`ship_country = 'zzz'`) leaves stock unchanged**, which is the rollback the old code did by hand
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the header lists the undo (drop the function and three triggers, restore `0328`'s check)
- [x] Production apply plan stated for the release manager — `0373_merch_shop_deferred.sql` on `dbkodyyxxhtygxcxmfcu` **before** the deploy that carries the checkout change, since `checkout.ts` calls the function. `0369` and the merchandise code ship in the same release (`-- consumer:` warning above)

## 4. Functional checks

- [x] Happy path works end to end — on `localhost:3006`: Merchandise reached from the footer link, mug added, Check out filled and placed; the status page loaded for the new order (`M-00007`, ฿290: ฿250 plus ฿40 postage, awaiting payment) and the variant's stock went 1 to 0
- [x] Data persists — the order and the stock change were read back from the database with the service role, not from the page
- [x] Create / edit / delete all exercised (whichever the feature has) — the hide key: Hide Merchandise saved (button became Show Merchandise), then Show Merchandise restored it. Orders are create-only here
- [x] Empty state renders sensibly — with a product shown the menu entry appears; the empty-catalogue case is unchanged (page says so) and the entry follows `hasPublicMerchProducts`
- [x] Invalid input is rejected with a readable message, not a crash — the function refuses an oversell and an empty cart with codes the checkout already mapped to its messages; a constraint failure returns `failed`
- [x] Boundary cases checked — exactly-the-shelf and over-the-shelf quantities (2 of 3, then 9 of 3); an order that fails after the stock decrement leaves stock unchanged

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Website → Pages, the Merchandise Show / Hide switch | present, saves | pass — clicked through Management → Website → Pages; saved, and the public menu entry, sitemap line and page body went with it |
| exactly `website` | the same switch | unchanged: `website.content` was already the gate | n/a: no policy or grant changed; the page's own server check (`website.content`) is untouched and was not re-driven |
| signed out | `/shop/merch` while hidden | Not found body, no product, `noindex`; `/shop` unaffected | pass — product text absent, page says it could not be found; `/shop` still renders and is not `noindex`; menu and sitemap no longer list Merchandise |
| signed out (database) | `place_merch_order()` | refused | pass — `permission denied for function place_merch_order`; the browser can never call it |

- [x] Every login above tested — admin and signed out driven; `website` card login n/a as stated
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — the function refuses anon at the database; the hidden page's address returns the Not found body

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — the public menu and footer list Merchandise under Get involved only while a product is shown and the page is not hidden; the staff `NavLinks.tsx` is untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no staff screen changed; the Website Pages list draws its cards from `PUBLIC_PAGES`, so the existing Website manual topic still describes it
- [x] Translatable strings go through the translation path, checked at `/management/translations` — no new free text; the three audit labels are in both `en.ts` and `th.ts` (`check-audited-tables.mjs` reads both), the menu label is the existing `t.merchShop.navLabel`
- [ ] Mobile viewport (375px) — n/a: one extra menu and footer entry and one more card in an existing list; no layout was built
- [x] Browser console clean — no errors seen while driving the order and the switch
- [x] Network clean — the checkout, status page and Website save all answered without 4xx/5xx

## 6. Regression

- [x] The pages nearest the change still work — `/shop` (affiliate) still 200 and unhidden while Merchandise was hidden; `/`, `/shop/merch`, the checkout and the order status page loaded
- [x] Any shared file touched checked from a second, unrelated page — `PublicHeader`, `PublicFooter`, `sitemap.ts` and `public-pages.ts` are shared: the home page's menu and footer, `sitemap.xml` and Settings → Website → Pages were all loaded and read
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#m3kpq`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-merch-shop-deferred.md` (invoker not definer, why the audit leaves the buyer out)
- [x] `README.md` still accurate — it does not describe the merch checkout internals
- [x] **Release notes.** — `unreleased` gained a line: the new Merchandise Show / Hide switch and the menu and footer entry. The order function and the triggers are invisible and are not claimed. No manual step is outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the decision file about the function, the rollback, the audit row and the anon refusal was observed on dev; the hide behaviour was read from the live page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates line above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager; the menu, footer and sitemap changed, and anonymous pages are edge-cached

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — yes: `checkout.ts` calls `place_merch_order()` and `public-pages.ts` expects `page:shop-merch` to be storable. The production apply of `0373` must happen **before** the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, per the line above (before)

### Rollback

- [ ] Rollback position stated, including what it does not cover — deferred: release manager. Code rolls back by redeploying the previous ref; the migration is additive and the old code ignores the new function and key, so it need not be undone

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | My first checkout rewrite mangled the file because it is stored with CRLF line endings; caught by the diff size before commit and redone | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Look at the Merchandise Show / Hide card among the page switches and at the new menu entry on a phone | Settings → Website → Pages; the public site's menu |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: a person has not looked at the Pages card and the phone menu

Manual verification by: pending: a person has not looked at the Pages card and the phone menu

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the plan as a committed file
- [ ] Handed to the production release manager — n/a: not yet — release time

Result: pass

Release manager acknowledgement: pending: release time
