# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` / `deferred` with the reason.

---

## Header

| | |
|---|---|
| Feature | Management → Stock between counts: each item's count change between two stocktakes beside the planned usage for the same dates |
| Backlog item | `docs/backlog.md` → Actual usage from stocktakes, compared with planned usage |
| Branch / worktree | `claude/stock-usage` @ `C:\Development\Animal_Shelter_stock-usage` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` |
| PR | linked from the PR itself |
| Tested by / date | Claude (stock-usage session), 2026-09-26 |
| Carries a migration? | no — reads `0093_stock_counts.sql`, merged in #146 and applied to dev |
| Tested at SHA | `623ff39` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a Management page setting each medication's and diet's count change between two stocktakes beside `medication_forecast` / `diet_forecast` for the same dates, gaps over 25% marked. It matches the item **except** that it does not state actual usage: nothing records stock received (0093's comments, and the brief), so the page shows count-to-count change and says in plain words what a fall and a rise can and cannot mean. The receipts half is split out on the backlog branch
- [x] Files/areas touched listed: new `src/app/management/stock-usage/page.tsx`, new `src/lib/management/stock-usage.ts`, new `scripts/check-stock-usage.mjs`; links added in `src/app/management/{page,medications/page,diets/page}.tsx`; `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. No migration, no `worker/`, no nav change
- [x] Roles affected identified: admin and management (the page is behind `requireManagementUser`, like every /management page). Staff, vet, volunteer and signed-out are refused
- [x] Out of scope written down: stock receipts / "Record a delivery", a CSV download and a percentage column (all in the new backlog item "Record stock deliveries…"); a forecast over placement history that would include residents who have since left (the page flags those rows instead; a fix needs a schema PR); an absolute minimum-quantity floor for marking (units differ per item). No Thai manual exists in the repo — only `en.ts`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (#149 contact-channels, merge commit `623ff39`, no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 301s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration in this PR; 0093 merged in #146
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; 0093 was applied to dev with #146
- [ ] Re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; the back-filled 0093 rows on dev were read by the page (below)
- [ ] Constraints exercised in a rollback harness — n/a: no migration in this PR
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR; 0093 must be on production before this deploys (release manager: additive, merged earlier in #146)

## 4. Functional checks

- [x] Happy path works end to end. Dev had one day of history, so a back-dated stocktake was inserted into dev `stock_counts` (12 Sep 2026 10:00 Thai: Hepato 80, FBC 60, AMC 500 2, Renovit 20, Bravecto 12, Standard Kibble 1000 cups) and a real stocktake was then saved through `/stocktake` on :3014 (Hepato 25, "Saved 1 count, counted 26 Sep 2026, 16:53"). `/management/stock-usage` then showed, each checked against `medication_forecast` / `diet_forecast` run by hand over the same window: FBC 60→20, plan 14 over 14 days → "At least 26 tablet(s) more went than planned"; Hepato 80→25 (the 16:53 sheet, not the same-day 10:33 count), plan 42 → "At least 13 more"; Renovit 20→0, plan 52 over 13 days → "Fell 32 less than planned"; AMC 500 2→5 → "Stock arrived that wasn't logged"; Bravecto 12→12, plan 0 → "Nothing planned, no change"; Kibble 1000→950, plan 1948 → "Fell 1898 cup(s) less than planned". Marked rows listed first
- [x] Data persists — the saved stocktake appeared as the later count on a fresh page load, and the picker listed it as a session
- [ ] Create / edit / delete — n/a: the page is read-only; its data is written by `record_stocktake()`, exercised above through the real sheet
- [x] Empty state renders sensibly, per item: with two picked stocktakes, items counted in only one are named in "Not counted in both stocktakes: Bravecto, Renovit." and never-counted items are not listed. The whole-page "Nothing to compare yet" message was not seen — dev already had history — and is under Left for manual verification 4
- [x] Invalid input is rejected with a readable message: the same stocktake as both ends (`?from=X&to=X`) shows "Pick two different stocktakes." and falls back to the default (6 rows); `?from=nonsense&to=<unknown uuid>` falls back to each item's last two counts (6 rows) with no error and no "Comparing" line
- [x] Boundary cases checked with the real exported functions in `node scripts/check-stock-usage.mjs`, 29 cases, `all ok` in the local zone and under `TZ=UTC`: both sides of 17:00Z (01:00 Thai counts as the next day), same-day recounts, plan window = first day to the day before the second, the 25% band edge (gap exactly 25% is "as planned"), float noise (0.1 + 0.2) not read as a fall, unit changed between counts and since, hand edit a second vs a day after, departed residents counted once and only when they left after the window began
- [x] Two-stocktake mode driven: `?from=<26 Sep>&to=<12 Sep>` (reversed on purpose) compared 12 Sep → 26 Sep, with the "Comparing the stocktakes of…" line
- [x] "Plan leaves out residents" caveat driven: a temporary Hepato prescription from 1 Sep was given to an Adopted test resident (adopted 25 Sep) on dev; the Hepato row showed "The plan leaves out 1 resident…"; the prescription was then deleted. This check found defect 1
- [x] "Changed by hand" caveat driven: Bravecto's `stock_on_hand` set to 10 on dev (the same trigger the single-cell edit fires); its row showed "Changed by hand on 26 Sep 2026, after this count."

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /management/stock-usage | sees the page | driven as the dev test user (admin) |
| management | /management/stock-usage | sees the page | not driven — `requireManagementUser` admits it as on every /management page; Left for manual verification 1 |
| staff | /management/stock-usage | redirected to / | not driven — same guard; Left for manual verification 1 |
| vet | /management/stock-usage | redirected to / | not driven — same guard; Left for manual verification 1 |
| volunteer | /management/stock-usage | redirected to / | not driven — same guard; Left for manual verification 1 |
| signed out | /management/stock-usage | redirected to /login | `curl` → `307 http://localhost:3014/login?next=%2Fmanagement%2Fstock-usage` |

- [ ] Every role above tested — n/a: only admin and signed-out were driven; the other four rest on `requireManagementUser`, unchanged and shared with every /management page, and are listed under Left for manual verification. The data itself is not new exposure: 0093 already lets staff and volunteer read `stock_counts`
- [x] A role that should not have access is blocked server-side: signed-out GET is a 307 to /login from the server; the page calls `requireManagementUser()` before any query

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change; Management is a single link whose landing page gained the tile, checked at /management (tile present in en and th)
- [x] Manual updated (`src/lib/manual/en.ts`): new topic "Stock between counts" after "Doing a stocktake"; it appears at /manual in the contents and as a section
- [ ] Translatable strings through the translation path — n/a: no translatable content; the new UI strings are in the en and th dictionaries, checked on the page in Thai (Buddhist-era dates, Thai units)
- [x] Mobile viewport (375px): the LargerScreenNotice shows as on the other Management tables; after Show anyway, `document.documentElement.scrollWidth` 375 = viewport, the two tables scroll inside their own boxes (834/325, 796/325)
- [x] Browser console clean — one `ReferenceError: shelterDate is not defined` was logged during editing, in the seconds between adding its use and its import (the dev log shows it once, between 200s); every load after that was clean, and the build compiled the page
- [x] Network clean — the dev log shows every GET of the page 200 after that edit window; forecast RPC errors would surface as "Couldn't load the plan", which never appeared

## 6. Regression

- [x] Nearest pages still work: /management/medications (loaded, new link present beside Stocktake), /management (tile grid, nine tiles), /stocktake (a sheet saved end to end)
- [x] Shared file touched (`manual/en.ts`, dictionaries) checked from a second page — /manual loaded and rendered the whole manual including the new topic; /stocktake rendered from the same dictionaries
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge; `releases.ts` merged both branches' `unreleased` lines

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, saying what was and was not done; the receipts follow-up was committed on the `backlog` branch ("Record stock deliveries, so Stock between counts can state usage")
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why nothing says "actual usage", what a fall / rise can mean, the forecasts' today's-status filter and the caveat, the plan window, default pairing, the 25% threshold
- [ ] `README.md` still accurate — n/a: README does not list Management pages or stock features
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for managers: the new page, what it compares, and that it can't show what was actually used
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the forecasts' status filter was read from 0044 / 0051 and shown on dev with the adopted-resident prescription; the timestamptz type of `placement_history.start_date` was seen in dev query output (`2026-09-09 17:00:00+00`) before the fix; the plan window and 17:00Z boundary are asserted in the check script under both zones

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager (the logic is asserted against fixed instants on both sides of 17:00Z under local and `TZ=UTC` by `scripts/check-stock-usage.mjs`; only the deployed-build half remains)
- [ ] Boundary or banding change — n/a: covered in section 4 — both edges of the 25% band and both sides of 17:00Z are asserted
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted output is the gates lines and the curl line, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] Production Supabase ref read and matches — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration here; 0093 (#146) must be applied to production before this deploys
- [ ] Production dry-run — n/a: no migration in this PR
- [ ] Production backup — n/a: no migration in this PR
- [ ] Apply plan — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — deferred: release manager (Worker rollback reverts this fully; it has no schema of its own)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | "Plan leaves out residents" compared `placement_history.start_date` — a timestamptz — as a string against a date, so departures would be misdated | fixed: read as a shelter day with `shelterDate()` before comparing |
| 2 | low | "Not counted in both stocktakes" listed every never-counted item too, burying the real ones | fixed: only items counted in one of the two picked stocktakes are named |
| 3 | low | Quantities wrapped mid-figure ("60 / tablet(s)") at desktop width | fixed: figure cells don't wrap; the reading column has a minimum width |
| 4 | — | The plan for a past interval leaves out residents who have since left (forecasts filter by today's status) | accepted and flagged per row; proper fix deferred to backlog ("Record stock deliveries…" item, related note) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a management login the page opens; as staff, vet and volunteer, typing the URL lands you back on the home page | `/management/stock-usage` |
| 2 | Read the page as a manager would: does the warning, and the wording of "At least N more went than planned" / "Fell N less than planned" / "Stock arrived that wasn't logged", read as fair and not as an accusation? Same in Thai | `/management/stock-usage` |
| 3 | The back-dated 12 Sep stocktake and Bravecto's hand-set 10 are dev test data from this check; leave or clear as you like (dev data is disposable) | dev `stock_counts`, `medication` |
| 4 | On a database with no stocktake on two different days (production today), the page shows "Nothing to compare yet…" and no tables | `/management/stock-usage` on the first deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stock-usage session)  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the list has four items awaiting Lutan

Manual verification by: pending: Left for manual verification items 1–4 (other roles, the wording read as fair in en/th, dev test data, the empty page)

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1–3 fixed, 4 accepted and flagged
- [x] Checklist pasted into the PR — the PR description links `docs/test-plans/stock-usage.md`, which is in its diff
- [ ] Handed to the production release manager — n/a: not yet — handed over with the PR

Result: pass with accepted defects
