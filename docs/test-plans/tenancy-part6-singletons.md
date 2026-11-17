# Feature test plan

## Header

| | |
|---|---|
| Feature | Part 6 of the tenancy programme: singletons, receipt series, app_users |
| Backlog item | `docs/backlog.md` → `#bncd0` (ticked) |
| Branch / worktree | `claude/tenancy-part6-singletons` @ `C:DevelopmentAnimal_Shelter_tenancy-part6-singletons` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: opened after this plan passes the checker |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | yes: 0395 |
| Tested at SHA | 614f07480 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: site_content keyed by shelter, receipt series and issuer read from the shelter, private.app_users filtered by hand (three of the four named singletons were found already gone or scoped)
- [x] Files/areas touched listed: `supabase/migrations/0395`, `scripts/prove-tenancy-part6-singletons.mjs`, `scripts/check-donation-receipts-schema.mjs`, `docs/`; no `src/` file
- [x] Cards affected identified: `donation.receipt` (issuing a receipt) and `website.content` (the site_content row); neither grants anything different. Admin unaffected; the signed-out public reads public_site_content as before
- [x] Out of scope written down: the other column-less tenant tables, `login_display_name`, translations keyed by site_content, NOT NULL, INSERT policies, Part 7 (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [ ] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — pending: build=1 locally from the advisory prompt below; CI's build is the authority
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

Output of `node scripts/gates.mjs`, unedited (typecheck, lint and test pass; the build step stopped on the Next.js security-advisory prompt, `SecurityFatalError`, an environment message the same as Part 5 saw, and no `src/` file changed here; CI's build is the authority):
```
=== gates: typecheck exited 0 after 66s
=== gates: lint exited 0 after 252s
=== gates: test exited 0 after 54s
=== gates: build exited 1 after 161s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1
```

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one (`check-migration-numbers.mjs` ok for 0395)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (create if not exists, create or replace, drop if exists, coalesce on the backfill)
- [x] Existing rows still read correctly after the change (site_content 1 row, receipts check passes against every real dev donation, admin login still reads its own user_roles row)
- [x] Constraints exercised against real rows in a rolled-back harness (`prove-tenancy-part6-singletons.mjs`): a second shelter gets its own site row (a second refused), overview, standard diet, receipt ZZA0000001 with its own issuer, Lanna counter unchanged 9016 -> 9016; app_users own 1, other shelter 0, trusted caller 1
- [x] Down-migration: not a file; the file header says how to restore (re-add the key, restore 0176/0186 functions, 0264 view)
- [ ] Production apply plan stated for the release manager — pending: release-time; 0395 needs shelters.receipt_series set for every shelter before receipts are issued (Lanna is back-filled by the file itself)

## 4. Functional checks

- [ ] Happy path works end to end — pending: browser click-through not done (serving the session cookie locally was refused by the permission classifier); proved at database level as the real admin login
- [x] Data persists — n/a: no write path in src/ changed; the receipts check issues and reads back real receipts
- [x] Create / edit / delete — n/a: no UI changed; receipt issue and site_content insert exercised by scripts
- [x] Empty state — n/a: no UI change
- [x] Invalid input — n/a: a second site_content row for one shelter is refused (proved); no input surface changed
- [x] Boundary cases — n/a: no header, own shelter, another shelter and trusted caller all measured for app_users

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin login (header = dev shelter) | website.content, donation.receipt | both true | both true |
| admin, no header | its user_roles row | 0 rows | 0 |
| login in a second shelter | private.app_users | itself only | 1 own, 0 from the first shelter |
| trusted caller (service role) | private.app_users | sees the login | 1 |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side: the database refuses, not the UI

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no UI change
- [x] Manual updated — n/a: no user-visible change
- [x] Translatable strings — n/a: no new strings
- [x] Mobile viewport — n/a: no UI change
- [x] Browser console clean — n/a: no UI change and no browser pass
- [x] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work: n/a: no page changed; `check-donation-receipts-schema.mjs` 0 failures, catalogue `0 flagged, 2 allowed, 0 stale`
- [x] Shared file touched — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: `#bncd0` ticked with a note of what was already done and what was not
- [x] Non-obvious design choices added as `docs/decisions/2026-11-17-tenancy-part6-singletons.md`
- [x] `README.md` still accurate — n/a: nothing in it describes these policies
- [ ] **Release notes.** n/a: no shelter user would notice; receipts print the same issuer and number as before, and the fix for caller-supplied issuers shipped in 0176
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: every reading in the decision file comes from a query or harness run on dev 2026-11-17

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: plan quotes script output and the gates block verbatim
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it — n/a: no app code reads these policies; `dev-signin.mjs` is a dev script
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive or rewriting migration backup — deferred: release manager (0394 updates rows)
- [ ] Apply plan stated — deferred: release manager (two-release order on `#ujqr5`)

### Rollback

- [ ] Rollback position stated — n/a: drop the three `shelter_scope_*` policies per table (0392 header); no code to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `check-donation-receipts-schema.mjs` failed 53 checks before any receipt code ran, because it sent no shelter header after Part 5 | fixed: header added to both helper functions |
| 2 | low | `check-null-shelter-id.mjs` reports 1 `retention_runs` row with a null shelter (a headerless writer, not this part) | deferred to backlog: for the planner |
| 3 | low | `login_display_name` and translations keyed by site_content still have no tenant filter | deferred to backlog: for the planner |

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Sign in on port 3005 and click through to Settings -> Website and Management -> Donations: pages show and a receipt can be issued | `node scripts/dev-signin.mjs admin --port 3005` | Lutan |

Automated checks by: Claude  Date: 2026-11-17
Manual verification by: pending: browser click-through left for a person
Result: pass with accepted defects
