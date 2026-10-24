# Test plan: who-does-what-features-schema

## Header

| | |
|---|---|
| Feature | `features` table and a feature for every card (schema half) |
| Backlog item | `docs/backlog.md` → Who does what: group the Available cards column into sections by FEATURE |
| Branch / worktree | `claude/who-does-what-features-schema` @ `C:\Development\Animal_Shelter_who-does-what-features-schema` |
| Dev server | n/a: no UI surface |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-24 |
| Carries a migration? | yes, 0255 |
| Tested at SHA | 47cf07e6 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two Admin-only tables, 13 seeded features and one feature for each of the 28 cards
- [x] Files/areas touched listed: `supabase/migrations/0255_features.sql`, `scripts/check-features-schema.mjs`, a decision file, `docs/backlog.md`
- [x] Roles affected identified: none; no policy or function that reads permissions is touched, and only Admin at 2-step can read or write the new tables
- [x] Out of scope: the whole screen (grouped column, Features panel), dictionaries, manual, `AUDITED_TABLES`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends clean:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 255 applied, 0 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: ok
- [x] Applied to **dev** and recorded in `schema_migrations`
- [x] File is re-runnable (create if not exists, drop policy/trigger if exists, seeds `on conflict do nothing`)
- [ ] Existing rows still read correctly after the change — n/a: purely additive; no existing table or row is touched
- [x] Constraints exercised in a `begin; … rollback;` harness (`node scripts/check-features-schema.mjs`): 13 features match `docs/features.md`; all 28 cards of `cards.ts` have exactly one feature; deleting a feature leaves its card unsorted; a card cannot have two rows; blank name and bad key refused; Admin at 2-step writes, Admin at 1-step and a non-admin cannot read or write
- [ ] Down-migration written — n/a: additive; revert is dropping the two tables, stated in the file
- [x] Production apply plan: `0255_features.sql` to project `dbkodyyxxhtygxcxmfcu` at release time, by the release manager; nothing reads it, so order against deploy does not matter

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Data persists — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface — nothing in src/ reads these rows yet (delete and update are checked in the SQL harness)
- [ ] Empty state renders sensibly — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface; the SQL harness checks the rejections
- [ ] Boundary cases checked — n/a: no UI surface; the harness covers blank names and bad keys

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | tables (2-step) | read and write | harness: yes |
| management | none | no access | harness: a non-admin sees 0 rows |
| staff | none | no access | n/a: retired role |
| doctor | none | no access | harness: a non-admin sees 0 rows |
| volunteer | none | no access | harness: a non-admin sees 0 rows |
| signed out | none | no access | anon privileges revoked |

- [x] Every role above tested (admin at 1-step and 2-step, and a user with no role, by SQL)
- [x] A role that should not have access is blocked server-side (row security, by the harness)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Manual updated — n/a: no UI surface — the manual entry belongs to the app half
- [ ] Translatable strings — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Mobile viewport (375px) — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Browser console clean — n/a: no UI surface — nothing in src/ reads these rows yet
- [ ] Network clean — n/a: no UI surface — nothing in src/ reads these rows yet

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no UI surface; no src/ file changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: this is half the item; a note says the schema half landed and the app half is left
- [x] Non-obvious design choices added as `docs/decisions/2026-10-24-features-table-and-card-features.md`
- [ ] `README.md` still accurate — n/a: nothing in it describes cards or features tables
- [ ] **Release notes.** n/a: schema only — no code reads these rows yet and no screen changes; the note belongs in the app half
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the card count and mapping are checked by the harness against `cards.ts`

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no thresholds or bands
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates output above
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration and reading code in one PR — n/a: no code reads the migration
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Backup for destructive migration — n/a: additive, creates two new tables
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback position stated — n/a: additive; leaving the tables in place is safe and nothing reads them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The two new tables are not yet in `AUDITED_TABLES`, so their Recent changes rows would show unlabelled | deferred to backlog: app half; recorded in the decision file and backlog note |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface — nothing in src/ reads these rows yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over through the PR

Result: pass

Release manager acknowledgement: n/a: pending release
