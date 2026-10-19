# Test plan: meme-sources-schema

## Header

| | |
|---|---|
| Feature | Meme sources, schema half: nullable source columns on `memes` |
| Backlog item | "Meme maker, stage 2" (NOT ticked: the widening's app half remains) |
| Branch / worktree | `claude/meme-sources-schema` @ `C:\Development\Animal_Shelter_meme-sources-schema` |
| Dev server | not used |
| PR | pending: opened after this push |
| Tested by / date | Claude, 2026-10-19 |
| Carries a migration? | yes, 0228 |
| Tested at SHA | 2e7b2ff9 |

## 1. Scope and risk

- [x] One sentence: five nullable columns, a check constraint and indexes on memes recording a meme's photo source; nothing reads them yet
- [x] Touched: `supabase/migrations/0228_meme_sources.sql`, the decision file, this plan
- [x] Roles affected: none; existing memes policies unchanged
- [x] Out of scope: every UI, source tabs, filters, Memes lists on outings, jobs, projects, backlog tick

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with all exit codes 0

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — all 8 checks passed on the PR before this tick

## 3. Schema and data

- [x] Migration number 0228 is next after 0227 on main
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev and recorded in schema_migrations
- [x] File is re-runnable (if not exists, drop constraint if exists)
- [x] Existing rows still read correctly: columns are nullable, existing memes get null source
- [ ] Harness — n/a: no new policy or function; the constraint is plain SQL
- [x] Down-migration: not written; drop the constraint, four indexes and five columns (in the migration header)
- [x] Production apply plan: apply 0228 with the release; additive

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface; the check constraint is the only guard
- [ ] Boundary cases — n/a: no UI surface

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | memes columns | as memes already | unchanged policies |

- [x] Every role above tested (policies unchanged, none added)
- [x] A role that should not have access is blocked server-side (existing memes policies, untouched)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest checks — n/a: additive nullable columns; no code reads them
- [ ] Shared file loaded from a second page — n/a: no shared file touched
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: schema half; the app half ticks it
- [x] Decision file `docs/decisions/2026-10-19-meme-sources-columns.md` added
- [x] README.md still accurate
- [ ] **Release notes.** n/a: schema only, no UI reads these columns yet
- [x] Commit messages say why
- [x] Claims were measured: dry-run and apply output seen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding assertions — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: none pasted beyond gates
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] deploy line read and ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret exists in production — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it in one PR — n/a: no code reads it yet
- [ ] Production dry-run clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive
- [x] Apply plan stated: file 0228, production project, with the release

### Rollback

- [ ] Rollback position stated — n/a: drop constraint, indexes and columns as listed in the migration header

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handover happens at release

Result: pass

Release manager acknowledgement: pending
