# Feature test plan — shop-page-finish-schema

## Header

| | |
|---|---|
| Feature | Schema half of finishing Shop for the shelter: `0290` adds `page:shop` to the hide-keys `site_content.hidden_public_pages` accepts (0256) |
| Backlog item | `docs/backlog.md` → **SHOP FOR THE SHELTER: FOUR SMALL THINGS THE APP HALF LEFT, ONE OF WHICH NEEDS A MIGRATION** (left open: the app half, PR 2 of this stream, ticks it) |
| Branch / worktree | `claude/shop-page-finish` @ `C:\Development\Animal_Shelter_shop-page-finish` |
| Dev server | not started — no UI surface in this PR |
| PR | the schema PR of stream `shop-page-finish` (number given on the PR itself) |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — `0290_hidden_public_pages_shop.sql` |
| Tested at SHA | `4d086b02` (after sync with `origin/main` `181dd4f2`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) of the item: one additive migration adding `page:shop` to `0256`'s allowed list, so the database will store it once the app offers it
- [x] Files/areas touched listed — `supabase/migrations/0290_hidden_public_pages_shop.sql`, this plan
- [x] Roles affected identified — none see a change: nothing offers `page:shop` until `/shop` has a `PUBLIC_PAGES` entry (PR 2). Write, read and audit rules are 0256's, untouched
- [x] Anything explicitly **out of scope** written down — the `PUBLIC_PAGES` entry, sitemap, menu/footer placement, the manual topic and `shop.manage`'s probe are PR 2 of this stream. Production apply is the release's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `181dd4f2` merged in cleanly (one backlog file)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Output redirected to a file, exit code read directly:

```
=== gates: typecheck exited 0 after 66s
=== gates: lint exited 0 after 174s
=== gates: test exited 0 after 24s
=== gates: build exited 0 after 229s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: `ok — 0290_hidden_public_pages_shop.sql (against origin/main 181dd4f2, highest 0289_assistant_actions_model_exchange.sql)`; no open PRs at all when checked, and the brief names this as the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 290 applied, 1 pending (`0290`), no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0290_hidden_public_pages_shop.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0290_hidden_public_pages_shop.sql … ok`
- [x] File is re-runnable — `drop constraint if exists` then `add constraint`, `comment on`, `notify`; the same shape as 0256, which `check-hidden-public-pages-schema.mjs` re-runs inside its own transaction every time
- [x] Existing rows still read correctly after the change — the new list is a strict superset of 0256's, so every stored value still passes; dev's row read back `{}` after the apply
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev, against the real `site_content` row. Asserted per key: `page:shop` accepted, `page:about` accepted (an old key still works), `page:home` refused, `page:privacy` refused, `page:shopp` refused (a typo), and a mixed list `{page:shop, section:get-involved, page:foster}` accepted. Read back after the rollback: `hidden_public_pages` is `[]`, nothing kept. Separately `check-hidden-public-pages-schema.mjs` (0256's own harness: editor writes, View-residents-only login refused, audit row, Home/Privacy/r/e/typo refused, signed-out read through the view): `all ok`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive. Removing `page:shop` again would only matter if a row stored it, and nothing can store it until PR 2
- [x] Production apply plan stated for the release manager — `0290` on `dbkodyyxxhtygxcxmfcu` with the next release, **before** the Worker deploy that carries PR 2 (that code offers `page:shop`, and the old constraint would refuse the Director's save)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this yet
- [ ] Data persists — n/a: no UI surface; the stored value was asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface; the empty list is unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the key boundaries (old key, new key, typo, never-hidden pages, mixed list) are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `site_content` | unchanged | n/a — no policy or grant changed |
| management | `site_content` | unchanged | n/a — as above |
| staff | retired | n/a | n/a — retired role (0173) |
| doctor | `site_content` | unchanged | n/a — as above |
| volunteer | `site_content` | unchanged | n/a — as above |
| signed out | `public_site_content` | unchanged | n/a — `check-hidden-public-pages-schema.mjs` confirms the signed-out read still works and `site_content` itself is still denied |

- [ ] Every role above tested — n/a: no policy, grant or view changed; only a check constraint's list grew
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; 0256's harness still shows a login without `website.content` changes nothing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the manual topic is PR 2's
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-hidden-public-pages-schema.mjs` `all ok` with `0290` applied; the build gate compiles every reader of `hidden_public_pages`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought one backlog file; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; PR 2 of this stream (the app lines) closes the item and ticks it
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious here (0256 says to do exactly this); the stream's decision file `2026-10-30-shop-page-finish.md` lands with PR 2 and covers both halves
- [x] `README.md` still accurate — it does not list hide-keys
- [ ] **Release notes.** — n/a: no screen offers the switch until PR 2, which carries the note
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the accepted and refused keys came from the harness on dev, not from reading the file

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
- [ ] Public pages re-checked after a cache purge — n/a: nothing the public site reads changes until PR 2

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no. PR 2 of this stream is the code that offers `page:shop`, so `0290` must be on production before that deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0290` on production with the next release, before the Worker deploy carrying PR 2

### Rollback

- [x] Rollback position stated — a code rollback does not revert `0290`, and does not need to: older code never offers `page:shop`, and every key it does offer is still accepted

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads this yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
