# Feature test plan

## Header

| | |
|---|---|
| Feature | Optional doctor name on a vet appointment — the UI half (the column shipped in #76) |
| Backlog item | `docs/backlog.md` → Medical records → **Optional doctor name on a vet appointment** (ticked in this PR) |
| Branch / worktree | `claude/vet-doctor-name` @ `C:\Development\Animal_Shelter_vet-doctor-name` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | this PR — see the GitHub PR for the number |
| Tested by / date | Claude (automated and browser-driven) / 2026-09-24 |
| Carries a migration? | no — it reads `0074_vet_doctor_name.sql` from #76, which is applied to dev and **not yet to production** |
| Tested at SHA | branch at `main` @ `2f2ca39` plus this PR's changes (the working tree the gates and browser checks ran on) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the vet-visit booking and edit forms get an optional free-text Doctor field, with the names already used for the chosen vet offered as a datalist, and the name is shown wherever a visit is listed
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/vet-visits/` (new `DoctorNameField.tsx`; `new/` and `[id]/edit/` pages, forms and actions), `src/app/residents/[id]/[section]/page.tsx` (Vet Appointments tab), `src/app/vets/[id]/` (hub page and `VetHub.tsx`), `src/lib/vets/doctors.ts` (new), `src/lib/vets/stats.ts` (`visitsInPeriod` made generic so rows keep their extra fields), `src/lib/archive/` (record, summary PDF, offline index), i18n en/th, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — whoever can already book or edit a vet visit sees the new field; whoever can already read a resident's Vet Appointments tab or a vet hub sees the name. No policy, route guard or RPC changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the assistant's vet booking does not ask for or accept a doctor (its parser strips "dr"/"doctor" when matching a vet); `schedule_bulk_appointments` did not gain `p_doctor_name` (see `docs/decisions.md`); no reporting by doctor

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (fast-forward `d355330..2f2ca39`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 204s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; 0074 merged in #76
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; 0074 was applied to dev with #76
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; existing NULL-doctor rows are covered under section 4
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration in this PR; #76's `scripts/check-vet-doctor-name.mjs` covers 0074
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; the ordering this PR needs is in section 8

## 4. Functional checks

All on `http://localhost:3001` against dev, driven in the built-in browser, rows read back through the Management API (read-only `select`).

- [x] Happy path works end to end — booked B1 (Cat) with Mae Wang, Doctor `   Dr Somchai (vdn test)   `, 2026-09-20 10:00. The Vet Appointments tab showed `Mae Wang · Dr Somchai (vdn test)`
- [x] Data persists — reload the page and the change is still there — the edit page for that visit (`20e8ec2d…`) reloaded with the field reading `"Dr Somchai (vdn test)"`, leading and trailing spaces gone
- [x] Create / edit / delete all exercised — create above. Edit to `   ` (spaces only) and save: the row read back `doctor_name: null, is_null: true`. Edit to ` Dr Ploy ` and save: read back `"Dr Ploy"`. There is no delete for visits
- [x] Empty state renders sensibly (no rows yet) — a vet with no named visits (Novel) gets no datalist at all (`list` attribute absent), and the field is plain free text
- [ ] Invalid input is rejected with a readable message — n/a: any text is valid in an optional free-text field, and blank means "not recorded". The one new error path, the doctor update failing after the RPC has booked, was not forced; its message is in the dictionaries and says the visit was booked and not to book again
- [x] Boundary cases checked — whitespace-only saved as NULL (above); an existing visit with no doctor (Phu Thong, Novel, 13 Aug, `6cf63d51…`) opened with an empty field and saved untouched, and the row read back unchanged (`doctor_name: null`, notes `Oral Exam`, status and date as before). The tab rows for that resident show `Novel` with no trailing separator

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no change to access | unchanged | n/a |
| management | n/a: no change to access | unchanged | n/a |
| staff | n/a: no change to access | unchanged | n/a |
| vet | n/a: no change to access | unchanged | n/a |
| volunteer | n/a: no change to access | unchanged | n/a |
| signed out | n/a: no change to access | unchanged | n/a |

- [ ] Every role above tested — n/a: no route, guard, RPC or policy changed. The doctor is written through the same `vet_appointments` update policy the edit form already uses (0030), and read through the same selects
- [ ] A role that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the "Booking and recording vet visits" steps mention the Doctor field and its suggestions, and that Edit can add the doctor later
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new labels are dictionary strings added to both `en.ts` and `th.ts` directly, as every other `vetVisits` label is. The Booking page was loaded in Thai and showed `ชื่อหมอ (ไม่บังคับ)`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/vet-visits/new` at 375×812: `scrollWidth` 375 = `clientWidth` 375; the Doctor field sits full width under Vet / clinic
- [x] Browser console clean — no errors on the edit page after the change (`read_console_messages`, errors only: none)
- [ ] Network clean — n/a: not captured separately; every page and both form submits in section 4 completed and redirected normally

## 6. Regression

- [x] The pages nearest the change still work — `/vet-visits/new`, `/vet-visits/[id]/edit` (a named and an unnamed visit), the Vet Appointments tab for B1 (Cat) and Phu Thong, and the Mae Wang vet hub, whose Recent visits list read `vet-doctor-name verification · Dr Ploy`
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/vets/stats.ts` (`visitsInPeriod` is now generic): loaded the Mae Wang hub, whose stat cards and visits-per-month chart rendered with the period filter applied. `manual/en.ts` and the dictionaries: the whole app shell and the Thai booking page rendered
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync was a fast-forward, and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — moved to Completed → Medical records. The assistant-booking follow-up goes on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — why the booking sets the doctor after the RPC rather than through a new parameter, and the cost of that
- [x] `README.md` still accurate — it does not describe vet-visit fields
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line saying a vet visit can record which doctor saw the resident, where to fill it in, and where it shows
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Measured: that the RPC `returns setof vet_appointments` (read from 0030) and that the follow-up update lands, since the booked row read back with the name; that 0030 gives staff update wherever they have insert (read from the policy text). Not measured: the failure path's message, which is stated as untested in section 4

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed; the appointment date is handled exactly as before
- [ ] Boundary or banding change covered on both edges — n/a: no threshold, band or cutoff changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: apart from the gates block, which is pasted as printed, the evidence is values quoted inline from the browser and from row reads
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Not both, but it reads one production does not have yet: this code selects `vet_appointments.doctor_name`, so **0074 must be applied to production before this deploys**, or the Vet Appointments tab, the vet hub, both vet-visit forms and the deceased archive will fail on a missing column
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] Production backup fresh — n/a: 0074 is an additive nullable column with a trigger and a check constraint that every existing NULL row satisfies
- [x] Apply plan stated: `supabase/migrations/0074_vet_doctor_name.sql`, production project `dbkodyyxxhtygxcxmfcu`, via `node scripts/apply-migrations.mjs --env production`, **before** the deploy that carries this PR

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the forms and lists without the Doctor field at once. It does not remove 0074, and does not need to: the old code never selects the column, and names already recorded simply stay in the table unread

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The two writes when booking with a doctor (RPC, then update) are not one transaction | accepted — the failure message says the visit is booked and to add the doctor with Edit; see `docs/decisions.md` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A deceased resident's summary PDF and offline `index.html` show `Vet · Doctor` in the Vet column for a visit with a doctor, and just the vet for one without. Not driven here: building the archive needs Drive, and the local Google OAuth client is dead | `test.lannacare.org`: record a test resident with a named visit as deceased, then open the archive in Drive |
| 2 | Picking a suggestion from the Doctor datalist on a phone — how the browser presents a datalist differs by platform, and it was only checked through the DOM here | `test.lannacare.org/vet-visits/new` on a phone, with a vet that already has a named visit |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are outstanding; see the pending line below

Manual verification by: pending: the archive PDF/index doctor column and the datalist on a phone (Left for manual verification 1 and 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above — the one defect is accepted
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
