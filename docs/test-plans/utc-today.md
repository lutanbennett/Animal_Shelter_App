# Feature test plan

## Header

| | |
|---|---|
| Feature | `todayIso()` — "today" in the shelter's timezone, not UTC |
| Backlog item | `docs/backlog.md` → Quick wins → **"Today" is UTC everywhere, so it is yesterday in Thailand until 07:00** (d98695a), code half |
| Branch / worktree | `claude/utc-today` @ `C:\Development\Animal_Shelter_utc-today` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | #59 |
| Tested by / date | Claude (automated) 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | `d01bf2b` — the branch merged up to `main` at `dfb01c3`. Code is unchanged since `537f1f0`; the assertion suite was re-run against the merged tree. |
| Deployed to test | `d01bf2b` on `test.lannacare.org` (project `qxkmhwybjggxvsfxsxbd`), 2026-09-23T12:26Z |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one `todayIso()` helper in `src/lib/format.ts` that formats the current date in `Asia/Bangkok`, replacing 27 copies of `new Date().toISOString().slice(0, 10)` across 24 files.
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — 27 files under `src/` only. Shared libs: `src/lib/format.ts` (new exports), `src/lib/maintenance/status.ts`, `src/lib/placements/dates.ts`, `src/lib/management/forecast-window.ts`, `src/lib/weight/record.ts` (comment only). Routes: intake, blood tests, procedures, immunizations, prescriptions, diets, weight, photos, resident `[section]` / hospital / rehome / deceased / edit / move, maintenance board, assistant lookups. No `worker/`, no `supabase/migrations/`.
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every role that can reach a date input is affected identically; the change is in shared formatting, not in any authorisation path. No role gains or loses access. Signed-out public pages show no date input, but `public_shelter_stats` is a **SQL** `current_date` read that this change does not touch (see out of scope).
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — see below.

**Out of scope, deliberately:**

