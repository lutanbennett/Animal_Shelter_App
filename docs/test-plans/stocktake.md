# Feature test plan

## Header

| | |
|---|---|
| Feature | `/stocktake`: one count sheet for every medication and diet, saved in one `record_stocktake` call. A blank row is left alone, "Same as last time" confirms an unchanged figure, and a summary shows old → new with big changes highlighted. Built for phones and open to staff and volunteers |
| Backlog item | `docs/backlog.md` → **Stocktake page: count everything in one go** (ticked here) |
| Branch / worktree | `claude/stocktake` @ `C:\Development\Animal_Shelter_stocktake` |
| Dev server | `http://localhost:3009` (`preview_start` `dev`), against dev (`qxkmhwybjggxvsfxsxbd`) |
| PR | #143 (after #140) |
| Tested by / date | Claude (automated, browser driven while signed in as Lutan's admin account) / 2026-09-26 |
| Carries a migration? | no. It depends on `0091_record_stocktake_staff.sql` (PR #140), which must merge first. 0091 is already applied to dev, and every check below ran against it |
| Tested at SHA | `af031ad` (browser checks), then merged with `origin/main` @ `6a3b8f3` as `5994cfb` (gates, logic check). The later commit adds only this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every point in the item is covered. The one deliberate difference is the roles: Lutan widened them to staff and volunteers on 2026-09-26, which is why the page is at `/stocktake`, not `/management/stocktake`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): new `src/app/stocktake/` (`page.tsx`, `StocktakeSheet.tsx`, `actions.ts`) and `src/lib/management/stocktake.ts`; `src/app/NavLinks.tsx`, `src/app/NavPane.tsx`, `src/components/hub-icons.ts` (nav entry); `src/app/management/medications/page.tsx` and `diets/page.tsx` (link); `src/lib/i18n/dictionaries/en.ts` / `th.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; new `scripts/check-stocktake-sheet.mjs`; `docs/backlog.md`, `docs/decisions.md`, this plan. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Admin, management, staff and volunteer get the page and the nav entry. Vet and public_viewer are redirected to `/`, and signed-out users to `/login`. The single stock cell on the Management tables stays management-only
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: sorting by cupboard layout (name order for now, as the item says), the link from the "stocktake every Monday" recurring job (that job does not exist yet), and catching the browser's Back button with unsaved counts (decisions.md explains why). No manual screenshot (screenshots are deferred to one full rerun)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: brought in #141 (public-site-home) with no conflicts; `releases.ts` keeps both lines. After the PR opened, a second sync brought in #142 (`scripts/worktree.mjs` and its test plans) and the backlog branch, again cleanly. Neither touches `src/`, so the gate run above still stands; CI re-runs all three on the merged tree
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`: run at `5994cfb` (merged with `origin/main` @ `6a3b8f3`), closing lines as printed: `=== gates: build exited 0 after 225s` then `gates: typecheck=0 lint=0 build=0`
- [x] CI green on the PR (runs the same three): PR #143, run 36215642602 at `0f3327a` — `check` pass (1m42s), `migration-numbers` pass. `test-plan` failed only because this plan was not yet committed; it is added in the next commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this branch; 0091 is in #140
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply from this branch
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: nothing to apply from this branch
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: nothing to apply from this branch (0091 was applied from #140's branch)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data): the sheet lists all 22 medications and 2 diets on dev, each with its unit and last count (e.g. `Bravecto | Last count 12 tablet(s) · counted yesterday`, `Standard Kibble + Chicken | Last count 1000 cup(s) · counted yesterday`) or `Never counted`
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no schema here. `record_stocktake`'s harness is `check-stocktake.mjs`, run in #140. This branch's rules are checked by `node scripts/check-stocktake-sheet.mjs` (no database), which asserts blank / whitespace / no entry → left out, Same → old figure, Same on a never-counted item → left out, typed equal figure / 0 / decimal → counted, and negative / text / `1,000` → invalid. It also covers the big-change boundaries (49% no, 50% yes, to and from 0 yes, first count no), a whole-sheet summary (blank rows absent from both lists, invalid rows reported and not sent), and the role list. Output ends `all ok`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration here; 0091's plan is in #140, and 0091 must be on production before this page is deployed

## 4. Functional checks

All on `http://localhost:3009` against dev, in the built-in browser, signed in as Lutan's admin account. Rows were read back through the Management API with a read-only `select`.

- [x] Happy path works end to end. Before: `Bravecto 12 @ 2026-09-25 11:35:35`, `FBC 20 @ 2026-08-31`, `Hepato 90 @ 2026-09-21`, `Renovit 0 @ 2026-09-25 11:35:03`, `Standard Kibble 1000`, AMC 500 never counted. On the sheet: AMC 500 typed 5, FBC Same as last time, Hepato typed 30, Diets tab Standard Kibble typed 950; **Bravecto and Renovit left blank**. The server log shows the one call: `saveStocktake([{count:5, AMC},{count:20, FBC},{count:30, Hepato}], [{count:950, Kibble}])`, with Bravecto and Renovit absent. After: AMC 5, FBC 20, Hepato 30 and Kibble 950 all at `2026-09-26 03:33:41.926296+00` (one time across both tables). **Bravecto `12 @ 2026-09-25 11:35:35.241558`** and **Renovit `0 @ 2026-09-25 11:35:03.645762`** are unchanged, count and date. The page said `Saved 4 counts, counted 26 Sep 2026, 10:33.`, and rows updated in place (`Last count 950 cup(s) · counted today`) without a reload
- [x] Data persists — reload the page and the change is still there: after navigating back to `/stocktake` and `/management/diets`, Kibble reads 950 counted today
- [x] Create / edit / delete all exercised (whichever the feature has): the sheet only records counts. Counted, confirmed, first count and left alone were all exercised above
- [x] Empty state renders sensibly (no rows yet): the footer reads `Nothing counted yet.` before any entry and after saving; Review with nothing entered says `Nothing to save yet — type a count or tap Same as last time on at least one row.` (from `openReview`). No-items and no-search-match texts exist but were not rendered: dev has items in both tabs
- [x] Invalid input is rejected with a readable message, not a crash: `1,5` on Amoxicillin flagged the row `Enter a number, 0 or more — or clear it to leave this item as it was.` (`aria-invalid`). Review was refused with `One count isn't a number. Fix it or clear it first.`, no dialog opened, and focus went to that row. Clearing it lifted the block
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): 0 and negative in the logic check. A never-counted item has its Same toggle disabled (20 disabled, 4 enabled, matching the 4 counted medications). Typing the same figure as last time counts; a 50% change is highlighted (Hepato 90 → 30, Kibble 950 → 300 in the cancelled phone check). `counted_at` is shown in shelter time (03:33Z → 10:33)

Also checked, for the item's own requirements:

- [x] **Blank vs unchanged cannot mix**: typing 7 in FBC, then tapping Same, left the input empty with placeholder `20 tablet(s), same as last time` and `aria-pressed=true`. Typing 8 then turned the toggle off (`"8","false"`), and tapping Same again cleared it (`"","true"`)
- [x] **Enter moves down the shelf**: Enter in AMC 500 focused Amoxicillin; Enter in the last Diets row focused Review and save. Inputs are `inputmode="decimal"`, `enterkeyhint="next"` (`done` on the last row)
- [x] **Tab renamed Diets → Food** at Lutan's request after the checks above (English label and the manual sentence; Thai was already อาหาร). On `/stocktake?tab=diets` the tabs read `Medications`, `Food (selected)`. The checks above ran with the old label, and the label is the only change
- [x] **Both tabs, one save**: the Medications badge kept `3` while on Diets. The footer read `3 counted · 1 same as last time` across both, and the one save wrote both tables
- [x] **Summary before saving**: `These 4 items will be saved as counted now.` / `One count changed by half or more — worth a second look.` Hepato was listed first as `90 → 30 tablet(s) Big change — check it`, then `First count: 5 tablet(s)`, `20 tablet(s), same as last time`, `1000 → 950 cup(s)`, and `22 items not counted this time — left as they were.`
- [x] **Warning before leaving**: with a count typed, clicking the Maintenance nav link called `confirm("You have counts that aren't saved. Leave and lose them?")`; answering no kept the page at `/stocktake` with the 5 still in the box. The header logo was skipped, correctly: it has `target="_blank"` and opens the public site in a new tab. The pane loads new tabs in place, which briefly looked like a failure. A synthetic `beforeunload` in the page returned `defaultPrevented: true`. The browser's own reload/close prompt could not be shown in the pane (left for manual verification)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/stocktake`, nav entry, save | yes | browser: page, nav `Stocktake /stocktake` marked current, save above |
| management | same | yes | not signed in as management; same `canStocktake` list as admin (logic check `roles`), and `record_stocktake` saves for management (#140 harness A) |
| staff | same | yes | not signed in as staff in the browser; `canStocktake('staff')` true (logic check); `record_stocktake` saves for staff (#140 harness I). Left for manual verification |
| volunteer | same | yes | as staff (#140 harness I). Left for manual verification |
| vet | `/stocktake` | redirected to `/`, no nav entry | `canStocktake('vet')` false (logic check); the page redirects on the same function; the RPC refuses vet (#140 harness G). Left for manual verification |
| signed out | `/stocktake` | `/login` | browser: `/stocktake` → `/login?next=%2Fstocktake` before Lutan signed in |

- [ ] Every role above tested — n/a: only admin and signed-out users were driven in the browser. The other roles share one tested function (`canStocktake`), used by the page, the action and the nav, and the database check for each role is in #140's harness. Seeing it as staff is in the manual table
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the page redirects when `!canStocktake(role)`; `saveStocktake` returns `notAuthorized` on the same test before calling the RPC; and the RPC refuses vet, public_viewer and role-less callers itself (#140 harness G)

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links: `Stocktake /stocktake` after Maintenance for admin, marked `aria-current="page"` on the page; gated by `canStocktake`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: new topic "Doing a stocktake" (path `Stocktake`, badges `Admin Management Staff Volunteer`). The Count steps of both Management topics now start "To count everything at once, use the Stocktake link at the top of the page", found twice on `/manual`. There is no `th.ts` manual in the repo
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no translatable database fields. UI strings are in `en.ts` and `th.ts` dictionaries, and typecheck enforces that the Thai one matches
- [x] Mobile viewport (375px) — no overflow, controls reachable: `scrollWidth - innerWidth = 0` at 375; no button or input on the sheet under 44px (inputs and buttons are 48px). The review opens as a bottom sheet with Save and Back full width. The Management link is outside the larger-screen notice and visible at 375 on both pages
- [x] Browser console clean — no errors or React warnings: `read_console_messages` with `onlyErrors` returned none after the save and on `/manual`
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: `POST /stocktake 200` for the save, `GET /stocktake 200`. The only server errors in the log were `The destination stream closed early` on `GET /`, from the pane loading the public home page in place of a new tab and being navigated away mid-stream. `/` is not touched by this branch

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/management/medications` and `/management/diets` load with the new link. `/management/diets` shows the 950 saved by the sheet. `/manual` renders. `node scripts/check-stock-reading.mjs` (the shared stock reader the sheet uses for "counted N days ago") ends `all passed`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file: the sidebar was read on `/stocktake` and seen on `/management/*` and `/manual` with every other entry present (`My tasks, Residents, Enclosures, Maintenance, Stocktake, Vets, Contacts, Projects, Management, Settings`, footer links)
- [x] Nothing merged from `main` during `sync` was broken by this branch: #141 touches the public home page and `src/lib/site/`; this branch touches neither, and the gates ran on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): ticked, with where it shipped and why it moved out of `/management`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-26 — The stocktake sheet: blank means "left alone", and it lives at `/stocktake`" — the rule, typing the same figure, commas refused, the route, both tabs in one save, the big-change threshold, and the Back-button gap
- [x] `README.md` still accurate: it does not list pages at this level
- [x] **Release notes.** Would a shelter user notice this change? Yes: `unreleased` gained "New: Stocktake, in the menu for staff, volunteers and management…"
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "a blank row is left out of the save" is the logged payload and the Bravecto/Renovit read-back above. "one time across both tables" is the shared `03:33:41.926296`. "48px targets" is the measured heights. "The browser's Back button is not caught" is reasoned from the App Router having no navigation-blocking hook; it was not tested

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the only dates are `counted_at` (a database `now()`) formatted by the shared `formatDateTime`, and "counted N days ago" from the shared `readStock`, whose shelter-day boundaries `check-stock-reading.mjs` asserts at fixed instants
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: the one threshold, big change at 50%, is asserted on both sides (49% no, 50% yes, up and down) in the logic check
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: the migration is in #140. The ordering that matters is that 0091 is applied to production before this page is deployed, otherwise staff and volunteers get `Your role can't record a stocktake.` from the RPC
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, for 0091 (#140)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration here
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy: 0091 (#140) on `dbkodyyxxhtygxcxmfcu` **before** the deploy that carries this page

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` to the previous Worker removes the page and nav entry. Counts already saved stay saved; they are ordinary `stock_on_hand` values the Management tables already read. 0091 can stay: with no page calling it, it has no effect

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | Not a defect, recorded because it looked like one: the leave warning seemed to fail on the header logo. The logo opens a new tab (`target="_blank"`), which the guard deliberately skips, and the pane opens new tabs in place | no change needed |
| 2 | Low | The browser's Back button within the app does not trigger the leave warning (the App Router has no hook to block it) | accepted: in decisions.md; reload, close, typed URL and in-app links are covered |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **staff** or **volunteer** login: Stocktake is in the menu, the page opens, and a save works. A **vet** login has no menu entry and `/stocktake` sends them to the home page | any dev port / test site |
| 2 | On a **real phone**: the number keypad appears (with a decimal point), Next moves down the list, and the rows and buttons are comfortable to tap while walking | `/stocktake` on a phone |
| 3 | With a count typed, **reload or close the tab**: the browser asks before leaving (the pane cannot show this prompt) | `/stocktake` in a normal browser |
| 4 | The **Thai** wording on the sheet reads naturally to a Thai speaker (switch to ไทย) | `/stocktake` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — four items await Lutan

Manual verification by: pending: the four items under Left for manual verification (staff/volunteer/vet roles, real phone, reload/close prompt, Thai wording)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links `docs/test-plans/stocktake.md`, which is the record
- [ ] Handed to the production release manager — n/a: not yet; that happens at the production deploy, after merge

Result: pass

Release manager acknowledgement: n/a: no release manager has read it yet
