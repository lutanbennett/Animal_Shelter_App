# Feature test plan — script-exit-debt

## Header

| | |
|---|---|
| Feature | Nine scripts (`add-product-admin`, `apply-migrations`, `backup`, `check-resident-sections`, `deploy`, `fix-panda-placements`, `reset-test-data`, `restore-grants`, `shelter-export`) and `worktree.mjs` now end through `bail`/`runMain` (`scripts/lib/exit.mjs`) instead of `process.exit`; `check-script-exits.mjs` lists a widened, non-blocking population |
| Backlog item | `#scimp` — left unticked: the widened population (46 scripts) is listed, not converted |
| Branch / worktree | `claude/script-exit-debt` @ `C:\Development\Animal_Shelter_script-exit-debt` |
| Dev server | n/a: scripts only, no UI |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `506726c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — nine named scripts plus `worktree.mjs` converted, check widened (not blocking)
- [x] Files/areas touched listed — `scripts/` only: the ten scripts, `scripts/lib/exit.mjs`, `scripts/check-script-exits.mjs`; `docs/decisions/2026-11-19-script-exit-debt.md`, this plan
- [x] Roles affected identified — none; scripts run by hand
- [x] Anything explicitly **out of scope** written down — converting the 46 widened-population scripts; `dev-signin.mjs` (still exempt)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends:

```
=== gates: build exited 0 after 168s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — `worktree.mjs` exit codes measured: unknown command 1, no command 0, `done` with no argument 1; `check-script-exits.mjs` run on the whole tree (0 unmarked)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI and no data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI and no data
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — the widened check proven against a planted unmarked fetch+exit (fails), a spawn+exit (counted unreviewed), and a helper user (ignored)
- [x] Boundary cases checked — every `process.exit(n)` became `bail(n)` with the same `n`, read per file; every `try` in the nine read for a catch that could swallow `bail`; `shelter-export` rethrows it
- [ ] Every role above tested — n/a: no roles
- [ ] A role that should not have access is blocked server-side — n/a: no access control touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — n/a: no pages; `check-script-ts-imports.mjs` and `check-script-exits.mjs` both pass on the whole tree
- [x] Any shared file touched checked from a second, unrelated place — `scripts/lib/exit.mjs` gained two exports; the 15 existing `exitWith` users are untouched and the checks still count them
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked; the widened population is only listed
- [x] Non-obvious design choices recorded as a new file, dated — `docs/decisions/2026-11-19-script-exit-debt.md`
- [x] `README.md` still accurate — n/a: README does not describe these scripts' exits
- [ ] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line — n/a: scripts somebody runs by hand; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — exit codes from runs; "not reproduced" is stated for the original crash

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — n/a: no threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates line comes from the run
- [ ] Public pages re-checked after a cache purge — n/a: no public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — n/a: `deploy.mjs` was edited but never run, by instruction; the first real use is the release manager's, and its exit codes are unchanged (see the decision file)
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy run
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; scripts only, nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Widened check lists 46 scripts not yet reviewed | deferred to backlog (planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The first real run of `apply-migrations`, `deploy` and `backup` after this merges: confirm each still ends with its usual exit code (the nine were never run here) | the release manager's next release and backup |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 waits for the next real run

Manual verification by: pending: the next real apply-migrations, deploy and backup run

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect is deferred, named above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