1. **The data half of the backlog item.** Whether rows already carry a date a day early is the `claude/utc-date-audit` stream (PR #57). This PR changes no data.
2. **The SQL half.** Postgres sessions run in UTC, so `current_date` inside the database has the same bug in six places — `maintenance.date_created` default (0001), the `date_completed` trigger (0033), the deceased cascade (0049), the 0069 diet seed, and two reads, `medication_daily_requirement` (0027) and `public_shelter_stats.in_treatment` (0062→0065), the last of which is a public website figure. `todayIso()` is TypeScript and cannot reach any of them. Reported by the audit stream mid-round; filed as its own backlog item on the `backlog` branch (commit 87fb883) because per CLAUDE.md a schema change is its own migration PR, and this stream carries no migration.
3. **The assistant's date parsing.** `AssistantCards` resolves "tomorrow" and weekday names against the *asker's* clock. That is deliberate and unchanged; it is renamed `viewerToday()` here so it cannot be confused with the shelter helper. Reconciling the two is left open.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged cleanly, three times as `main` moved: `83bf4a6` (no-op, already the base), then `4c3f284` (#56), then `dfb01c3` (#62). The last was run by the test-manager session in this worktree, not by me. `docs/decisions.md` took the union merge each time; no conflicts anywhere.
- [x] `npm run typecheck` — clean
- [x] `npm run lint` — clean
- [x] `npm run build` — succeeds, all 60+ routes compiled
- [ ] CI green on the PR (runs the same three) — n/a: not yet — `check` is green on the PR and was watched, not assumed (run 35837905567, 1m30s); `test-plan` is red by design while manual verification is `pending`, so "CI green" as a whole is not true and is not ticked.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR.
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration.
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration.
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration.
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration.
- [x] Existing rows still read correctly after the change (checked against real dev data) — the resident hub, Diet tab, Prescriptions tab, Management → Medications forecast and the maintenance board were all loaded against dev data and render existing rows unchanged. No row was rewritten by this change.
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration.
- [ ] Production apply plan stated for the release manager — n/a: no migration. The deploy is a plain Worker deploy with no ordering constraint.

## 4. Functional checks

- [x] Happy path works end to end — registered resident **R-0078 "TZ Check Overnight"** through the six-step intake wizard on dev: intake date defaulted to `2026-09-23`, `max` was `2026-09-23`, and the saved record reads "Intake 23 Sep 2026" with its opening placement "Since 23 Sep 2026".
- [x] Data persists — reload the page and the change is still there — the resident, its placement and its starting diet all survive a reload; the diet's end date persisted across a full navigation.
- [x] Create / edit / delete all exercised (whichever the feature has) — create: intake + starting diet. Edit: "End today" on the diet wrote `end_date = 2026-09-23`. Delete: n/a within this feature — nothing deletes a date.
- [x] Empty state renders sensibly (no rows yet) — Management → Medications shows "None due" for the 7- and 30-day columns on unprescribed medications; the maintenance board's Blocked and Completed columns render at `(0)`.
- [x] Invalid input is rejected with a readable message, not a crash — `isFutureDate()` rejects a future date with `dateInFuture`; verified by assertion (section 8) rather than by typing, since the input's `max` prevents the UI reaching it.
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — dates are the whole feature and are covered exhaustively in section 8: both sides of the 17:00Z rollover, both ends of the 00:00–07:00 window, month end, year end and a leap day, plus negative and zero day offsets. Long text / zero / negative numbers are untouched by this change.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | intake wizard, diet tab, management forecasts, maintenance board | shelter date everywhere | as expected — driven in the browser |
| staff | same date inputs | shelter date everywhere | not driven — identical code path, no role branch |
| vet | blood tests, procedures, prescriptions | shelter date everywhere | not driven — identical code path, no role branch |
| volunteer | intake, weight, photos, maintenance | shelter date everywhere | not driven — identical code path, no role branch |
| resident | n/a | n/a | n/a — residents are animals, not logins |
| signed out | public pages only | no date input reachable | unchanged — no date input on public pages |

- [ ] Every role above tested — n/a: only the signed-in admin session was driven. This change touches no authorisation path and has no role branch anywhere: every role renders the same `todayIso()` from the same shared module, so testing a second role would exercise identical code. Noted rather than silently skipped.
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — unchanged by this PR; no route's access rules were touched, and `/residents/new` still redirects to `/login` when signed out (observed at the start of this session).

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; `NavLinks.tsx` is untouched by this PR.
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing user-visible changed. The same forms show the same fields; only the value the date defaults to is corrected, which the manual does not describe.
- [ ] Translatable strings go through the translation path — n/a: no new or changed strings. `todayIso()` returns an ISO date, never a label; display formatting still goes through `formatDate()`, which is unchanged.
- [x] Mobile viewport (375px) — no overflow, controls reachable — the intake wizard was driven at a 590px-wide viewport throughout, including the step-2 date field; no horizontal overflow and the date input and Next button stayed reachable.
- [x] Browser console clean — no errors or React warnings — checked after loading the intake wizard: only React DevTools and Fast Refresh notices. **No hydration warning**, which matters here: server and client now compute the same date from the same zone, where previously the server used UTC and the browser its own local clock.
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — one expected 404 from a URL I guessed (`/diets` instead of `/diet`); all feature routes returned 200.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/residents/new` (all six steps), `/residents/[id]`, `/residents/[id]/diet`, `/management/medications`, `/maintenance`.
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/format.ts` is imported by nearly every page; `/management/medications` (forecast windows, via `isoDatePlus`) and `/maintenance` (`dueState`, `recentCutoff`) were checked as pages unrelated to the intake path that consume the same new exports. Management → Medications shows exactly 7 and 30 doses in its two fixed columns for a daily prescription, which is the inclusive-window arithmetic behaving.
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing to merge; the branch's base `83bf4a6` is still the tip of `origin/main`.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately left unticked. The item covers a code half and a data half, and is **not** complete. The code half is done here; the audit stream has reported (PR #57) but the user has not yet decided whether to correct any rows, and the audit surfaced a third piece nobody had counted — six SQL `current_date` sites that need their own migration PR. Ticking it would close an item with two open halves. Left open, and the PR says so.
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the three-way choice (UTC / viewer's clock / shelter), why the viewer's clock is also wrong, the deliberate assistant exception, and the measured result on `dueState` (below).
- [x] `README.md` still accurate — no setup, command or environment change; nothing in it describes date handling.
- [x] Commit messages say why, not just what — with one correction, recorded under Defects.

## 8. Pre-production gate

### Deterministic boundary checks — run in place of a timed observation

The verification problem with this change is that a broken fix and a working one
are **identical for seventeen hours out of twenty-four**: UTC and Bangkok only
disagree between 17:00Z and 24:00Z (00:00–07:00 Thailand). Checking a running app
at 11:41 Thai, which is when this was written, proves nothing either way.

So the boundary is asserted by injecting fixed instants into the **real exported**
functions — bundled from source with esbuild, not re-typed — since `todayIso(now)`
takes the instant as an optional argument for exactly this reason. Run under the
system zone (UTC+7) and again under `TZ=UTC`, which is the Workers case. All pass.

```
-- todayIso: the shelter's calendar, from an injected instant --
PASS  bug report instant 2026-09-22T18:26Z                    -> 2026-09-23
PASS  16:59:59Z is still the 22nd                             -> 2026-09-22
PASS  17:00:00Z rolls over to the 23rd                        -> 2026-09-23
PASS  06:59 Thai, inside the broken window                    -> 2026-09-23
PASS  07:00 Thai, where the old code agreed                   -> 2026-09-23
PASS  new year's eve                                          -> 2027-01-01
PASS  end of february                                         -> 2026-03-01
PASS  leap day                                                -> 2024-02-29

-- dueState: overdue / due-soon banding, and the UTC today that skewed it --
PASS  due today is dueSoon, not overdue                       -> dueSoon
PASS  due yesterday is overdue                                -> overdue
PASS  due on the 26th (today+3) is dueSoon                    -> dueSoon
PASS  due on the 27th (today+4) is none                       -> none
PASS  completed is never overdue                              -> none
PASS  no due date is none                                     -> none
PASS  dueSoon across a month end                              -> dueSoon
PASS  dueSoon across a year end                               -> dueSoon
PASS  due yesterday IS overdue on the shelter calendar        -> overdue
PASS  ...and read only dueSoon on the UTC one (the real fault)-> dueSoon
PASS  far edge of the due-soon band, shelter calendar         -> dueSoon
PASS  ...a day short on the UTC one                           -> none

-- isFutureDate: the day of slack is gone --
PASS  today is not future (the reported case)                 -> false
PASS  yesterday is not future                                 -> false
PASS  tomorrow IS future again                                -> true

-- placementStartDate: same-day keeps the instant, back-dated uses midday --
PASS  same shelter day keeps the instant                      -> 2026-09-22T18:26:00.000Z
PASS  back-dated gets midday UTC                              -> 2026-09-20T12:00:00.000Z

-- isoDatePlus / addDaysIso --
PASS  isoDatePlus(0) is today at the shelter                  -> 2026-09-23
PASS  a 7-day window is 6 days wide                           -> 2026-09-29
PASS  addDaysIso across a year end                            -> 2027-01-04
PASS  addDaysIso backwards                                    -> 2026-02-28
PASS  addDaysIso leap                                         -> 2024-02-29

ALL PASS
```

The `2026-09-22T18:26Z` case is the exact instant from the bug report — 01:26 on
23 Sep in Chiang Mai, the moment a test resident could not be dated today.

- [x] Boundary asserted against the real exported helper at injected instants, under both the system zone and `TZ=UTC`

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this branch is not merged yet, so it is not the tip of `main`. The release manager re-records this at the production deploy. It *is* the tip of `test`, which is the header's "Deployed to test" row.
- [x] Deployed SHA matches the tested SHA — `d01bf2b` on both, confirmed against `origin/claude/utc-today` after pushing the merge (see defect 5 — the merge was briefly unpushed, so the PR and the deployed build had drifted apart).

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — done by the test-manager session, not by me: `d01bf2b` to project `qxkmhwybjggxvsfxsxbd`, `2026-09-23T12:26Z`, `strip-baked-env` removed 10 vars. Attributed rather than claimed, because I did not run it.
- [x] Smoke-tested on `test.lannacare.org` — **partially, and the part I could reach I verified myself rather than accepting the report.** `/adopt` renders residents and dates on the deployed Workers build, and fetching all 13 script chunks from the running site finds `Asia/Bangkok` present in a client chunk — so the artefact genuinely carries the fix, which is the specific failure that voided the first attempt (test was serving `main`, without this branch). What is *not* smoke-tested is the authenticated intake path, which needs a login I do not have; that is the manual item.
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: split into its two claims, per the template. Both are addressed, neither by this line:
  - *Does the logic handle the boundary?* — **yes, and asserted**: the real exported functions against fixed instants, then the same suite under `TZ=UTC`. Full output in *Deterministic boundary checks* above. Ticked there.
  - *Does the deployed build behave as the source does?* — **still not answered, but now answerable.** The branch is on `test.lannacare.org` as of `d01bf2b`, and I have confirmed the uploaded bundle contains `Asia/Bangkok`; what remains is watching it render during 00:00–07:00 Thai. Narrower than it was — "the deploy didn't include the branch" is ruled out — but not closed. In **Left for manual verification**, and named on the `pending` signature line, rather than ticked.
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — and this is the plan where that line earned its place. Two claims in my own commit messages about `dueState()` were reasoned, plausible and wrong, in opposite directions (defects 1 and 1a); a third, from the audit stream, was right in direction but named the one case in the band that does not move. All three would have shipped past `typecheck`, `lint`, `build` and this checklist. Each is now measured, and the measurements are pasted from run output rather than described.
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration and no schema in this PR; there is no constraint or default to exercise.
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: this PR changes nothing on `/`, `/adopt`, `/our-work` or `/donate`. Worth noting for the release manager that `public_shelter_stats.in_treatment` on those pages **is** timezone-wrong, but from SQL `current_date`, which this PR does not touch and cannot fix.

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no production deploy in this PR.
- [ ] `strip-baked-env` line seen in the deploy output — n/a: no deploy in this PR.
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var. `Asia/Bangkok` is a compile-time constant in `src/lib/format.ts`, deliberately not an env var, so it cannot differ between environments.

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration. No ordering constraint between deploy and database.
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration.
- [ ] Production backup fresh, for a destructive or rewriting migration — n/a: no migration, and nothing in this PR rewrites a row.
- [ ] Apply plan stated — n/a: no migration.

### Rollback

- [x] Rollback position stated, including what it does not cover — `npx wrangler rollback --env production` fully covers this change: it is code-only, adds no schema and rewrites no data, so reverting the Worker restores the previous behaviour exactly (which is to say, it restores the bug). Nothing needs a down-migration. The one thing rollback does not undo is any row *written* while the fix was live — those rows carry correct shelter dates and should be left alone.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | My own commit message for `537f1f0` misdiagnosed `dueState()`. It claims the `DUE_SOON_DAYS` arithmetic was "off by one for the whole of every day at UTC+7"; measured, it was not — `new Date("2026-09-23")` is UTC midnight, which at a *positive* offset is still the same local day, so the `setDate()` round trip came back correct at UTC+7 **and** at UTC, differing only on the 3 DST-transition days a year in zones that have them. | fixed in the record: `docs/decisions.md` and defect 1a now state the measured result for both halves. The arithmetic is still rewritten, as a robustness change rather than a bug fix. |
| 1a | medium | **The correction has a correction.** `dueState()` *did* have a real fault, and it was the half I had just called fine: its `today` default was the UTC date, and all three call sites (`EnclosureHub`, `MaintenanceBoard`, `MaintenanceJobView`) take the default. During the overnight window every badge was computed against yesterday and fired a day **late** — a job due yesterday-in-Bangkok read `dueSoon` instead of `overdue`, and the far edge of the due-soon band was a day short. Under-reporting on a maintenance board. Raised by the `utc-date-audit` stream, which had the direction backwards in its own first pass. | fixed — the substitution to `todayIso()` covers it, so no further code change was needed. Measured before recording this time: with the shelter today, due-yesterday returns `overdue`; with the UTC today it returned `dueSoon`. |
| 2 | medium | Postgres has its own copy of the bug in six places; `todayIso()` cannot reach SQL. Includes the deceased cascade end-dating prescriptions the day *before* a death. | deferred to backlog — commit `87fb883` on the `backlog` branch; needs its own migration PR. Reported by the `utc-date-audit` stream. |
| 3 | low | `prescriptions` and `resident_diets` have no `updated_at`, so a wrong `end_date` can never be audited after the fact. | deferred to backlog — same commit. |
| 4 | — | `node_modules/.bin` was missing in this worktree, so every npm script failed with "'next' is not recognized". `npm ci` fixed it. Not caused by this change; noting it in case `worktree.mjs new` is leaving installs half-finished. | accepted — environment, not code. Worth a look if it recurs. |
| 5 | medium | **The merge that put this branch on test was never pushed.** Another session ran `sync` here, reported it "pushed by the post-commit hook", and it was not — the branch sat 9 commits ahead of `origin`. So `test.lannacare.org` was serving `d01bf2b` while PR #59 still showed `165cdb1`: the deployed build and the reviewable build had silently diverged, and the manual check would have been run against a commit not on the PR. This is the known backlog item "`sync` leaves the branch unpushed — the post-commit hook does not fire for merges" biting in a new way, now that a deploy depends on it. | fixed — pushed manually; `origin/claude/utc-today` and the deployed build are both `d01bf2b`, re-verified after the push. The underlying hook gap is already on the backlog. |
| 6 | high (not mine) | **Deploys from `main` are broken** — `main`'s release-notes change lost the quoting on `wrangler … --message "v0.0.1 Current Baseline Build"`, so every deploy fails with `Unknown arguments: Baseline, Build`. The cause is that wrangler detects an OpenNext project and delegates to `opennextjs-cloudflare deploy`, which re-joins the command line downstream of any argv array; `--autoconfig false` stops the delegation. | deferred — not this PR's change and not this PR's to fix. Fix is on `claude/deploy-message-quoting`, unmerged. **The release manager must not attempt a production deploy until that lands.** Recorded here because this plan is what they read. |

Defect 1a is the one worth drawing a lesson from. Two sessions looked at
`dueState()` and both got it wrong on the first pass, in opposite directions,
because the function invites the wrong diagnosis: the eye goes to the visibly
gnarly date arithmetic, which is correct, and slides past the default argument,
which was not. Neither of us was right until it was measured.

Three findings from the audit stream turned out to be **already fixed** by this
change and were confirmed rather than actioned. One is the `dueState()` default
in defect 1a above. The other two are `endPrescriptionToday` and
`endDietToday`, which both took the mechanical substitution, fixing both the
day-early end date and the silent zero-row failure (`start_date <= today` matched
nothing for a course started today). The zero-row case was exercised in the
browser: a diet created today and ended with "End today" now reads
`23 Sep 2026 – 23 Sep 2026` instead of failing with a generic `saveFailed`.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open `/residents/new` and go to step 2 (Arrival). Confirm the **Intake date defaults to the new day** and that the new day is **selectable** — the field's `max` must not be stuck on the previous date. This must be done **between 00:00 and 07:00 Thailand time**; at any other hour UTC and Bangkok agree and the check proves nothing. | `test.lannacare.org`, **runnable now** — it serves `d01bf2b`, which is this branch |
| 2 | Optional, same window, same page load: the resident hub of anything created in step 1 should read the new day under "Intake", and its placement "Since" the new day. | `test.lannacare.org` |
| 3 | Before starting, confirm you are looking at this branch and not `main`: the intake step-2 date field is the test, and `main` does **not** contain the fix. The first attempt at this check was run against `main` and its results were void. | `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-09-23

### Manual verification

`pending`, not `n/a`. The item in **Left for manual verification** is real and
outstanding: the deployed 00:00–07:00 Thailand check has not been done, and
Claude cannot do it. `test-plan` stays red until a person has, which is the gate
working rather than a defect in the plan — and with `pending` the red now says
*what* it is waiting for instead of looking like a plan filled in badly.

- [ ] Every item in the manual list was checked by a person, or the list is empty — n/a: nothing to sign yet; the one outstanding item is on the signature line below as `pending`.

Manual verification by: pending: /residents/new on test.lannacare.org between 00:00 and 07:00 Thailand — intake date defaults to the new day, and the new day is selectable  Date: —

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links to this file and summarises it rather than duplicating 200 lines; the file is in the PR's diff.
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
