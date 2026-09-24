# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Migration numbering check: `.githooks/pre-commit` and CI job `migration-numbers`, both running `scripts/check-migration-numbers.mjs` |
| Backlog item | `docs/backlog.md` → Architecture: "Enforce migration numbering with a check, not prose" |
| Branch / worktree | `claude/migration-numbering-check` @ `C:\Development\Animal_Shelter_migration-numbering-check` |
| Dev server | n/a: nothing served; `.port` is 3002 |
| PR | linked from the PR itself |
| Tested by / date | Claude (migration-numbering-check session), 2026-09-25 |
| Carries a migration? | no |
| Tested at SHA | `d92dc4e` (hook, script, gates); against `origin/main` `2f7f6b8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a commit or PR that adds a `supabase/migrations/` file not numbered one past the highest on `origin/main`, or that reuses a number, is refused, and the refusal says what to rename the file to
- [x] Files/areas touched listed: `scripts/check-migration-numbers.mjs` (new), `scripts/lib/migrations.mjs` (new, shared with `apply-migrations.mjs`), `scripts/apply-migrations.mjs` (imports it, no behaviour change), `.githooks/pre-commit` (new, mode 100755), `.github/workflows/ci.yml` (new job `migration-numbers`), `README.md`, `docs/backlog.md`, `docs/decisions.md`. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling only; no app role sees any of it
- [x] Out of scope written down: the `--drift` half shipped as #114 and is reused, not rebuilt. Editing an already-applied file is not checked (a different rule). A clean `worktree.mjs sync` merge makes no commit, so the hook does not see a clash main brings in, and the PR's CI does (decisions.md, 2026-09-25). Making `migration-numbers` a required check in branch protection is the user's call

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: a no-op at `2f7f6b8` before testing, then `2e0b0eb` (#116, `src/` only) as `388a547`, conflict-free, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed, at `388a547` (after the second sync; the same result at `d92dc4e` before it):

```
=== gates: build exited 0 after 213s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; this PR adds the check for that line
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

Every case below is an actual `git commit` through `.githooks/pre-commit`. In
the worktree the commits were made on a detached HEAD, so `post-commit` pushed
nothing. The missing-ref, stale-ref and crash cases ran in a throwaway clone
in the scratchpad, since deleting `origin/main` in a worktree would delete it
for every stream. After each hook verdict the same tree was committed
(`--no-verify` if refused) and run through CI mode (`--base origin/main`,
against HEAD). That covers "CI and the hook agree".

- [x] Happy path works end to end: a correctly numbered `0083_*.sql` commits; so do `0083` + `0084` together (a combined schema PR); so does the suggested `git mv` fix
- [ ] Data persists — reload the page and the change is still there — n/a: no data, no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no records; the file-level equivalents (add, modify, rename) are the cases below
- [x] Empty state renders sensibly (no rows yet): a commit touching no migration passes silently, and CI mode with nothing new prints `ok — no new migration files`
- [x] Invalid input is rejected with a readable message, not a crash: too low (duplicate), too high (gap), two sharing a number, and a misnamed `83_bad_name.sql` are all refused. Each message names the target file and gives the `git mv`
- [x] Boundary cases checked: highest+1 passes, highest (duplicate) and highest+3 (gap) fail, two at highest+1 fail on the second, and highest+1 and +2 pass. Modifying an existing migration, renaming a non-migration file, and a commit adding only a file `origin/main` already has (the sync-resolution shape) all pass. Fail-open: no `origin/main`, no recorded fetch, and node crashing at import all let the commit through with a note

Case run (`sh run-cases.sh`) at `d92dc4e`, output unedited:

