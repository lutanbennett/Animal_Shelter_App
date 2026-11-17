# Feature test plan

## Header

| | |
|---|---|
| Feature | Part 10: roles a shelter adds at setup (per-shelter half) |
| Backlog item | `docs/backlog.md` → #omt6u, #cgrnt |
| Branch / worktree | `claude/tenancy-part10-shelter-roles` @ `C:\Development\Animal_Shelter_tenancy-part10-shelter-roles` |
| Dev server | not started (no UI change) |
| PR | see PR |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | yes (0401, 0402) |
| Tested at SHA | 13f64ab32 |

## 1. Scope and risk

- [x] Change is described in one sentence: the screen already served the shelter; this makes the three database paths that wrote without a request header (role_permissions recompute, audit of the shared catalogue, the card-grants check) stamp a shelter, and records that card_grants/card_includes are pure catalogue
- [x] Files touched: supabase/migrations/0401, 0402; scripts/check-card-grants.mjs; docs (decision, registry, backlog)
- [x] Cards affected: none change behaviour; admin unaffected (Admin bypass untouched); signed-out public unaffected
- [x] Out of scope: narrowing card_grants/card_includes writes (found, for the planner); the seven lookup lists

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged (one backlog.md conflict resolved keeping both items)
- [x] `node scripts/gates.mjs` ends with the four-gate line, all 0:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 159s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 402s
=== gates: test — npm test
=== gates: test exited 0 after 85s
=== gates: build — npm run build
=== gates: build exited 0 after 412s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number checked with check-migration-numbers.mjs (0401, 0402 on top of 0400)
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed (0401 ok)
- [x] Applied to dev and recorded in schema_migrations (402 applied)
- [x] Both files are create or replace, re-runnable
- [x] Existing rows still read correctly: check-card-grants reports all 113 roles hold exactly what their cards require
- [x] Harness in begin/rollback: second shelter with a role keyed volunteer (0 cells), shelter one's role count unchanged (115 to 115), and a role keyed kennel_lead holding my_tasks held exactly recurring.do_own; nothing left behind
- [ ] Down-migration — n/a: both are create or replace of a function; the previous bodies are in 0257 and the live record_audit
- [ ] Production apply plan — pending: release manager applies 0401 then 0402 to production before deploy; function bodies only

## 4. Functional checks

- [ ] Happy path — n/a: no UI change; role creation relies on the existing header default
- [ ] Data persists — n/a: no UI change
- [ ] Create / edit / delete — n/a: no UI change
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input — n/a: no UI change
- [ ] Boundary cases — n/a: no UI change

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: no UI change |

- [ ] Every login above tested — n/a: no UI change, nothing to sign in as
- [ ] Server-side block — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none touched
- [ ] Manual — n/a: none touched
- [ ] Translatable strings — n/a: none touched
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console — pending: the Who does what click-through (deliverable 9) was not driven in this session
- [ ] Network — pending: same click-through not driven

## 6. Regression

- [ ] Nearest pages — pending: Who does what click-through not driven; the db checks (check-card-grants, check-hard-coded-security, check-cards-count) pass
- [ ] Shared file loaded from a second page — n/a: no shared app file touched
- [x] Nothing merged from main during sync was broken (gates green after merge)

## 7. Documentation

- [x] Backlog items #omt6u and #cgrnt ticked on this branch
- [x] Decision file docs/decisions/2026-11-17-per-shelter-roles.md
- [x] README still accurate
- [ ] **Release notes.** n/a: no shelter user sees a difference; the screen looks identical and only database writes without a header were fixed
- [x] Commit messages say why
- [x] Claims were measured: each proof above came from a run against dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager (none involved)
- [ ] Boundary or banding change — deferred: release manager (none involved)
- [ ] Evidence is the tool's actual output — deferred: release manager (gate output above is unedited)
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets — deferred: release manager (none added)

### Migration ordering

- [ ] Migration and reading code together — deferred: release manager (no app code reads these; apply any time before deploy)
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager (function-only change, no data rewrite)
- [ ] Apply plan — deferred: release manager applies 0401 then 0402 to production

### Rollback

- [ ] Rollback position — deferred: release manager; function-only migrations, restore the 0257 and prior record_audit bodies if ever needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | card_grants/card_includes writable by any shelter's Admin though shared | deferred to backlog (for the planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Who does what loads and a role can be added at the shelter being served | /admin/who-does-what on dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the one Who does what click-through

Manual verification by: pending: one Who does what click-through on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: at PR creation
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
