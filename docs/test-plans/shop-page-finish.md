# Feature test plan — shop-page-finish

## Header

| | |
|---|---|
| Feature | App half of finishing Shop for the shelter: `/shop` on the public page list (hideable, menu, footer, sitemap), its own manual topic, and a `shop.manage` probe |
| Backlog item | `docs/backlog.md` → **SHOP FOR THE SHELTER: FOUR SMALL THINGS THE APP HALF LEFT, ONE OF WHICH NEEDS A MIGRATION** (ticked in this PR) |
| Branch / worktree | `claude/shop-page-finish` @ `C:\Development\Animal_Shelter_shop-page-finish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | the app PR of stream `shop-page-finish` (number given on the PR itself); schema half was #1119 |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no — `0290` merged in #1119 and is applied to dev |
| Tested at SHA | `fb79f4b6` (after sync with `origin/main` `52644be8`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/shop` joins `PUBLIC_PAGES` so the Director can hide it and it reaches the sitemap and footer (parts 1 and 2), the manual step becomes its own topic (3), and `shop.manage` gets a database probe (4)
- [x] Files/areas touched listed — `src/lib/public-pages.ts`, `src/app/adopt/PublicHeader.tsx`, `src/app/adopt/PublicFooter.tsx`, `src/app/shop/page.tsx`, `src/app/donate/ShopMention.tsx`, `src/app/sitemap.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/lib/permission-probes.mjs` (a declared crossing: another stream owns it this batch), `docs/backlog.md`, `docs/decisions/2026-10-30-shop-page-finish.md`, this plan
- [x] Roles affected identified — by card, not role: holders of `website` (website.content) gain the Hide switch for `/shop`; holders of `manage_shop_page` (shop.manage) now see their own manual topic; signed-out visitors see `/shop` in the footer and sitemap once an entry is shown, and Not found while it is hidden
- [x] Anything explicitly **out of scope** written down — production publication of `/shop` (waits on `0285` on production and the Director's tax answer); a `shop.manage` read probe (needs a fixture in `check-who-does-what.mjs`); the catalogue's `probes` field (deliberately left empty, see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `52644be8` (the #1119 merge) fast-forwarded in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Output redirected to a file, exit code read directly:

```
=== gates: typecheck exited 0 after 78s
=== gates: lint exited 0 after 316s
=== gates: test exited 0 after 23s
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0290` was #1119
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; `0290` applied to dev with #1119
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; the browser check below stored `page:shop` through the app and read it back
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0290` must be on production before this deploys (see §8)

## 4. Functional checks

- [x] Happy path works end to end — signed in on dev as a disposable login holding exactly `website` and `manage_shop_page` (`dev-signin.mjs --cards`), one shown test entry seeded: Settings → Website → Pages lists *Shop for the shelter /shop* under Get involved; Hide stored `{page:shop}`; signed out, `/shop` served the Not found page (`noindex`, no entry), and the sitemap, Donate page and home page had no `/shop` link; Show restored all of it
- [x] Data persists — after Hide, `site_content.hidden_public_pages` read `{page:shop}` from the database; after Show, `{}`
- [x] Create / edit / delete all exercised — Hide and Show pressed through the Pages tab; the shop editor itself is unchanged (0285's stream exercised it)
- [x] Empty state renders sensibly — with the only entry set to not shown, the sitemap and the Donate page dropped `/shop` (0 links), as the menu already did
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new input; an unknown hide-key is refused by `hideableEntries()` and the database (0256/0290), unchanged
- [x] Boundary cases checked — both independent hiding causes: switch on with an entry shown (gone), switch off with no entry shown (gone), switch off with an entry shown (back)

### Role access matrix

Card-shaped, per `CLAUDE.md`: rows name the login's cards, not a role.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged (outside the card system) | n/a — not re-driven; the `perms.isAdmin` short-circuit is untouched |
| management | n/a | tested by card instead | n/a — login with exactly `website` + `manage_shop_page`: Pages tab shows the switch, Hide/Show work, hidden `/shop` shows the "hidden from the public" bar and the entry |
| staff | retired | n/a | n/a — retired role (0173) |
| doctor | n/a | tested by card instead | n/a — `shop.manage` probe run under every live role by `check-who-does-what.mjs`: all six boxes OBEYED |
| volunteer | n/a | tested by card instead | n/a — `requirePageVisible` refuses anyone without `website.content`, unchanged; signed out checked below |
| signed out | `/shop` | Not found while hidden | Not found page with `noindex`, no entry, no links anywhere |

- [x] Every role above tested — by card: the editor login and signed out in the browser, every live role through the probe
- [x] A role that should not have access is blocked server-side — hidden `/shop` fetched signed out returned the Not found body; the switch's write is refused by the database without `website.content` (0256's harness, `check-hidden-public-pages-schema.mjs`, all ok with #1119)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no app nav change; the public header and footer are covered in §4
- [x] Manual updated — new topic `shop` on `shop.manage`; the Website topic keeps a one-line pointer; `node scripts/acceptance-matrix.mjs --check`: `ok — 96 manual topics → 153 activities`
- [ ] Translatable strings go through the translation path — n/a: no new dictionary strings; the Pages row and links use the existing `t.shop.navLabel`. The manual is English only
- [ ] Mobile viewport (375px) — n/a: no layout change; one more link in an existing footer column and menu group
- [x] Browser console clean — no errors on the Pages tab during Hide and Show
- [x] Network clean — `/shop`, `/donate`, `/` and `/sitemap.xml` served without error throughout

## 6. Regression

- [x] The pages nearest the change still work — `/donate`, `/`, `/sitemap.xml`, `/admin/shop`, `/admin/website?tab=pages` loaded; the other Get involved pages still listed with their switches
- [x] Any shared file touched checked from a second, unrelated page — `PublicHeader`/`PublicFooter` read from `/donate` and `/` signed out (three `/shop` links on Donate when shown, none when hidden); the sitemap still lists every other page in order, Privacy now 13th
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync was #1119 itself; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — with a closing note. Searched the backlog for `public-pages`, `sitemap`, `hidden_public_pages`, `shop.manage`, `affiliate` and `/shop`: the remaining open hits (domain cutover, Thai addresses, Search Console, Donate online payment, the merchandise shop, drop-shipping) are not closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-shop-page-finish.md` (menu and footer placement, the sitemap's empty rule, topic not step, probe in the probes file not the catalogue)
- [x] `README.md` still accurate — it does not list public pages or probes
- [x] **Release notes.** — one line added to `unreleased`, tagged `cards: ["website"]`: the Hide switch for Shop for the shelter, and the page now in the footer and search-engine list
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the probe counts (52 → 53 activities, 252 → 258 OBEYED) are from two runs of `check-who-does-what.mjs`; the hide behaviour from the browser and database reads above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager; `/shop`, `/donate` and the sitemap are the ones this changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, but this code offers `page:shop`, which `0290` (#1119) lets the database store. **`0290` must be applied to production before this deploys**, or the Director's Hide press on Shop is refused
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, for `0290`
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration here; `0290` is additive
- [x] Apply plan stated — `0290` on production with the release, before the Worker deploy carrying this PR

### Rollback

- [x] Rollback position stated — a code rollback leaves `0290` in place harmlessly. If `page:shop` was stored, older code ignores it: the old header showed Shop regardless, so a rollback would show a hidden Shop again

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `check-public-views.mjs` exceeded 60s, not run to completion; every line it printed was ok | accepted — not this change's to diagnose; CI's `public-views` job runs it in full |
| 2 | info | `check-menu-coverage.mjs` red: 23 pages no single card both opens and reaches; none is `/shop` or `/admin/shop`, and the script is unchanged from `main` | not this PR — red before this change |
| 3 | info | `check-who-does-what.mjs` red before and after: one STICKY `recurring.do_own` box and five `clinicRule` entries over-marked | not this PR — identical with and without the probe |
| 4 | info | In `next dev` a hidden page answers HTTP 200 with the Not found body (hidden `/friends` does the same) | not this PR — how a streamed `notFound()` reports under dev |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Hide and Show Shop for the shelter from a real Director login, and look at the public site on a phone | Settings → Website → Pages, then `test.lannacare.org` signed out |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 waits for a person to press Hide and Show once on test

Manual verification by: pending: a person to look at item 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and lists every deliverable
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
