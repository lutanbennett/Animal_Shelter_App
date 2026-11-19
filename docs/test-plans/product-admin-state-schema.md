# Feature test plan — product-admin-state-schema

## Header

| | |
|---|---|
| Feature | Schema half of #padui: each shelter's setup state in `product_admin_shelters()`, an exact-match login lookup by email, and a `site_content` seed and backfill |
| Backlog item | `docs/backlog.md` -> #padui (NOT ticked: the screen is batch 3) |
| Branch / worktree | `claude/product-admin-state-schema` @ `C:\Development\Animal_Shelter_product-admin-state-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known at creation |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | yes - `0417_product_admin_setup_state.sql` |
| Tested at SHA | `d6d1282ae` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for - the read says what setup each shelter has had, a lookup answers whether an address has a login, and a shelter with no website-settings row gets one
- [x] Files/areas touched listed - `supabase/migrations/0417_product_admin_setup_state.sql`, `supabase/harness/product_admin_setup_state.sql`, `scripts/lib/tenancy-catalogue.mjs` (four allowed-by-name entries), `docs/hard-coded-security-registry.json` (six declarations), `docs/decisions/2026-11-19-product-admin-state-schema.md`, this plan
- [x] Roles affected identified - none: product administrators only; no grant to anon or to any shelter role
- [x] Anything explicitly **out of scope** written down - no src/ change; the screen is batch 3; `#padui` is not ticked

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
gates: typecheck=0 lint=0 test=0 build=0

```
=== gates: build exited 0 after 175s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR - n/a: not yet, the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` - `check-migration-numbers.mjs`: ok, 0417 against highest 0416
- [x] `--status` reviewed before applying - 417 applied, 1 pending (0417)
- [x] `--dry-run` reviewed - `0417 ... ok`
- [x] Applied to **dev** - `applying 0417_product_admin_setup_state.sql ... ok`
- [x] File is re-runnable - the drop is `if exists`; the creates are new names; the backfill and the seed are `on conflict do nothing`; owner changes guarded
- [x] Existing rows still read correctly - no existing row changed; `site_content` gained one row each for `test-shelter-2` and `proof-b`
- [x] **Exercised against real rows** in a rolled-back harness (`supabase/harness/product_admin_setup_state.sql`): `HARNESS OK padui schema` — new shelter's flags, each step flipping its own flag, drive `incomplete` and calendar `dead`, lookup true/false/case-insensitive, wildcard and underscore refused, aal1 and non-PADMIN refused with address-independent text, by-email link and unknown-address refusal, reseed idempotent, no shelter lacks a `site_content` row
- [x] Down-migration - not needed: undo steps are in the migration header
- [x] Production apply plan - 0417 with the next release; nothing reads it yet. Production has one shelter (`lanna`) that already has its row, so the backfill adds nothing there

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in §3's harness
- [ ] Empty state renders sensibly - n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked - n/a: no UI surface; address-shape refusals are in the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any non-PADMIN login, PADMIN at aal1 | the lookup, the two by-email writes, the people list, the setup read | refused or empty, with address-independent wording | harness: `product admin only` for both a real and an unreal address; zero rows from the two reads |
- [ ] Every role above tested - n/a: one access class (product administrator); the refusals above were driven in the harness
- [x] A role that should not have access is blocked server-side - the harness shows a non-PADMIN and an aal1 PADMIN are refused inside the function bodies

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated - n/a: no UI surface
- [ ] Translatable strings - n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work - build gate green; the existing screen reads `product_admin_shelters` by name through a cast, so extra columns are ignored (not driven in a browser)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` - n/a: deliberately not ticked, this is the schema half and the screen is batch 3
- [x] Non-obvious design choices added in `docs/decisions/2026-11-19-product-admin-state-schema.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** - n/a: only a product administrator could notice, and nothing reads the columns yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — column types from `information_schema` on dev, behaviour from the harness, lint results from the two scripts

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
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Migration and code that reads it?** - no; consumer none
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: the one drop is of a read function recreated in the same file
- [x] Apply plan stated - 0417 on production with the next release

### Rollback

- [x] Rollback position stated - code rollback does not need to revert 0417; nothing reads it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | the tenancy lint and the hard-coded-security check both flagged the new functions until recorded | fixed - four allowed-by-name entries, six registry declarations |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

Manual verification by: n/a: no UI surface, nothing for a person to look at

Result: pass
