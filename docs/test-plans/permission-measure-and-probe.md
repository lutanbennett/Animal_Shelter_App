# Feature test plan

## Header

| | |
|---|---|
| Feature | `permission-measure-and-probe`: measure `has_permission()` now every policy is converted, and run the security assessment's dynamic half |
| Backlog item | `docs/backlog.md` → *Next up*: "Does `has_permission()` need a statement-level cache?"; *Architecture* (routes to *Security*): "The security assessment's dynamic half" |
| Branch / worktree | `claude/permission-measure-and-probe` @ `C:\Development\Animal_Shelter_permission-measure-and-probe` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` (not started: nothing in this PR renders) |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `6b037cf0` (after `sync`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: re-measure the policy init-plans and decide on a cache (decided: no cache), and ask the running dev database what every login can actually reach, recording it as a dated addendum with each surprise filed separately
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `scripts/measure-permission-baseline.mjs` (two heavier queries, init-plan columns, a stale header fixed); `scripts/probe-role-surface.mjs` (new, dev only, writes nothing); `docs/decisions/2026-10-09-has-permission-no-cache.md`; `docs/security/security-assessment-2026-10-09-dynamic.md`; `docs/backlog.md` (two ticks); this plan. No `src/`, no `worker/`, no migration
- [x] Roles affected identified: none change. Every role was *probed* (anon, no role, archived, public_viewer, volunteer, staff, vet, the three configured roles, management, admin at `aal1` and `aal2`); nothing about any role's access is altered by this PR
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the four findings are filed on the `backlog` branch (`07072a06`), not fixed here; production was not read; no statement-level cache was built

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (4 files from `main`, no conflicts, pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 184s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; both scripts end every transaction in a rollback
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. The probes themselves ran against real dev rows in rolled-back transactions (see §4)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/measure-permission-baseline.mjs` run twice on dev (the two runs agree within 0.15 ms on every line; table in the decision file); `node scripts/probe-role-surface.mjs --json` run for all 13 principals over 100 relations
- [ ] Data persists — reload the page and the change is still there — n/a: no page; both scripts are read-only by construction (every write is undone in its own subtransaction and each request ends in a raised exception)
- [x] Create / edit / delete all exercised (whichever the feature has): the probe exercises read, update, delete and insert per relation per principal; the ambiguous inserts (`maintenance`, `placement_history`, `project_folders`) were re-tried by hand with valid rows as no role, volunteer and Head of Medical, and the vet's project-photo insert, rename and delete were confirmed by a separate rolled-back harness
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input; the scripts refuse any project but dev (`qxkmhwybjggxvsfxsxbd`)
- [x] Boundary cases checked: the probe's insert used a copied real row because an empty row is stopped by triggers before RLS (first run, discarded); a finding was only filed after a second, targeted harness confirmed it (vet attachments: 146 deleted, 144 renamed, 1 inserted; `reset_prescription_rounds` as no role: `morning` became `morning,evening`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | 78 internal relations; writes `roles` / `user_roles` only at `aal2` | as `0153` | matches |
| management | 70 | as its cells | matches |
| staff | 67, `contacts` included | `contacts` is the known hole (`carer-contacts-picker-view`) | known, not new |
| vet | 44, clinic-scoped, **plus all project and maintenance attachments and non-resident translations** | clinic scope only | **finding 1, filed** |
| volunteer | 15 | who-and-where floor | matches |
| signed out | the `public_*` views and five functions | `check-public-views.mjs` | matches (250 ok, exit 0) |

- [x] Every role above tested, plus no role, archived, public_viewer and the three configured roles
- [x] A role that should not have access is blocked server-side: probed under each login's own JWT against the database, and over HTTP with the anon key (`residents` 401 `42501`, `rpc/role_can` 401, `storage`/`private`/`extensions` schemas `PGRST106`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings go through the translation path — n/a: no strings in the app
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no page touched
- [ ] Network clean — n/a: no page touched

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page is near the change; the scripts nearest it still pass — `check-public-views.mjs` exit 0 (250 ok), and `measure-permission-baseline.mjs` still produces its original five rows unchanged in shape
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched (`docs/backlog.md` only)
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought four `docs/` files; gates green after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: both items, citing `8834dea4` and `f03bb7b5`; the four findings went on the `backlog` branch (`07072a06`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-09-has-permission-no-cache.md`; the probe's method is in the addendum
- [x] `README.md` still accurate (it lists no check scripts individually)
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no shelter user would notice a measurement, a dev-only probe script and an addendum; nothing in the app changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the decision file and the addendum is from a run on dev today; the one claim not measured (production's `disable_signup`) is marked as unread

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; `scripts/` and `docs/` are not in the Worker bundle
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**: the gates lines above are as printed; the decision file's table is transcribed from two runs whose ranges it gives, and the script regenerates it
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: nothing deploys; reverting is reverting the commits, and nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | A vet login reads, renames, adds and deletes every project and maintenance attachment; reads non-resident translations | deferred to backlog (`07072a06`, *Security*) |
| 2 | Medium-low | `reset_*_rounds()` callable by any signed-in login; silently changes the medication list | deferred to backlog (`07072a06`, *Security*) |
| 3 | Low | `facility_maps`, `map_rooms` answer public_viewer, no-role and archived logins | deferred to backlog (`07072a06`, *Security*) |
| 4 | Low | A vet lists every login's name and role through `app_users` | deferred to backlog (`07072a06`, *Security*) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether new sign-ups are off on **production** (dev has `disable_signup: true`). If they are on, a stranger's Google sign-in becomes a no-role login, which is what finding 3 and the no-role row of the addendum describe; sessions are not allowed to read production | Supabase dashboard, production project → Authentication → Sign In / Providers → "Allow new users to sign up" |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (permission-measure-and-probe session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — one item for Lutan, below

Manual verification by: pending: Lutan to read production's "Allow new users to sign up" setting (item 1)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: all four are deferred to the backlog with severities; none is introduced by this PR
- [ ] Checklist pasted into the PR — n/a: the PR body links this file rather than pasting it
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a: nothing deploys
