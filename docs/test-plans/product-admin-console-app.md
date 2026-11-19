# Feature test plan — product-admin-console-app

## Header

| | |
|---|---|
| Feature | `#pltfd` (console moves to the platform host `/platform`, third host setting) and `#padui` app half (per-shelter checklist, email add/link) |
| Backlog item | `docs/backlog.md` -> #padui (ticked); #pltfd NOT ticked: its "done when" needs the deploy and Lutan's Cloudflare/Supabase steps |
| Branch / worktree | `claude/product-admin-console-app` @ `C:\Development\Animal_Shelter_product-admin-console-app` |
| Dev server | `http://localhost:3001` |
| PR | pending: number known at creation |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | pending: recorded at merge |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for - the console lives on the platform host in its own shell and shows each shelter's setup steps
- [x] Files/areas touched listed - `src/lib/site-hosts.ts`, `src/proxy.ts`, `src/app/platform/*`, `src/app/PublicPathGate.tsx`, `src/app/admin/page.tsx`, dictionaries, `wrangler.jsonc`, deploy and host-check scripts, catalogue entries, docs
- [x] Roles affected identified - product administrators only; no card or role involved
- [x] Anything explicitly **out of scope** written down - receipts form, the `_` limitation, the apex login page; see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — pending: run before merge
- [x] `node scripts/gates.mjs` - typecheck, test and build exit 0; lint was red on the old path in the permission catalogue and was fixed (`npm run lint` has no FAIL); final run recorded at merge
- [ ] CI green on the PR - pending: not yet opened

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` - n/a: no migration
- [ ] `--status` reviewed before applying - n/a: no migration
- [ ] `--dry-run` reviewed - n/a: no migration
- [ ] Applied to **dev** - n/a: no migration
- [ ] File is re-runnable - n/a: no migration
- [ ] Existing rows still read correctly - n/a: no migration
- [ ] **Exercised against real rows** - n/a: no migration (0417 was proved in its own PR)
- [ ] Down-migration - n/a: no migration
- [ ] Production apply plan - n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — signed in at aal2 on dev as a product administrator, `/platform` renders the checklist, emails, own shell
- [x] Data persists — a Server Action ran from the page (add by email, refused in words for an unknown address)
- [ ] Create / edit / delete all exercised — pending: only the add-by-email refusal was pressed; create shelter, host and role presses were not, to leave the shared dev data alone
- [x] Empty state renders sensibly - no shelters / one administrator wording is unchanged
- [x] Invalid input is rejected with a readable message, not a crash — "No login has that email address."
- [ ] Boundary cases checked - n/a: the `_` refusal is recorded as a finding, not driven

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| product administrator at aal2 | `/platform` | page and all controls | pass, driven |
| product administrator at aal1 | `/platform` | page readable, one notice, no controls | pending: not driven, code path by reading |
| login not on the list | `/platform` | not-found | pending: not driven, `isProductAdmin()` gate unchanged |
- [ ] Every role above tested - pending: two rows above not driven
- [x] A role that should not have access is blocked server-side - the database functions refuse; unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the Admin tile was removed on purpose, the console has no menu
- [ ] Manual updated - n/a: no manual topic describes this screen
- [x] Translatable strings - English and Thai added, `shelterNote` removed from both
- [ ] Mobile viewport (375px) — pending: not driven
- [ ] Browser console clean — pending: not read
- [ ] Network clean — pending: not read

## 6. Regression

- [x] The pages nearest the change still work - build and lint gates; the Admin landing page compiles without the tile
- [ ] Any shared file touched checked from a second, unrelated page — pending: `PublicPathGate` and `proxy.ts` only gain a platform-path branch, covered by the site-hosts unit tests
- [x] Nothing merged from `main` during `sync` was broken by this branch — pending sync, nothing merged yet

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` - #padui ticked; #pltfd left open on purpose
- [x] Non-obvious design choices added in `docs/decisions/2026-11-19-operator-console-on-the-platform-host.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** - n/a: only a product administrator can see this page and nothing a shelter user would notice changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the dev press and the unit tests were run; the apex itself is not live

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: public pages untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: `PLATFORM_HOST` is a wrangler var, not a secret; the production deploy creates the two routes

### Migration ordering — *skip if no migration*

- [ ] **Migration and code that reads it?** - n/a: no migration; reads 0417, applied on dev, goes with the next release
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (0417 must be applied before this code ships)
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated - n/a: see above

### Rollback

- [x] Rollback position stated - revert the PR; no schema change to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | permission-catalogue still listed the old path, lint red | fixed |
| 2 | low | an address with `_` cannot be looked up (0417 rule) | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the deploy and the Cloudflare/Supabase steps, sign in on cooperjaidee.org and save a change | `docs/domain-checklist.md` section F |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

Manual verification by: pending: Lutan, on cooperjaidee.org after the deploy

Result: pass
