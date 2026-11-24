# Feature test plan: tenancy-catalogue-seven

## Header

| | |
|---|---|
| Feature | Seven product-console definer functions: re-owned or listed (#tnycl) |
| Backlog item | `docs/backlog.md` → #tnycl |
| Branch / worktree | `claude/tenancy-catalogue-seven` @ `C:\Development\Animal_Shelter_tenancy-catalogue-seven` |
| Dev server | not started: no UI surface changed |
| PR | pending: opened after this plan |
| Tested by / date | Claude, 2026-11-25 |
| Carries a migration? | yes (`0440_product_admin_reown_site.sql`) |
| Tested at SHA | dedf34be9 |

## 1. Scope and risk

- [x] Change is described in one sentence: re-own `product_admin_set_shelter_site` to `rls_definer`, and list the six others in `ALLOWED` with a measured reason.
- [x] Files touched: `supabase/migrations/0440_product_admin_reown_site.sql`, `scripts/lib/tenancy-catalogue.mjs`, decision file, backlog tick, this plan.
- [x] Cards affected: none change behaviour; the console's website switch is product-administrator + aal2 (outside the card system), Admin and signed-out public unaffected.
- [x] Out of scope: the four readers that need a shelter header (a body change), the lint's exit behaviour, `my_shelters()`, production.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 80s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 213s
=== gates: test — npm test
=== gates: test exited 0 after 55s
=== gates: build — npm run build
=== gates: build exited 0 after 231s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is above the highest on `main` (0438); `0439` is `my-shelters-blank`'s, so this is `0440`
- [x] `--status` reviewed before applying
- [ ] `--dry-run` reviewed — n/a: ownership change only, applied for real on dev and exercised
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (guarded `alter … owner`, idempotent revoke/grant)
- [x] Existing rows still read correctly: `set_shelter_site` ran under `rls_definer` against a real dev shelter
- [x] Exercised in a rolled-back transaction as an aal2 product administrator: all seven functions answered; the four that would break under `rls_definer` were shown to (0 rows vs 1; set_role refused) and are therefore not moved
- [x] Down-migration: `alter function public.product_admin_set_shelter_site(uuid, text) owner to postgres;` (in the file header)
- [ ] Production apply plan — n/a: nothing here applies to production; the release's migration pass takes it with the rest

## 4. Functional checks

- [x] Happy path: `set_shelter_site` writes the value through `rls_definer`
- [ ] Data persists — n/a: the exercise rolled back on purpose; same-value write
- [ ] Create / edit / delete — n/a: no UI
- [ ] Empty state — n/a: no UI
- [x] Invalid input rejected: bodies untouched (not re-tested)
- [ ] Boundary cases — n/a: no logic changed

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| product administrator, aal2 | all seven functions | answer | answered (see decision file) |

- [ ] Every login above tested — n/a: only the product administrator can call these; gates are inside the bodies and unchanged
- [ ] A login that should not have access is blocked server-side — n/a: grants and gates unchanged

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest objects checked: `check-tenancy-catalogue.mjs --tenant-role rls_definer` reports 0 flagged, 9 allowed, 0 stale
- [ ] Shared file touched — n/a: none of `NavLinks.tsx`, `manual/en.ts` changed
- [x] Nothing merged from `main` during `sync` (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-25-tenancy-catalogue-seven.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: nobody using the app, Admin or product administrator, would notice an ownership change
- [x] Commit messages say why
- [x] Claims were measured, not reasoned: the 0-vs-1 row result and the set_role refusal were run on dev; a first claim about `would_lock_out` was not reproducible and was removed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's output — n/a: gates block above is verbatim
- [ ] Public pages re-checked — n/a: no public surface

### Deploy safety

- [ ] `deploy: production →` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: no code reads it
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Destructive migration backup — n/a: ownership change only
- [ ] Apply plan stated — deferred: release manager (file `0440`, production project, any order)

### Rollback

- [ ] Rollback position — n/a: one `alter function … owner to postgres`; no Worker change

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | `regress-tenancy-reown.mjs --harness` reported 0 differences for a version that was broken (it snapshots zero-argument functions only) | accepted; noted in PR for the planner |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is open
- [ ] Handed to the production release manager — pending: at release

Result: pass
