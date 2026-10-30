# Feature test plan — affiliate-links-app

## Header

| | |
|---|---|
| Feature | App half of Shop for the shelter: public `/shop`, Settings screen `/admin/shop`, the `manage_shop_page` card now opens it |
| Backlog item | `docs/backlog.md` → **AFFILIATE LINKS GET THEIR OWN PUBLIC PAGE** (ticked, with a short LEFT note) |
| Branch / worktree | `claude/affiliate-links-app` @ `C:\Development\Animal_Shelter_affiliate-links-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no — `0285` landed in #1100 |
| Tested at SHA | see PR body |

## 1. Scope and risk

- [x] Change is described in one sentence — a public Shop page and the screen that edits it, so the `manage_shop_page` card does something
- [x] Files/areas touched listed — `src/app/shop/`, `src/app/admin/shop/`, `src/app/donate/`, `PublicHeader.tsx`, `src/lib/shop/`, `cards.ts`, `routes.ts`, `public-paths.ts`, both dictionaries, the manual, one `EXEMPT` line in `check-permission-catalogue.mjs`
- [x] Roles affected identified — card-shaped: holders of `manage_shop_page` (none assigned on production); Admin through the bypass; signed-out public reads `/shop`
- [x] Out of scope written down — click recording (decided none), Pages hide switch for /shop (needs a migration), sitemap line, its own manual topic (needs a `scripts/lib/` row), production publication

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` — see PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: `0285` already on dev from #1100
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Harness in `begin … rollback` — n/a: no migration; the existing `check-shop-links.mjs` was re-run and reports HARNESS-OK
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; the release applying `0285` owes the release note

## 4. Functional checks

- [x] Happy path works end to end — card tile on Home → `/admin/shop` → add shop → Show → appears on `/shop`
- [x] Data persists — the entry was still listed after the action refreshed the page; `/shop` read it from the view
- [x] Create / edit / delete all exercised — create and show and delete (with confirm) driven in the browser; edit Save and reorder not pressed
- [x] Empty state renders sensibly — the screen showed "Nothing here yet" before the first add
- [x] Invalid input is rejected with a readable message — `http://` link refused: "Use a secure link that starts with https://"
- [ ] Boundary cases — n/a: long text, price hint and photo upload not driven; the database checks are in `check-shop-links.mjs`

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `manage_shop_page` only | Home tile, `/admin/shop`, every control | allowed | pass (browser, dev login `--cards manage_shop_page`) |
| `shop.manage` read only | list as text, no controls | read only | not driven — `canEdit` defaults false; policies proven in the harness |
| no card | `/admin/shop` | refused | not driven in the browser — `requirePermission("shop.manage","read")`; table refused in the harness |
| signed out | `/shop` | allowed, shown entries only | pass (view, harness `check-public-views`) |

- [x] Every card level above tested — the first and last in the browser, the middle two by the harness and the guard only
- [x] Blocked server-side — every action asks `can(perms,"shop.manage","edit")` and the policies ask the same activity

## 5. Cross-cutting

- [x] Nav entry correct — header Get involved gains Shop for the shelter once an entry is shown; routed in `routes.ts` (the card opens `/admin/shop`)
- [x] Manual updated — a step in the Website topic (`en.ts`); no separate topic, see the decision file
- [ ] Translatable strings — n/a: shop title, note and price hint are queued by the schema's triggers; not checked at `/management/translations`
- [ ] Mobile viewport — n/a: not driven at 375px
- [x] Browser console clean — no error appeared during the flow; console not read exhaustively
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] Nearest checks still work — `npm run lint` clean (permission catalogue, acceptance matrix, cards count); `check-features-schema` green; `check-shop-links` HARNESS-OK
- [ ] Shared file touched checked from an unrelated page — n/a: `/donate` and the public header were not re-viewed with no entries beyond `/shop` itself
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked — with a LEFT note for the separate manual topic and the sitemap line
- [x] Decision recorded — `2026-10-30-affiliate-links-app.md`, including click recording and the controls table
- [x] `README.md` still accurate — it does not list pages
- [ ] **Release notes.** — n/a: 0285 is not on production yet; the release that applies it owes the note
- [x] Commit messages say why
- [x] Claims were measured — browser flow and check output, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? — n/a: no migration here; this code reads `0285`, which production lacks
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: `0285` must reach production before this release; publication also waits on the tax answer

### Rollback

- [x] Rollback position — revert the PR; the schema is untouched and nothing else reads it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | One `EXEMPT` line added to `scripts/check-permission-catalogue.mjs` (stream 2's file) or `npm run lint` is red | accepted — flagged in the PR |
| 2 | low | No separate manual topic: it needs a row in `scripts/lib/`, off limits this batch | accepted — in the decision file and the backlog note |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the `shop` block and the disclosure; it is Claude's draft and wants a Thai reader | `src/lib/i18n/dictionaries/th.ts`, `/shop` in Thai |
| 2 | Photo upload and a Friend entry with its logo, which need Drive and a published Friend | `/admin/shop` |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty — n/a: two rows are left, see above

Manual verification by: pending: a Thai reader for the Thai strings; someone with Drive for photo upload

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
