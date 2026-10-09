# Feature test plan — donation-receipts

## Header

| | |
|---|---|
| Feature | Management → Donations: record a gift, issue its receipt (LCA0009000 onward, never repeated or skipped; void keeps the number), a PDF in the Director's sample layout with the Thai font, Thai or US receipt from one layout, filed on Drive with retry, sent by the Director herself (Share / Download / Email draft), and a list with totals |
| Backlog item | `docs/backlog.md` → **Donation receipts: a form for the Director to issue a receipt, saved to Drive and ready to send to the donor** (ticked on this branch) |
| Branch / worktree | `claude/donation-receipts` @ `C:\Development\Animal_Shelter_donation-receipts` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | see the PR this plan is in |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | no — its schema is `0168_donation_receipts.sql`, merged in #482 (with `0169`) and applied to dev before this branch synced |
| Tested at SHA | `80818147` (code), then `54250538` merged `origin/main` `7dfef223` (#484: one test plan and `check-permission-tables.mjs`, neither read by this branch) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item's form, receipt, numbering, voiding, Drive filing with failure handling, sending, list with totals and permission activity, plus the 2026-10-09 answers: hard-coded issuer behind `receiptIssuer(country)`, the country option as one layout, English-only labels with the Thai font embedded, first number `LCA0009000`
- [x] Files/areas touched listed — new `src/lib/donations/` (issuer, receipt content and labels, form rules, PDF layout, server-side issuing and Drive filing, font and seal data), `src/lib/archive/fonts/thai-pdf-text.ts`, `src/app/management/donations/` (list, new, `[id]`, actions, `receipts/[id]/pdf` route), `src/app/management/page.tsx` (tile), `src/lib/permissions/routes.ts` (entry), both dictionaries, `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-donation-receipts-schema.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-09-thai-sara-am-in-pdfs.md`, this plan. No `worker/`, no migration
- [x] Roles affected identified — Admin and Management gain Management → Donations (`donation.receipt`, `0168`); staff, vet and volunteer get nothing; signed-out nothing
- [x] Anything explicitly **out of scope** written down — the e-Donation tax-deduction path (Thai ID, store apart, e-Donation export) and adding a new contact from the form: both split to new backlog items under Fundraising. No Thai edition of the receipt (English only, Lutan 2026-10-09). The same ำ bug in the archive and manual PDFs is a separate suggested task. Sharing the Drive folder with the Director only is a Drive setting for Lutan, not code

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` `75b98c10` (#482, the schema), clean, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run at `80818147`, output to a file, exit code read (`exit=0`). The first run, earlier, was `lint=1`: the acceptance matrix said only Admin held `donation.receipt`, because `scripts/lib/permission-seed.mjs` did not read cells seeded as `select … where r.key = …` (0168's and 0154's form). Fixed in `e94d42c5`; the run below is after that and after the last code change:

```
=== gates: build exited 0 after 80s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this branch; `0168` merged in #482
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this branch. For the record: `Against origin/main 75b98c10: 169 file(s), 169 applied row(s)`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this branch
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration on this branch; `0168` was applied by the community-dogs-schema session after #482 merged
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration on this branch
- [ ] Existing rows still read correctly after the change — n/a: no migration on this branch; the new tables have no earlier rows
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-donation-receipts-schema.mjs` against `0168` as applied on dev, under real management, staff and anon sessions, rolled back (the counter too). Output: `all 35 held (rolled back, nothing kept)`. Asserted: Management records a donation and lines, staff and anon refused (RLS); a bad method and a blank donor refused; `recorded_by` and `issued_by` come from the session; an in-kind line has a null amount and a 0 amount is refused; an amount keeps its satang (1200.50); staff read 0 donations and anon gets 42501; **the first issue takes `LCA0009000`**; a second live receipt for the same gift is refused (23505) **and the counter did not advance**; staff's issue is refused (42501) and a bad country (23514), counter still unmoved; a direct insert is refused, a content rewrite is refused, delete is refused both for Management (no grant) and for the owner role (trigger); marking sent and recording a Drive id work; a void without a reason is refused, with a reason works, and cannot be undone; the voided receipt is kept; **the re-issue after the void takes `LCA0009001`** and another gift `LCA0009002`; a donation with receipts cannot be deleted; `receipt_counters` is closed to authenticated for read and write; the audit log holds three rows for the receipt (issue, sent, void) and none for the refused writes. The first run expected four audit rows, which was my arithmetic, not the table: the refused rewrite writes nothing, which is right
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this branch
- [ ] Production apply plan stated for the release manager — n/a: no migration on this branch; `0168` must be on production **before** this branch deploys, and #482's plan says so

## 4. Functional checks

Driven in the browser pane on `localhost:3010` at 375 px as a disposable Management login (`dryrun-donations-management-20261009@example.test`, made by script for this run), against dev.

- [x] Happy path works end to end — recorded a donation from "บริษัท ล้านนา พัฒนา จำกัด (คุณสมศรี ใจดี)" with two lines (a Thai line with น้ำ, 2,500.50; "Vet costs for Tia (spay)", 1,800): it issued **LCA0009000**, the first number, filed it on Drive ("Saved to Drive"), and opened the gift's page with "Receipt LCA0009000 issued." The PDF route returned `200 application/pdf`, `%PDF-1.3`, file name `LCA0009000-บริษัท-ล้านนา-พัฒนา-จำกัด-คุณสมศรี-ใจดี.pdf` (RFC 5987 `filename*`). The stored row rendered shows the full Thai name **with its closing bracket**, both lines, 2,500.50 and 1,800.00, TOTAL ฿ 4,300.50, dd/mm date
- [x] Data persists — the gift, its receipt and its state (sent, void, Drive) all read back after navigation and reload; the list shows them
- [x] Create / edit / delete all exercised — create (record and issue), mark sent ("Sent 9 Oct 2026"), **void** with a reason after the confirm dialog (stays listed, keeps LCA0009000, reason shown, PDF stamped VOID with "Voided 09/10/2026: Test: wrong amount"), **re-issue** as a US receipt (**LCA0009001**, date 10/09/2026, month first). There is no delete by design; §3 asserts it is refused
- [x] Empty state renders sensibly — the list for an empty window (1–31 Jan 2020) loaded as Management shows "No donations recorded in this window." and no receipt; a gift with no live receipt offers Issue a receipt
- [x] Invalid input is rejected with a readable message, not a crash — a 0 amount on line 2: "Line 2 needs an amount in baht, more than zero, with at most two decimals." Server-side `checkDonation` covers the rest (missing name, future date, in-kind with an amount, more than 12 lines, bad email)
- [x] Boundary cases checked — **gift in kind**: choosing In kind hides the amount boxes and changes the hint; saved as **LCA0009002**, the list says In kind and leaves it out of the baht total, the PDF's total reads In kind (not ฿ 0.00, defect #2). **Drive failure**: LCA0009002 set to unsaved in the database (as an outage leaves it): the gift's page and the list said "Not yet saved to Drive" with Save to Drive now; `fileReceiptOnDrive` run on that row with Drive unreachable returned false without throwing and left it unsaved, then with Drive back returned true and recorded the file id. Satang: 2,500.50 round-trips and the list total reads ฿4,300.50 (defect #3)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Management → Donations, all of it | yes (Admin holds every activity) | not driven in the browser; `has_permission` answers yes for Admin before any cell (0132 §6 rule 1), and the page guard is the same `requirePermission` Management passed |
| management | list, form, gift page, PDF | yes (0168's cell) | all `200`, receipt data shown, PDF `application/pdf`; issued, voided, re-issued in the browser |
| staff | nothing | refused | list, form and gift page redirect to `/no-access` (`NEXT_REDIRECT`), PDF `403`, no receipt data in any body; the database refuses its insert and issue (§3) |
| vet | nothing | refused | not driven; holds no `donation.receipt` cell, same guard and RLS as staff |
| volunteer | nothing | refused | not driven; holds no `donation.receipt` cell, same guard and RLS as staff |
| signed out | nothing | refused | list, form and PDF all redirect (opaque redirect to login), no PDF served |

- [x] Every role above tested — management, staff and signed-out driven; admin, vet and volunteer by the cell table and the shared guard, as recorded in the table
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — staff's direct GETs redirect and the PDF route answers 403; the database refuses staff's insert and issue in §3

## 5. Cross-cutting

- [x] Nav entry correct — no sidebar entry by design (`menu: false`, like Shelter Friends); the Donations tile appears on `/management` for Management (checked by loading it) and the route registry entry passes `check-permission-catalogue.mjs` E (page guards with the same activity)
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — loaded `/manual` as Management: "Recording a donation and sending its receipt" is there
- [ ] Translatable strings go through the translation path — n/a: no public or database-held text; every UI string is in both dictionaries (`th.ts` is typed against `en.ts`, so a missing Thai key fails typecheck). The receipt's own words are deliberately English only
- [x] Mobile viewport (375px) — the form measured at 375 px: document and main `scrollWidth` 375, no element past the right edge. Drop-downs were 41 px, raised to 44 (`80818147`)
- [x] Browser console clean — no errors; only Fast Refresh logs and Next's font-preload warnings, present on every page
- [x] Network clean — every feature request in the server log is `200` (and the staff PDF `403`, expected)

## 6. Regression

- [x] The pages nearest the change still work — `/management` (tile added), `/management/cashflow` (shares `src/lib/format.ts`, where `formatBahtExact` was added beside the unchanged `formatBaht`), `/management/shelter-friends` (its route entry is the anchor the new one follows): all `200` as Management, no error text
- [x] Any shared file touched checked from a second, unrelated page by loading it — `/manual` (shared `manual/en.ts`) and `/management/cashflow` (shared `format.ts`) loaded; `permission-seed.mjs`'s other reader, `check-home-screens.mjs`, run: all ok
- [x] Nothing merged from `main` during `sync` was broken by this branch — the two syncs brought in #482 (the schema this branch reads) and #484 (a test plan and `check-permission-tables.mjs`); gates green after the first, and the second touches nothing this branch reads

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked, with what was split out; the `/donate` item's step (b) noted as mostly closed by this work (searched the backlog for `donation`, `receipt`, `contacts`, `Drive`, `react-pdf`; the *Dates in US order* item already exempts the US receipt). Two follow-ups added on `backlog` (`c7109a00`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-donation-receipts.md` (numbering, voiding, what a receipt keeps, the hard-coded issuer, who; merged with the schema in #482) and `2026-10-09-thai-sara-am-in-pdfs.md` (this branch)
- [x] `README.md` still accurate — it describes no Management page individually
- [x] **Release notes.** A shelter user will notice a new Management page. `unreleased` gained one line for it, written for the Director
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The ำ bug was measured by rendering (fontkit's glyph list shows 42 glyphs for 41 code points on the sample name; the bracket returns once ำ is written as two code points), and the numbering claims by the harness in §3

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Worth including: issue one receipt on the deployed Worker and open its PDF, because the fonts and seal are data URIs the Worker bundle has to carry
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the receipt date and the "not in the future" check use `todayIso()`, the app's shared shelter-day function, which this branch does not change; the issue date stored is `todayIso()` from the server action, not the database's `current_date`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or band; the counter's "no gap" property is asserted both after a refused issue and across a void and a second gift in §3
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: production release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added; Drive filing uses the existing `GOOGLE_DRIVE_ROOT_FOLDER_ID` and Drive token

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: production release manager. No migration here, but this code reads `0168`: apply `0168` (with `0169`) to production **before** deploying this branch
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0168` is additive
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: production release manager. `0168_donation_receipts.sql` on `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: production release manager. Rolling the code back leaves the tables and any receipts already issued; the register must be kept (never deleted), so a rollback hides the page and keeps the data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major (silent) | A Thai donor name containing ำ lost its last character(s) on the PDF: "บริษัท … จำกัด (คุณสมศรี ใจดี)" printed without ")". @react-pdf drops one end glyph per ำ | fixed on this branch (`thaiPdfText`), verified by re-rendering; the same bug in the archive and manual PDFs is a separate suggested task |
| 2 | minor | A gift wholly in kind printed "TOTAL ฿ 0.00" | fixed: the total reads In kind |
| 3 | minor | The form's running total and the list rounded to whole baht (2,500.50 showed as ฿2,501), disagreeing with the receipt | fixed: `formatBahtExact` (`80818147`) |
| 4 | minor | The acceptance matrix could not see cells seeded as `select … where r.key = …`, so it said only Admin held `donation.receipt` (and missed 0154's `translations.view` cells) | fixed in `scripts/lib/permission-seed.mjs` (`e94d42c5`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Share from a real phone: the share sheet opens with the PDF attached, and Gmail and LINE each receive it as an attachment | the Director's phone, Management → Donations → a gift → Share |
| 2 | The PDF compared side by side with `101-Global-Tiger.pdf`: does it read as the same document to the Director? | any receipt's View |
| 3 | Share the Drive folder `Admin/Donations/Receipts` with the Director only, like `Backups`, once the first receipt has created it | Google Drive |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; Lutan or the Director ticks it after the three checks above

Manual verification by: pending: share from a real phone, the side-by-side look at the sample, and the Drive folder's sharing (Left for manual verification 1–3)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR merges and joins a release

Result: pass

Release manager acknowledgement: pending: production release manager
