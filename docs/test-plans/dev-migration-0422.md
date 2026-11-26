# Feature test plan

## Header

| | |
|---|---|
| Feature | Clear dev's stale `0422_keep_an_admin_per_shelter.sql` row; name renumbered rows in `--status`/`--drift` |
| Backlog item | `docs/backlog.md` → `#d422o` |
| Branch / worktree | `claude/dev-migration-0422` @ `C:\Development\Animal_Shelter_dev-migration-0422` |
| Dev server | not used: no page changed |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | c4c0e6e4b |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `scripts/apply-migrations.mjs` (drift report), `src/lib/migration-drift.ts` (+ test), `docs/backlog.md`,
`docs/decisions/2026-11-26-dev-migration-0422.md`. No card's behaviour changes; Admin and the public see nothing.
`src/lib/migration-drift.ts` is also imported by `src/lib/status/health.ts`, which uses only `migrationDrift`, unchanged.
Out of scope: production and UAT (not touched), `0423` and its function (left as is), the other 445 rows.
One dev database row was deleted: `0422_keep_an_admin_per_shelter.sql` in `schema_migrations`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Pasted below as printed

```
=== gates: typecheck exited 0 after 40s
=== gates: lint exited 0 after 155s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 126s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration file in this PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: nothing applied; one row deleted with --forget
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; the change to dev is the deletion of one stale row, shown before and after in the PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration file
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no constraint or default changed; a read-only query confirmed `user_roles_keep_an_admin()` exists on dev with 0423's body
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: deliberately none; a down-migration would drop the last-Admin guard (decision file says why)
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing to apply on production; the row existed only on dev

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: no page; re-running --status after --forget showed 0 extra rows
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create or edit; the one delete was run and re-read
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI; with no renumbered rows the drift report prints nothing extra (unit test)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new input; --forget's existing refusals unchanged
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Boundaries in `migration-drift.test.mjs`: renumbered with new name applied (named), new name not yet applied (not named),
orphan with no namesake (not named).

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | script run on the developer's machine | no app surface | n/a |

- [ ] Every login above tested — n/a: no app page, route or action changed
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: developer tooling, not in the manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `migration-drift.ts` gained an export only; `migrationDrift`, which health.ts uses, is unchanged and typecheck and build pass
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: `apply-migrations.mjs --status` on dev, before and after.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a bookkeeping row in the dev database and a line in a developer script's output; no shelter user, Admin or product administrator sees anything
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing deployed changes; script and docs only
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployed surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: script output only; reverting the commit restores the old report. The deleted dev row is not to be restored

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no surface a person needs to look at | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing for a person to look at; script output and a dev bookkeeping row

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending: next release
