# Feature test plan — role-can-app

## Header

| | |
|---|---|
| Feature | Recurring-job eligibility asks the database: `canDoJob` takes an answer built from `role_can()` (0133) instead of a role string; the rota form's picker, the save check, the stranded warning and My tasks read it; `STOCK_COUNT_ROLES` / `STOCK_DELIVERY_ROLES` are gone and the stock rules come from the route registry |
| Backlog item | `docs/backlog.md` → "Recurring-job eligibility asks about another person's role" (ticked: this is its second and last unit) |
| Branch / worktree | `claude/role-can-app` @ `C:\Development\Animal_Shelter_role-can-app` |
| Dev server | `next dev` on `http://localhost:3010` — not started; the pages were not driven (Left for manual verification 1) |
| PR | pending |
| Tested by / date | Claude / 2026-10-04 (gates, scripts and one live RPC call; the screens were not driven) |
| Carries a migration? | no |
| Tested at SHA | `5e13b536` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — the four deliverables: an RPC wrapper, `canDoJob` taking its answer, the picker fed from it, the two role lists gone
- [x] Files/areas touched listed — `src/lib/recurring-jobs/eligibility.ts`, new `eligibility-load.ts`; `src/app/management/recurring-jobs/` (page, actions, form, view); `src/lib/my-tasks/recurring.ts`; `scripts/check-permission-catalogue.mjs`, `check-recurring-job-eligibility.mjs`, `check-permission-parity.mjs`, `fixtures/legacy-predicates.json`; docs. No migration, no `worker/`
- [x] Roles affected identified — admin and management build rotas; every assignable role (admin, management, staff, volunteer) reads My tasks. Vet is never assignable, unchanged
- [x] Anything explicitly **out of scope** written down — the `/admin`, `/management`, `/maintenance` rules stay as predicates; the decision file says what they become

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` was already merged in ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 207s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; 0133 was applied in #333
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; `check-role-can.mjs` was re-run and ends HARNESS-OK, and a live `role_can` call by named arguments through PostgREST answered volunteer/stock.count true, volunteer/stock.delivery false, staff/stock.delivery true, management and admin/stock.purchasing true, staff/stock.purchasing false
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration; 0133 must be on production before this ships (see section 8)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the rota form and My tasks were not driven in a browser; Left for manual verification 1 and 2
- [ ] Data persists — reload the page and the change is still there — n/a: the change writes nothing new; saving a rota is unchanged apart from the eligibility check before it
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not driven
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rendering changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven; a failed `role_can` call surfaces as the page's "couldn't load" line (page) or the save's refusal (actions), by reading the code
- [x] Boundary cases checked — `check-recurring-job-eligibility.mjs` "Every case held": the old E1–E16, purchasing, an empty or missing answer grants nothing (F1–F3), and each role's answer for `/stocktake`, `/deliveries`, `/management/purchasing`, `/management`, `/admin`, `/maintenance`, `/residents` equals the truth table written before the conversion

### Role access matrix

Not signed in as any role. The access change is none: the rota page and its actions still guard with `requireManagementUser()`, and the RPC's caller boundary is 0133's (Management/Admin about anyone, anyone about their own role).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Management → Recurring jobs | picker as before | not signed in as this role |
| management | same | same | not signed in as this role |
| staff | My tasks only | own role asked; stock jobs linked as before | not signed in as this role |
| vet | not assignable | no `role_can` call is made for a vet | not signed in as this role |
| volunteer | My tasks only | asks only its own role, so is not refused | not signed in as this role |
| signed out | redirected to login | unchanged | not driven |

- [ ] Every role above tested — n/a: not driven; each answer is the seed's, held by the scripts above. Left for manual verification 1 and 2
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no guard changed; `check-role-can.mjs` asserts the refusals (staff, vet, volunteer, public viewer, no role, archived, anon)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a person is told to do differently
- [ ] Translatable strings go through the translation path — n/a: no string added or changed
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout touched
- [ ] Browser console clean — n/a: not run
- [ ] Network clean — n/a: not run

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven; Left for manual verification 1 and 2
- [x] Any shared file touched (`legacy-predicates.json`, the three check scripts; `routes.ts` is read, not edited) checked from a second, unrelated page — the build compiled every route; `check-permission-parity.mjs` is GREEN with 12 predicates × 7 roles (9 before the fixture rows), `check-permission-catalogue.mjs` ends "all ok"
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — both units of the item are in
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-04-role-can-app.md`, including what the three remaining rules become
- [x] `README.md` still accurate — nothing in it names the deleted lists
- [ ] **Release notes.** n/a: under today's roles the picker lists exactly the people it listed before (the pre-conversion truth tables are held by the scripts); the difference only appears when a shelter edits the permission matrix, and no screen for that exists yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "Behaviour unchanged" is the parity check and the eligibility check against the fixture, run before and after; the cost note (one call per role and cell) is read from the loader, not timed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted evidence is the `gates:` lines, as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR, but it reads `role_can()` (0133), which must be applied to production before this build is deployed, or the rota page and My tasks will show a load error on every visit. Release manager: confirm 0133 is in production's `schema_migrations` first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration here; the dry-run belongs to 0133's own apply
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration here; 0133 first, then this deploy

### Rollback

- [ ] Rollback position stated — n/a: no schema change; redeploy the previous SHA (`./scripts/pi/deploy-pi.sh --ref <sha>`). 0133 is additive and can stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | The screens were not driven in a browser (no signed-in role account was set up) | accepted: listed under Left for manual verification |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As Management: open a new recurring job, link it to the stocktake, then to deliveries, then to Maintenance. The picker should list volunteers for the stocktake only, staff for deliveries, and neither volunteers nor vets for Maintenance; the "only … are listed" sentence should name the same roles. No load error at the top of the page | Management → Recurring jobs |
| 2 | As a volunteer with a stocktake job assigned: it shows on My tasks with its link. As a staff member with a Maintenance-linked job, same. No error line on My tasks | My tasks |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — rows 1 and 2 wait for someone signed in as Management and as a volunteer or staff member

Manual verification by: pending: rota picker as Management and My tasks as volunteer/staff (rows 1 and 2 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; pending the PR

Result: pass

Release manager acknowledgement: pending
