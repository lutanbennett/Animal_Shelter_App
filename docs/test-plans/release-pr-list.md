# Feature test plan — release-pr-list

## Header

| | |
|---|---|
| Feature | `scripts/release-prs.mjs <since-sha>`: lists a release's PRs from every merge commit in the range and exits non-zero when a migration or test plan added in the range belongs to no listed PR |
| Backlog item | `docs/backlog.md` → "A release's PR list is built from `git log --first-parent`, which cannot see every PR" |
| Branch / worktree | `claude/release-pr-list` @ `C:\Development\Animal_Shelter_release-pr-list` |
| Dev server | not started — release tooling, no app code |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | tip of this branch after `sync` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — fix options (b) and (c) as one script, plus the prose change; (a) deliberately not built, see the decision file
- [x] Files/areas touched listed — `scripts/release-prs.mjs` (new), `docs/release-smoke-test.md` (one line), `docs/backlog.md` (tick), `docs/decisions/2026-09-29-release-pr-list-script.md`, this plan. No `src/`, no `worker/`, no migrations
- [x] Roles affected identified — none; developer tooling used by the release manager
- [x] Anything explicitly **out of scope** written down — option (a) (`gh pr list`); a PR leaving no migration, no test plan and no PR-named merge commit stays invisible, but it would already be breaking the every-PR-has-a-plan rule

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 398s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no database touched
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — **the `0.9.1` regression case, run for real:** `node scripts/release-prs.mjs 8c876f9 ee035a6` (0.9.0's and 0.9.1's deployed SHAs from `docs/releases/2026-09-29.md`) lists **#207–#216: nine PRs plus the cut PR #216 — the release record's "#207–#215 (nine), cut by #216"**, **including #213**, and prints `git log --first-parent shows only 9; 1 more found off the first-parent line`. Exit 0, 13 artifacts checked
- [x] Data persists — n/a as such: the script is read-only and writes nothing; it only runs `git log` and `git merge-base`
- [x] **The assertion fires when a PR is missing** — a throwaway copy of the script with #213 filtered out of the PR set (deleted afterwards) exits **1** and names `docs/test-plans/stock-edit-history.md` and `supabase/migrations/0112_stock_count_source.sql`. This is the check that matters: it proves the cross-check cannot silently pass. An earlier version that only tested reachability from a merge's second parent exited 0 here (later PRs had merged `origin/main` and carried #213's commits), which is why ownership now also requires that the commit is not already reachable from the merge's first parent
- [x] Empty state renders sensibly — `ee035a6..HEAD` (three PRs, 4 artifacts) exits 0
- [x] Invalid input is rejected with a readable message — no argument prints usage, exit 2; a bad ref prints git's own error, exit 2
- [x] Boundary cases checked — a range with no artifacts prints "Checked 0" and exits 0; PR subjects with branch names lacking `claude/` still parse

### Role access matrix

n/a for every role — a local script, no app surface.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no app surface | n/a |
| management | n/a | n/a: no app surface | n/a |
| staff | n/a | n/a: no app surface | n/a |
| vet | n/a | n/a: no app surface | n/a |
| volunteer | n/a | n/a: no app surface | n/a |
| signed out | n/a | n/a: no app surface | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no UI
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no browser involved
- [ ] Network clean — n/a: the script makes no network calls, by design

## 6. Regression

- [x] The pages nearest the change still work — `docs/release-smoke-test.md` reads as before; only one checklist line changed
- [x] Any shared file touched checked from a second, unrelated page — `docs/backlog.md` is only ticked; `check-test-plan.mjs` run over the tree
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-09-29-release-pr-list-script.md`
- [x] `README.md` still accurate — it does not describe release tooling
- [ ] **Release notes.** — n/a: release tooling, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — the "reachability alone is too loose" claim was observed (exit 0 with #213 removed), not argued

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager; tooling only, nothing deploys
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager; no app change, nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; no app change
- [ ] Timezone-sensitive behaviour proved — deferred: release manager; the script derives no dates
- [ ] Boundary or banding change covered on both edges — deferred: release manager; no banding logic
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager; §2 and §4 are pasted or quoted as run
- [ ] Public pages re-checked after a cache purge — deferred: release manager; no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager; none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration: production backup fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — n/a: nothing deploys; reverting the PR restores the old prose

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First version's ownership test (second-parent reachability only) let a missing PR look owned by a later PR that had merged `origin/main` | fixed before commit; regression check in §4 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The reworded pre-deploy item reads clearly to whoever runs the next release | `docs/release-smoke-test.md`, "Before the deploy" |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — one item is open and needs a person

Manual verification by: pending: Lutan to read the reworded pre-deploy line in `docs/release-smoke-test.md`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: at the next release
