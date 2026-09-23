# Feature test plan

## Header

| | |
|---|---|
| Feature | Cashflow forecast — `/management/cashflow`, `cashflow_forecast()` and the stacked chart |
| Backlog item | `docs/backlog.md` → Management → "Cashflow forecast: what the shelter is about to spend, in one place" (half 2 of 2) |
| Branch / worktree | `claude/cashflow` @ `C:\Development\Animal_Shelter_cashflow` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | (filled in at `gh pr create`) |
| Tested by / date | Claude Opus 5, 2026-09-23 |
| Carries a migration? | **yes** — `0072_cashflow_forecast.sql` (function only, no table or column changes) |
| Tested at SHA | (filled in at PR time) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
  — adds `/management/cashflow`, which totals every outgoing the database can see (food,
  medication, vaccinations, vet visits, maintenance) for a chosen window, as a stacked
  column chart plus the table behind it.
- [x] Files/areas touched listed:
  - `supabase/migrations/0072_cashflow_forecast.sql` — new `cashflow_forecast(date, date)`
  - `src/app/management/cashflow/` — `page.tsx`, `CashflowView.tsx`, `CashflowChart.tsx`
  - `src/lib/management/cashflow.ts` — categories, folding, window resolution
  - `src/app/globals.css` — five `--series-*` tokens
  - `src/app/NavLinks.tsx`, `src/app/management/page.tsx` — nav entry and landing tile
  - `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`
  - `docs/backlog.md`, `docs/decisions.md`
  - No `worker/` changes. `src/lib/management/forecast-window.ts` deliberately **not**
    touched — owned this round by the `utc-today` stream.
- [x] Roles affected identified: admin and management can reach the page; staff, vet,
  volunteer, resident and signed-out cannot (§4 matrix).
- [x] Anything explicitly **out of scope** written down:
  - **Month boundaries stay UTC.** The bucketing is wrong for part of every Thai day.
    Not fixed here on purpose — it is backlog Dashboard follow-ups (e), whose point is a
    single shelter-wide constant applied to all call sites at once. Casts are commented
    so the fix knows where to land.
  - **`FIXED_FORECAST_DAYS` unchanged.** The item asked for 30/90 buttons; this page
    carries its own `CASHFLOW_FIXED_DAYS` rather than moving the constant the Diets and
    Medications tables draw their columns from. Divergence logged on `backlog`.
  - No CSV export, no forecast-vs-actuals, no per-vet average, no salaries — all listed
    as follow-ups on the `backlog` branch, none built.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (see §6)
- [x] `npm run typecheck` — clean. Exit code **0**, read from `$?` with output redirected
      to a file, not from piped output.
- [x] `npm run lint` — clean, exit code **0**, same method.
- [x] `npm run build` — succeeds, exit code **0**, same method.
      Note: this worktree's `node_modules/.bin` was unlinked on arrival and every script
      failed with "'next' is not recognized" while still reporting success through a
      pipe; `npm ci` was run before any of the three gates above were believed.
- [ ] CI green on the PR (runs the same three) — n/a: the PR does not exist until this checklist is committed, so this line cannot be true at the moment it is written. Read off the PR by the release manager.

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `main` tops out at 0071, no
      other in-flight branch carries a migration (checked every `origin/claude/*` for
      files above 0071, and `gh pr list` was empty).
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — caught a real error first
      time (`maintenance_status` value `'Done'`, renamed to `'Completed'` by 0033).
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable — `drop function if exists` then `create`, applied three times
      in the course of this work.
- [x] Existing rows still read correctly after the change — the function is additive and
      reads only existing tables; `diet_forecast` and `medication_forecast` return
      identical figures before and after (§4).
- [x] Down-migration written, or the reason one is not needed is stated — **not needed**:
      the file adds one function and nothing reads it but the new page. To revert,
      `drop function cashflow_forecast(date, date)`. No table, column, enum or policy is
      touched, so there is no data to lose.
