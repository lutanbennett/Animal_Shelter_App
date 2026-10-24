# Test plan: website-page-visibility-schema

## Header

| | |
|---|---|
| Feature | Record of hidden public pages (schema half) |
| Backlog item | `docs/backlog.md` → Show or hide public website pages (part 1 of 6) |
| Branch / worktree | `claude/website-page-visibility-schema` @ `C:\Development\Animal_Shelter_website-page-visibility-schema` |
| Dev server | n/a: no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | yes (0256) |
| Tested at SHA | 6f599d95 |

## 1. Scope and risk

- [x] One sentence: adds site_content.hidden_public_pages (default empty) with audit and a public-view column; matches part (1) of the item
- [x] Touched: supabase/migrations/0256, scripts/check-hidden-public-pages-schema.mjs, a decision file, the backlog note, this plan
- [x] Roles: website editors write; signed-out reads via public_site_content; nobody else
- [x] Out of scope: parts (2) to (6) (page list, header/footer/sitemap, Not found, Admin screen, cache note, Desexing refusal) and AUDITED_TABLES

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with origin/main
- [x] `node scripts/gates.mjs` closing line:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Number 0256 is one above 0255 on main; no other branch carries a migration
- [x] `--status` reviewed: 256 applied, 0 pending before
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev and recorded
- [x] Re-runnable (if not exists, drop if exists, or replace)
- [x] Existing rows read correctly: check-public-views.mjs still passes after the view change
- [x] Harness check-hidden-public-pages-schema.mjs asserts: default empty; Management writes; Volunteer cannot; audit row with editor as actor; home/privacy/r/e/typo/unprefixed refused; anon reads via view, denied on table
- [x] Down-migration not needed: additive column, trigger and view column; leaving them is harmless
- [x] Production apply plan: 0256 applies at release time via the release manager; no code reads it, so order does not matter

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Data persists — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Create / edit / delete — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Empty state — n/a: no UI surface — the empty default is proved in SQL
- [ ] Invalid input — n/a: no UI surface — the database refusals are proved in SQL
- [ ] Boundary cases — n/a: no UI surface — the key vocabulary edges are proved in SQL

| Role | Can reach | Expected | Result |
|---|---|---|---|
| management | write column | allowed | pass (SQL) |
| volunteer | write column | 0 rows | pass (SQL) |
| signed out | view yes, table no | as stated | pass (SQL) |

- [x] Every role that matters tested in SQL (admin was not separately driven; admin holds website.content as Management does)
- [x] Role that should not write is blocked server-side (RLS, 0 rows)

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Manual — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Translatable strings — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Mobile viewport — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Browser console — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Network — n/a: no UI surface — nothing in src/ reads these rows yet

## 6. Regression

- [x] Nearest: public_site_content consumers, checked with check-public-views.mjs
- [ ] Shared file touched from a second page — n/a: no src/ file touched
- [x] Nothing merged from main broke this branch (sync was a no-op)

## 7. Documentation

- [ ] Backlog item ticked — n/a: one of six parts; a note records part (1) done instead, by brief
- [x] Decision file docs/decisions/2026-10-24-hidden-public-pages-record.md
- [x] README.md still accurate (nothing it describes changed)
- [ ] **Release notes.** n/a: schema only — no code reads these rows yet, the default hides nothing, and the note belongs in the app half
- [x] Commit messages say why
- [x] Claims were measured: every behaviour above is a harness result, not reasoning

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — n/a: nothing user-visible
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no thresholds
- [x] Evidence pasted is the tool's actual output (gates line above)
- [ ] Public pages re-checked after cache purge — n/a: nothing reads the column yet

### Deploy safety

- [ ] Deploy project ref line — deferred: release manager
- [ ] strip-baked-env line — deferred: release manager
- [ ] New secrets — n/a: none added

### Migration ordering

- [ ] Migration and reading code together? — n/a: no code reads it, so apply order is free
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive — n/a: additive only
- [ ] Apply plan — deferred: release manager (file 0256, production, at release time)

### Rollback

- [x] Rollback: nothing to roll back; additive schema is safe to leave; does not revert migrations

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing: no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [x] The manual list is empty; filled by Claude, nothing to look at

Manual verification by: n/a: no UI surface — nothing in src/ reads these rows yet

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links the file instead
- [ ] Handed to the release manager — n/a: handed over at release time, after merge

Result: pass

Release manager acknowledgement: pending
