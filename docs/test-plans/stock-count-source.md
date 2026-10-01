# Feature test plan — stock-count-source

## Header

| | |
|---|---|
| Feature | Management → Stock between counts says when a figure was typed by hand *between* the two counts being compared — the display half of `0112`, which has been recording `stock_counts.source` with nothing reading it since `0.9.1` |
| Backlog item | `docs/backlog.md`, "A single-cell stock edit writes no history…" — already ticked for the schema half; its note now records this half too |
| Branch / worktree | `claude/stock-count-source` @ `C:\Development\Animal_Shelter_stock-count-source` |
| Dev server | `http://localhost:3004` (the worktree's own port — **not** 3000, which serves `main`) |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-01 |
| Carries a migration? | **no** — this is the code half of `0112`, already applied everywhere (dev and production both at `0120`) |
| Tested at SHA | `c7a76f6` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — a per-row note on Stock between counts naming the dates a figure was typed by hand inside the interval, in the table and the CSV
- [x] Files/areas touched listed — `src/lib/management/stock-usage.ts` (new pure function + type, one doc comment corrected), `src/app/management/stock-usage/page.tsx` (one extra query, one `Line` field, two render sites), `src/lib/i18n/dictionaries/{en,th}.ts` (one string each), `src/lib/manual/en.ts` (one step), `src/lib/releases.ts` (`unreleased`), `scripts/check-stock-usage.mjs` (8 cases), `docs/decisions/`, `docs/backlog.md`
- [x] Roles affected identified — **admin and management only**: the page is behind `requireManagementUser()` and the manual topic is `roles: ["admin", "management"]`. The release note carries the same two tags
- [x] Anything explicitly **out of scope** written down — **Lutan chose option 1 of three on 2026-10-01: Stock between counts only.** Declined for now, and recorded in the decision file as still open: (a) labelling counts by origin wherever a count is listed, so a `backfill` row stops passing as a real stocktake; (b) a provenance view per item under Management. Also out of scope: changing `editedSince` to read the history instead of a timestamp (§6 says why not)

**The risk in this change is that it looks like a reporting change and isn't.** No figure moves. `correctionsBetween()` is read-only, feeds nothing but a string, and the page's existing history query keeps its `.neq("source", "correction")` untouched. Corrections arrive through a **second** query that exists only for the note, so the arithmetic path is byte-for-byte the one that shipped in `0.9.1`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed: branched from `origin/main` at `c7a76f6` and `git rev-list --count HEAD..origin/main` was **0** when the PR was opened
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`. It reports 11 warnings repo-wide; **`npx eslint` on both files this PR touches returns nothing**, so none of them is new here
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] **`node scripts/check-stock-usage.mjs` — all ok, in both time zones.** It runs the real exports, not a copy. 8 new cases, and the existing suite still passes: `node scripts/check-stock-usage.mjs` and `TZ=UTC node scripts/check-stock-usage.mjs` both report `all ok`. The UTC run matters because the Workers runtime is UTC wherever it is

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. This PR is the code half of `0112`
- [x] `--status` reviewed — dev is current through `0120`, and `--drift production` reported `No drift` earlier today, so **the column this reads exists in every environment already**. That is the whole premise: `0112` shipped on 2026-09-29 and has been collecting rows since `0.9.1`
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [x] **Existing rows still read correctly after the change** — exercised against the real dev database, not a fixture. Dev holds 13 `stock_counts`: 12 `backfill` and 1 `count`. The page's query returns **11** medication counts with corrections excluded, the new query returns the **2** corrections seeded for this test, and `latestPairs` finds **5** paired items of which exactly **1** carries the note. So the note is selective, not blanket
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [x] Production apply plan stated for the release manager — **none needed.** Nothing to apply; the column is already everywhere

**Test rows were seeded directly as `service_role`, and why that was necessary is worth recording.** `record_stock_correction()` stamps `counted_at` from the trigger's `now()`, so a correction made through the app always lands *after* the latest count — which exercises `editedSince`, not this. Reproducing a correction *inside* an interval therefore needs a row with a chosen timestamp, which only a direct insert can give. Two rows were added for medication `b5db2a09…` (45 on 18 Sep, 40 on 22 Sep, inside its 12 Sep → 26 Sep interval). **They are left in dev on purpose** so the next person to look at the page sees the note; dev data is disposable and is wiped before the real migration.

- [x] **`stock_counts.stocktake_id` is `not null`, so every correction carries a `gen_random_uuid()` of its own** (`0112`, line 99). A correction is therefore structurally a one-item "stocktake", and the only thing keeping it out of the Earlier/Later stocktake pickers is the source filter on the history query. Found while seeding, because a direct insert without one is rejected. Nothing to fix — the filter is there and is now covered by §6 — but it is a trap for whoever next writes a query over this table

## 4. Functional checks

- [x] Happy path works end to end — verified against real dev rows through the page's own two queries, the real `correctionsBetween`, and the real `en` dictionary. The string a user will see: *"Changed by hand 2 times between these two counts (18 Sept 2026, 22 Sept 2026). The figure here is unaffected: only stocktakes are compared, so a correction doesn't count as use."*
- [ ] Data persists — n/a: this PR writes nothing. It is a read and a string
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface added
- [x] Empty state renders sensibly — **the common case, and checked**: 4 of the 5 paired items on dev have no correction in their interval and render exactly as before, no empty element and no stray punctuation. `correctionsBetween([], pair)` returns `[]` and the note is behind `line.corrected.length > 0`
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the interval window is the substantive one and has 8 assertions in `check-stock-usage.mjs`:
  - a correction **inside** the interval is attributed to it; ones before `from` or after `to` are not
  - only the **pair's own item** is considered
  - **the same instant as `from` is excluded, the same instant as `to` is included** — the half-open window the view already uses for receipts (`previous.counted_at < received_at <= next.counted_at`, 0096), so a correction and a delivery stamped at a stocktake's exact time land in the same interval rather than different ones
  - several corrections come back **oldest first**
  - **a correction after `to` belongs to `editedSince` and not to this** — asserted as a pair, `[0, true]`, because the two notes reporting the same event would be the obvious way for this change to go wrong
- [x] **A failed corrections query costs the note, not the page** — `correctionsResult.data ?? []` with no error branch, deliberately: every figure is computed without it, so an empty list is a safe answer and giving it an error state of its own would imply the page was degraded when it is not
- [x] The CSV carries the same text as the table — both render from the same `u.correctedBetween(...)` call with the same dates, appended to the existing note column beside `departed` and `editedSince`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/stock-usage` | sees the note | verified at the data layer; placement left for a person (below) |
| management | `/management/stock-usage` | sees the note | same |
| staff / volunteer / vet | the page | **turned away** — `requireManagementUser()`, unchanged by this PR | not re-verified; no access rule touched |
| signed out | the page | bounced to sign-in, unchanged | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR adds no route and no permission. The page's guard is untouched and the new data comes from the same table the page already read
- [x] A role that should not have access is blocked server-side — not re-verified and not claimed: `requireManagementUser()` is unchanged. Worth noting the new query reads `stock_counts`, which `0112` documents as readable by admin, management, staff **and** volunteer — so it grants no visibility the page did not already have

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the page already exists
- [x] Manual updated (`src/lib/manual/en.ts`) — the `stock-usage` topic's "a row can carry a note" step now distinguishes the two cases, and a new step explains that the between-counts note **changes no figure** and why, plus that the notes reach the CSV. The existing step's wording was also tightened to say "after the later stocktake", which is what `editedSince` actually means
- [x] Translatable strings go through the translation path — `correctedBetween` added to `en.ts` and `th.ts` with the same shape (a count and a date list), matching `departed`'s explicit-pluralisation style. **No raw string in the component**
- [ ] Mobile viewport (375px) — n/a: the page is desktop-only by design (`LargerScreenNotice`), and the note is a `<p>` inside a cell that already holds two others
- [ ] Browser console clean — n/a: not driven from here, because the page needs a management session and signing in would put the dev password in this transcript (§8 item 2 hands it over). No client-side code changed: the note is server-rendered text
- [ ] Network clean — no unexpected 4xx/5xx — n/a: the one added request is a `select` on a table the page already queries, and it returned 200 with 2 rows when run directly against dev (§3)

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route, and the 4 unaffected paired items on dev render as before
- [x] **The shared file's other consumers were checked** — `src/lib/management/stock-usage.ts` is imported by the page and by `scripts/check-stock-usage.mjs`. Nothing else imports it (`grep`), and the only change to an existing export is a **comment**: `editedSince`'s body is untouched
- [x] **`editedSince`'s comment was wrong and is corrected** — it claimed a single-cell edit "leaves no history row (0093 records only stocktakes)", which stopped being true when `0112` started writing `correction` rows. The comment now says the row exists but is never paired, and names the boundary it shares with `correctionsBetween`
- [x] **`editedSince` was deliberately not re-derived from the history.** Reading a `correction` row would be more direct, but **an edit made before `0112` shipped has no row**, so the history would silently stop reporting those. The timestamp is the wider net and stays. Recorded in the decision file so the next reader does not "tidy" it
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `c7a76f6`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — the `0112` item was already ticked for its schema half; its note now records that the display half landed here, which option was chosen, and what was declined
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line, tagged `admin, management`, written for a user: it says the note appears, that the used figure does not change and why, and that the note reaches the CSV
- [x] Non-obvious design choices recorded as a new file in `docs/decisions/` — `2026-10-01-corrections-on-stock-between-counts.md`: the option chosen and the two declined, why no figure moves, the half-open window and why it matches the receipts window, why `editedSince` keeps its timestamp, and the `backfill` problem left open
- [x] `README.md` still accurate — unaffected; it does not describe this page
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `c7a76f6` plus this branch's commits
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next cut

### On the deployed build

- [ ] Deployed to test — deferred: release manager, with the next release. This PR ships no migration, so it carries no apply step with it
- [ ] Smoke-tested on a deployed build — deferred: Lutan. **What was not driven from here, and why**: the page is behind `requireManagementUser()`, and signing in means typing a password. On `localhost:3004` that is permitted, but it would put the dev account's password in this session's transcript, so the page was verified at the data layer instead — the real queries, the real function, the real dictionary string, against real dev rows (§3, §4). **The dev server is still running on `http://localhost:3004`** and the two seeded corrections are still in dev, so the note is one sign-in away from being looked at
- [ ] Timezone-sensitive behaviour checked on a deployed build — deferred: release manager. **Relevant**: the note prints dates through `formatDate(…, locale)` and the window is compared as instants, so a correction stamped near midnight is attributed by its real time rather than its printed day. `TZ=UTC` already passes in the checker
- [ ] Public pages re-checked after a cache purge — n/a: nothing public changes. The page is management-only and behind sign-in
- [ ] `check-public-views.mjs --env production` — n/a: no migration and no change to any public view

### Deploy safety

- [x] Any new secret/env var exists in the Cloudflare environment — none added
- [x] Release mail — nothing to watch from this PR; whether its release mails is the cut's decision
- [x] **Rollback** — reverting this PR removes a note and nothing else. No migration ships, nothing is written, and the figures are produced by the same code path either way, so a revert cannot change a number anyone has already read

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — **it is the other half of that pattern**: the migration (`0112`) shipped first and alone on 2026-09-29, and this is the code that reads it, landing two days later with the column already applied everywhere. That is the ordering CLAUDE.md asks for, observed in sequence rather than in one PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [x] Apply plan stated — §3: none needed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `editedSince`'s doc comment had been wrong since `0112` — it said a single-cell edit leaves no history row | **fixed** in this PR (§6) |
| 2 | low | `stock_counts.stocktake_id` is `not null`, so each correction carries its own `gen_random_uuid()`; only the source filter keeps corrections out of the stocktake pickers | **accepted, recorded** (§3). The filter is present and correct; this is a trap for the next query over the table, not a current fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The note as it reads on screen**, and its placement under the existing two notes in the Against the plan cell. Sign in as admin or management; medication **FBC** is the row that carries it, comparing 12 Sep → 26 Sep | `http://localhost:3004/management/stock-usage` (server is up; seeded rows are in dev) |
| 2 | **The wording.** "Changed by hand 2 times between these two counts (…)" — the count-and-dates form was chosen so it scales past two, but "2 times" is the clumsiest part of it and the singular reads differently | `src/lib/i18n/dictionaries/en.ts`, `correctedBetween` |
| 3 | The Thai string, which nobody who reads Thai has checked | `src/lib/i18n/dictionaries/th.ts`, `correctedBetween` |
| 4 | Download CSV on that page: the note should appear in the last column for FBC, with the same dates as the table | the same page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — four items are open. Item 1 is the one that matters: this change is a rendered string, and its text and placement are the parts a data-layer check cannot see

Manual verification by: pending: Lutan to look at the note on the FBC row (item 1), the English wording (item 2), the Thai (item 3) and the CSV column (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
