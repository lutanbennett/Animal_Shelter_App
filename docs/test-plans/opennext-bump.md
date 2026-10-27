# Feature test plan — opennext-bump

## Header

| | |
|---|---|
| Feature | Bump `@opennextjs/cloudflare` 1.20.6 to 1.20.13 so the Worker can load Next 16.4's `preview-props.json` (the cron's failure) |
| Backlog item | `docs/backlog.md` → **THE 15-MINUTE SCHEDULE HAS STOPPED ON BOTH TEST AND PRODUCTION** (not ticked until a deploy proves a real run) |
| Branch / worktree | `claude/opennext-bump` @ `C:\Development\Animal_Shelter_opennext-bump` |
| Dev server | not started — no UI surface |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | `b82da8a4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — dependency bump; the cron is fixed only once Lutan deploys the Worker
- [x] Files/areas touched listed — `package.json`, `package-lock.json`, `docs/decisions/2026-10-27-opennext-1-20-13-for-next-16-4.md`, this plan
- [x] Roles affected identified — none; no page or role sees a change
- [x] Anything explicitly **out of scope** written down — deploying the Worker (Lutan's), the Cloudflare trigger, any migration, app code

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see the closing gates lines below; sync was run before the PR
- [x] `node scripts/gates.mjs` ends clean. Closing lines: `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path — `gates.mjs` ended typecheck=0 lint=0 test=0 build=0, and `npm run opennext:build` completed with the built `handler.mjs` listing `.next/server/preview-props.json`
- [ ] Data persists — n/a: no UI; whether the cron now runs is only proved after a Worker deploy (see Left for manual verification)
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI or data
- [x] Invalid input — n/a: no input handling changed
- [x] Boundary cases — n/a: no boundary or banding change

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing new | no page, route or permission changed | n/a |

- [ ] Every role above tested — n/a: no page or route changed
- [ ] A role that should not have access is blocked server-side — n/a: no new surface; the heartbeat writes with the service-role key the Worker already holds

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual updated — n/a: internal diagnostics
- [ ] Translatable strings — n/a: no user text
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the app still type-checks, lints, tests and builds on the bumped adapter, and `wrangler` moved 4.145.0 to 4.153.0 with it (not exercised by a deploy here)
- [ ] Shared file touched, loaded from a second page — n/a: no shared source file touched, only the lockfile and package.json
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: the cron is not proven fixed until a deploy; the item is updated on the `backlog` branch instead
- [x] Non-obvious design choices added as `docs/decisions/2026-10-27-opennext-1-20-13-for-next-16-4.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a dependency bump that changes nothing a shelter user sees until the Worker is deployed, and status alert mail is not yet proven to resume
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The cause is from the adapter's own source (1.20.6 vs 1.20.13 `load-manifest.js`) and the build output; the decision says the cron fix is not yet verified

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: the release manager at cut time
- [ ] Deployed SHA matches — deferred: the release manager at deploy time
- [ ] Deployed to test — deferred: Lutan (Worker deploys are his)
- [ ] Smoke-tested on test — deferred: Lutan; after deploy and one quarter-hour run `node scripts/check-production.mjs calendar-cron --env test`
- [ ] Timezone-sensitive behaviour — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: the 45-minute staleness window is the only threshold and both sides were run
- [ ] Evidence pasted is the tool's actual output — n/a: no table of results
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: Lutan at deploy time
- [ ] `strip-baked-env` line seen — deferred: Lutan at deploy time
- [ ] Any new secret/env var exists — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; revert the commit and redeploy the Worker; the old adapter is the one that fails on Next 16.4

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | No Worker harness exists, so the bumped adapter is untested at runtime until a deploy | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the Worker is deployed to test and one quarter-hour passes, `calendar-cron` shows `verdict: healthy` | `node scripts/check-production.mjs calendar-cron --env test` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: left pending; the item needs a Worker deploy that is Lutan's

Manual verification by: pending: a real cron run can only be seen after Lutan deploys the Worker to test

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass with accepted defects
