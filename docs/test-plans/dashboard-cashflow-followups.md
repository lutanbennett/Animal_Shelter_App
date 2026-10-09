# Feature test plan

## Header

| | |
|---|---|
| Feature | Dashboard and Cashflow follow-ups: candidates sorted; Copy/Print, Thai-time months, Vaccinations and Clinic spend cards built |
| Backlog item | `docs/backlog.md` → *Dashboard follow-ups* and *Cashflow follow-ups* (both stay open with notes; see §7) |
| Branch / worktree | `claude/dashboard-cashflow-followups` @ `C:\Development\Animal_Shelter_dashboard-cashflow-followups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `e144161f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the two umbrella items' candidates are sorted into done / built / own item / waiting (`docs/decisions/2026-10-09-dashboard-and-cashflow-follow-ups-sorted.md`), and the no-schema pile Lutan approved in chat is built: Dashboard (a) Copy as text and Print, (d) Clinic spend card, (e) months on Thai time, (f) Vaccinations given card, Cashflow (d) recorded as permanent
- [x] Files/areas touched listed — `src/app/management/dashboard/` (`page.tsx`, `ReportCard.tsx`, new `CopyTextButton.tsx`), `src/lib/management/report.ts`, `src/lib/clinics/stats.ts` (visits-per-month chart), `src/lib/format.ts` (new `shelterMidnight`, `shelterMonthKey`, `addMonthsToKey`), both dictionaries, `src/lib/manual/en.ts` (Management → dashboard topic only), `src/lib/releases.ts`, `docs/backlog.md` (notes on the two items), one decision file. No `worker/`, no migration
- [x] Roles affected identified: admin and management (the dashboard, `reports.dashboard`); every role that can open a clinic page (the chart's month buckets). No public surface
- [x] Anything explicitly **out of scope** written down — Dashboard (b) year view (Lutan's call), Cashflow (a) forecast vs actuals and (b) per-clinic average (wait on data), Cashflow (e) second doses and the SQL half of the time-zone fix (spun out as *Cashflow forecast function: second doses and Thai-time months*, a schema item), the vaccine stock forecast (spun out). The Fostered card's residents-vs-placements count is noted in the decision, unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Auto-merging docs/backlog.md`, `Merge made by the 'ort' strategy`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`.

```
=== gates: build exited 0 after 214s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — all seven checks pass on #500

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0173` belongs to `remove-staff-role`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev as a management login, September 2026: the month section shows Clinic spend `฿1,450` with `1 invoiced · 5 with no amount yet` and Vaccinations given 7 (Heartworm 4, Rabies 2, Parvovirus 1). Copy as text, clicked in the pane with the clipboard captured, produced the whole month as plain lines (pasted in the PR). Print: the page's print rules applied on screen leave only the month section, black on white, buttons and month arrows hidden; no ancestor of the section scrolls or has a fixed height, so a printout runs over pages rather than clipping
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page, nothing is saved
- [ ] Create / edit / delete all exercised — n/a: read-only page
- [x] Empty state renders sensibly — Blood work cards with no tests read `0` / `None`; Clinic spend with no visits shows `None` rather than "0 visits, all invoiced" (code path in `page.tsx`); Fostered "Continuing from before" `0 — None` in the copied text
- [ ] Invalid input is rejected with a readable message — n/a: the only input is `?month=`, and an invalid one (`2026-13`) falls back to the current month, asserted in the suite below
- [x] Boundary cases checked — the real exported `monthWindow`, `monthReport`, `trend`, `shiftMonth`, `toMonthKey` and `visitsByMonth`, bundled with esbuild and run under `TZ=UTC` (the Workers case) and under the machine's Asia/Bangkok: 00:00 and 06:59 Thai on the 1st, 23:59 Thai on the last day, year end, 29 Feb / 1 Mar 2028, the default month either side of 17:00Z, year roll in `shiftMonth`, the clinic chart at 06:30 Thai on the 1st, a cost arriving as the string `"1450.00"`, a null cost, a cancelled visit with a cost, and a date-only dose on the 30th vs the 1st. Output below. The same boundary case against `origin/main`'s `report.ts` under `TZ=UTC` puts the 00:00-Thai intake in September, so the suite discriminates

```
--- TZ=UTC
PASS 00:00 Thai 1 Oct counts in Oct 1 
PASS 00:00 Thai 1 Oct not in Sep 0 
PASS 06:59 Thai 1 Oct counts in Oct 1 
PASS 23:59 Thai 30 Sep counts in Sep 1 
PASS 23:59 Thai 30 Sep not in Oct 0 
PASS year end: 00:30 Thai 1 Jan 2027 in Jan 1 
PASS year end: not in Dec 0 
PASS leap: 29 Feb 2028 23:00 Thai in Feb 1 
PASS leap: 1 Mar 2028 00:00 Thai in Mar 1 
PASS window bounds Oct ["2026-09-30T17:00:00.000Z","2026-10-31T17:00:00.000Z"] 
PASS default month at 01:00 Thai 1 Oct is Oct "2026-10" 
PASS default month at 23:00 Thai 30 Sep is Sep "2026-09" 
PASS bad key falls back "2026-10" 
PASS shiftMonth across year ["2025-12","2027-01"] 
PASS toMonthKey Thai "2026-10" 
PASS trend: 12 buckets ending Oct [12,"2025-11-01","2026-10-01"] 
PASS trend: boundary adoption in Oct bucket [0,1] 
PASS clinic chart: 06:30 Thai 1 Oct in Oct [["2026-08-01",0],["2026-09-01",0],["2026-10-01",1]] 
PASS clinic spend: string cost summed, null counted, cancelled ignored {"spent":1450,"invoiced":1,"notInvoiced":1} 
PASS vaccinations: date-only 30 Sep in, 1 Oct out [["Rabies",1]] 
all passed TZ=UTC UTC
--- system zone
all passed TZ=(system) Asia/Bangkok
OLD code, intake at 00:00 Thai 1 Oct -> Sep: 1 Oct: 0
```

### Role access matrix

One disposable dev login (`dryrun-management-20261009@example.test`, made by script, role switched by script between loads) hitting `/management/dashboard` directly.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | dashboard, both new cards | yes | yes — Clinic spend `฿1,450`, Vaccinations 7 |
| management | dashboard, both new cards, Copy, Print | yes | yes |
| staff | — | role retired | n/a: the database refuses the role ("The Staff role is retired") |
| doctor | — | refused | redirected to `/no-access` |
| volunteer | — | refused | redirected to `/no-access` |
| signed out | — | login | redirected to `/login?next=…` |

- [x] Every role above tested — staff cannot be assigned any more (retired by `remove-staff-role`)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — doctor and volunteer land on `/no-access`; the gate is the unchanged `requirePermission("reports.dashboard")`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — Management → *The dashboard*: vaccinations in the month list, Thai-time months, a step for Clinic spend and one for Copy as text / Print
- [x] Translatable strings go through the translation path — the new labels are dictionary entries in both `en.ts` and `th.ts` (staff UI strings, not `/management/translations` public content); checked in Thai on dev: `ค่าใช้จ่ายคลินิก`, `บันทึกยอดแล้ว 1 ครั้ง · ยังไม่มียอด 5 ครั้ง`, `การฉีดวัคซีน`, `คัดลอกเป็นข้อความ`, `พิมพ์`. Vaccine names fall back to English where `name_th` is empty, as they do on the resident page
- [x] Mobile viewport (375px) — in Thai at 375 px, `scrollWidth` 375, no overflow; Copy and Print sit on their own row under the month arrows
- [x] Browser console clean — no errors on the dashboard or the clinic page
- [x] Network clean — the pages loaded with no error banner; the first cut's `immunization_types(name)` embed returned nothing usable for management, fixed by reading `picker_immunization_types` (Defects, 1)

## 6. Regression

- [x] The pages nearest the change still work — the dashboard's Right now cards and the 12-month trend; June 2026 shows the Foster at `2026-05-31T17:00Z` (00:00 on 1 June, Thai time) under June; a clinic page's Visits per month chart renders May–Oct 2026 with its Spend card
- [x] Any shared file touched checked from a second, unrelated page — `format.ts` (shared): the clinic page (dates, chart axis) and the dashboard's Thai month label `ก.ย. 2569` loaded and correct; `manual/en.ts` — the change is one topic's steps, and the build compiles every manual page
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge touched only `docs/backlog.md`; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: neither umbrella is wholly done, so neither is ticked; each carries a *SORTED 2026-10-09* note saying which letters shipped, which closed, which are their own items now and which still wait. The two spun-out items are on the `backlog` branch. Other open items searched for the files and features changed: none closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-dashboard-and-cashflow-follow-ups-sorted.md`
- [x] `README.md` still accurate — it does not describe the dashboard's cards
- [x] **Release notes.** Two lines in `unreleased` for admin and management: Copy/Print and the two new cards; months on Thai time
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the time-zone claim is the suite above, run under `TZ=UTC` against old and new code; the "embedding `immunization_types` came back null" claim was seen on dev (every dose grouped under Other); "1 of September's 6 visits had a cost" is the dev dashboard's own figure

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — the logic half by the suite in §4, real exported functions under `TZ=UTC`. The deployed-build half (open the dashboard on `test.lannacare.org` between 00:00 and 07:00 Thai on a 1st) is under Left for manual verification
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — both sides of 17:00Z at the start of the month (00:00 Thai in, 23:59 Thai out) and at the end, the 06:59 end of the old broken window, plus year end and a leap day
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates lines and the suite output above are pasted as printed; the deploy output is the release manager's
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code reads `clinic_visits.cost` (0053), `immunization_records.archived_at` (0124) and `picker_immunization_types`, all long on production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — code only: the Pi `--ref` rollback, or `wrangler rollback` for the Worker fallback, restores the previous dashboard completely; nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | First cut embedded `immunization_types(name)` directly; for a management login it came back null, so every dose grouped under "Other" | fixed in `cb6d3e80` — read through `picker_immunization_types`, Thai name where present |
| 2 | minor | Fostered card headline counts residents, its "New this month" line counts placements (a resident fostered four times reads 3 over 6) | accepted — pre-existing, recorded in the decision for the next dashboard pass with Lutan |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Print the month for real (to paper or Save as PDF) and check it reads well: only the month section, nothing cut off between pages | Management → Dashboard → Print, on the PC |
| 2 | Paste Copy as text into a LINE message and into the monthly report, and check it reads as the report should | Management → Dashboard → Copy as text, on the phone and the PC |
| 3 | On `test.lannacare.org` between 00:00 and 07:00 Thai time on the 1st of a month, the dashboard opens on the new month | Management → Dashboard |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items wait for Lutan

Manual verification by: pending: a real print, a real paste into LINE and the monthly report, and the 00:00–07:00 check on test.lannacare.org

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 fixed, 2 accepted
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after the PR merges

Result: pass with accepted defects

Release manager acknowledgement: pending
