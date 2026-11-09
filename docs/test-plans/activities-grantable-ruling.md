# Feature test plan

## Header

| | |
|---|---|
| Feature | `activities-grantable` judges the live per-level gaps against the dated rulings in `docs/ungranted-activities-allowlist.json`, through the verdict it now shares with `check-ungranted-activities.mjs`; `maintenance.delete` recorded as ruled |
| Backlog item | `docs/backlog.md` → `#av8rq` (Security) |
| Branch / worktree | `claude/activities-grantable-ruling` @ `C:\Development\Animal_Shelter_activities-grantable-ruling` |
| Dev server | n/a: scripts only, no page changed (port 3008 unused) |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | 71e0753a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — shape (a), Lutan's choice of 2026-11-08: exit 0 when the Admin-only set matches the dated records, exit 1 naming what joined or left
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/lib/ungranted-allowlist.mjs` (new), `scripts/check-ungranted-activities.mjs`, `scripts/lib/readonly-checks.mjs` (the `activities-grantable` entry), `scripts/check-production.test.mjs`, `docs/ungranted-activities-allowlist.json`, the decision file and this plan. No `src/`, no `worker/`, no migration
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — none: no card's grants change; the checks only read them. Admin is outside the card system and unaffected; the public is unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the sixteen `foundNotRuled` gaps are not ruled (each is Lutan's); `check-menu-coverage.mjs` untouched; production not read from this worktree

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 204s
=== gates: lint exited 0 after 443s
=== gates: test exited 0 after 62s
=== gates: build exited 0 after 395s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration, and the brief forbids one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the new SQL was run read-only against dev's real `card_grants` and `permission_activities` (section 4)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the check's own query runs in `begin read only; … rollback;` by construction
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev (`--env test`, `qxkmhwybjggxvsfxsxbd`) `activities-grantable` exits 0: 3 ruled, 16 UNRULED, `ok   the live Admin-only set matches the allow-list`; `check-ungranted-activities.mjs` exits 0 with the same 19 activity+level rows; `fault-maintenance-delete` exits 0
- [ ] Data persists — reload the page and the change is still there — n/a: no page; the allow-list change is a committed file, and both checks re-run after the commit read it
- [x] Create / edit / delete all exercised (whichever the feature has) — planted failure on dev: deleting the `stock.usage` record (joins) and adding a ruling for `maintenance.jobs` at read (leaves) made both checks exit 1 naming both; undone with `git checkout`, both exit 0 again
- [ ] Empty state renders sensibly (no rows yet) — n/a: the catalogue is never empty; `compareToAllowlist([], …)` is covered by the unit test's "leaves" case shape
- [x] Invalid input is rejected with a readable message, not a crash — a record with no reason/date, or naming an activity outside the catalogue, fails with its own line (shared function, unchanged rule)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the level boundary: an activity granted at read and not at edit is a gap at edit only (`facility.enclosures` reads as ruled at edit, not at read); yes/no activities are checked at edit only

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page changed | n/a: scripts only | n/a: scripts only |
| signed out | n/a: no page changed | n/a: scripts only | n/a: scripts only |

- [ ] Every login above tested — n/a: no page or access path changed; the change is two read-only check scripts
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-facing behaviour
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings in the app
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — nearest are the sibling checks: `fault-maintenance-delete` (exit 0 on dev) and `check-production.test.mjs` (6 of 6 pass, including the SELECT-only lint over every check)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched; `readonly-checks.mjs` is shared by the check script only, and its full test file passes
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought only `docs/backlog.md`; gates run after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — pending: the item's done-when is a production exit 0, which a worktree cannot read; the planner or release manager runs `node scripts/check-production.mjs activities-grantable` and ticks `#av8rq` on a pass
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-09-activities-grantable-ruling.md`
- [x] `README.md` still accurate — it does not describe either check
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing a shelter user would notice; a developer check script changes, no page or behaviour does
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the under-count hypothesis was measured on dev (0 diffs over 83 activities, three ways); the "17 vs 10" explanation was measured by running the old check on dev and getting production's ten

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: scripts only, nothing in the deployed app changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts only, nothing in the deployed app changes
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band; the read/edit level boundary is covered in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: scripts only, not part of the deployed bundle
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: scripts only, not part of the deployed bundle
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: no deploy surface; reverting the PR restores the old check

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `activities-grantable` was blind to an activity granted at read but never at edit (eight such on dev) | fixed: the check is per level now |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | `node scripts/check-production.mjs activities-grantable` exits 0 on production and ends `ok   the live Admin-only set matches the allow-list` (or names a production-only row) | planner or release manager, from the main checkout |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the production run in row 1

Manual verification by: pending: production run of activities-grantable (row 1)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: at the next release

Result: pass

Release manager acknowledgement: pending: next release
