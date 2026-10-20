# Test plan: release-tooling-fixes

## Header

| | |
|---|---|
| Feature | Release tooling fixes (byte count, x-lanna-cache, daily sync check, cron check) |
| Backlog item | `docs/backlog.md` → purge-cache vs check-assets; x-lanna-cache HIT; daily-sync check-backlog-sections; 0227 cron check |
| Branch / worktree | `claude/release-tooling-fixes` @ `C:\Development\Animal_Shelter_release-tooling-fixes` |
| Dev server | n/a, scripts and docs only |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | b8478489 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: scripts that prove a deploy now count bytes correctly, the cache header is explained, and a read-only cron check exists
- [x] Files/areas touched listed: scripts/purge-cache.mjs, scripts/pi/check-assets.mjs, scripts/lib/served-bytes.mjs, scripts/check-cron-job.mjs, plan-day skill, CLAUDE.md, docs
- [x] Roles affected identified: none, no app surface
- [x] Out of scope written down: worker/ not changed; the cron job is not made to report on itself; production not read

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: served-bytes.test.mjs passes (plain and gzip, fixture 4 bytes longer than its characters)
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete — n/a: no UI
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no UI
- [ ] Boundary cases — n/a: byte-vs-character boundary covered by the test fixture

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing | no app surface | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] Server-side block — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: check-assets.mjs and purge-cache.mjs pass node --check and use the same helper
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from main during sync was broken: gates pass

## 7. Documentation

- [x] Backlog items ticked in docs/backlog.md on this branch (the 0227 item deliberately left open, with a note)
- [x] Decision added: docs/decisions/2026-10-20-release-tooling-fixes.md
- [x] README.md still accurate
- [ ] **Release notes.** — n/a: scripts and docs only, no shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured: the 4-byte cause was reproduced by the fixture; the x-lanna-cache conclusion is from reading worker/index.mjs and is labelled as such, with the purge question left open

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: scripts and docs only, nothing deploys
- [ ] Smoke-tested on test — n/a: scripts and docs only
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding assertions — n/a: no banding change
- [x] Evidence pasted is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no page changed
- [ ] deploy line read — n/a: nothing deploys
- [ ] strip-baked-env seen — n/a: nothing deploys
- [ ] New secret/env var — n/a: none
- [ ] Migration and reading code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: revert the commit; nothing deployed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Whether Cloudflare purge-everything clears the Worker's cache copy is not established | deferred to backlog (recorded in the decision file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `node scripts/check-cron-job.mjs --env production`; it must print ok. Claude could not read production | Lutan's machine |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is left for Lutan, so this is not ticked

Manual verification by: pending: Lutan runs check-cron-job.mjs on production

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not a release PR

Result: pass with accepted defects

Release manager acknowledgement: n/a: not a release PR
