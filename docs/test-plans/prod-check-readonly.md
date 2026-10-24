# Feature test plan — prod-check-readonly

## Header

| | |
|---|---|
| Feature | A read-only production check script: `scripts/check-production.mjs`, five named checks, read-only by construction |
| Backlog item | `docs/backlog.md` → **Build a READ-ONLY production check script** (ticked) |
| Branch / worktree | `claude/prod-check-readonly` @ `C:\Development\Animal_Shelter_prod-check-readonly` |
| Dev server | not started — no UI surface |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `c17ad385` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one allow-listed script that reads named facts from production in a read-only transaction
- [x] Files/areas touched listed — `scripts/check-production.mjs`, `scripts/lib/readonly-checks.mjs`, `scripts/check-production.test.mjs`, `docs/backlog.md`, one decision file, this plan
- [x] Roles affected identified — none; developer tooling only
- [x] Anything explicitly **out of scope** written down — no guard loosened, nothing in CI, no migration, no `src/`; more checks are added one entry at a time

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — all five checks run on dev and on production and print plain-English lines
- [x] Data persists — n/a: nothing is written; that is the point
- [ ] Create / edit / delete all exercised — n/a: read-only by design
- [x] Empty state renders sensibly — production `diets-proportion` prints "Every line is in proportion."
- [x] Invalid input is rejected with a readable message — unknown check name prints "No check called …"; unit test refuses `constructor` and raw SQL as a name
- [x] Boundary cases checked — a write attempted in the same read-only wrapper on dev returned "cannot execute UPDATE in a read-only transaction"; lint tests refuse `;`, delete, insert/update in a CTE, `nextval`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any app role | n/a | script is run from a developer machine with the Supabase access token | n/a: no app surface |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface; the token is a local gitignored file

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: developer tool, no shelter user sees it
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the 130 dev-only guarded scripts are untouched (no existing file edited)
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken — nothing merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — ticked, with the five checks named
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-production-check-script.md`
- [x] `README.md` still accurate — it does not describe check scripts
- [ ] **Release notes.** — n/a: a read-only developer check script; no shelter user sees it and nothing in the app changes
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the read-only refusal and production answers are real output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of main at deploy time — n/a: not deployed; scripts only
- [ ] Deployed SHA matches — n/a: not deployed

### On the deployed build

- [ ] Deployed to test — n/a: scripts only, nothing deploys
- [ ] Smoke-tested on test — n/a: scripts only
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates derived
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence pasted is the tool's actual output** — n/a: no evidence pasted in this plan
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — n/a: not deployed
- [ ] `strip-baked-env` seen — n/a: not deployed
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; nothing in the app or database depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First run failed to parse results (json_agg newlines, trailing CONTEXT line) | fixed — result cast to jsonb text |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: a developer script with no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: scripts only

Result: pass

Release manager acknowledgement: n/a: not yet released
