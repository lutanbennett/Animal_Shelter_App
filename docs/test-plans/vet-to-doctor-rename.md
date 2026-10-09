# Feature test plan — vet-to-doctor-rename

## Header

| | |
|---|---|
| Feature | App half of "Clinics and doctors: remove the word Vet": every screen, both dictionaries, the manual, the assistant, the scripts and the role walkthrough follow 0172 (clinics, doctors, clinic visits, the Doctor role) |
| Backlog item | `docs/backlog.md` → **Clinics and doctors: remove the word "Vet" from the system** (ticked here) |
| Branch / worktree | `claude/vet-to-doctor-rename` @ `C:\Development\Animal_Shelter_vet-to-doctor-rename` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | #496; the schema half is #495 (merged) |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | yes — `0172_clinics_and_doctors.sql`, the same file as #495; it lands with #495 first, so this PR adds no file of its own once that merges |
| Tested at SHA | `809d2fc5` (after sync with `origin/main` `e52f5c70`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — "Vet" leaves everything the app shows: nav and Management read **Clinics**, a vet visit is a **Clinic visit**, the role is **Doctor**, booking asks for a clinic and offers its doctors, Settings → Security links a login to a doctor, the assistant understands clinic/doctor and still vet/หมอ, the manual, both dictionaries, the role walkthrough's Doctor pass and a releases line
- [x] Files/areas touched listed — routes moved: `src/app/clinics` (was `vets`), `src/app/clinic-visits` (was `vet-visits`), `src/app/management/clinics` (was `management/vets`), `src/lib/clinics` (was `lib/vets`), resident tab `clinic-visits` (was `vet-appointments`); redirects for every old URL in `next.config.ts`; about 150 files under `src/` for names, roles and words; `src/lib/i18n/dictionaries/*`, `src/lib/manual/en.ts`, `src/lib/releases.ts`; about 60 scripts under `scripts/` (the five the item names rewritten to assert the live schema, and every harness that made a vet login); `docs/role-walkthrough.md`, `docs/test-plan-template.md`
- [x] Roles affected identified — everyone sees the new words. Doctor (was vet): sees its own patients at clinics it has left, read-only (0172). Admin: Settings → Security names the role Doctor and links a login to a doctor
- [x] Anything explicitly **out of scope** written down — dictionary key names (`t.vets.*`, `t.vetVisits.*`) and the manual's topic ids and screenshot file names keep their old names: they are never shown, and renaming them breaks manual links and screenshot names. Past release notes keep their words (they are a record); their role tags became `doctor`. A cross-clinic Doctors list for staff (Lutan: not now). The two clinic-login Security findings (photos, the list of logins), not closed by this

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in twice: `146b7925` (the acceptance PDF) cleanly, and `e52f5c70` (facility map) with one conflict in `src/lib/releases.ts`, both streams' `unreleased` lines kept
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the redirected output file:

```
=== gates: build exited 0 after 153s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — all 7 checks passing on #496 at `902e528b` (after #495 merged and `main` was synced in), read from `gh pr checks 496`

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0172`; carried by #495, which merges first
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — see #495's plan
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — see #495's plan
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — from #495's branch on Lutan's go, 2026-10-09; this branch was then run against it
- [x] File is re-runnable — `check-doctor-resident-scope.mjs` replayed it twice in one transaction before the apply
- [x] Existing rows still read correctly after the change — every page below read real dev rows (7 clinics, their visits, doctors and 99 residents) through the renamed tables
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `check-doctor-resident-scope.mjs` (cases N, A–J, `HARNESS-OK … asserted live on dev`), and the four other named harnesses rewritten to assert the live schema, each ending in its pass line: `check-clinics-readonly` (`HARNESS-OK … A … E`), `check-doctor-multi-clinic` (`HARNESS-OK … A … H`), `check-contact-visibility` (`HARNESS-OK … A … G`), `check-public-views` (exit 0, all ok)
- [x] Down-migration written, or the reason one is not needed is stated — as #495: not written; this PR is the reason none is needed
- [x] Production apply plan stated for the release manager — `0172` on production immediately before deploying the release that carries this PR (#495's plan has the detail)

## 4. Functional checks

Driven in the browser pane on `localhost:3005` against dev, as two disposable logins made by script for this run: `dryrun-mgmt-20261009@example.test` (Management) and `dryrun-doctor-20261009@example.test` (Doctor, linked to "Dr Dry Run 20261009", working at Novel and marked as having left Mae Wang). Their passwords are only in this worktree's `.env.local`.

- [x] Happy path works end to end — as Management: booked a clinic visit for Angsumalin at Mae Wang with a newly typed doctor; it saved and opened the resident's **Clinic Visits** tab showing "Mae Wang · Dr Dryrun Typed 1009", and that doctor was then on Mae Wang's Doctors list
- [x] Data persists — reloaded the resident's Clinic Visits tab and Mae Wang's Doctors page: both still there
- [x] Create / edit / delete all exercised — created a visit and a doctor (Management → Clinics → Mae Wang → Doctors → Add doctor, the new two-insert path); edit and delete of doctors and clinics are covered by `check-doctor-multi-clinic` and `check-clinics-readonly` under each role's JWT
- [x] Empty state renders sensibly — a clinic with no phone, address or notes (5 of 7 on dev, the mobile-doctor case) shows nothing for them on Clinics and its hub: no blank row, no map link, no "no contact info" line
- [x] Invalid input is rejected with a readable message, not a crash — adding the same doctor again in lower case: "dr dryrun added 1009" is already on this clinic's list, and the database holds one doctor with one link, so nothing half-made was left
- [x] Boundary cases checked — the booking form's doctor is optional (no `required`, the label says "(optional)"); a visit with no doctor, a colleague's patient and a left clinic's patient are in the scope harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | harness F, J; Settings → Security code path in `check-doctors` |
| management | Clinics, Management → Clinics, booking, Doctors | unchanged, new words | driven in the browser: 15 pages load, old URLs redirect, nothing says vet; Settings → Security refused (admin only, as before) |
| staff | as management for clinics | unchanged | harness F; `check-clinics-readonly` D |
| doctor (was vet) | its clinics' residents plus its own patients anywhere; writes at its current clinics | widened reads | browser: signs in as "Doctor", Residents lists Novel's 14 (11 shown, 3 deceased hidden) with the new line; harness A–E |
| volunteer | no residents | unchanged | harness F |
| signed out | the public site | unchanged | `check-public-views` all ok |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side — harness D and E under the doctor's JWT; Management refused at `/admin/security` by the server redirect

## 5. Cross-cutting

- [x] Nav entry correct — the Clinics route and Management tile read Clinics (`routes.ts`); `/vets`, `/management/vets`, `/vet-visits/new` and `/residents/<id>/vet-appointments` redirect to the new pages (checked by loading each)
- [x] Manual updated — Clinics topics, Security's role name, booking a clinic visit, the model explained once, the doctor's widened list; `/manual` loads in English and Thai with no "vet" but the line about what people can type
- [x] Translatable strings go through the translation path — the clinic name's translation row moved from `vets` to `clinics` in 0172 and `labels.ts` follows it; `/management/translations` was not opened
- [x] Mobile viewport (375px) — the doctor's Residents page at 375 px: page width 375, no sideways scroll
- [x] Browser console clean — no console errors on the pages loaded
- [x] Network clean — no failed requests in the pane's log for the pages loaded

## 6. Regression

- [x] The pages nearest the change still work — loaded in English and Thai: Clinics, a clinic hub, Management → Clinics, a clinic's Doctors, Book clinic visit, a resident and its Clinic Visits tab, Management, Operations, Cashflow, Residents, Home, Manual, Release notes. Scanned each for "vet"/"vets"/"สัตวแพทย์": none, except a dev doctor whose name is "Scope test vet" (data) and the manual's note that "vet" still works when typed
- [x] Any shared file touched checked from a second, unrelated page — the dictionaries, manual and `NavLinks` were checked by loading Cashflow, Operations, Home and Release notes, which read them and are not clinic pages
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after both syncs

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — with a Done note; searched the open items for the tables, functions, role and words changed: the two clinic-login Security items are **not** closed (both outcomes can still happen; their names were updated on the `backlog` branch), and no other open item is closed. A follow-up to drop the compatibility views went on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-clinics-and-doctors.md`, carried by #495
- [x] `README.md` still accurate — names no vet route, table or role
- [x] **Release notes.** Every staff member sees the labels change: `unreleased` gained two lines, one for everyone (Vets is now Clinics, a vet visit is a clinic visit, a mobile doctor is a clinic with no address, old links still work) and one for admin and doctor (the role is Doctor; a doctor also sees, read-only, the animals they saw at a clinic they have left)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every page claim above was loaded; every scope claim is a harness assertion

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates and harness lines above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of the renamed tables (`check-public-views` all ok)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — yes: this code reads only `0172`'s names. `0172` must be on production **before** this deploys, and this must deploy in the same release as `0172`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — deferred: release manager
- [x] Apply plan stated — `0172` on production immediately before the deploy

### Rollback

- [x] Rollback position stated — rolling the code back past this release leaves `0172` applied, and the older code then reads through read-only views: it shows clinics and visits but cannot save them. A real rollback needs a down-migration first (not written)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The doctor's Residents line still described the clinic-only rule | fixed (`d22a0800`), and the manual's two lines with it |
| 2 | low | The "no clinic" message told a doctor to have an admin "set your clinic", a step 0127 replaced | fixed: it now says to link the login to their doctor entry |
| 3 | info | On dev the Doctor role holds 2 cells (resident record read, microchip), so a doctor login lands on "You don't have access" and has no Appointments. This is the Director's draft matrix loaded 2026-10-05 (#380), recorded since as "vet: got 2, wanted 13"; the rename does not touch `role_permissions` | accepted: not this PR's; the roles work owns it |
| 4 | info | Script-filled forms in the browser pane submitted as plain GETs, because the form had not hydrated; real clicks and typing work (React hydrates the form on the first real interaction) | not a defect in the app |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai words read naturally to a Thai speaker: คลินิก, หมอ, การไปคลินิก, นัดไปคลินิก, and the doctor's Residents line | `/clinics`, `/clinic-visits/new`, `/residents` as a doctor, in ไทย |
| 2 | A real doctor login's day, once the Doctor role has its cells back (defect 3): lands on Appointments, books at its own clinic only, sees an old clinic's patient read-only | `docs/role-walkthrough.md` Pass 1 — Doctor |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items wait for a person, see the line below

Manual verification by: pending: the Thai wording (1) and a real doctor login's day (2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
