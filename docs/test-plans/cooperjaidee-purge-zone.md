# Feature test plan

## Header

| | |
|---|---|
| Feature | Purge the `cooperjaidee.org` zone, name all four production hosts |
| Backlog item | `docs/backlog.md` → `#cjpzn` |
| Branch / worktree | `claude/cooperjaidee-purge-zone` @ `C:\Development\Animal_Shelter_cooperjaidee-purge-zone` |
| Dev server | n/a: script-only change, no page |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | c956b5a33 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `purge-cache.mjs --env production` purges both production zones and names any zone it could not purge
- [x] Files/areas touched listed — `scripts/purge-cache.mjs`, new `scripts/lib/purge-zones.mjs`, new `scripts/purge-zones.test.mjs`, `docs/release-procedure.md`, `docs/backlog.md`, one decision file
- [ ] Cards affected identified — n/a: a release script; no card, no page, no admin or public behaviour changes
- [x] Anything explicitly **out of scope** written down — widening the production purge token and adding the zone id are Lutan's; no live production purge was run

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all four exit 0:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 78s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 258s
=== gates: test — npm test
=== gates: test exited 0 after 64s
=== gates: build — npm run build
=== gates: build exited 0 after 173s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` — n/a: no migration
- [ ] `--dry-run` — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `--dry-run` against copies of the real env files: `--env test` names the `lannacare.org` zone (exit 0); `--env production` names `lannacareforanimals.org` + `www.` and reports `cooperjaidee.org` + `www.` as NOT PURGED (exit 1, the intended state until the zone id is added). Live purge not run
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete — n/a: no records
- [x] Empty state renders sensibly — a missing zone variable is named NOT PURGED; missing token or every zone still refuses with exit 2 (unit test: absent variable kept as a null zone, not dropped)
- [x] Invalid input is rejected with a readable message — `--env` outside production/uat/test still refuses as before
- [x] Boundary cases checked — unit test: a host bound in `wrangler.jsonc` that no zone covers is reported; every bound host in all three environments is covered today

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: script | n/a: script | n/a: script |
| signed out | n/a: script | n/a: script | n/a: script |

- [ ] Every login above tested — n/a: a release script run from the deploy machine, no login
- [ ] Server-side block — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual updated — n/a: nothing a shelter user sees
- [ ] Translatable strings — n/a: console output for the release manager
- [ ] Mobile viewport — n/a: no page
- [ ] Browser console — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — `--env test` dry run selects the same zone and both hosts as before
- [ ] Shared file checked from a second page — n/a: no shared UI file touched; `scripts/lib/wrangler.mjs` only read
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item updated in `docs/backlog.md` on this branch — script side recorded; item left open, `waiting:lutan`, for the token
- [x] Non-obvious design choices added — `docs/decisions/2026-11-27-purge-missing-zone-fails-after-purging.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a release script; no shelter user or Admin sees anything change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured** — the token's zone list and the `www.` zone lookup were read from the Cloudflare API on 2026-11-27

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone — n/a: no date logic
- [ ] Boundary assertions — n/a: no threshold
- [x] Evidence pasted is the tool's actual output
- [ ] Public pages re-checked after a purge — deferred: release manager, on the first release after the token is widened

### Deploy safety

- [ ] Supabase ref line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] Any new secret/env var exists — deferred: Lutan, `CLOUDFLARE_ZONE_ID_COOPERJAIDEE` in `.env.deploy.production` and a purge token allowed on that zone

### Migration ordering — *skip if no migration*

- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; a script on the deploy machine, nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Production purge token cannot reach the `cooperjaidee.org` zone | deferred: Lutan, on `#cjpzn` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a release script with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the next release

Result: pass with accepted defects

Release manager acknowledgement: pending: the next release
