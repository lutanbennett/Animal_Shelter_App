# Feature test plan

## Header

| | |
|---|---|
| Feature | UAT's Worker had no `SUPABASE_URL`, so it never looked a host up and refused every sign-in |
| Backlog item | `docs/backlog.md` → `#uatsb` |
| Branch / worktree | `claude/uat-supabase-url` @ `C:\Development\Animal_Shelter_uat-supabase-url` |
| Dev server | not started — this change is a Worker setting and a pre-flight rule; neither has a page |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude — 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | the branch tip this plan is committed on |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the `uat` block of `wrangler.jsonc` gains `SUPABASE_URL`, and a pre-flight rule fails when any routed environment lacks it or shares another's
- [x] Files/areas touched listed — `wrangler.jsonc` (`uat` block only), `scripts/lib/site-hosts-problems.mjs` (the rule), `scripts/check-site-hosts.mjs` (two broken copies that prove it fires), `docs/backlog.md` (ticking is `n/a`, see §7)
- [ ] Cards affected identified — n/a: no card changes. The fault refused **every** login on UAT regardless of cards, because with no shelter header `my_permissions()` is null before any card is read
- [x] Anything explicitly **out of scope** written down — **the UAT Worker deploy is not in this PR**: a setting that is not deployed changes nothing, and a Worker deploy is Lutan's (his instruction, 2026-10-02). `#drvtk`'s UAT upload stays open until after that deploy. Nothing about test or production is touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 43s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 203s
=== gates: test — npm test
=== gates: test exited 0 after 53s
=== gates: build — npm run build
=== gates: build exited 0 after 223s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — for what this PR contains, the happy path is the rule: `node scripts/check-site-hosts.mjs` prints `ok uat sets SUPABASE_URL, which its host lookup needs` and ends `all right`. The **sign-in** happy path cannot be true until the UAT Worker is deployed; see §8
- [x] Data persists — the value is read back from the file by `readWranglerConfig()` in the same run, and the file still parses as JSONC
- [ ] Create / edit / delete all exercised — n/a: no records; this is one configuration value
- [ ] Empty state renders sensibly — n/a: no list and no page
- [x] Invalid input is rejected with a readable message, not a crash — both failure shapes were constructed and asserted: a routed environment with the value deleted, and two environments sharing one value. Each makes a named rule report `FAIL` with the environment in the message
- [x] Boundary cases checked — the rule is skipped for an environment with **no routes** (nothing can reach it), and the three environments were asserted to point at **three different** databases, which is the mistake a copy-paste fix would make

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no page, route or action is added or altered |
| exactly `<card key>` | nothing new | no change | n/a: no card governs a Worker variable |
| signed out | nothing new | no change | n/a: as above |

- [ ] Every login above tested — n/a: this PR adds no page, route, action or card; the matrix has nothing to vary
- [x] A login that should not have access is blocked server-side — unchanged and deliberately so: the fix **restores** the shelter header, and `0392`'s restrictive policies still decide every row. Nothing here weakens a check; it stops the Worker failing to say which shelter a request is for

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: nothing a shelter user does changes
- [ ] Translatable strings — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a page here is the pre-flight itself: `check-site-hosts.mjs` passes **29 rules, 0 failing**, including every pre-existing host, route and tunnel rule
- [x] Any shared file touched checked from a second, unrelated place, by running it rather than reading it — `scripts/lib/site-hosts-problems.mjs` is also imported by `scripts/check-deployed-hosts.mjs`'s neighbours; `node scripts/check-deployed-hosts.mjs --env test` still runs and reports both test hosts `ok`
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync, all four `0`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — pending: `#uatsb` is not closed by this PR. The setting only takes effect on the UAT Worker deploy, and the item's own *Done when* asks for a pressed sign-in on UAT afterwards. Ticking it here would record a fix that nobody can use yet
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-20-worker-settings-are-not-data.md`
- [x] `README.md` still accurate — it describes the three environments and their databases, which this does not change
- [ ] **Release notes.** — n/a: UAT is not a shelter user's site, and no page, tile or setting appears, moves or disappears for anyone, Admin included. The sign-in this restores was working everywhere a shelter user goes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the cause was read in `worker/shelter.mjs` (`resolveShelterSite()` returns `none` when `SUPABASE_URL` is unset) and in `wrangler.jsonc` (set for `test` and `production`, absent for `uat`), after ruling out the account, the rows and the build. Nothing in the decision file is inferred from the symptom alone

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in this PR changes the test environment; its `SUPABASE_URL` was already set and is byte-identical after the change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: as above, test is untouched
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date or time logic
- [ ] **Both edges of a band or boundary** — n/a: no threshold, band or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above and the rule names quoted in §4 are copied from the runs
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — this adds a **var**, not a secret, and only to `uat`. `SUPABASE_SERVICE_ROLE_KEY`, the other half the host lookup needs, is declared `where: "both", secret: true` in `scripts/lib/runtime-config.mjs`, so the deploy sets it per environment. **Whether UAT's Worker already holds that secret was not verified** — a Worker's secrets cannot be read back — so if the UAT deploy does not fix the sign-in, that is the next thing to check

### Migration ordering — *skip if no migration*

- [ ] **Both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert this commit and redeploy the UAT Worker; the change is one variable in one environment's block plus a pre-flight rule, touches no schema and no data, and cannot affect test or production (both blocks are byte-identical, asserted). **What it does not cover:** nothing, because nothing is applied anywhere by merging this

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | UAT refused every sign-in: its Worker had no `SUPABASE_URL`, so `resolveShelterSite()` sent no shelter header and `my_permissions()` was null for everyone | fixed here (takes effect on the UAT Worker deploy) |
| 2 | Medium | Two database-level checks (`check-deployed-hosts.mjs`, `resolve_shelter_site()`) passed on UAT throughout, because neither touches the Worker | fixed here — the new rule is Worker-side, and the decision file records why a data proof is not an end-to-end one |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in on UAT **after the UAT Worker is deployed** — press it, do not infer it from a check | `https://uat.lannacare.org/login`, direct, reading the address bar afterwards |
| 2 | Then `#drvtk`'s outstanding half: add a photo to a resident on UAT and see it accepted | UAT, any resident → Photos |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: both rows wait on the UAT Worker deploy, which is Lutan's

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: this does not reach production; it changes one UAT-only setting and a pre-flight rule

Result: pass

Release manager acknowledgement: n/a: UAT-only change, no production step