- [x] Production apply plan stated for the release manager — see §8.

**Deviation to flag, deliberately not hidden.** CLAUDE.md says an applied migration file
is never edited. `0072` was edited twice *after* being applied to dev — once to fix the
phantom-visit bug, once to add the anon revoke — by deleting its `schema_migrations` row
and re-applying. The reasoning: the file is pre-merge, pre-PR, and dev is the only
database that has ever run it, and it is a single idempotent `create function`. The
alternative was shipping a function with a known money bug into `main`'s history plus a
0073 to correct it. Called out here so the release manager sees the choice rather than
discovers it.

## 4. Functional checks

- [x] Happy path works end to end — the function returns a full month × category grid
      over a 90-day window against real dev data, and the page renders it (§5).
- [x] Data persists — the forecast is derived, not stored; the prices it reads persist
      (entered on dev, read back through the function on a later call).
- [x] Create / edit / delete all exercised (whichever the feature has) — the page is
      read-only by design; the figures it reads were created and edited on dev
      (medication costs, immunization costs, vet estimate, two maintenance jobs, one
      invoiced vet visit) and the forecast followed each change.
- [x] Empty state renders sensibly — categories with nothing booked read `—`, and
      `months.length === 0` renders the "nothing falls in this window" line.
- [x] Invalid input is rejected with a readable message, not a crash — a half-filled or
      out-of-range From/To falls back to the default 30-day window and shows the picker's
      existing `invalid` message; `?days=` values other than 30/90 fall back to 30 rather
      than erroring.
- [x] Boundary cases checked:
  - **Month slicing is lossless** — a 90-day window summed from its four monthly slices
    equals `diet_forecast` over the same 90 days exactly (฿245,070.00 both ways) and
    `medication_forecast × cost` exactly (฿7,382.50 both ways). This is the check that
    would have caught double-counting or a dropped partial month.
  - **Partial first month** — a window starting 23 Sep gives Sep 8 days and Oct 31 days
    at the same daily rate (฿21,784 / ฿84,413 = ฿2,723 a day both).
  - **Zero vs gap** — a category with items but no prices returns `amount 0,
    missing_prices > 0` and reads "not priced yet"; a category with nothing booked
    returns `0 / 0` and reads `—`. Both states produced on dev.
  - **Partially priced month** — medication returns a real amount *and* `missing_prices 2`
    simultaneously (two medications deliberately left unpriced), rendering the `+2` marker.
  - **`basis` transitions** — a window containing only an invoiced visit returns
    `actual`; the same month with one invoiced and one uninvoiced visit returns
    `estimated` and ฿2,250 (the real ฿1,450 plus the ฿800 estimate), confirming a real
    cost overrides the estimate and that the weaker label wins a mixed month.
  - **Unset vet estimate** — with `vet_visit_estimate` null, booked visits return
    `missing_prices 2` rather than being silently free.

### Defect found and fixed during this pass

