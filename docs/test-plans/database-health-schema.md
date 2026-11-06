# Feature test plan — database-health-schema

## Header

| | |
|---|---|
| Feature | Schema half of the health endpoint: `database_health()` returns database size and open connections |
| Backlog item | `#mzu7v` (left open; endpoint and Home Assistant side follow) |
| Branch / worktree | `claude/brave-liskov-2d2561` |
| Dev server | not started — no UI surface in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | yes — `0324_database_health.sql` |
| Tested at SHA | pending |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — database size and connection count for the health endpoint
- [x] Files/areas touched listed — `supabase/migrations/0324_database_health.sql`, a decision file, this plan
- [x] Roles affected identified — none; executable by `service_role` only
- [x] Anything explicitly **out of scope** written down — the endpoint, token and check script are the next PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged cleanly
- [ ] `node scripts/gates.mjs` — pending
- [ ] CI green on the PR — pending

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0323), no other schema PR open
- [x] `--status` reviewed: 325 applied, 1 pending (this one)
- [x] `--dry-run` reviewed: `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`): `applying 0324_database_health.sql … ok`
- [x] File is re-runnable (`create or replace`, revoke/grant)
- [x] Existing rows still read correctly — n/a in effect: adds one function, touches no table
- [x] Constraints/defaults exercised — called over the API: service role gets `{"size_bytes":44002451,"connections":7}`; anon gets `42501 permission denied for function database_health`
- [x] Down-migration not needed: additive; `drop function database_health()` if ever wanted
- [x] Production apply plan: apply 0324 with the next release, before the endpoint PR deploys (the endpoint tolerates it missing)

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, nothing reads the function yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: read-only function
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: takes no input
- [ ] Boundary cases — n/a: takes no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| service_role | `database_health()` | allowed | pass (measured above) |
| anon | `database_health()` | refused | pass (measured above) |
| authenticated | `database_health()` | refused | n/a: same revoke as anon; not separately called |

- [ ] Every role tested — n/a: no card or page involved
- [ ] A role that should not have access is blocked server-side — done for anon above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages still work — n/a: nothing reads the function
- [ ] Shared file touched checked — n/a: no shared file touched
- [x] Nothing merged from `main` broken — pending the sync; migration is independent

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; endpoint PR follows
- [x] Decision recorded — `2026-11-06-database-health-function.md`
- [x] `README.md` still accurate — it does not list functions
- [ ] **Release notes.** — n/a: staff will not notice; no screen changes
- [x] Commit messages say why
- [x] Claims were measured, not reasoned (RPC calls above)

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: not touched
- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none in this PR
- [x] Contains migration and code reading it? — no; `-- consumer: src/lib/status/health.ts` lands in the next PR
- [ ] Production `--dry-run` — deferred: release manager
- [ ] Production backup — n/a: additive only
- [x] Apply plan stated above
- [x] Rollback: code rollback leaves the function; nothing depends on it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

- [x] Manual list is empty

Manual verification by: n/a: no UI surface

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — n/a: the PR links it
- [ ] Handed to the production release manager — n/a: via the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
