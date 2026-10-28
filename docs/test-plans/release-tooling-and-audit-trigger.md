# Test plan: release-tooling-and-audit-trigger

## Header

| | |
|---|---|
| Feature | `release-prs.mjs` resolves squash-merged PRs from GitHub; `check-docs-only.mjs` writes `deps-changed` |
| Backlog item | `docs/backlog.md` → Quick wins, "`release-prs.mjs` CANNOT SEE A SQUASH-MERGED PR" |
| Branch / worktree | `claude/release-tooling-and-audit-trigger` @ `C:\Development\Animal_Shelter_release-tooling-and-audit-trigger` |
| Dev server | n/a, no UI |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 06581159 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the release PR list script asks GitHub about commits it cannot place, and the CI classifier writes the `deps-changed` output the audit job reads
- [x] Files/areas touched listed: `scripts/release-prs.mjs`, `scripts/check-docs-only.mjs`, `docs/backlog.md`, one decision file
- [x] Roles affected identified: none, release tooling and CI only
- [x] Out of scope written down: `advisories.yml`, `continue-on-error`, timeouts, retries, other release scripts, `release-procedure.md`, any migration or card. Job 3 (`record_intake` seeders) was found already fixed by #1006, so nothing was built for it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (branch cut from current main; see gates output below)
- [x] `node scripts/gates.mjs` closing lines:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

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

Run against the real `0.40.9` range (`429229cd` to `0911a1e0^1`, the deploy before it to the commit before the cut):

```
Release range 429229cd..0911a1e0^1
PRs in this release: 29
- #1008  claude/buttons-sweep-3-medical-rows  (ad4a700)  [from github]
- #1009  claude/filters-say-what-they-do  (6d7fb25)  [from github]
(27 other lines, each [from git])
2 PR(s) resolved from GitHub (squash/rebase merge, no merge commit in git); the rest from git.
exit 0
```

Before the change the same range printed `DISAGREEMENT` for both test plans and exited 1. With `GH_TOKEN=bad` after the change it prints the same `DISAGREEMENT` and exits 1, as before.

- [x] Happy path works end to end: 29 PRs, #1008 and #1009 from GitHub, exit 0
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no stored data
- [ ] Empty state renders sensibly — n/a: a range with no orphans never calls `gh`, unchanged path
- [x] Invalid input is rejected with a readable message: no `<since-sha>` prints usage, exit 2 (unchanged); an orphan GitHub cannot resolve still exits 1
- [x] Boundary cases checked: offline or unauthenticated `gh` leaves the orphan in place and exits 1 exactly as before (checked with a bad token). Not exercised: `gh` absent from PATH, since the same harness also dropped `git`; the code path is `spawnSync` returning `error`, handled as unresolved

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing, no app surface | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface, a script and a CI output
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: `check-docs-only.mjs` output unchanged apart from the extra line in `GITHUB_OUTPUT`; `ci.yml` untouched
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the `deps-changed` residue was filed on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-28-release-prs-asks-github.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: release tooling and a CI trigger; no shelter user can see any of it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: counts above are from the run, including the 30-versus-29 range-end difference

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts and CI only, nothing is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts and CI only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the 27 identical `[from git]` lines are elided, noted as such)
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert this PR; neither file affects the running app or any data. After merge a PR touching `package.json` or the lockfile will run `audit` (non-blocking); today every PR shows `skipping`, and a `skipping` is not a pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty, no surface for a person to look at

Manual verification by: n/a: no UI or user-visible surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over through the PR itself once it exists

Result: pass

Release manager acknowledgement: pending
