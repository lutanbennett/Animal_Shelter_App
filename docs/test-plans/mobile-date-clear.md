# Feature test plan — mobile-date-clear

## Header

| | |
|---|---|
| Feature | A visible Clear button on every optional date field |
| Backlog item | `docs/backlog.md` → "A date field cannot be cleared once it has been set, on mobile." |
| Branch / worktree | `claude/mobile-date-clear` @ `C:\Development\Animal_Shelter_mobile-date-clear` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `30d60d9` (feature commit; `sync` found `origin/main` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a new shared `OptionalDateInput` shows a Clear button beside any populated optional date and submits `""` (stored as `null`) once cleared; it replaces the bare input on every date the server accepts as blank, not only the diet end date
- [x] Files/areas touched listed — `src/components/OptionalDateInput.tsx` (new); callers `src/app/diets/DietForm.tsx`, `src/app/prescriptions/PrescriptionForm.tsx`, `src/app/maintenance/MaintenanceForm.tsx`, `src/app/management/recurring-jobs/RecurringJobForm.tsx`, `src/app/contacts/[id]/ShelterFriendCard.tsx`, `src/app/projects/[id]/FolderView.tsx`; `common.clearDate` / `common.clearDateLabel` in both dictionaries; `src/lib/releases.ts`; docs. No server action changed — each already turns `""` into `null`
- [x] Roles affected identified — anyone who can already open those forms (admin, management, staff, vet for diets/prescriptions; management/admin for recurring jobs, shelter friends and projects as today). No permission changed
- [x] Anything explicitly **out of scope** written down — the other 24 date inputs stay plain because they are required: `required` on the element, or required in practice (photo uploader's date taken gates Upload; the recurring-jobs handover window is validated as two dates; assistant card dates are marked `*`). Vet-visit appointment dates are `datetime-local` and required. Placement `end_date` is never edited in a date field — rehome and return-to-shelter set it. Required dates get no Clear, since the form would refuse the empty value

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 376s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

All in the built-in browser against `next dev` on :3007, dev database, signed in as the dev test admin, emulated **mobile** viewport (375×812, Android touch UA) unless noted.

**Reproduction first, and its limit.** The pane emulates a touch phone but cannot open a phone's native date picker, so the exact failure (a picker that will not return to empty) could not be driven here. What it did confirm before the change: a populated optional date had no clear control anywhere on the page — the only route to empty was inside the native picker. That is the part this change fixes, and it is why a real-phone check is left for manual verification below.

The pane's own form-fill bypasses React's value tracking, so values were set with the native `value` setter plus an `input` event — what a picker does.

- [x] Happy path works end to end — **diet end date**: new diet saved with end date 31 Oct 2026 (list read "27 Sep 2026 – 31 Oct 2026"); reopened Edit showed `2026-10-31` with Clear beside it; tapped Clear (real click at its on-screen position) → field empty, button gone; saved → the list read "27 Sep 2026 – ongoing" and the edit page's data carried `end_date: null`
- [x] Data persists — the diet's cleared end date read `null` from a fresh load of its edit page after saving
- [x] Create / edit / delete all exercised — create (diet with an end date) and edit (clearing it); the component has no delete
- [x] Empty state renders sensibly — every field loads without a Clear button when empty (diet and prescription new forms, maintenance new, recurring-job new); it appears only once a date is set
- [ ] Invalid input is rejected with a readable message — n/a: the only new input is emptying an optional date, which every action already accepts; end-before-start validation is unchanged
- [x] Boundary cases checked — **prescription end date**: set, Clear, form then submits `endDate=""`, input 259px wide. **Maintenance due date** (the uncontrolled path, `defaultValue` + `name`): set → Clear appears (aria-label "Clear Due date") → tapped → field empty and `FormData` gives `dueDate=""`. **Recurring-job end date**: Clear appears ("Clear Ends"). **Shelter friend Friend since** (desktop width, 1280): Clear appears ("Clear Friend since"), input 220px; left unsaved. **Project folder date**: typecheck and lint only, not loaded in the browser — same component, uncontrolled path, as maintenance

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all six forms | Clear on the optional dates | diet, prescription, maintenance, recurring job, friend card seen as admin |
| management | same forms as today | same | not signed in as; no access rule touched |
| staff | diets, prescriptions, maintenance as today | same | not signed in as; no access rule touched |
| vet | diets, prescriptions as today | same | not signed in as; no access rule touched |
| volunteer | as today | same | not signed in as; no access rule touched |
| signed out | nothing | redirected to `/login` | not re-tested; no route or guard touched |

- [ ] Every role above tested — n/a: a presentational control inside forms whose guards are unchanged; each role sees it exactly where they already see the form
- [ ] A role that should not have access is blocked server-side — n/a: no route, action or permission changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual has no step about emptying a date; "Leave blank if ongoing" hints on the forms already describe the empty state and stay true
- [x] Translatable strings go through the translation path — `common.clearDate` / `common.clearDateLabel` in `en.ts` and `th.ts` ("ล้าง")
- [x] Mobile viewport (375px) — no horizontal overflow (`scrollWidth` 375 on the recurring-job form). Defect 1 below found and fixed here
- [x] Browser console clean — only a pre-existing 404 for a static resource, the same on pages this branch does not touch
- [x] Network clean — diet create and update server actions returned and redirected to the resident's Diet tab

## 6. Regression

- [x] The pages nearest the change still work — diet new/edit, prescription new, maintenance new, recurring-job new (mobile and 1280px), a contact's shelter-friend edit (1280px); the required start dates beside the changed fields are unchanged plain inputs
- [x] Any shared file touched checked from a second, unrelated page — the dictionaries: the recurring-jobs and contact pages (unrelated to diets) loaded with their own strings intact and the new Clear label in place
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged nothing ("Already up to date.")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — why a button rather than the native picker, why required dates stay plain, how uncontrolled callers work, the two layout changes
- [x] `README.md` still accurate — it does not describe form controls
- [x] **Release notes.** `unreleased` gained a line: optional dates can be emptied again with a Clear button, naming the six fields
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 60px End field and "31/" were read from the page before the layout fix, 198px after; the `null` round trip was read back from the saved diet. The one reasoned claim — that a phone's native picker may offer no way back to empty — is stated as the reported behaviour and left for a real phone below

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the component only passes through what the picker gives
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding change; the "not only the case reported" point is covered by checking five of the six fields, not just the diet
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts it completely: no schema. Dates people cleared stay `null`, which the previous build already reads as "ongoing" / "no date"

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | At 375px the recurring-job form's side-by-side Starts/Ends left the End field 60px wide beside Clear, showing only "31/" | fixed: Starts/Ends stack below `sm`; End is 198px at 375px and 164px side by side at 1280px |
| 2 | Low | The shelter-friend Friend since column was a fixed 224px, leaving the date about 155px beside Clear | fixed: column widened to `w-72`; input 220px |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a **real phone** (the pane cannot open a native date picker): open a diet's Edit, set an End date with the phone's picker, tap Clear beside it, Save — the diet reads "ongoing" | a resident's Diet tab → Edit |
| 2 | Same phone: Clear sits beside the date without crowding it on the maintenance form and the recurring-job form (Starts and Ends stacked) | `/maintenance/new`, `/management/recurring-jobs` → New |
| 3 | "ล้าง" reads naturally as the Thai label for the button | any of the forms, ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items above need a real phone and a Thai reader

Manual verification by: pending: items 1–3 above — a real phone's picker with Clear, and the Thai label

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: pending: after manual verification
