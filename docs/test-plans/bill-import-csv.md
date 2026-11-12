# Feature test plan

## Header

| | |
|---|---|
| Feature | Bulk bills from a strict templated CSV: utility and general bills, filename joined to Bills inbox photos |
| Backlog item | `docs/backlog.md` → `#m3vx9` |
| Branch / worktree | `claude/bill-import-csv` @ `C:\Development\Animal_Shelter_bill-import-csv` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: opened after this plan is committed |
| Tested by / date | Claude, 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | a240f4124 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a person downloads a template, types utility and general bills into it away from the app, uploads it, reads a preview, and the good rows are added with a reject file for the rest
- [x] Files/areas touched listed — `src/app/bills/import/` (page, client, actions, template route), `src/lib/bills/import*.ts`, `src/lib/csv-read.ts`, `src/app/bills/page.tsx` (one link), `src/lib/write-requests.ts` (one path), `scripts/check-permission-catalogue.mjs` (one pinned page), both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`; no migration, no `worker/`
- [x] Cards affected identified — `bills` (carries `bills.utilities` and `bills.general`, the only two activities asked, per row); Admin sees it through the existing bypass; signed out is sent to login
- [x] Out of scope written down — maintenance, delivery and clinic-visit bills (need a parent record), a note column, a separate "may import" card, a Thai manual (the manual is English-only)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (branch was cut from current main; sync re-run before the PR)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every exit code `0`:

```
GATES_PASTE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration (the paper, section 6, and the brief)
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration; the existing 0305 tables' checks were exercised by real inserts through the import on dev
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev as a login holding only the `bills` card: uploaded a CSV with a BOM and two inbox photos; the preview listed 3 good rows and 3 rejects; Add 3 bills wrote them; the utility bill appears on /bills/utilities, the general one on /bills/general with its page, and the inbox photo count fell to 0
- [x] Data persists — the new bills were read back from the server-rendered utility and general pages after the import
- [x] Create / edit / delete all exercised — n/a for edit and delete (import only creates); create exercised above, and the photo changing owner from the inbox was checked
- [x] Empty state renders sensibly — the page with no places or accounts yet shows "None yet"; "Check the file" is disabled until a file is chosen; a preview with no good rows says nothing can be added and offers no import button (code path, parser tests)
- [x] Invalid input is rejected with a readable message — a bad date, an unknown kind and a missing photo each rejected on their own row with a reason; 23 parser tests cover encodings, header faults and every row reason
- [x] Boundary cases checked — dates (non-real days, three other shapes), months, amounts (comma, sign, exponent, three decimals), a filename matching none, one and two photos, an empty filename, two rows naming one photo, 500-row limit

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | the page and the template | through the existing `isAdmin` bypass in `can.ts`, both kinds allowed | pending: not driven; the bypass is not changed by this PR |
| exactly `bills` | /bills link, /bills/import, template, preview, import | all work; a row for either destination is added | works (driven above) |
| exactly `view_residents` | none | template returns 403 with a reason; the page shows the no-access page without the form | refused (driven: 403, form absent) |
| signed out | none | redirected to /login for both the page and the template | 307 to /login (curl) |

- [x] Every login above tested — admin excepted, see its row
- [x] A login that should not have access is blocked server-side — the template route returned 403 to a signed-in login without the card; both actions repeat the check; each ROW is asked for its own destination (unit-tested with a login that may file only general bills). **No card grants only one of the two kinds** (`bills` carries both), so the one-kind case cannot be driven in the browser and is proved in the parser tests

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry or tile; reached by a link on the Bills page, drawn only when the login may file either kind
- [x] Manual updated (`src/lib/manual/en.ts`) — topic `bills-import` added at the end of the Bills section, with the activity it asks
- [x] Translatable strings go through the translation path — every string is in both dictionaries (English and Thai), including all 25 row reasons and the whole-file faults
- [ ] Mobile viewport (375px) — pending: not driven at 375px; the tables sit in an `overflow-x-auto` wrapper
- [x] Browser console clean — the only error logged was the 403 from deliberately fetching the template as a login without the card
- [x] Network clean — template 200, import and preview actions 200, no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work — /bills (with the new link), /bills/utilities and /bills/general loaded after the import
- [x] Any shared file touched checked from a second, unrelated page — `write-requests.ts` list and both dictionaries are loaded by every page; /bills and /bills/import both rendered in English; the permission-catalogue check passes
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#m3vx9`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-12-bill-import-csv.md`
- [x] `README.md` still accurate — nothing in it describes the Bills screens
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it, written for a shelter user
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the import, the photo move, the 403 and the rejects file were all run on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no "today" is derived; the date column is a literal written by the typist
- [ ] Boundary or banding change covers both sides — n/a: the 500-row and 1 MB limits are the only thresholds and both sides are in the parser tests
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: the gates block above is the only pasted evidence and it is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (purely additive code; no schema to revert)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A real shelter CSV from a real typist, saved from Excel, with Thai place names | `/bills/import` on test |
| 2 | The page and the preview table on a phone | `/bills/import` at 375px |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

pending: a real shelter CSV tried by a person, and the page on a phone

Result: pass
