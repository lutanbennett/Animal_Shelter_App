# Feature test plan

## Header

| | |
|---|---|
| Feature | Tenancy catalogue gate: an unowned view, definer function or RLS table is caught in the migration file |
| Backlog item | `docs/backlog.md` → `#tnc41` |
| Branch / worktree | `claude/tenancy-catalogue-gate` @ `C:\Development\Animal_Shelter_tenancy-catalogue-gate` |
| Dev server | n/a: no page changes; nothing to serve |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | 26e2cb77e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Scope: new `scripts/check-tenancy-migrations.mjs` and `scripts/lib/tenancy-migration-lint.mjs`; three `ALLOWED` entries in
`scripts/lib/tenancy-catalogue.mjs`; tests in `scripts/check-tenancy-catalogue.test.mjs`; a `tenancy-migrations` job in
`.github/workflows/ci.yml`. No card, page or user is affected. Out of scope: the ~125 objects the bare run counts, the nightly
workflow, and `product_admin_access_elsewhere` (another stream's unmerged `0444`, told by message).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, each its own exit code, every one `0`

```
=== gates: typecheck exited 0 after 95s
=== gates: lint exited 0 after 342s
=== gates: test exited 0 after 80s
=== gates: build exited 0 after 312s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: a CI script; no page or stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a CI script; nothing is created or deleted
- [x] Empty state renders sensibly (no rows yet)
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Run on history: `0436` alone fails (`product_admin_set_shelter_site`); `0438`, `0441` pass only through `ALLOWED`; `0440`, `0443`
pass; the other stream's `0444` (copied in, run, removed) fails. No new files on the branch: `ok — 0 new migration file(s)`.
Eleven unit tests pass: owner inside `do $$`, revoked-from-API functions, invoker views, `definer_all`, redefinitions, comments.
Strict nightly on dev after the entries: only `product_admin_access_elsewhere` (not this PR's).

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no page | n/a |
| signed out | n/a | n/a: no page | n/a |

- [ ] Every login above tested — n/a: a CI script; no login reaches anything new
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL added

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: developer tooling, not in the manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared UI file touched; the shared lib `tenancy-catalogue.mjs` was re-checked by running the nightly check, which read 16 allowed, 0 stale
- [x] Nothing merged from `main` during `sync` was broken by this branch

Nearest neighbours: `check-tenancy-catalogue.mjs` (bare and strict) and `check-script-integrity.mjs`, both run.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a CI check and three catalogue entries; no shelter user, Admin or product administrator sees either
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; CI-only change
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys; CI-only change

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the app changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in the app changes
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time handling
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; both sides of each rule (owned/unowned, revoked/regranted) are in the unit tests
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the one pasted block is the gates output, copied from the file
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret; the job needs none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: revert the PR; nothing deployed or applied

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `product_admin_access_elsewhere` (another stream's unmerged `0444`) is on dev with no owner or entry | not this PR's; owning stream told by message |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing: no surface a person looks at | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a CI script; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a: nothing deploys
