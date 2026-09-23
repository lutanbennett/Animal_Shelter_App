# Feature test plan

## Header

| | |
|---|---|
| Feature | `shelter_today()` / `shelter_date()` — "today" in SQL is the shelter's calendar, not the UTC session's |
| Backlog item | `docs/backlog.md` → Architecture → **Postgres has its own copy of the UTC "today" bug — `current_date` in a UTC session** |
| Branch / worktree | `claude/postgres-current-date` @ `C:\Development\Animal_Shelter_postgres-current-date` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | #71 |
| Tested by / date | Claude (automated) 2026-09-24, 00:20–00:38 Bangkok — inside the 00:00–07:00 window, so `current_date` and the shelter's today really differed |
| Carries a migration? | yes — `0073_shelter_today.sql` |
| Tested at SHA | `a0b10ce` (branch on `main` @ `84e61e0` — #59 and #69 merged). Synced since to `d3997a8` (#70), which changes only `.github/workflows/ci.yml`, so the gates and the harness still stand for the tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one migration adds `shelter_time_zone()` / `shelter_today()` / `shelter_date(timestamptz)` and moves every live `current_date` and `timestamptz::date` site that decides a shelter date onto them, the SQL twin of #59's `todayIso()`.
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0073_shelter_today.sql`; `scripts/check-shelter-today.mjs` (the rollback harness, dev-only); `docs/decisions.md`, `docs/backlog.md`, this plan. No `src/`, no `worker/`.
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — signed-out public (home-page stats, `/adopt` "happy endings"); staff/admin who record maintenance jobs or a death. No access rule changes.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — see below.

**Sites changed (8):** `maintenance.date_created` default (0001:405); `maintenance_before_write()` `date_completed` (0033:146); `handle_deceased_placement()` — the choice of prescriptions to close (0049:100, not in the backlog item) and the end date written (0049:118); `public_shelter_stats` `in_treatment` (0065:74) and `adopted_this_year` / `intakes_this_year` (0065:63/66, added on Lutan's call); `public_recent_adoptions.adopted_on` (0061:22, added on Lutan's call).

**Out of scope, deliberately:**

1. **Existing rows are not repaired.** The production audit (2026-09-23) found nothing to correct; dev has 0 prescriptions closed early by a death (measured below).
2. `medication_daily_requirement` (backlog item's 0027:233) — already dropped by 0044; nothing to fix.
3. The 0069 diet seed — a one-off that has already run.
4. Cashflow month boundaries (0072) — backlog "Dashboard follow-ups (e)"; that work can now call `shelter_date()`.
5. `adopted_last_7_days` — a span of instants (`now() - 7 days`), not calendar days; unaffected by time zone.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (exit 0) — first sync brought in #69 (release cut, no migration) before the gates ran; a second brought in #70 (`ci.yml` only)
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0; the new script re-linted on its own after its last edit, exit 0)
- [x] `npm run build` — succeeds (exit 0)
- [x] CI green on the PR (runs the same three) — `check` and `test-plan` both pass on #71 (run 35897584059)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0072_cashflow_forecast.sql`; #69 (release cut, merged during sync) carried none, and there is no other open PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `74 applied, 1 pending. pending: 0073_shelter_today.sql` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0073_shelter_today.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0073_shelter_today.sql … ok`; afterwards `maintenance.date_created` default reads `shelter_today()`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — every statement is `create or replace` or `alter … set default`; proved by running the harness (which executes the whole file again) after the apply
- [x] Existing rows still read correctly after the change (checked against real dev data) — home page and `/adopt` loaded against dev after the apply (see §4)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-shelter-today.mjs`. One transaction: the migration, then assertions against real dev residents, then a read of both public views **as `anon`**, then a deliberate `raise` carrying the evidence, so it cannot commit. Asserted: (A) `shelter_date()` puts 18:26Z on 22 Sep on the **23rd**, 16:59:59Z on the 22nd, 17:00:00Z on the 23rd; `shelter_today()` equals the real `todayIso()` imported from `src/lib/format.ts`. (B) a new maintenance job's `date_created` and its `date_completed` on completion are `shelter_today()`. (C) a death at 18:26Z on 22 Sep (01:26 Bangkok on the 23rd): an open course ends **2026-09-23**; a course already ending on the 23rd is **not** picked or moved (the old line 100 moved it to the 22nd); a course starting on the 23rd ends on the 23rd; `deceased_cascade` records the open course and not the one ending on the death day. (D) `in_treatment` does not count a course that ended yesterday by the shelter's calendar and does count one ending today. (E) `anon` can read both views (a view checks function EXECUTE as the caller). Output, unedited:

  ```
  HARNESS-OK todayIso()=2026-09-24 shelter_today()=2026-09-24 current_date=2026-09-23 | maintenance created=2026-09-24 completed=2026-09-24 | death 18:26Z closes on 2026-09-23/2026-09-23/2026-09-23 | in_treatment 6->6->7 | intakes_this_year old=2 new=2 adopted_this_year old=1 new=1 | adoptions ever on a shifted day=1 | dev prescriptions already closed early=0 | anon: in_treatment=7 recent_adoptions=0
  ```

  Dev counts: **0** prescriptions already closed early by a past death; **1** Adopt placement whose shelter day differs from its UTC day (it is outside `public_recent_adoptions`' 90-day window, so nothing public changes today); the this-year counts are unchanged on dev because no dev placement falls in 00:00–07:00 on 1 January.
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: the change is additive in effect — new functions plus `or replace` of existing ones with the same signatures and column lists; rolling back means re-applying the 0033/0049/0061/0065 bodies, and nothing needs undoing in data
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0073_shelter_today.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan, with `node scripts/apply-migrations.mjs --env production --dry-run` then without, from the main checkout. Order against the deploy does not matter: no code reads anything new.

## 4. Functional checks

- [x] Happy path works end to end — the harness is the happy path for every changed site; the public home page after the apply shows "In vet care 6" and "Adopted this year 1", matching the harness's `in_treatment` 6 and `adopted_this_year` 1
- [ ] Data persists — reload the page and the change is still there — n/a: no UI writes; persistence of the apply is `schema_migrations` plus the column default read back after it
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI; the insert/update paths the migration touches (maintenance insert and completion, Deceased placement insert) are exercised in the harness
- [x] Empty state renders sensibly (no rows yet) — `/adopt` with `public_recent_adoptions` empty on dev renders without the strip and without console errors
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface; no constraint changed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — both sides of 17:00Z, and the course ending exactly on the death day (the case that discriminates old line 100 from new)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | — | — |
| management | n/a: no route or policy changed | — | — |
| staff | n/a: no route or policy changed | — | — |
| vet | n/a: no route or policy changed | — | — |
| volunteer | n/a: no route or policy changed | — | — |
| signed out | both public views | readable as `anon` | readable (harness step E; home and `/adopt` load) |

- [ ] Every role above tested — n/a: no route, grant or RLS policy changed; the one grant-sensitive path (anon reading views that call new functions) is tested
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed; the views keep their existing SELECT-only grants, re-stated in the migration

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-visible behaviour to describe beyond dates now being right
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI change
- [x] Browser console clean — no errors or React warnings — `/` and `/adopt` on dev, no errors
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI change; the pages that read the views loaded and rendered their figures

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/` (stats strip) and `/adopt`, loaded against dev after the apply. Served from the `utc-today` checkout on :3004 rather than this worktree; that is equivalent here because this branch changes no `src/` and the figures come from the dev database
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing new; build green on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — one place for the zone; why not `ALTER DATABASE … SET timezone`; `stable` not `immutable`; anon EXECUTE; no data repair
- [x] `README.md` still accurate — it does not describe SQL date handling
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the line-100 claim, the anon EXECUTE claim and the dev counts all come from the harness run above. One correction: the commit message says the harness "passed at 00:40 Bangkok"; the runs were between 00:20 and 00:38

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy from this PR — it is SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — the SQL functions take fixed instants, so `shelter_date()` was asserted at both sides of 17:00Z and the 01:26 death at fixed times, independent of the clock. `shelter_today()` depends on `now()` and was additionally run inside the broken window, when `current_date` was 2026-09-23 and the shelter's day 2026-09-24. Workers' runtime zone is irrelevant here: the database computes these values
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — 16:59:59Z / 17:00:00Z / 18:26Z; for the cascade, a course ending *on* the death day (the discriminating case, which the bug report did not name) as well as an open one; for `in_treatment`, yesterday excluded and today included
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; no code reads anything new, so the production apply may go before or after any deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no data is rewritten; functions and views are replaced with the same signatures
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To revert, re-apply the previous bodies of `maintenance_before_write()` (0033), `handle_deceased_placement()` (0049), `public_shelter_stats` (0065), `public_recent_adoptions` (0061) and `date_created default current_date`; the three new functions can stay. Rows written while 0073 was live keep their (correct) shelter dates

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Harness exited 127 on Windows despite passing: `process.exit()` straight after `fetch` trips a libuv assertion | fixed — `process.exitCode` |

## Left for manual verification

Empty — nothing in this change has a surface a person needs to look at that the harness and the page loads did not already cover.

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

Manual verification by: n/a: the manual list is empty — SQL-only change, verified by the rollback harness and page loads

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links it (`docs/test-plans/postgres-current-date.md`) and quotes the harness output rather than duplicating the whole plan
- [x] Handed to the production release manager — the PR states the production apply as Lutan's, with the exact commands

Result: pass