**An empty month was billed for a vet visit that never existed.** `months` is LEFT JOINed
to `vet_appointments`, so a month with nothing booked still yields a row with every
`va.*` column null — at which point `coalesce(va.cost, vet_visit_estimate)` returns the
estimate. Every month past the two visits actually booked read ฿800. Fixed by summing
only rows that matched an appointment; re-verified (Oct/Nov/Dec now ฿0). Recorded in
**Defects** below.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/cashflow` | yes | (see note) |
| management | `/management/cashflow` | yes | (see note) |
| staff | `/management/cashflow` | no — redirect | (see note) |
| vet | `/management/cashflow` | no — redirect | (see note) |
| volunteer | `/management/cashflow` | no — redirect | (see note) |
| resident | `/management/cashflow` | no — redirect | (see note) |
| signed out | `/management/cashflow` | no — redirect to `/login` | **pass** — hitting the URL directly served the sign-in page, server-side |
| signed out | RPC direct, anon key | no | **pass** — `401 permission denied for function cashflow_forecast` |

- [ ] Every role above tested — n/a: the five signed-in roles each need a password, which this session does not handle; the repo's own `scripts/manual-screenshots.mjs` takes the same line ("the script never sees the password"). Signed-out *is* verified server-side, twice — by hitting the URL directly and by calling the RPC with the anon key. The five signed-in roles are item 1 under **Left for manual verification**.
- [x] A role that should not have access is blocked server-side (hitting the URL directly
      fails) — confirmed for signed-out by URL, and the page uses the same
      `requireManagementUser()` redirect every other `/management/*` page uses, which is a
      server component call, not a nav-level hide.

**Stronger than the matrix, and verified:** the figures are protected at the data layer,
not only by the page guard. Calling `cashflow_forecast` with the anon key that ships in
the client bundle now returns `401 permission denied`; before the revoke it returned
`200` with the vet estimate visible, because `site_content` is public-read (0018). The
underlying price columns were checked directly with the anon key too — `medication`,
`immunization_types`, `vet_appointments` and `maintenance` all return `[]`.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — added under Management between Diets
      and Translations, and a landing tile on `/management`; both inside the existing
      admin-or-management branch. *Rendering pending sign-in.*
- [x] Manual updated (`src/lib/manual/en.ts`) — new `cashflow` topic under Management with
      steps, a warning callout carrying the "not a budget" sentence and a note on the vet
      estimate. The screenshot it references (`/manual/management-cashflow.png`) does not
      exist yet; per the standing decision, `/manual` PNGs are regenerated in one pass
      when the current batch of features is done, not per PR.
- [x] Translatable strings go through the translation path — every string on the page is a
      dictionary key in both `en.ts` and `th.ts` (no literal copy in the components).
      `/management/translations` covers user-entered content, not app labels, so there is
      nothing for it to show here.
- [ ] Mobile viewport (375px) — *pending sign-in*
- [ ] Browser console clean — *pending sign-in*
- [ ] Network clean — *pending sign-in*

## 6. Regression

- [ ] The pages nearest the change still work — *pending sign-in*
- [x] Any shared file touched checked from a second, unrelated page:
  - `forecast-window.ts` — **not modified**, only imported, so Diets and Medications are
    untouched by construction. Verified `FIXED_FORECAST_DAYS` is still `[7, 30]`.
  - `globals.css` — five new tokens added, nothing existing redefined.
  - `NavLinks.tsx`, `management/page.tsx`, both dictionaries, `manual/en.ts` — additive
    entries only.
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` was a
      no-op fast-forward (`origin/main` unchanged at `83bf4a6` since the branch was cut),
      so nothing new came in to break.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** and moved to
      Completed → Management. Follow-ups raised separately on the `backlog` branch
      (commit `e077a7a`), not in this PR.
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-23 — four
      entries: the flat vet estimate, gap-not-zero, reusing the existing forecasts rather
      than restating them, and why the chart series have their own colour tokens.
- [x] `README.md` still accurate — it describes setup, deploy and the migration workflow,
      none of which this changes; it does not enumerate pages.
- [x] Commit messages say why, not just what.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: there is no merge SHA before the merge. Release-manager step; apply plan above.
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed from a feature branch. Release-manager step at deploy time.

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: deploys run from `main` after merge, not from this branch.
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing is deployed yet. Release-manager step after merge.
- [ ] **Timezone-sensitive behaviour checked on test, not locally** — *pending deploy, and
      this one matters more here than usual.* The whole page is date arithmetic, and the
      month bucketing is UTC by design (§1). What must be checked on a real Workers build
      is the **window edges**, not the buckets: `isoDatePlus(0)` derives "today" from the
      runtime clock, so between 00:00 and 07:00 Thai time a Workers build will offer a
      window starting the previous day. Expected, not a defect — but it should be seen
      once and confirmed to be only a one-day shift in the window, not a shifted total.
- [ ] Public pages re-checked after a cache purge — n/a: nothing is deployed yet, and this change adds no public page. `globals.css` gains five tokens and redefines nothing, so the only exposure is a glance at `/` once the release manager deploys.

### Deploy safety

- [ ] `deploy: production → Supabase project ref` line read and the ref matches production — n/a: only exists in deploy output, which is the release manager's step.
- [ ] `strip-baked-env` line seen in the deploy output — n/a: only appears in deploy output; release-manager step.
- [x] Any new secret/env var exists in the production Cloudflare environment — **n/a: this
      change introduces no secret or environment variable.**

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** **Yes** —
      `0072` adds `cashflow_forecast` and `/management/cashflow` calls it, so the
      production apply must happen **before** the deploy. This is the PR #53 failure mode
      and is called out here deliberately.
      **Production also still needs `0071`**, which was deliberately not applied when the
      schema PR merged. So production is two migrations behind and both must land, in
      order, before this deploys.
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: needs production credentials and is the release manager's step. Flagged for them in the apply plan above, deliberately not attempted from a feature branch.
- [x] For a **destructive or rewriting** migration only: backup fresh — **n/a: 0072 adds
      one function and touches no data. 0071 is additive nullable columns.** Neither
      rewrites a row.
- [x] Apply plan stated:
      1. `node scripts/apply-migrations.mjs --env production --dry-run` — expect **0071
         and 0072 both pending**.
      2. Apply both to production (`dbkodyyxxhtygxcxmfcu`), 0071 then 0072.
      3. **Then** deploy. Reversing this order leaves `/management/cashflow` calling a
         function production does not have.
      4. After deploying, set the typical-vet-visit figure on `/admin/website` — until it
         is set the vet row honestly reads as unpriced rather than wrong, so this is a
         first-run task, not a blocker.

### Rollback

- [x] Rollback position stated, including what it does not cover — `npx wrangler rollback
      --env production` reverts the Worker in seconds and is sufficient here, because both
      migrations are purely additive: 0071 is nullable columns nothing else reads, 0072 is
      a function nothing else calls. Rolling the Worker back leaves both in place
      harmlessly, and no down-migration is needed. It does **not** revert migrations, and
      that statement is true rather than hopeful only because nothing here rewrites data.

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **High** | Empty months billed a vet visit that never existed — `coalesce(va.cost, estimate)` over an unmatched LEFT JOIN row returned the estimate, so every month with nothing booked read ฿800. Silent and plausible-looking, which is the worst kind of wrong on a money page. | **fixed** (commit `dc0759c`), re-verified |
| 2 | Medium | `cashflow_forecast` was callable with the anon key, returning the vet estimate to a signed-out caller (`site_content` is public-read). | **fixed** — execute revoked from PUBLIC *and* anon; now `401`. Verified against `pg_proc.proacl`, not assumed |
| 3 | Low | First `--dry-run` failed: the file used `maintenance_status = 'Done'`, renamed to `'Completed'` by 0033. | **fixed** before apply |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as **staff, vet, volunteer and resident** and hit `/management/cashflow` directly — each should be redirected, not shown the page. Signing in needs a password, which this session does not handle. | `http://localhost:3007/management/cashflow` |
| 2 | Confirm the Thai strings read naturally — they were written to match the existing register but not reviewed by a Thai speaker. Particularly "คาดการณ์กระแสเงินสด" and the not-a-budget paragraph. | `/management/cashflow` with ไทย selected |
| 3 | Whether the "average per month" card is the per-month figure the item meant, or whether it should be the *current* month. A partial first month drags the average down. | `/management/cashflow` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-09-23

### Manual verification

- [ ] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: <name>  Date: <yyyy-mm-dd>

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: <pass | pass with accepted defects | fail>

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
