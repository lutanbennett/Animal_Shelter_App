# Feature test plan

## Header

| | |
|---|---|
| Feature | PR `audit` job only on package-list changes plus a release audit step; card walkthrough generator stops asserting four things the app does not do |
| Backlog item | `docs/backlog.md` → "Run the PR `audit` job only on PRs that change the package list" and "Card walkthrough generator: four steps say something the app does not do" |
| Branch / worktree | `claude/ci-audit-and-walkthrough-fixes` @ `C:\Development\Animal_Shelter_ci-audit-and-walkthrough-fixes` |
| Dev server | not started: nothing driven in a browser (CI config, docs and a generator script) |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | `d9405a7b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for: `audit` runs only when `package.json` or `package-lock.json` changed and every release audits first; the walkthrough's refused page, photo read-back and website step are corrected and the file regenerated
- [x] Files/areas touched listed: `.github/workflows/ci.yml`, `scripts/check-docs-only.mjs` and its test, `scripts/gen-card-walkthrough.mjs`, `docs/card-walkthrough.md`, `docs/release-procedure.md`, `docs/release-smoke-test.md`, `CLAUDE.md`, a decision file, `docs/backlog.md`
- [x] Roles affected identified: none; no app code, no permission, no database
- [x] Anything explicitly **out of scope** written down: `advisories.yml` untouched, `continue-on-error`/timeout/retry on the PR job untouched, no `npm audit fix`, no migration, no change to `src/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 153s

gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed. n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations`. n/a: no migration
- [ ] File is re-runnable. n/a: no migration
- [ ] Existing rows still read correctly after the change. n/a: no migration
- [ ] Constraints and defaults exercised against real rows. n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated. n/a: no migration
- [ ] Production apply plan stated for the release manager. n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `check-docs-only.test.mjs` passes (7 tests, incl. the new `depsChanged` cases); `gen-card-walkthrough.mjs` regenerates and `check-card-walkthrough.mjs` reports all 28 cards current
- [ ] Data persists — reload the page and the change is still there. n/a: no data written
- [ ] Create / edit / delete all exercised. n/a: no records involved
- [ ] Empty state renders sensibly. n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: an unreadable diff makes `depsChanged` answer true (audit anyway), asserted in the test
- [x] Boundary cases checked: root `package.json` and `package-lock.json` count, a nested `worker/package.json` does not; a docs-only diff does not trigger audit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing | no access rule changed | n/a: no app code touched |

- [ ] Every role above tested. n/a: no access rule changed and no page touched
- [ ] A role that should not have access is blocked server-side. n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct. n/a: no nav change
- [ ] Manual updated. n/a: no user-facing feature
- [ ] Translatable strings. n/a: none added
- [ ] Mobile viewport (375px). n/a: no UI
- [ ] Browser console clean. n/a: no page changed
- [ ] Network clean. n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: the other CI jobs' conditions in `ci.yml` are unchanged; only `audit`'s `if` and the `changes` job's outputs moved, and gates ran clean
- [ ] Any shared file touched checked from a second page. n/a: no shared UI file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch. n/a: sync merged nothing new

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch (both)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-25-audit-on-releases-not-every-pr.md`
- [ ] `README.md` still accurate. n/a: nothing it describes changed
- [ ] **Release notes.** n/a: CI configuration and a generator script, nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: the generated diff was read line by line (every `/operations/medication-list` refusal replaced, the `residents` steps 10 and 12 read); the claim that a `src/`-only PR shows `audit` skipped is NOT measured here and is stated as such in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time. deferred: release manager
- [ ] Deployed SHA matches the tested SHA. deferred: release manager

### On the deployed build

- [ ] Deployed to test. deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`. deferred: release manager
- [ ] Timezone-sensitive behaviour proved. n/a: nothing here touches dates
- [ ] Boundary or banding change covers both edges. n/a: no boundary or banding in app behaviour; the file-path test covers both sides of the package-list match
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked. n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read. deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output. deferred: release manager
- [ ] Any new secret/env var exists in production. n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? n/a: no migration
- [ ] `--env production --dry-run` run and clean. n/a: no migration
- [ ] Destructive migration backup. n/a: no migration
- [ ] Apply plan stated. n/a: no migration

### Rollback

- [ ] Rollback position stated. n/a: no code, data or schema in the app; revert the PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On this PR (no package file changed) the `audit` job shows as skipped; on the next PR that changes `package-lock.json` it runs | the PR's checks list |
| 2 | The new "Audit the production dependencies" step is walked once on the next release | `docs/release-procedure.md` |
| 3 | The refused page in the regenerated walkthrough (e.g. `/stocktake`) really is refused to a login holding only that card; the generator picks it by activity overlap, not by driving the app | Card review 1 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: rows 1 to 3 are open and signed as pending below

Manual verification by: pending: rows 1 to 3 of Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: pasted once the PR exists
- [ ] Handed to the production release manager. n/a: after merge

Result: pass

Release manager acknowledgement: n/a: after merge
