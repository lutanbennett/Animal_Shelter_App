# Feature test plan — affiliate-links-schema

## Header

| | |
|---|---|
| Feature | Schema half of Shop for the shelter: `shop_links`, the `shop.manage` activity and `manage_shop_page` card, `public_shop_links` |
| Backlog item | `docs/backlog.md` → **AFFILIATE LINKS GET THEIR OWN PUBLIC PAGE** (left open: the app half remains) |
| Branch / worktree | `claude/affiliate-links-schema` @ `C:\Development\Animal_Shelter_affiliate-links-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — `0285_shop_links.sql` |
| Tested at SHA | see PR body |

## 1. Scope and risk

- [x] Change is described in one sentence — a table for public shop and Shelter Friend affiliate entries, its card-gated policies and a public view
- [x] Files/areas touched listed — `supabase/migrations/0285_*.sql`, `scripts/check-shop-links.mjs`, one line in `scripts/check-public-views.mjs`, `docs/hard-coded-security-registry.json`, the decision file, this plan
- [x] Roles affected identified — none today: the card is held by no role until Admin assigns it
- [x] Out of scope written down — all of `src/`, `src/lib/permissions/`, the page, the management screen, releases

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` — see PR body
- [ ] CI green on the PR — n/a: the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0285 against 0284, `migration numbers: ok`
- [x] `--status` reviewed before applying — dev 285 applied, 0 pending
- [x] `--dry-run` reviewed — `0285 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — `applying 0285_shop_links.sql … ok`
- [x] File is re-runnable — if not exists, on conflict, drop-then-create policies and triggers, create or replace
- [x] Existing rows still read correctly — `is_public_drive_file()` rebuilt from 0245's body; the harness checks the appeal and adoption-update branches survive
- [x] Harness in `begin … rollback` (`scripts/check-shop-links.mjs`): http, javascript:, blank title refused; Friend entries read name and logo from the Friend; hidden, unpublished and archived rows absent from the view; editor writes, reader reads only, no-card login nothing; anon cannot touch the table; Admin does all of it holding no cell. Result: HARNESS-OK
- [x] Down-migration not needed — additive; undo steps are in the file header
- [x] Production apply plan — never applied to production here; production is three migrations behind on purpose

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these tables yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface (exercised in the harness)
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface (the database check is exercised in the harness)
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `manage_shop_page` (shop.manage edit) | `shop_links` read and write | allowed | pass (harness) |
| shop.manage read only | read, no write | read only | pass (harness) |
| none | nothing | refused | pass (harness) |
| Admin (no cards) | everything | allowed | pass (harness) |

- [x] Every card level above tested — in the harness, as logins with exactly those cells
- [x] Blocked server-side — the policies refuse; there is no page to hide anything on

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: nothing user-visible yet
- [ ] Translatable strings — n/a: `translatable_fields` rows are registered; no dictionary yet
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest checks still work — `check-public-views.mjs` passes for the new view (anon select ok, writes refused, table refused); `check-hard-coded-security.mjs` clean
- [ ] Shared file touched checked from an unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately open; the app half remains (progress note on the `backlog` branch)
- [x] Decision recorded — `2026-10-30-affiliate-links-schema.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: schema only; no screen reads these tables yet
- [x] Commit messages say why
- [x] Claims were measured — harness and check output, not reasoned

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
- [ ] Public pages re-checked — n/a: no public page reads the view yet

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and reading code in one PR? — no; `-- consumer: none`; the readers are the app half
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: additive; one function replaced with a superset body
- [x] Apply plan stated — with the app half's release; publication also waits on the tax question

### Rollback

- [x] Rollback position — nothing reads the new objects; undo steps are in the migration header

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | `scripts/check-public-views.mjs` (another stream's area) got a one-line addition, or CI's public-views job fails on any new public view | accepted — flagged in the PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
