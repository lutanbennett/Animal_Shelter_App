# Feature test plan

## Header

| | |
|---|---|
| Feature | `updated_at` on `prescriptions` and `resident_diets`, kept current by a touch trigger, so a wrong `end_date` can be audited from now on |
| Backlog item | `docs/backlog.md` → Architecture → **`prescriptions` and `resident_diets` have no `updated_at`, so a wrong `end_date` is permanently undetectable** (ticked on this branch: the item is complete once the columns and trigger exist) |
| Branch / worktree | `claude/prescriptions-updated-at-schema` @ `C:\Development\Animal_Shelter_prescriptions-updated-at-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | #97 |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes: `0078_prescriptions_diets_updated_at.sql` |
| Tested at SHA | `894aee0` (branch on `main` @ `c684fbb`); the migration, harness, backlog tick, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration adds `updated_at timestamptz not null default now()` to both tables plus a touch trigger, exactly as the item asks
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0078_prescriptions_diets_updated_at.sql`; `scripts/check-prescriptions-updated-at.mjs` (dev-only rollback harness); `docs/backlog.md`; `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. None, because no code reads the column, and the trigger fills it on every write that roles already make. Grants and RLS on both tables are table-level and cover the new column unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: any audit that uses the column, any UI showing it, and repairing `end_date` values written before 0078, which stay unauditable (the back-fill carries no information about them)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date", exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 259s

  gates: typecheck=0 lint=0 build=0
  ```

- [x] CI green on the PR (runs the same three): PR #97, run 36000586834 at `f29fc46` — `check` pass (1m31s), `test-plan` pass

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0077_data_api_grants.sql`; `gh pr list --state open` returned `[]`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `79 applied, 1 pending. pending: 0078_prescriptions_diets_updated_at.sql` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0078_prescriptions_diets_updated_at.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0078_prescriptions_diets_updated_at.sql … ok`; `--status` afterwards shows `80 applied, 0 pending`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness executes the whole file twice in one transaction, after the real apply, so three runs in total against the same schema
- [x] Existing rows still read correctly after the change (checked against real dev data): all 59 prescriptions and 72 resident diets are present, each with a single back-filled `updated_at` (the apply time) and none earlier than its `created_at`
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-prescriptions-updated-at.mjs`, run after the apply so that back-filled rows carry an earlier time than the harness transaction's `now()`. Each case runs in its own subtransaction that is undone, so every case starts from the back-filled value. Shape: both columns `timestamptz not null default now()`, both triggers present. For each table, on a live resident's row: (A) back-fill not null and `>= created_at`; (B) changing `end_date` moves `updated_at` to `now()`; (C) changing only `notes` moves it too; (D) a no-op update keeps the old value; (E) setting `updated_at` by hand is ignored; (F) an insert asking for `2000-01-01` gets `now()`; (G) a write under the deceased-lock bypass, the death cascade's path, moves it (prescriptions had a deceased resident's row on dev; resident_diets had none, so G ran for prescriptions only). Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK shape: 2 columns timestamptz not null default now(), 2 triggers | prescriptions: rows=59 distinct updated_at=1 bypass-write=moved | resident_diets: rows=72 distinct updated_at=1 bypass-write=no deceased row in dev  | per table: back-fill not null and >= created_at, end_date edit moves, notes edit moves, no-op keeps, hand-set ignored, backdated insert gets now() | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 174 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`, and did.) **Negative control:** the same harness with the trigger's `new.updated_at := now();` replaced by `null;` fails, exit 1:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: FAIL B prescriptions: end_date edit left updated_at at 2026-09-24 12:29:10.023124+00 (was 2026-09-24 12:29:10.023124+00)
  CONTEXT:  PL/pgSQL function inline_code_block line 37 at RAISE
  ```

- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive; undoing it is dropping the two triggers, `touch_updated_at()` and the two columns, and nothing reads them
- [x] Production apply plan stated for the release manager (which file, which project, when): `0078_prescriptions_diets_updated_at.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan, `node scripts/apply-migrations.mjs --env production --dry-run` then without, from the main checkout. No deploy depends on it, so it can go any time; the sooner it is applied, the sooner production `end_date` edits become auditable

## 4. Functional checks

- [x] Happy path works end to end: harness cases B, C and F are the writes the app makes today ("End today", editing a prescription or diet, adding one), and G is the death cascade's write
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert and update exercised in the harness, and delete does not touch the column
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the column accepts no input; a hand-set value is overridden silently rather than rejected, by design (cases E and F), so existing code that never mentions it cannot break
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): no-op update, hand-set value alone, backdated insert, a deceased resident's row under the lock bypass

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | — | — |
| management | n/a: no route or policy changed | — | — |
| staff | n/a: no route or policy changed | — | — |
| vet | n/a: no route or policy changed | — | — |
| volunteer | n/a: no route or policy changed | — | — |
| signed out | n/a: no route or policy changed | — | — |

- [ ] Every role above tested — n/a: no route, grant or RLS policy changed; the trigger runs as the writer for every role alike
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded, because nothing in `src/` selects the column. The harness drove the same inserts and updates the prescription and diet pages make, through the existing deceased-lock triggers, and all succeeded. The only new behaviour is the trigger, which fires after the lock alphabetically, so a write the lock refuses never reaches it
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in, and the build is green on this tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: moved to Completed → Architecture with what was done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: the back-fill caveat, the no-op rule, and why the trigger function is new and generic
- [x] `README.md` still accurate: it does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: a column no screen shows, filled in by the database; nobody using the app can tell it exists
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** the back-fill, no-op, hand-set, insert and bypass behaviour all come from the harness run above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `updated_at` is a stored instant from `now()`; nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads either table's new column

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, and no follow-on feature is waiting on it; it can be applied before or after any deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive columns; existing values untouched
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. The columns and triggers are safe to leave in place. Removing them drops every edit time recorded since the apply, which cannot be recovered

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: nothing in this change has a surface a person needs to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager: the PR states that Lutan applies it to production

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
