# Feature test plan

## Header

| | |
|---|---|
| Feature | Vet visit form: a vet records visits for their own clinic (set in Security); Status kept as a field and reworded |
| Backlog item | `docs/backlog.md` → "Vet visit form: scope the clinic picker, and reconsider the Status dropdown" |
| Branch / worktree | `claude/vet-visit-form-scoping` @ `C:\Development\Animal_Shelter_vet-visit-form-scoping` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `e84a9fc` (the code; this plan follows it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a vet account books and edits vet visits for its own clinic only (`user_roles.vet_id`, 0102), set by an admin in Security, and is refused while none is set; Status stays a dropdown because the data says it is not derivable (overdue = scheduled with a past date; cancelled comes from the deceased cascade), with options and a hint that say what each state means. Both halves were put to Lutan before anything changed; answers are in `docs/decisions.md`
- [x] Files/areas touched listed — `src/lib/vets/scope.ts` (new); `src/app/vet-visits/new/{page,VetVisitForm,actions}`; `src/app/vet-visits/[id]/edit/{page,VetVisitEditForm,actions}`; `src/app/admin/security/{page,UsersTable,actions}`; `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `README.md`, `docs/decisions.md`, `docs/backlog.md`
- [x] Roles affected identified — vet: clinic fixed to their own, or refused with no clinic; admin: gains the Clinic select on vet rows in Security; admin / management / staff: booking and edit forms unchanged apart from Status wording; volunteer and signed out: unchanged (volunteers cannot write vet visits under RLS, and the proxy sends signed-out requests to sign in)
- [x] Anything explicitly **out of scope** written down — enforcement in RLS (a vet's session can still insert a visit for any clinic through the API; that belongs with the resident-level scope item, order 4, and this stream had no migration slot); a `missed` status (offered to Lutan, not taken; would need an enum migration); linking a vet account to a particular doctor (0102 defers that to order 4); the rest of the doctor-roster feature half (list on the clinic hub, `p_doctor_name` in the booking action)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.` at `e84a9fc`; after the PR opened, a second sync merged #184 (`schema-vets-readonly`) cleanly — `0105` (a vet reads `vets` but no longer writes it, which is all these forms need), its check script and docs, no app code, so the gates run above still covers every file the build compiles
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run at `e84a9fc`, which printed:

```
=== gates: build exited 0 after 272s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; reads `user_roles.vet_id` and `current_user_vet_id()` from 0102, already on `main` and applied to dev
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the Status decision was read off dev's real rows (72 completed past, 1 scheduled future, 2 scheduled past, 0 cancelled; 2 vet accounts, neither with a clinic)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; 0102's constraint and trigger on `user_roles.vet_id` were exercised by `scripts/check-vet-doctors.mjs` in #176
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; needs 0102 on production, which ships with release 0.8.0

## 4. Functional checks

- [x] Happy path works end to end — as the admin test login on `localhost:3005`: `/vet-visits/new` lists all five dev clinics with the reworded Status and its hint; `/vet-visits/<id>/edit` for a scheduled 29 Sep Novel visit showed all five clinics and all three statuses, and Save changes returned to the resident's Vet Appointments tab with the visit unchanged (Novel, 29 Sep 2026, Scheduled). The vet path is under Left for manual verification
- [x] Data persists — reload the page and the change is still there — the saved visit reloads on the Vet Appointments tab as it was
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: edit exercised through the changed action as admin; a booking was not submitted as admin because the booking action's change only adds the vet check, which for an admin returns before the RPC unchanged; setting and clearing a clinic in Security needs a 2-step session, under Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: the empty state here is "vet account with no clinic", which needs a vet session, under Left for manual verification
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the invalid input is a vet posting another clinic's id, which needs a vet session; the refusal strings exist in both dictionaries (`notYourClinic`, `noClinicForAccount`, `clinicNotFound`, `clinicOnlyForVets`) and typecheck
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the Thai strings at 375px: the longest new text (the Status hint) wraps with no horizontal scroll (`scrollWidth` 375 = `innerWidth` 375)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/vet-visits/new`, `/vet-visits/<id>/edit`, `/admin/security` | every clinic on both forms; Clinic select under the role on vet rows | forms checked in the browser: every clinic. Security needs 2-step; the test login has none, so it is under Left for manual verification |
| management | both forms | every clinic, as before | not signed in as management; `loadVetScope` returns `any` for every role but vet |
| staff | both forms | every clinic, as before | not signed in as staff; same code path as management |
| vet | both forms | own clinic by name; refused with no clinic | Left for manual verification |
| volunteer | both forms | unchanged: the form renders and RLS refuses the write, as before this PR | not re-checked; nothing in this PR changes a volunteer's path |
| signed out | both forms | sent to sign in | checked: `/vet-visits/new` signed out went to `/login?next=%2Fvet-visits%2Fnew` |

- [ ] Every role above tested — n/a: vet and the Security page are under Left for manual verification; management, staff and volunteer share the admin's code path through `loadVetScope`
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: nothing new is refused by role except a vet with no clinic or posting another clinic, both needing a vet session (Left for manual verification). `updateVetClinic` keeps `refuseUnlessAdmin`, the same admin + 2-step check as every other Security action

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the vet-visits topic's status step and two notes, and the Accounts and roles step about a vet account's clinic, both found on `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: UI strings only, in both dictionaries; no user-entered text
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/vet-visits/new` in Thai at 375×812
- [x] Browser console clean — no errors or React warnings — no console errors across the booking form, edit form, save and Vet Appointments tab
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not inspected request by request; the pages and the save completed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/vet-visits/new`, `/vet-visits/<id>/edit` and its save, `/residents/<id>/vet-appointments`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `/manual` loaded and rendered the changed topics alongside the rest; the dictionaries were exercised by the menu and forms in both languages
- [x] Nothing merged from `main` during `sync` was broken by this branch — the second sync brought in `0105` only; `vet_read_vets` keeps the select a vet's forms run (Security reads with the service role)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-27, "Vet-visit Status stays a field; a vet books for their own clinic, set in Security"
- [x] `README.md` still accurate — the vet row in the roles table now names the clinic link and says it is the forms' rule, not RLS
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: a vet books for their own clinic, set by an admin under Security, and the Status choices say what they mean
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The status counts and vet-account counts were read from dev by query; "cancelled comes from the deceased cascade" is from `handle_deceased_placement` in 0002/0026/0027/0073; "overdue = scheduled with a past date" is from `ResidentHub.tsx` and `VetHub.tsx`. That a vet's API session can still write any clinic's visit is from 0102 adding no policy on `vet_appointments`, not from a run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the booking form's date-driven status default is unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; it reads 0102's column and function, which must be on production first (0102 ships in 0.8.0)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts it completely: no schema. Any `vet_id` an admin set stays in `user_roles`, harmless to the previous build, which never reads it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The first Status hint began "Not worked out from the date", which contradicted the booking form pre-filling Status from the date | fixed before commit: the clause was dropped in both languages |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Security (after 2-step): a vet account's row shows a Clinic select under the role, outlined while empty; choosing a clinic says Clinic updated. and survives a reload; changing that account's role away from vet hides the select and, set back to vet, it is empty again | `/admin/security` |
| 2 | Signed in as that vet **with no clinic set**: Book Vet Visit and Edit Vet Visit both say the account isn't linked to a clinic and to ask an admin, and show no form | `/vet-visits/new`, any visit's Edit |
| 3 | Signed in as the vet **with a clinic set**: the Vet / clinic field shows that clinic by name (no dropdown) with the "Your account belongs to this clinic" hint, and booking a visit records it against that clinic | `/vet-visits/new` |
| 4 | As the same vet, Edit on a visit recorded at a **different** clinic offers both that clinic and theirs, and saving without touching it leaves the visit at its clinic | a resident's Vet Appointments → Edit |
| 5 | The reworded Status options and hint read naturally in Thai | both vet-visit forms, ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — five items above need a vet session and a 2-step admin session

Manual verification by: pending: items 1–5 above — the vet view, the Security clinic select, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: pending: after manual verification
