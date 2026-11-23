# Feature test plan

## Header

| | |
|---|---|
| Feature | `/th` 500 on the Pi: Thai rewrite moved from the proxy to a config rewrite |
| Backlog item | `docs/backlog.md` → #thpfx (not ticked: production proof outstanding) |
| Branch / worktree | `claude/thai-prefix-500` @ `C:\Development\Animal_Shelter_thai-prefix-500` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | 5fa04744c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/th/<page>` is served by a relative `next.config.ts` rewrite instead of an absolute `NextResponse.rewrite` from the proxy, which Next proxied outward on the Pi and answered 500
- [x] Files/areas touched listed: `src/proxy.ts`, `src/lib/supabase/proxy.ts`, `next.config.ts`, `src/lib/th-rewrite.test.mjs`, a decision file
- [x] Cards affected identified: none change; no card, no access rule. The rewrite fires only on the header the proxy sets for a `thPathRest()` address; signed-out public visitors are the ones who reach these pages
- [x] Anything explicitly out of scope written down: `PUBLIC_SITE` untouched, no platform page edited, production proof is the planner's and Lutan's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all 0:

```
=== gates: typecheck exited 0 after 92s
=== gates: lint exited 0 after 202s
=== gates: test exited 0 after 34s
=== gates: build exited 0 after 83s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: production build bound to 127.0.0.1 with `Host: localhost:3007` and `x-forwarded-proto: https` (the Pi's shape) reproduced the 500 before the fix; after it `/th` 200 in Thai, `/th/` 308 to `/th`, `/th/adopt`, `/th/donate`, `/th/our-work`, `/th/platform/about`, `/th/platform/features/x` equal their bare targets
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no data written
- [ ] Empty state renders sensibly — n/a: no list
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: `/th` and `/th/` tested as two cases; a spoofed `x-locale-path` on `/adopt` stays English

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | `/th/bills`, `/th/login` | 307 to login, as before | 307 to `/login?next=...` |

- [ ] Every login above tested — n/a: only signed out matters; no card or access rule changed
- [x] A login that should not have access is blocked server-side: `/th/bills` signed out is redirected to login

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible behaviour change
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: checked with curl against a built server, no browser page changed
- [x] Network clean: no 4xx/5xx on the checked addresses; server log held no EPROTO after the fix

## 6. Regression

- [x] The pages nearest the change still work: `/`, `/adopt`, `/donate`, `/our-work`, `/platform/about` and their `/th` twins
- [x] Shared files touched checked from an unrelated page: `proxy.ts` runs for every request; bare `/adopt` and `/` load 200 in English
- [x] Nothing merged from `main` during `sync` was broken: gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked, production proof outstanding (item left for the planner)
- [x] Non-obvious design choices added as `docs/decisions/2026-11-23-thai-prefix-rewrite.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: until the site is unlocked nobody can reach a Thai public page to notice, so the note belongs to whichever PR closes the step a user could see
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the cause is read from the Pi's journal and reproduced locally with the Pi's bind and headers

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (`/th` and `/th/platform/about` must answer 200)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback: `./scripts/pi/deploy-pi.sh --ref <previous sha>`; no migration to undo

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the Pi deploy, `/th` and `/th/platform/about` answer 200 | production, planner and Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: proof on production

Manual verification by: pending: proof on production

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed with the PR
- [ ] Handed to the production release manager — pending: after merge

Result: pass
