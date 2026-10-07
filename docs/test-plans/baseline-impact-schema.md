# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema half of "Impact figures as a baseline plus a live count": table `impact_baselines` and view `public_impact_figures` (0156) |
| Backlog item | `docs/backlog.md` → Impact figures as a baseline plus a live count (status note added; **not** ticked, the app half is batch 64) |
| Branch / worktree | `claude/baseline-impact-schema` @ `C:\Development\Animal_Shelter_baseline-impact-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not started: no UI) |
| PR | linked from the PR itself |
| Tested by / date | Claude (baseline-impact-schema session), 2026-10-07 |
| Carries a migration? | yes |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one table row per public figure (key, label, Thai label, baseline count, baseline date, who set it, when), a view that returns baseline + live count computed on read, writes only with `website.content` Edit, every change in `audit_log`
- [x] Files/areas touched listed: `supabase/migrations/0156_impact_baselines.sql`, `scripts/check-impact-baselines.mjs`, `docs/decisions/2026-10-07-impact-baselines.md`, `docs/backlog.md`, this plan. Nothing under `src/` or `worker/`
- [x] Roles affected identified: writes admin only on dev today (Management does not hold `website.content`); the public view is readable by signed-out visitors; nothing else changes
- [x] Out of scope written down: the Settings → Website editor, the "approximate" wording, both dictionaries, any live count for village sterilisations (nothing records them), giving Management the `website.content` cell

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 541s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0155), and no other in-flight branch carries one (`check-migration-numbers.mjs` ok)
- [x] `node scripts/apply-migrations.mjs --status` reviewed: 155 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0156_impact_baselines.sql … ok`; the only warning is the expected consumer-header one (the reader is not live yet)
- [x] Applied to **dev** and recorded in `schema_migrations`: `applying 0156_impact_baselines.sql … ok`, 2026-10-07, from this branch at merge time
- [x] File is re-runnable (`if not exists`, `or replace`, `drop … if exists`, `on conflict do nothing`)
- [x] Existing rows still read correctly — nothing existing is altered: a new table and a new view only; `placement_history` is read, not changed
- [x] Constraints and defaults exercised in a rolled-back harness, `node scripts/check-impact-baselines.mjs`, 39 checks, RESULT: GREEN. Asserted: count without date and date without count are rejected; negative count, malformed key and duplicate key are rejected; both seeded figures start unset and are absent from the view; live count counts only Adopt placements on days after the baseline date (one on the baseline day itself is not counted); total = baseline + live; a baseline-only key totals its baseline; a forged `set_by` is replaced by the session's login; an admin update writes an `audit_log` row with before and after images and the admin as actor; admin can write, management/staff/volunteer/vet cannot insert, update, delete or read the table; no role can delete; anon cannot read the table and can read the view; the view has no column beyond the figure
- [x] Down-migration: not needed — additive; `drop view public_impact_figures; drop table impact_baselines;` undoes it, as the file header says, and nothing reads it yet
- [ ] Production apply plan stated — n/a: deferred to the release that ships the app half; apply `0156` to production before deploying code that reads it (the migration is additive and harmless on its own)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet; the data path is covered by the harness in §3
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete — n/a: no UI surface; insert, update and the absence of delete were exercised in the §3 harness
- [ ] Empty state — n/a: no UI surface; the view returning no rows while both figures are unset was asserted in §3
- [ ] Invalid input rejected readably — n/a: no UI surface; the constraints reject it, asserted in §3
- [ ] Boundary cases — n/a: no UI surface; the baseline-day boundary and zero/negative were asserted in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | table read/insert/update; view | allowed; no delete | as expected (harness) |
| management | view only | table refused (no `website.content` on dev) | as expected (harness) |
| staff | view only | table refused | as expected (harness) |
| vet | view only | table refused | as expected (harness) |
| volunteer | view only | table refused | as expected (harness) |
| signed out | view only | table refused | as expected (harness) |

- [x] Every role above tested, in the harness under each role's own JWT
- [x] A role that should not have access is blocked server-side (RLS and grants, not a hidden control)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface, no code reads these columns yet
- [ ] Manual updated — n/a: no UI surface, no code reads these columns yet
- [ ] Translatable strings — n/a: no strings in the app; the Thai label column is seeded and the dictionaries are the app half
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — n/a in practice: nothing existing was altered, and `check-migration-grants.mjs` passes over all migration files
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates below

## 7. Documentation

- [x] Backlog item status updated in `docs/backlog.md` on this branch (left open: the app half is batch 64)
- [x] Design choices recorded in `docs/decisions/2026-10-07-impact-baselines.md`: "since" is strictly after the baseline date, unset is not public, no live source for village sterilisations, Management cannot write yet
- [ ] `README.md` still accurate — n/a: it does not describe individual tables
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing a shelter user can see yet, the table has no screen until batch 64
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the sterilisation finding is from reading 0031, 0034 and `src/lib/projects/queries.ts` (a photo-folder category, no count field); the Management finding is from the harness, which found only admin able to write on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; nothing visible changes until the app half
- [ ] Timezone-sensitive behaviour proved — n/a: the only date logic is `shelter_date()`, the same function `public_shelter_stats` uses; the baseline-day boundary was asserted in §3
- [ ] Boundary assertions cover both edges — n/a: the one boundary (baseline day excluded, next day included) is asserted both sides in §3
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering

- [ ] Migration and code in one PR? — n/a: schema only, no reader in this PR
- [ ] Production dry-run — deferred: release manager (`--env production --dry-run` before the apply)
- [ ] Production backup — n/a: additive, no rewrite
- [ ] Apply plan stated — deferred: release manager; apply 0156 to production before the deploy that carries the app half

### Rollback

- [x] Rollback position: purely additive schema is safe to leave; nothing reads it, so reverting the PR needs no migration undo. If it must go, `drop view public_impact_figures; drop table impact_baselines;` (audit_log rows for it stay by design)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Management holds no `website.content` cell on dev, so the "→ Management" item can only be edited by Admin until the Director grants it | deferred: Director's permission matrix; noted on the backlog item and in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here has a surface a person could look at: there is no screen, and the behaviour is asserted in the §3 harness.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (baseline-impact-schema session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; the behaviour is a table and a view, asserted in the §3 harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (as a comment)
- [ ] Handed to the production release manager — n/a: not yet — the release manager reads it from the PR before the deploy that carries this migration

Result: pass with accepted defects

Release manager acknowledgement: 
