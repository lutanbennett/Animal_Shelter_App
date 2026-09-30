# Feature test plan

Filled from `docs/test-plan-template.md`.

## Header

| | |
|---|---|
| Feature | Microchip, second half: vet chip form, procedure prompt, archive, public "Microchipped", dashboard count, No microchip filter |
| Backlog item | `docs/backlog.md` → **Microchip, second half: vet entry, procedure prompt, archive, public flag, dashboard nudge** (also closes **Microchip number on a resident, searchable from a chip scanner**) |
| Branch / worktree | `claude/microchip-vet-feature` @ `C:\Development\Animal_Shelter_microchip-vet-feature` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | linked from the PR itself |
| Tested by / date | Claude / 2026-09-30 (browser checks signed in as Lutan's admin account, which Lutan signed in to in the pane) |
| Carries a migration? | yes — `0117_public_is_microchipped.sql` |
| Tested at SHA | `b2d505e` (after merging `origin/main` `43a0f12`); see the PR for the tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: vets (and staff and admin) record or correct a chip through `set_resident_microchip()` from the hub, the Vet appointments and Procedures tabs and a visit's Edit page, are asked for it after a Microchipping procedure, and the chip reaches the deceased archive, while the public page gets a "Microchipped" boolean and management a no-chip count and filter
- [x] Files/areas touched listed: `supabase/migrations/0117_public_is_microchipped.sql`; `scripts/check-public-views.mjs`, new `scripts/check-public-microchipped.mjs`; `src/app/residents/[id]/microchip/actions.ts` (new), `src/components/MicrochipForm.tsx` (new), `src/components/MicrochipFields.tsx`; `src/app/residents/[id]/{page,ResidentHub}.tsx`, `src/app/residents/[id]/[section]/page.tsx`, `src/app/vet-visits/[id]/edit/page.tsx`, `src/app/procedures/new/{page,ProcedureForm}.tsx`, `src/app/adopt/[id]/page.tsx`, `src/app/residents/page.tsx`, `src/app/management/dashboard/page.tsx`; `src/lib/residents/{microchip,public}.ts`, `src/lib/management/report.ts`, `src/lib/archive/{resident-record,resident-summary-pdf.tsx,resident-index-html}.ts`; both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, a decisions file
- [x] Roles affected identified: admin / staff / vet (chip form), management (dashboard count; sees the chip, may not set it), volunteer (sees the chip line where they can see the hub, no form), signed-out public (`/adopt/[id]` boolean)
- [x] Anything explicitly **out of scope** written down: the optional duplicate-scan box on the intake wizard's first step; a header search (the app has none); the chip on `public_resident_cards` (`/r/<code>`), deliberately left off; Thai manual text (no Thai manual exists)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (both sides appended to `unreleased`), resolved by keeping all lines (`b2d505e`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed after the merge:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `0116` highest on `main`; the brief assigned `0117` as batch 12's only slot; the post-commit `migration numbers: ok` check passed against `origin/main`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (116 applied, 0 pending, no drift)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0117_public_is_microchipped.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `--status` now reads `117 applied, 0 pending`, `Applied here, no file on origin/main: 1 — 0117_public_is_microchipped.sql` (expected until merge)
- [x] File is re-runnable: `create or replace view`, idempotent grants; the harness runs it twice
- [x] Existing rows still read correctly after the change: `/adopt` and `/adopt/[id]` for Markey and Panda render as before plus the new tick; the view was re-created from its live `pg_get_viewdef` (identical to 0103) with one column appended
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness (`node scripts/check-public-microchipped.mjs`, exit 0): the file ran twice; `is_microchipped` is `boolean`; no `public_*` view has a `microchip_number` or `microchip_implanted_on` column; as `anon`, a real public resident reads `false` with no chip and `true` once one is set; `anon` is still refused `residents.microchip_number`; no Adopted or Deceased resident appears on the view (the 0101 trap). `node scripts/check-public-views.mjs` exit 0, 185 `ok`, 0 `FAIL`, including every `*.microchip_number` / `*.microchip_implanted_on` refusal and the new `public_resident_profiles.is_microchipped: anon reads a boolean`
- [x] Down-migration written, or the reason one is not needed is stated: in the file header — `create or replace` cannot drop a column, so a revert is drop-and-recreate with 0103's text and grants; purely additive, so leaving it in place on a rollback is safe
- [x] Production apply plan stated for the release manager: apply `0117_public_is_microchipped.sql` to production (`dbkodyyxxhtygxcxmfcu`) with `node scripts/apply-migrations.mjs --env production` from the main checkout after merge and **before** the deploy, because `/adopt/[id]` selects `is_microchipped`

## 4. Functional checks

- [x] Happy path works end to end: on Markey's hub, Record chip → `985112300000118`, date 2026-09-15 → saved and shown under the name; logged a Microchipping procedure → "Record the chip number?" appeared with the date set to the procedure date → typed 15 digits and pressed Enter (as a reader does) → saved and landed on the Procedures tab showing `985112300000119 · implanted 30 Sep 2026`
- [x] Data persists — reloading the hub still showed the chip; the database row checked directly
- [x] Create / edit / delete all exercised: record (above), correct (Correct opens the form with the number selected; a scan replaces it), clear (number blanked with the date still in its field → both `microchip_number` and `microchip_implanted_on` null in the database, and the ready-for-adoption nudge returns)
- [x] Empty state renders sensibly: a resident with no chip shows "No microchip recorded" with Record chip, or the ready-for-adoption nudge for Markey
- [x] Invalid input is rejected with a readable message, not a crash — through the UI: duplicate (Panda's number typed with spaces and dashes) → "Another resident already has that microchip number…", which also shows the stripping worked (unstripped it would have failed the format check); 14 digits → "A microchip number is exactly 15 digits…"; a future implant date → "The implant date can't be in the future." The deceased (`23001`) and out-of-scope (`42501`) refusals cannot be produced through the admin UI (no pencil on a deceased resident; admin is never out of scope), so their mapping is pinned by `check-public-microchipped.mjs` (each SQLSTATE → its own message key, and an unknown one falls through to the reference message) and the function raising those exact conditions by the existing 0116 harness
- [x] Boundary cases checked: spaces and dashes in the number; 14 digits; blank number with a date present; future date; an existing chip corrected (field selected so a scan replaces rather than appends)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | hub, tabs, visit Edit, procedure prompt, dashboard, `/residents?nochip=1` | form offered everywhere; count and filter work | as expected, in the browser |
| management | hub (read), dashboard | sees the chip, no form (`MICROCHIP_WRITE_ROLES` excludes it; 0116 refuses it) | not signed in as this role; see Left for manual verification |
| staff | as admin | form offered | not signed in as this role; the function allowing staff is asserted by the 0116 harness (G3) |
| vet | hub, Vet appointments / Procedures tabs, visit Edit, procedure prompt for residents in their clinic's scope | form offered; out-of-scope refused with "You can only record a chip for a resident your clinic treats." | not signed in as a vet; the function's scope check is asserted by the 0116 harness (G1, G2a); the vet's view is in Left for manual verification |
| volunteer | hub where allowed | chip shown, no form | not signed in; the function refusing a volunteer is asserted by the 0116 harness (G4) |
| signed out | `/adopt/[id]` | "Microchipped" tick only; never the number or date | as expected: Panda shows "Desexed · Vaccinated · Microchipped", Markey (no chip) no tick; a credentials-omitted fetch of the page HTML contains neither `985112300000117` nor `2026-09-01`; `check-public-views.mjs` refuses anon the columns everywhere |

- [ ] Every role above tested — n/a: only Lutan's admin account could be signed in this session (there are no test accounts for other roles); the server-side behaviour for staff, vet, volunteer and anon is asserted by the 0116 rollback harness, and a vet's own view is listed under Left for manual verification
- [x] A role that should not have access is blocked server-side: anon `EXECUTE` on `set_resident_microchip` refused (`check-public-views.mjs`, HTTP 401); volunteer, unlinked vet, out-of-scope vet refused inside the function (0116 harness); the hub hides the form but the action relies on the function, not the hiding

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the filter is reached from `/residents` and the dashboard card
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: new "Scanning a microchip" topic loads at `/manual#microchip`; "Finding a resident" gains the No microchip step
- [ ] Translatable strings go through the translation path — n/a: no new translatable content fields; the new UI strings are dictionary entries with Thai, checked on the hub in Thai
- [x] Mobile viewport — the pane ran at 590px wide throughout; hub, form, tabs, prompt and dashboard card fit with no horizontal overflow
- [x] Browser console clean — no console errors on the pages checked
- [x] Network clean — no failed requests seen; every save returned the expected result

## 6. Regression

- [x] The pages nearest the change still work: `/residents` with and without `?nochip=1` (76 rows → 75, the one chipped resident excluded; the other filters kept), resident hub, Vet appointments and Procedures tabs, visit Edit page (its own form still below the chip line, not nested), `/procedures/new` for a non-Microchipping type path unchanged in code (`finish()` pushes to the tab as before), `/management/dashboard` (other cards unchanged; new card 72 / 2 matches a direct count of in-care residents), `/adopt/[id]`
- [x] Shared files touched checked from a second page by loading it: `src/lib/manual/en.ts` via `/manual`; both dictionaries via the hub in Thai and English; `src/lib/releases.ts` merged with the management sweep's line, gates green
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green on the merge commit

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — both microchip items
- [x] Non-obvious design choices added as `docs/decisions/2026-09-30-microchip-second-half-vet-form-public-boolean.md`
- [x] `README.md` still accurate — nothing in it describes the chip screens
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained four lines: vets can record a chip (and the procedure prompt), "Microchipped" on the public page, the filter and dashboard count, and the chip in the deceased archive
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the dashboard count, filter row counts, the cleared date and the absence of the number from public HTML were each read back from the database or the page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the only date logic added is "implant date not after today", compared against `todayIso()` as the other forms do; no new day boundary
- [ ] **For a boundary or banding change** — n/a: no threshold or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (the gates line and the quoted check output)
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager (`/adopt/[id]` changes)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes: `/adopt/[id]` selects `is_microchipped`. Production apply of `0117` must happen **before** the deploy; written in the apply plan in section 3
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (production refuses a checkout whose migrations differ from `origin/main`, so after merge)
- [ ] For a destructive or rewriting migration only: a fresh production backup — n/a: `create or replace view` appending one column; no table data is touched
- [x] Apply plan stated: `0117_public_is_microchipped.sql`, production `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` reverts the Worker; it does not revert 0117, which is safe to leave (an extra boolean column the old code never selects)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Clearing the chip number left the implant date on a resident with no chip, and it came back prefilled next time | fixed (`3669739`): clearing sends a null date |
| 2 | minor | The chip form did not focus the number field, so a reader's scan went nowhere; on a correction it would have appended to the old number | fixed (`3669739`): autofocus with the old number selected |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **vet**: Record chip is offered on a resident your clinic treats (hub, Vet appointments and Procedures tabs, visit Edit), saves, and a chip scan works with the real reader | `/appointments` → a resident |
| 2 | Signed in as **management**: the chip is shown but no Record chip / Correct is offered; the dashboard card reads sensibly | a resident hub, `/management/dashboard` |
| 3 | The deceased summary PDF and offline index show the Microchip row: use Retry archive on a deceased resident who has a chip (Drive write, so not done by Claude) | a deceased resident's hub |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items are waiting for a person

Manual verification by: pending: vet-role view, management view and a regenerated deceased archive (Left for manual verification 1–3)

### Result

- [x] Open defects are either fixed or explicitly accepted above (both fixed in `3669739`)
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: pending  Date: —
