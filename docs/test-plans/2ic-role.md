# Feature test plan

## Header

| | |
|---|---|
| Feature | R4, the 2IC: the third configured role, with four jobs (Do Stocktaking, Do the Purchasing, Record a Delivery, Do Maintenance) over the four screens that were built waiting for her |
| Backlog item | `docs/backlog.md` → the roles item "Roles build, then one role at a time" (status line added, deliberately **not ticked**: Management and Admin remain). The card-by-card stocktake item under Medical records is not ticked either: its part (3) is not this change |
| Branch / worktree | `claude/2ic-role` @ `C:\Development\Animal_Shelter_2ic-role` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0143_2ic_role.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan; `origin/main` was already merged at sync |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a `second_in_command` role (borrowing `volunteer`) whose home is four job tiles, with the cells, price-free views, policies and function guards that let her count stock, read what to buy, record a delivery and run the maintenance board, and nothing else
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0143_2ic_role.sql`, `src/lib/permissions/jobs.ts`, both dictionaries (`appHome.jobs`), `src/app/stocktake/page.tsx`, `src/app/deliveries/page.tsx` and `actions.ts`, `src/app/management/purchasing/page.tsx`, `src/app/api/photos/[fileId]/route.ts` (the three stock pages and the photo proxy now read the views), `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`, `scripts/check-2ic-role.mjs` (new), `scripts/check-permission-tables.mjs` (a baseline fix), docs. No `worker/`
- [x] Roles affected identified: the new 2IC; admin, management, staff, vet, volunteer and a login with no role were probed to show nothing changed. **Admin, management and staff now read the same three pages through views instead of the tables**: same columns, and no price column was ever on those pages
- [x] Anything explicitly **out of scope** written down: photos on a job and Delete job (not hers; the board still offers both), `recurring.manage` (P2), stock correction and every Management stock page, the rota picker for a role key (Defects #3), a login-creation UI, the Head of Medical's label photos (probably the same blank, unchecked)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 33s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0142`), and no other in-flight branch carries one: `check-migration-numbers` ran on the commit hook ("`0143_2ic_role.sql` against origin/main `54f8b3e5`"); the brief named this stream as the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 142 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0143_2ic_role.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`. **The file was edited after that apply** (the forecast wrappers and the stamp trigger, found in the browser) and the changed sections were re-run on dev by hand; the file is unmerged and only dev had it. Dev equals the file; the decision file says so
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `on conflict do nothing`, `create or replace view / function`, `drop policy if exists` before each policy; sections 5 and 6 were run twice
- [x] Existing rows still read correctly after the change (checked against real dev data): stocktake, deliveries and purchasing loaded dev's real medications, diets, vendors, receipts and counts as the 2IC
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-2ic-role.mjs` → `313 checks held, 0 failed`. Ten principals under their own JWTs (the 2IC; three roles built in the transaction that each hold ONE stock cell; admin; management; staff; volunteer; a vet; no role). It asserts the views, counts, conversions and receipts read, a delivery inserts **with its unit stamped** and deletes, `record_stocktake()` runs, both forecast wrappers answer; that `cost_per_unit` and the diets' daily quantities are not readable through either view; that she cannot read `medication`, `diet_types`, contacts, residents, weight, prescriptions, attachments or the assistant, correct a stock figure, write a medicine or a conversion, change a delivery, delete a job or add a job photo, or set up a recurring task; **that the two forecast wrappers return what management's originals return**; that the one-cell roles can each do their own job and not the others'; that nothing changed for admin, management, staff, volunteer, vet and no role; and that her cells equal `bundleOfRole()`
- [x] Down-migration written, or the reason one is not needed is stated: the header names the undo (drop the three views, two functions and five policies, restore `record_stocktake()` from `0134` and the stamp trigger from `0096`, delete the role's cells and row); additive
- [x] Production apply plan stated for the release manager: apply `0143` to production from the main checkout after the merge, `--dry-run` first, **before** the deploy because the three pages now read the views. It prints a consumer warning, the safe direction

## 4. Functional checks

- [x] Happy path works end to end: signed in as a throwaway 2IC login on dev at 375 px: Home shows four tiles; **Stocktake** loaded the cards, a count of 7 was saved through `record_stocktake()` and the list then read "Last count 7 · counted today"; **Purchasing** loaded with an item and its working (last count, received, safety stock, lead time); **Deliveries** went through all six steps (Medicine, FBC, 3 packets, today, no details) and recorded 3 packets = 150 tablets
- [x] Data persists — reload the page and the change is still there: the stocktake count and the delivery were read back (the delivery's unit was null at first, Defects #1, and is stamped after the fix)
- [x] Create / edit / delete all exercised (whichever the feature has): create driven in the browser (a count, a delivery); delivery **delete** driven at the database in the harness, not in the browser
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list; the three pages' empty states are unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input field or rule was added to any screen
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input rule changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| 2IC | Home, `/stocktake`, `/deliveries`, `/management/purchasing`, `/maintenance`, `/my`, Residents (who and where), Enclosures, `/management` | reads and does her four jobs | passed: the job pages and `/my` returned 200 and the three stock screens were driven; `/management` returned 200 (its contents were not read) |
| 2IC | `/management/medications`, `/diets`, `/stock-usage`, `/contacts`, `/dashboard`, `/recurring-jobs`, `/medication-list`, `/medical/weight`, `/admin` | refused | passed: each fetched directly with her cookie and returned the no-access page |
| admin | the three stock pages and their writes | unchanged | passed at the database under its own JWT (`check-2ic-role`); not driven in the browser |
| management | the three stock pages and their writes, and the originals of the forecasts | unchanged | passed at the database; the forecast comparison ran as management |
| staff | stocktake and deliveries; **not** purchasing (staff has never held `stock.purchasing`) | unchanged | passed at the database |
| vet | none of the stock views | unchanged | passed at the database (a vet still reads `medication` and `diet_types` by its own policies) |
| volunteer | none of the stock views | unchanged | passed at the database |
| signed out | nothing | unchanged | not exercised: no route changed |

- [x] Every role above tested: at the database, under each role's own JWT in one transaction; in the browser (and by direct fetch) only as the 2IC
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): her refused URLs were fetched directly, not hidden in the UI; the table-level refusals are the harness

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; her menu was not re-read
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the three topics (stocktake, purchasing, deliveries) gained the 2IC's way in (path, one step each, one callout), and `node scripts/acceptance-matrix.mjs --check` is green; the topics were not opened at `/manual` in the browser. There is no Thai manual file in `src/lib/manual/` to update (the brief assumed a `th.ts`)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: three new strings, dictionary keys in both languages; nothing is stored in the translations table
- [x] Mobile viewport (375px) — no overflow, controls reachable: every page above was driven at 375 px; no horizontal scroll was seen. **Thai** was not re-driven: only the dictionary keys were added (Home in Thai was not looked at)
- [ ] Browser console clean — no errors or React warnings — n/a: the console was not read on these pages
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the network log was not read; the dev server log showed 200 for every page and action

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `check-permission-parity` green (**1,924 match / 36 known / 0 mismatch, unchanged**), `check-permission-catalogue`, `check-permission-tables` (`HARNESS-OK`, after the baseline fix in Defects #4), `check-maintenance-role` (140), `check-medical-role` (101), `check-medical-jobs` (157), `check-volunteer-narrowing`, `check-role-can`, `check-recurring-jobs`, `check-stock-on-hand` (`HARNESS-OK`), `check-purchasing` and `check-stock-deliveries` green. `check-recurring-job-eligibility` was not re-run (R3 recorded it failing identically on `main`)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `manual/en.ts` and the dictionaries were touched; the lint step runs the manual, matrix and home-screen checks and passed, and no other page reads these keys
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged; main was already included

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked: Management and Admin remain; a status line saying R4 exists, the `legacy_role` call and what the next role inherits was added instead (the brief's instruction)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-2ic-role.md` (the `legacy_role` call, the departures, a per-screen handover for R5)
- [x] `README.md` still accurate: it does not describe roles at this level
- [x] **Release notes.** `src/lib/releases.ts`'s `unreleased` gained a line: a 2IC login exists, its four buttons, what she can and cannot do (tagged admin and management, who create logins). A shelter user with an existing login sees no change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The harness counts (313, 140, 101, 157, 1,924/36/0), the gates line and the browser results are tool output. Reasoned and said so in the decision file: that the Head of Medical's label photos have the same blank

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date logic was added; the forecast copies carry the originals' date arithmetic unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no boundary or banding changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block above is pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Yes, and **the order matters**: the stocktake, deliveries and purchasing pages and the photo proxy now read `stock_medications`, `stock_diet_types`, `stock_vendors` and the two forecast functions, so a build deployed before `0143` is applied would break those three pages **for admin, management and staff too**. Apply `0143` to production first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; the two replaced function bodies are the live ones with a wider guard and a definer flag
- [x] Apply plan stated: `0143_2ic_role.sql` to production, from the main checkout, `--dry-run` first, before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**: reverting the merge **without** reverting the migration is safe (the old code reads the tables, which still answer admin, management and staff). Reverting the migration while the new code is live breaks the three pages for every role. A login already assigned the role would lose its tiles, which is the intended effect

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | Found only in the browser, after the harness was green: (a) the Purchasing forecast wrapper wrapped the original and returned **zero rows** for her, because `public.resident_current_state` is empty to a volunteer floor; (b) a delivery she recorded had a **null unit**, because `stock_receipts_stamp()` read `medication` as the caller | fixed: the wrappers now carry the queries over `private.resident_current_state`; the trigger is definer. Both probes now assert content (a comparison with management's originals; a stamped unit) |
| 2 | Medium | The board still offers photos and Delete job to her; the database refuses both | deferred to backlog: same as #359; not hers, and the screens are another stream's |
| 3 | Medium | A recurring job linked to `/stocktake` cannot be given to her from the rota picker and loses its link on her `/my`: eligibility asks the enum role (`volunteer`), not her key. Marking such a task done still works | deferred to backlog: R5's recurring-jobs-on-a-phone work; filed on the `backlog` branch. This is the price of the volunteer floor |
| 4 | Low | `check-permission-tables.mjs` was already red on `main`: its baseline counted `0136`/`0141`'s own role inserts as unexplained audit rows (21, wanted 0) | fixed: it now excludes `INSERT`s by no actor on `roles` and `role_permissions`; it asserts the same of everything else |
| 5 | Low | "Recorded by" shows a dash for a login with no display name (her email is hidden from a volunteer-based login) | accepted: a Google login has a name; the disposable test login does not |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nobody has watched the 2IC use any of these screens.** She does a real stocktake on the cards, reads a Purchasing list and says whether she would buy from it, and records a real delivery, each without help. This is the role's done-when (§12 R4) and Purchasing's own note says the same | dev, then production, her phone |
| 2 | Home, the three stock screens and the form errors **in Thai** (none was read in Thai) | dev, 375 px |
| 3 | The Thai wording รองผู้จัดการ for the role and ตรวจนับสต็อก, จัดซื้อ, บันทึกการรับของ for the jobs; does Lutan or the Director like them (L4) | dev |
| 4 | Whether she should see the cost of recent deliveries on `/deliveries` (she types it, so the plan says yes) | Lutan |
| 5 | A label photo shows on the stocktake card and the delivery form for a medicine that has one (the dev medicines had none) | dev, 375 px |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

Manual verification by: pending: the five items under Left for manual verification, chiefly the 2IC using it on her phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, nothing to hand over until the PR merges

Result: pass

Release manager acknowledgement: pending: production release manager