```
### correct: 0083_numbering_test.sql
$ git commit -m test
migration numbers: ok — 0083_numbering_test.sql (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql)
commit exit=0 (4886 ms)
$ node scripts/check-migration-numbers.mjs --base origin/main   # CI mode, same tree
migration numbers: ok — 0083_numbering_test.sql (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql)
ci exit=0

### too low: 0082 duplicates main
$ git commit -m test
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0082_numbering_test.sql: 0082 is already taken on origin/main by 0082_anon_function_execute.sql.
    Rename it to 0083_numbering_test.sql:
      git mv supabase/migrations/0082_numbering_test.sql supabase/migrations/0083_numbering_test.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
commit exit=1 (2790 ms)
$ node scripts/check-migration-numbers.mjs --base origin/main   # CI mode, same tree
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0082_numbering_test.sql: 0082 is already taken on origin/main by 0082_anon_function_execute.sql.
    Rename it to 0083_numbering_test.sql:
      git mv supabase/migrations/0082_numbering_test.sql supabase/migrations/0083_numbering_test.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
ci exit=1

### too high: 0085 leaves a gap
$ git commit -m test
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0085_numbering_test.sql: it leaves a gap: the highest on origin/main is 0082_anon_function_execute.sql.
    Rename it to 0083_numbering_test.sql:
      git mv supabase/migrations/0085_numbering_test.sql supabase/migrations/0083_numbering_test.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
commit exit=1 (2491 ms)
$ node scripts/check-migration-numbers.mjs --base origin/main   # CI mode, same tree
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0085_numbering_test.sql: it leaves a gap: the highest on origin/main is 0082_anon_function_execute.sql.
    Rename it to 0083_numbering_test.sql:
      git mv supabase/migrations/0085_numbering_test.sql supabase/migrations/0083_numbering_test.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
ci exit=1

### two new files sharing 0083
$ git commit -m test
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0083_numbering_b.sql: 0083 is shared with 0083_numbering_a.sql, also new here.
    Rename it to 0084_numbering_b.sql:
      git mv supabase/migrations/0083_numbering_b.sql supabase/migrations/0084_numbering_b.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
commit exit=1 (2154 ms)
$ node scripts/check-migration-numbers.mjs --base origin/main   # CI mode, same tree
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0083_numbering_b.sql: 0083 is shared with 0083_numbering_a.sql, also new here.
    Rename it to 0084_numbering_b.sql:
      git mv supabase/migrations/0083_numbering_b.sql supabase/migrations/0084_numbering_b.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
ci exit=1

### two new files 0083 + 0084 (combined schema PR)
$ git commit -m test
migration numbers: ok — 0083_numbering_a.sql, 0084_numbering_b.sql (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql)
commit exit=0 (5842 ms)
$ node scripts/check-migration-numbers.mjs --base origin/main   # CI mode, same tree
migration numbers: ok — 0083_numbering_a.sql, 0084_numbering_b.sql (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql)
ci exit=0

### misnamed 83_bad_name.sql
$ git commit -m test
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 83_bad_name.sql is not named NNNN_<what>.sql, so apply-migrations.mjs would never apply it.
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
commit exit=1 (4147 ms)
$ node scripts/check-migration-numbers.mjs --base origin/main   # CI mode, same tree
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 83_bad_name.sql is not named NNNN_<what>.sql, so apply-migrations.mjs would never apply it.
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
ci exit=1

### no migrations touched (docs only)
$ git commit -m test
commit exit=0 (1809 ms)
### rename of a non-migration file
$ git commit -m test
commit exit=0 (1317 ms)
### modifying an existing migration (not this check's rule)
$ git commit -m test
commit exit=0 (2051 ms)
### the fix the message suggests: git mv 0082_ -> 0083_
$ git commit -m test
migration numbers: ok — 0083_numbering_test.sql (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql)
commit exit=0 (5067 ms)
### sync-resolution shape: commit adds only a file origin/main already has
$ git commit -m test
commit exit=0 (1644 ms)
## claude/migration-numbering-check...origin/claude/migration-numbering-check
```

Fast path: the hook alone with nothing added, compared with bare node startup.
Before the `git diff --quiet` pre-check, the hook took 0.5–1.7 s, all of it node:

```
### fast path: hook alone, nothing staged under supabase/migrations/ (5 runs)
pre-commit exit=0 (717 ms)
pre-commit exit=0 (438 ms)
pre-commit exit=0 (487 ms)
pre-commit exit=0 (374 ms)
pre-commit exit=0 (458 ms)
### baseline: bare node startup (3 runs)
node -e 0 (656 ms)
node -e 0 (919 ms)
node -e 0 (951 ms)
```

Fail-open cases, scratch clone, output unedited:

```
d92dc4e Pre-commit: block only on a real refusal, and skip node when nothing is added
### origin/main absent (scratch clone, ref deleted there only)
$ git -c core.hooksPath=.githooks commit -m test   # a 0082 that would otherwise be refused
migration numbers: not checked — origin/main does not exist here (git fetch origin main). Commit allowed; CI checks the PR.
commit exit=0
$ node scripts/check-migration-numbers.mjs   # CI / by hand: an error, not a pass
migration numbers: origin/main does not exist here (git fetch origin main)
exit=2

### origin/main present but no fetch recorded (FETCH_HEAD removed, reflog expired — scratch clone only)
migration numbers: warning, not blocking — origin/main has no recorded fetch, so it may not know what main holds now (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0082_numbering_test.sql: 0082 is already taken on origin/main by 0082_anon_function_execute.sql.
    Rename it to 0083_numbering_test.sql:
      git mv supabase/migrations/0082_numbering_test.sql supabase/migrations/0083_numbering_test.sql
  Run `git fetch origin main` and commit again to get a real verdict; CI will check the PR against a fresh main.
commit exit=0

### same clone after a fetch: the same file is now refused
migration numbers: a new migration must be numbered one past the highest on origin/main, with no number used twice (against origin/main 2f7f6b8, highest 0082_anon_function_execute.sql):
  - 0082_numbering_test.sql: 0082 is already taken on origin/main by 0082_anon_function_execute.sql.
    Rename it to 0083_numbering_test.sql:
      git mv supabase/migrations/0082_numbering_test.sql supabase/migrations/0083_numbering_test.sql
  Numbers belong to main, not to a branch (CLAUDE.md, "Database migrations"). If this file is already applied
  to dev under its old name, that row stays behind as drift — see apply-migrations.mjs --drift.
commit exit=1

### node crashes at import (scratch clone: lib replaced by a throw) — commit adding 0082
file:///C:/Users/Leidos/AppData/Local/Temp/claude/C--Development-Animal-Shelter-migration-numbering-check/dcabbe02-8a20-44a8-bcb6-47e2b5ef0bd9/scratchpad/clone/scripts/check-migration-numbers.mjs:40
import { MIGRATION_NAME, MIGRATIONS_DIR, numberOf, parseLsTree } from "./lib/migrations.mjs";
                         ^^^^^^^^^^^^^^
commit exit=0
```

`apply-migrations.mjs` after its file list moved to `scripts/lib/migrations.mjs` (read-only, dev):

```
$ node scripts/apply-migrations.mjs --drift test
Environment: test — project qxkmhwybjggxvsfxsxbd
Against origin/main 2f7f6b8: 82 file(s), 82 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 0
No drift: test matches origin/main.
exit=0
```

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a |
| management | n/a | n/a | n/a |
| staff | n/a | n/a | n/a |
| vet | n/a | n/a | n/a |
| volunteer | n/a | n/a | n/a |
| signed out | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: developer tooling; no app role reaches it
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not a shelter-user feature; developer docs are README and decisions.md
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: `apply-migrations.mjs --drift test` (the other consumer of the shared lib) reports as before, and this branch's own commits went through the new hook and were pushed by `post-commit` as usual
- [x] Any shared file touched checked from a second, unrelated place: the hook is shared by every worktree. Commits touching no migration (docs, rename) passed through it in the case run above, as did this branch's own commits to `docs/` and `scripts/`
- [x] Nothing merged from `main` during `sync` was broken by this branch: #116 came in conflict-free and the gates above ran on the merged tree; `check-migration-numbers.mjs` there prints `ok — no new migration files (against origin/main 2e0b0eb, highest 0082_anon_function_execute.sql)`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated (2026-09-25: fail-open, exit 3, fast path, what "new" means, boundary with `--drift`, the uncovered sync case)
- [x] `README.md` still accurate — "Enable the git hooks" now mentions `pre-commit`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a commit hook and a CI job; no shelter user touches git
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The exit-3 change came from the crash case failing on the first version, and the timing figures are from the runs pasted above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deployed; scripts and a git hook do not ship in the Worker
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no app change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates; the only clock is the 24-hour staleness window, which compares two epoch times and was exercised in its "no recorded fetch" branch
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: not a banding change; the numbering boundaries (highest, +1, +2, +3) are covered in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. Deleting `.githooks/pre-commit` alone disables the hook in every worktree at once. Nothing touches a database, so nothing else needs undoing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (would wedge every stream) | First version: node crashing at import exited 1, which the hook read as a refusal and so blocked the commit | fixed in `d92dc4e`: refusal is exit 3 under `--staged`; the hook blocks on 3 only |
| 2 | Low | Hook took 0.5–1.7 s on every commit, almost all node startup | fixed in `d92dc4e`: `git diff --quiet` pre-check in the hook |

## Left for manual verification

Empty: every case was driven by real commits and scripted runs above.

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (migration-numbering-check session)  Date: 2026-09-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing to look at — a commit hook and a CI job, exercised by the real commits above

### Result

- [x] Open defects are either fixed or explicitly accepted above: both fixed on this branch
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: not yet handed over
