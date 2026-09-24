# Feature test plan

## Header

| | |
|---|---|
| Feature | production-drift-visible |
| Backlog item | `docs/backlog.md` → Architecture: "Make production drift visible: nothing records what production has actually run." |
| Branch / worktree | `claude/production-drift-visible` @ `C:\Development\Animal_Shelter_production-drift-visible` |
| Dev server | n/a: script only, no dev server involved |
| PR | #114 |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | no |
| Tested at SHA | `279da03` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `apply-migrations.mjs` gains `--drift <env>` (the database's `schema_migrations` against the files on `origin/main`, both halves, exit 1 on either), `--status` prints the same two lists, and uat/production refuse to apply, dry-run or baseline from a checkout whose migrations differ from `origin/main`
- [x] Files/areas touched listed: `scripts/apply-migrations.mjs`, `README.md` (deploy step 5), `docs/decisions.md`, `docs/backlog.md`
- [x] Roles affected identified: none. A developer tool; no app role reaches it
- [x] Anything explicitly **out of scope** written down: the migration numbering check (sibling backlog item `migration-numbering-check`, boundary in `docs/decisions.md`); detecting a file edited after it was applied (rows hold no checksum); deleting dev's two leftover rows

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date at `bdc94be`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 257s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #114, `Check` and `test-plan` both passed on the `50051d4` push (run 36042684874)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR (`--status` itself is exercised in §4)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the rows temporarily set aside in §4 were restored with their original `applied_at` (count back to 83)
- [ ] **Constraints and defaults exercised against real rows** — n/a: no constraints or defaults added
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

All runs below against dev (`qxkmhwybjggxvsfxsxbd`), output unedited.

- [x] Happy path works end to end. Dev as it stands — the two leftover rows from the `0067`/`0069` renumberings are still there, and are named:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
Against origin/main bdc94be: 81 file(s), 83 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 2
    0067_public_resident_cards.sql
    0069_assistant_actions.sql
Drift: test and origin/main disagree.
exit=1
```

- [x] No drift reported when there is none (the two leftover rows deleted, then restored afterwards):

```
Environment: test — project qxkmhwybjggxvsfxsxbd
Against origin/main bdc94be: 81 file(s), 81 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 0
No drift: test matches origin/main.
exit=0
```

- [x] A file on `origin/main` not applied (the `0081` row deleted, then restored), via `--drift` and `--status`:

```
### --drift test (0081 row set aside)
Environment: test — project qxkmhwybjggxvsfxsxbd
Against origin/main bdc94be: 81 file(s), 80 applied row(s).
  On origin/main, not applied here: 1
    0081_anon_view_grants.sql
  Applied here, no file on origin/main: 0
Drift: test and origin/main disagree.
exit=1
### --status (0081 row set aside)
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 80 applied, 1 pending.
  pending: 0081_anon_view_grants.sql
Against origin/main bdc94be: 81 file(s), 80 applied row(s).
  On origin/main, not applied here: 1
    0081_anon_view_grants.sql
  Applied here, no file on origin/main: 0
exit=0
```

- [x] Refusal, without production credentials. Run by Lutan in this worktree's terminal because the auto-mode classifier refused to let Claude run any `--env production` command; output read by Claude from that terminal. Checkout matching `origin/main` passes the guard and stops only at the missing env file:

```
.env.deploy.production is missing or empty — see README, "Environments".
```

  With an unmerged `0082_probe.sql` in the checkout (created, run, removed):

```
apply-migrations: production dry-runs migrations only from a checkout whose supabase/migrations/ matches origin/main (bdc94be):
  - 0082_probe.sql is not on origin/main
Schema reaches main before any database. Merge the migration's PR, then run this from the main checkout.
Nothing was read from or sent to any database.
```

- [ ] Data persists — n/a: the reports write nothing; the dev rows moved for testing were restored and recounted (83)
- [ ] Create / edit / delete all exercised — n/a: no records managed by this change
- [ ] Empty state renders sensibly — n/a: no UI; a database without `schema_migrations` is reported rather than created, but no such database was available to run it against
- [x] Invalid input is rejected with a readable message: the refusal above; `--drift` given an environment twice is rejected by an explicit check in the code
- [ ] Boundary cases checked — n/a: no numeric or date boundary; the edited-file and missing-file refusal cases were not run, only the extra-file case above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: developer script | — | — |
| management | n/a: developer script | — | — |
| staff | n/a: developer script | — | — |
| vet | n/a: developer script | — | — |
| volunteer | n/a: developer script | — | — |
| signed out | n/a: developer script | — | — |

- [ ] Every role above tested — n/a: no app surface; the script runs on a developer machine
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not in the shelter manual
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: plain `--status` against dev still lists the checkout's pending files first (`This checkout: 83 applied, 0 pending.`), then the new `origin/main` lists
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing new merged; gates green)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-25
- [x] `README.md` still accurate: deploy step 5 now starts with `--drift production` and describes the refusal
- [ ] **Release notes.** — n/a: a migration tool no shelter user touches
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Drift output and the refusal are pasted above. The CRLF claim (`hash-object` compares equal on a CRLF checkout) is measured by the first refusal run passing the guard in this `core.autocrlf=true` worktree

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing deploys: a local script)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change covers both edges** — n/a: no threshold; both drift halves and the clean case are covered in §4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (this worktree has no production credentials; see Left for manual verification)
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the commit; the script changes no schema and writes no rows in its report modes, so there is nothing in any database to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Dev keeps two `schema_migrations` rows with no file (`0067_public_resident_cards.sql`, `0069_assistant_actions.sql`), so `--drift test` exits 1 every run | accepted: reported on purpose, not allow-listed; deleting them is Lutan's call |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | `node scripts/apply-migrations.mjs --drift production` names what production has not run and any rows with no file. This worktree structurally cannot run it (no `.env.deploy.production`) | main checkout, after merge |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 needs the main checkout after merge

Manual verification by: pending: `--drift production` from the main checkout

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (#114 description)
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass with accepted defects
