# Feature test plan

## Header

| | |
|---|---|
| Feature | `recurring_jobs`, its assignees, acted-on occurrences with a per-date cover team, the recurrence evaluator, `recurring_job_staffing`, and `record_recurring_job()` / `reassign_recurring_job()`: the schema half of recurring jobs, including reassigning one week's job when someone is sick |
| Backlog item | `docs/backlog.md` → **Recurring jobs for staff, feeding My dashboard** (not ticked here: the item closes when the feature half, `claude/recurring-jobs`, lands) |
| Branch / worktree | `claude/recurring-jobs-schema` @ `C:\Development\Animal_Shelter_recurring-jobs-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | #152 (merged as `3b11402`) |
| Tested by / date | Claude (automated) / 2026-09-26 |
| Carries a migration? | yes: `0095_recurring_jobs.sql` |
| Tested at SHA | `e69d353` (branch on `main` @ `e22d289`); the migration, harness, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration adds recurring-job templates, per-date outcomes and per-date cover, with occurrences computed from a small explicit rule subset rather than generated ahead. That is the item's "templates vs occurrences" and recurrence subset, plus Lutan's 2026-09-26 addition of reassigning one week's job when someone is sick
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0095_recurring_jobs.sql`; `scripts/check-recurring-jobs.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Only through the new tables and functions, which nothing in the app calls yet. The access rules for each role are exercised in the harness (§4 matrix)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the Management page, the `/my` loader, the "all of X's jobs for these dates" cover form, the manual topic and the backlog tick all belong to `claude/recurring-jobs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: merged `e22d289` (#151) with no conflicts, then pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 512s

  gates: typecheck=0 lint=0 build=0
  ```

- [x] CI green on the PR (runs the same three): PR #152, run 36237951087 at `7236c32` — `check` pass (1m36s), `migration-numbers` pass, `test-plan` pass

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0095_recurring_jobs.sql (against origin/main e22d289, highest 0094_resident_hook_ideal_home.sql)`; `gh pr list --state open` was empty
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 94 applied, 1 pending.` with `On origin/main, not applied here: 0` and `Applied here, no file on origin/main: 0`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0095_recurring_jobs.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0095_recurring_jobs.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness runs the whole file twice in one transaction, before and after the real apply, so it has run four times against the same schema
- [x] Existing rows still read correctly after the change (checked against real dev data): nothing existing is altered. Four new tables, one view, five functions and three triggers on the new table; `touch_updated_at()` (0078) and `app_users` (0086) are used, not changed
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-recurring-jobs.mjs`. **R**, the rule against real calendar dates worked out independently of the SQL: weekly; fortnightly anchored on a Wednesday start (first date 19 Oct, not 12 Oct) and on a Monday start; two weekdays; fortnightly across the year end; the 31st in every month of 2026 and in a leap February; every 3 months; first Monday; last Friday; inclusive `ends_on`; a start after the month's day; Sunday = 7. The same dates come out at UTC+14 and UTC−11. Over five years, every `month_day` 1–31 and every Nth/last weekday falls exactly once in each of 60 months and on the right days, and fortnightly gaps are all 14. A range over two years is refused. **T**: defaults; 18 bad rules, 5 off-site links and 2 blank titles refused by CHECKs; self, two-step and three-step dependency cycles refused; `overdue_from` kept on plain edits and reset on resume and on each rule column; `updated_at`. **F/G**: both functions as every role (below). **K**: table access, `recurring_job_dates`, the staffing view, delete behaviour. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0095 twice | R1 weekly Mon: 2026-10-05 2026-10-12 2026-10-19 2026-10-26 | R2 fortnightly Mon, starts Wed: 2026-10-19 2026-11-02 2026-11-16 | R3 fortnightly Mon, starts Mon: 2026-10-05 2026-10-19 2026-11-02 2026-11-16 | R4 weekly Mon+Thu: 2026-10-01 2026-10-05 2026-10-08 | R5 fortnightly across year end: 2026-12-21 2027-01-04 2027-01-18 2027-02-01 | R6 monthly on the 31st: 2026-01-31 2026-02-28 2026-03-31 2026-04-30 2026-05-31 2026-06-30 2026-07-31 2026-08-31 2026-09-30 2026-10-31 2026-11-30 2026-12-31 | R7 the 31st in a leap February: 2028-02-29 | R8 every 3 months on the 15th: 2026-10-15 2027-01-15 2027-04-15 2027-07-15 2027-10-15 | R9 first Monday: 2026-10-05 2026-11-02 2026-12-07 2027-01-04 2027-02-01 | R10 last Friday: 2026-10-30 2026-11-27 2026-12-25 2027-01-29 2027-02-26 | R11 ends_on is inclusive: 2026-10-05 2026-10-12 2026-10-19 | R12 starts mid-month, day already past: 2026-11-10 2026-12-10 | R13 Sunday is 7: 2026-10-04 2026-10-11 | R14 same dates at UTC+14 and UTC-11 | R15 60/60 months for every month_day and every Nth/last weekday, fortnightly gaps all 14 | T1 defaults today/today/active/anytime | T2 18 bad rules, 5 bad links, 2 blank titles refused; /stocktake?tab=diets and / accepted | T3 self / 2-step / 3-step cycles refused, delete releases | T4 overdue_from kept on title/ends_on/time edit, reset on resume, weekdays, every, starts_on, repeat | T5 updated_at | F1 assignee done, stamped by the function, note trimmed, overwrite | F2 not-assigned, vet, wrong weekday, before start, done ahead, bad outcome, missing job, public_viewer, role-less, archived refused; anon by grant | F3 skip ahead, clear deletes, management/admin record any | G1 staff cannot reassign | G2 one date to the volunteer, stamped | G3 usual assignee refused on it, cover refused next week, cover records, clear keeps cover | G4 recorded date frozen | G5 archived, public_viewer, role-less, unknown, wrong weekday refused, nothing written | G6 replace, dedupe, hand back, ahead | K1 staff/vet/volunteer/management read all four tables; public_viewer, archived, role-less read nothing; anon refused on all five | K2 staff cannot write jobs or assignees; nobody writes history or cover directly; management writes jobs, created_by stamped | K3 recurring_job_dates from start, public_viewer none | K4 staffing 1/0, 0/1 archived, public_viewer-only and unassigned 0 | K5 history blocks delete, free job deletes with assignees, login delete cascades cover and keeps outcome
  CONTEXT:  PL/pgSQL function inline_code_block line 430 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit. The script exits 0 only on `HARNESS-OK`, and it did: `exit=0`.) **Negative control:** the same harness, with the weekly anchor counting from `starts_on` itself instead of the Monday of its week, fails with exit 1:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: FAIL R2 fortnightly Mon, starts Wed: got [2026-10-12 2026-10-26 2026-11-09]
  CONTEXT:  PL/pgSQL function inline_code_block line 19 at RAISE

  exit=1
  ```

- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive; nothing reads the new objects. Undoing it means dropping the view, the five functions and the four tables in a new file
- [x] Production apply plan stated for the release manager (which file, which project, when): Lutan applies `0095_recurring_jobs.sql` to production `dbkodyyxxhtygxcxmfcu` from the main checkout, running `node scripts/apply-migrations.mjs --env production --dry-run` first and then the real apply. It **must be applied before** the deploy that carries `claude/recurring-jobs`, because that code reads these tables. It depends on `shelter_today()` (0073), `touch_updated_at()` (0078), `app_users` (0086) and the `public_viewer` value (0085), all already in production

## 4. Functional checks

- [x] Happy path works end to end: harness F1 (the assignee marks a date done; the function stamps `done_by` and `done_at`), G2–G3 (management hands one date to a volunteer; the volunteer records it; the usual assignee does the next week), K3 (`recurring_job_dates` lists the job's Mondays from its start)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these tables yet
- [x] Create / edit / delete all exercised (whichever the feature has): at the database layer. Jobs are inserted and updated (T1–T5), deleted when they have no history, and refused when they do (K5). Outcomes are recorded, overwritten and cleared (F1, F3, G3). Cover is set, replaced, de-duplicated and handed back (G2, G6)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; `recurring_job_staffing` reports an unassigned job as 0/0 (K4)
- [x] Invalid input is rejected with a readable message, not a crash: each function refusal is a sentence the page can show as-is, asserted word for word (F2, G1, G4, G5). Constraint violations are `check_violation`s the feature's form should catch before submitting
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): `every` 0 and 53, `month_day` 0 and 32, week 0 and 5, weekday 0 and 8 and null, empty weekdays, `ends_on` before `starts_on`, blank title and note (trimmed to null), a date before the start, a Tuesday for a Monday job, done before the day, skipped ahead, the 31st in 30-day months and February, a leap year, the year end, the last weekday of a month

### Role access matrix

Driven in the harness as real logins (JWT claims, `authenticated` / `anon` role), not by reading policies.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | tables, both functions | read all; write jobs; record any date; reassign | as expected (F3, G6) |
| management | tables, both functions | read all; write jobs (`created_by` stamped); record any date; reassign; not write history directly | as expected (F3, G2, K1, K2) |
| staff | tables, `record_recurring_job` | read all; record own jobs only, and not a date covered by someone else; no job writes; no reassign | as expected (F1, F2, G1, G3, K1, K2) |
| vet | tables, `record_recurring_job` | read all; record only if assigned | as expected (F2, K1) |
| volunteer | tables, `record_recurring_job` | read all; record a date covered by them, not the next week | as expected (G3, K1) |
| signed out | — | refused on all five objects and both functions | `42501 permission denied` (F2, K1) |

Also covered: `public_viewer`, archived and role-less logins read nothing and are refused by both functions, and none of them can be made cover (F2, G5, K1).

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): at the database, which is where these are enforced. Staff inserting a job fails row-level security. Updating one changes 0 rows. Nobody, management included, can insert or edit history or cover rows directly (`permission denied`)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature stream documents it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings. The function refusals are English and the feature decides whether to map them
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page was loaded, because nothing in `src/` references the new objects and nothing existing was altered. `app_users` and `touch_updated_at()` are only read or attached, never replaced
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates above ran on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item closes with the feature half (`claude/recurring-jobs`), not with the schema. The sick-cover requirement was added to the item on the `backlog` branch (`1501e1e`)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: computed occurrences, the single SQL evaluator, the rule subset and its anchoring/clamping choices, dates vs instants, overdue look-back, per-date cover versus editing the template or a person-level absence table, archived assignees, dependencies, who can do what, history holding the job, and how it maps onto `/my`
- [x] `README.md` still accurate: it does not list tables
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: tables and functions no screen uses yet; the feature stream writes the line when recurring jobs appear on Management and My dashboard
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** the anchoring example (19 Oct, and 12 Oct under the wrong anchor), the clamping, the time-zone independence, the overdue reset, who may record or reassign, and delete behaviour all come from the harness run and negative control above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** The dates that decide when a job falls are `date` columns, evaluated in integer day steps. The real functions were run at session time zones UTC+14 and UTC−11 and returned the same dates (R14). "Today" comes only from `shelter_today()` (0073), used for the defaults, the overdue reset and "done before its day". The Workers-side "today" belongs to the feature's loader
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary:** month days 1 and 31 in every month, weeks 1 and 4 and last (days 1–7, 22–28, final seven), `every` 1 and 52 accepted against 0 and 53 refused, the day before `starts_on`, `ends_on` inclusive, done on a past date against done on a future date
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads these tables

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, but the follow-on `claude/recurring-jobs` feature will read these tables, so production must have `0095` before that feature deploys (see §3)
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean: from the main checkout at `3b11402`, `dry-run 0095_recurring_jobs.sql … ok` (with 0092–0094, also pending on production). Then applied at Lutan's request, 2026-09-26: `applying 0095_recurring_jobs.sql … ok`, and `--status` reads `95 applied, 0 pending`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; no existing object altered
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. The new objects are safe to leave in place. Once the feature ships, dropping them would lose the record of which jobs were done

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | First draft of the rule CHECK accepted `weekly` with `weekdays` null, because a CHECK that evaluates to null passes | fixed before the first commit: `coalesce(…, false)` and explicit `is not null`; T2 asserts it |

## Left for manual verification

Empty: nothing in this change has a surface a person needs to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness summary rather than duplicating it
- [x] Handed to the production release manager: the PR states that Lutan applies it to production, before the feature deploy

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
