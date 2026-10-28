# Test plan: release-note-guard

## Header

| | |
|---|---|
| Feature | `check-deferred-notes.mjs` lists deferred release notes at every cut; `cut-release.mjs` refuses until each is answered |
| Backlog item | `docs/backlog.md` → Quick wins, "THREE RELEASE NOTES IN A ROW WENT MISSING" |
| Branch / worktree | `claude/release-note-guard` @ `C:DevelopmentAnimal_Shelter_release-note-guard` |
| Dev server | n/a, no UI |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | aa245953 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the deferred-note check is now a script that runs at every cut, not only when `unreleased` is empty, and the cut refuses to write until each candidate is answered
- [x] Files/areas touched listed: `scripts/check-deferred-notes.mjs`, `scripts/lib/deferred-notes.mjs`, `scripts/cut-release.mjs`, `docs/release-procedure.md`, `docs/backlog.md`, one decision file
- [x] Roles affected identified: none, release tooling and CI only
- [x] Out of scope written down: `check-test-plan.mjs`, the gates and CI checks, `CLAUDE.md`, `src/`, any shipped release's notes, any sweep of earlier releases (not done)

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

Self-test: `node scripts/check-deferred-notes.mjs --self-test` printed six `ok` lines, exit 0.

Real range since the `0.40.9` cut (`--since 0911a1e0`): 13 plans changed; 3 may-owe candidates, including `medical-photos-read-grant.md` ("production still needs `0279` applied before any user would see it"), 8 other n/a answers listed.

Cut refusal: `node scripts/cut-release.mjs 9.9.9 2026-10-28 minor --title x --since 0911a1e0` printed the list, then `cut-release: REFUSED — 3 PR(s) above wrote n/a for a step that may close in this release…Nothing written.`, exit 1, `git status` showing no change to `releases.ts` or `package.json`.

- [x] Happy path works end to end: the list prints and the cut refuses on the real range
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no stored data
- [ ] Empty state renders sensibly — n/a: with no candidates the list prints "May owe a note: none." and the cut proceeds; the self-test covers the classifier, the cut path with an answer was not run, because that would change `releases.ts`
- [x] Invalid input is rejected with a readable message: no earlier "Cut x.y.z" commit gives "pass --since <ref>"
- [x] Boundary cases checked: a ticked line carrying the template sentence is not read as n/a; a cut's own plan is skipped. Not exercised: the `--deferred-reviewed` pass-through writing a real cut

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

- [x] The nearest thing still works: `cut-release.mjs` argument handling and its `--verify` path are untouched; `node scripts/check-release-guards.mjs` is unchanged
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-28-release-note-guard.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: release tooling only; no shelter user can see it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the 13/3/8 counts are from the run above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts and CI only, nothing is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts and CI only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [x] Evidence described in this plan is the tools' actual output
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

- [x] Rollback position stated: revert this PR; the cut script goes back to its old behaviour and nothing else depends on the new files

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
