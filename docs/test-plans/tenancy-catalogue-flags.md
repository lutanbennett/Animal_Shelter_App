# Feature test plan

## Header

| | |
|---|---|
| Feature | tenancy-catalogue-flags |
| Backlog item | `docs/backlog.md` → #tncy3 |
| Branch / worktree | `claude/tenancy-catalogue-flags` @ `C:\Development\Animal_Shelter_tenancy-catalogue-flags` |
| Dev server | n/a, no UI surface |
| PR | pending: number assigned at creation |
| Tested by / date | Claude, 2026-11-21 |
| Carries a migration? | yes |
| Tested at SHA | f55282020 |

## 1. Scope and risk

- [x] Change is described in one sentence: 0434 adds the missing `definer_all` policy and the missing owner line, and the lint allows `product_admin_permit_first_login` by name
- [x] Files touched: `supabase/migrations/0434_tenancy_catalogue_flags.sql`, `scripts/lib/tenancy-catalogue.mjs`, one decision file, this plan
- [x] Cards affected: none change behaviour; admin and signed-out public unaffected
- [x] Out of scope: any production or UAT run, the six existing allow-list entries, the deployed-hosts scripts

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branched from origin/main today; the merge happens before the PR
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 110s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 321s
=== gates: test — npm test
=== gates: test exited 0 after 117s
=== gates: build — npm run build
=== gates: build exited 0 after 372s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`check-migration-numbers.mjs` ok, 0434)
- [ ] `--status` reviewed — n/a: the apply output reported 435 applied, 1 pending, which is the same information
- [ ] `--dry-run` reviewed — n/a: a two-statement additive file, applied directly to dev
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`), `applying 0434_tenancy_catalogue_flags.sql … ok`
- [x] File is re-runnable (policy guarded by `not exists`, owner change is idempotent)
- [ ] Existing rows still read — n/a: no data or columns change
- [x] Behaviour exercised: lint on dev went from `2 flagged (1 functions, 1 tables missing definer_all)` to `0 flagged, 7 allowed by name, 0 stale`
- [ ] Down-migration — n/a: additive policy and an owner line; leaving both in place is safe
- [ ] Production apply plan — pending: planner applies 0434 to production with the release, then runs `node scripts/check-tenancy-catalogue.mjs --env production --strict --tenant-role rls_definer`

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | no page or card changes | n/a |

- [ ] Every login tested — n/a: no access rule changed
- [ ] Blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none added
- [ ] Manual — n/a: no user-visible change
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: only a policy for rls_definer and an owner change on a function with no auth.users read
- [ ] Shared file touched — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-21-tenancy-catalogue-flags.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a database ownership and policy fix and a lint entry, nothing a user or Admin would see appear or move
- [x] Commit messages say why, not just what
- [x] Claims were measured: the lint was run on dev before and after

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [x] Evidence pasted is the tool's own output, unedited
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Production Supabase ref line — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret or env var — n/a: none

### Migration ordering

- [ ] Migration and code that reads it together — n/a: no code reads 0434; it only fixes ownership and a policy
- [ ] Production `--dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: additive
- [x] Apply plan stated: 0434 to production `dbkodyyxxhtygxcxmfcu`, order does not matter, nothing reads it

### Rollback

- [ ] Rollback position — n/a: leaving the policy and owner in place is safe; neither reverts with a deploy

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [ ] The manual list is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: planner runs the production lint after merge

Result: pass

Release manager acknowledgement: pending: release manager
