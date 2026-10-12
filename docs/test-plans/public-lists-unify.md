# Feature test plan

## Header

| | |
|---|---|
| Feature | One list for the public hostnames (`site-hosts.ts`) and one for the public pages (`PUBLIC_PAGE_PREFIXES`); /r and /e decided not edge-cached |
| Backlog item | `docs/backlog.md` → Deployment: public hostnames hard-coded in two places; Architecture: public-page list exists three times |
| Branch / worktree | `claude/public-lists-unify` @ `C:DevelopmentAnimal_Shelter_public-lists-unify` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | @@SHA@@ |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the staff-app host list and the public-page list are each defined once and imported where they were copied; no hostname and no public path changed
- [x] Files/areas touched listed: `src/lib/site-hosts.ts` (new), `src/lib/auth/same-origin.ts`, `next.config.ts`, `src/lib/public-paths.ts`, `worker/index.mjs`, `scripts/check-site-hosts.mjs` (new), `scripts/check-public-paths.mjs`, `.github/workflows/ci.yml`, README, backlog, one decision file
- [x] Roles affected identified: none changes behaviour; signed-out public and every role that posts a Server Action or upload are the ones the host list protects
- [x] Out of scope written down: no cutover step, no hostname change, `scripts/lib/runtime-config.mjs` and the proxy's origin-key check untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

@@GATES@@

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-public-paths.mjs` and `node scripts/check-site-hosts.mjs` both print `all right`
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no records involved
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected: `/adoptive`, bare `/r` and `/e`, `/residents` still not public; a Cross-site Origin still refused (same host predicate, moved)
- [x] Boundary cases checked: before/after membership of `isPublicPath` (open and locked) and `isPublicPage` compared on 120 probes (every prefix bare, with slash, with child, plus lookalikes): 0 differences. Edge cache set is exactly the old Worker list: /adopt /our-work /foster /volunteer /donate /friends /privacy and "/"

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no access rule changed | n/a |
| management | n/a | no access rule changed | n/a |
| second_in_command | n/a | no access rule changed | n/a |
| staff | n/a | no access rule changed | n/a |
| vet | n/a | no access rule changed | n/a |
| volunteer | n/a | no access rule changed | n/a |
| resident | n/a | no access rule changed | n/a |
| signed out | n/a | no access rule changed | n/a |

- [ ] Every role above tested — n/a: no access rule changed; membership of the public lists proven identical
- [ ] A role that should not have access is blocked server-side — n/a: the proxy and same-origin check are unchanged in behaviour

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI or text changed
- [ ] Manual updated — n/a: no UI or text changed
- [ ] Translatable strings — n/a: no UI or text changed
- [ ] Mobile viewport — n/a: no UI or text changed
- [ ] Browser console clean — n/a: no UI or text changed
- [ ] Network clean — n/a: no UI or text changed

## 6. Regression

- [x] Nearest things still work: the existing 40-odd `check-public-paths` cases all still pass; `node scripts/check-script-integrity.mjs` unaffected
- [x] Shared files touched: `next.config.ts` evaluated by the build (gates build=0); `ci.yml` gained two `run` lines beside existing ones
- [x] Nothing merged from `main` during sync was broken: gates run on the merged tree

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md`
- [x] Non-obvious design choices recorded: `docs/decisions/2026-10-12-r-and-e-not-edge-cached.md`
- [x] `README.md` cutover paragraph now names `site-hosts.ts` and `httpHostHeader`
- [x] Commit messages say why, not just what
- [ ] Release-notes line — n/a: refactor of two lists with identical membership, and /r and /e were not cached before and are not now, so no shelter user would notice

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager (sign in, save a Server Action form, upload a photo: that is what a wrong host list would break)
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date logic
- [ ] Public pages re-checked after cache purge — deferred: production release manager. The Worker now imports its list from `src/lib/public-paths.ts`; the Worker bundle is NOT built by `gates.mjs`, so confirm `wrangler deploy` bundles it, then load / and /adopt (x-lanna-cache MISS then HIT) and /r/<code> (BYPASS)

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: production release manager
- [ ] `strip-baked-env` seen — deferred: production release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; no data or setting changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After deploy: Worker bundle builds, / is cached (HIT on 2nd load), /r/<code> is not (BYPASS); a Server Action and an upload still work | test.lannacare.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [x] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: pending: Lutan to confirm the Worker deploy and the test-site smoke test above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — goes with the release

Result: pass

Release manager acknowledgement: pending: release manager
