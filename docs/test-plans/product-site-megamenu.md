# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Product site mega menu, sign-in links top right; two Thai vet strings |
| Backlog item | `docs/backlog.md` → `#pmega`, `#thvet` (ticked on the `backlog` branch; neither item is on `main` yet) |
| Branch / worktree | `claude/product-site-megamenu` @ `C:\Development\Animal_Shelter_product-site-megamenu` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-28 |
| Carries a migration? | no |
| Tested at SHA | c84597fcf |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

The product nav becomes a mega menu listing every feature and Cooper's page (when it has words), and the sign-in links move to the header. Files: `src/app/platform/about/ProductNav.tsx`, new `ProductMenu.tsx`, `src/app/platform/layout.tsx`, `about/page.tsx` (footer removed), the two other pages passing the nav, both dictionaries, `releases.ts`. No card is affected: public pages, plain links; signed-out visitors see the new menu and links. Out of scope: Cooper's page content (#cpstr), and the JS-off streaming of every page body (decision file).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 264s
=== gates: test exited 0 after 56s
=== gates: build exited 0 after 77s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: links only
- [x] Empty state renders sensibly (no rows yet)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Driven in headless Chrome (playwright-core) on :3003: Enter opens the menu, ArrowDown focuses the first feature, ArrowUp wraps to Overview, Escape closes it and returns focus to the button, a press outside closes it. At 375x812 with touch, a tap opens it, the page has no horizontal scroll (scrollWidth 375), and a tap on Medical care went to `/th/platform/features/medical`. Empty state: dev has no Cooper `heading`, and the menu lists no Cooper link (raw HTML has no `/platform/cooper` href). Long text: band descriptions are clamped to two lines.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | /platform/about, header | three sign-in links top right, none in the footer | pass |
| any signed-in login (management role login used; the pages read no card) | /platform/about, header | email and Sign out, no sign-in links | pass |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: public pages, nothing gated changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: app nav not touched; the product nav has no dead links (Cooper hidden without content)
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the public product site has no manual topic
- [x] Translatable strings go through the translation path, checked at `/management/translations`
- [x] Mobile viewport (375px) — no overflow, controls reachable
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

New strings (en / th), each awaiting the weekly read; `check-thai-dictionary.mjs` exits 0:

- [ ] `menuButton` Product / ผลิตภัณฑ์ — pending: Thai wording to be confirmed in the next weekly read (#y1dqu)
- [ ] `menuFeatures` Features / ฟีเจอร์ (already used elsewhere in the dictionary) — pending: Thai wording to be confirmed in the next weekly read (#y1dqu)
- [ ] `menuAbout` About CooperJaidee / เกี่ยวกับ CooperJaidee — pending: Thai wording to be confirmed in the next weekly read (#y1dqu)

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched beyond the dictionaries, where only new keys and the two vet strings changed
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: /platform/about, /th/platform/about, /th/platform/features/medical.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** One line added to `unreleased`, for every visitor.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

Backlog ticks are on the `backlog` branch (commit 8c530db7b) because neither item has reached `main` yet.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Code only: redeploy the previous SHA; nothing in the database to revert.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | With JavaScript off every page body stays hidden in `next dev` (root `loading.tsx` streaming); the links are still in the HTML | deferred to backlog, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the three new menu labels | /th/platform/about |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Thai wording to be confirmed in the next weekly read (#y1dqu)

Manual verification by: pending: Thai wording of three menu labels, next weekly read (#y1dqu)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan file is linked from the PR body
- [ ] Handed to the production release manager — pending: the release manager's pre-deploy pass

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
