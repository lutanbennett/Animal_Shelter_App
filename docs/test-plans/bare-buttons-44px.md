# Feature test plan

Filled from `docs/test-plan-template.md`. A partial pass on the backlog item; the evidence is the 44 px check run before and after, pasted at the end.

---

## Header

| | |
|---|---|
| Feature | Move real actions off bare 36 px `<button>`s onto `ActionButton` (28 submit buttons and four more); audit the rest |
| Backlog item | `docs/backlog.md` → Bare `<button>`s under 44 px on phones (not ticked) |
| Branch / worktree | `claude/bare-buttons-44px` @ `C:\Development\Animal_Shelter_bare-buttons-44px` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | linked from the PR itself |
| Tested by / date | Claude (bare-buttons-44px session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every plain primary submit button and four other real actions now render through `ActionButton`, so the phone-width check fails if one regresses. The item asked for all ~200 notes; this is a partial pass and the item stays unticked (see the decision)
- [x] Files/areas touched listed: `ActionButton` callers in 29 forms (resident edit/rehome/move/hospital, vet-visit, prescription/diet/procedure/blood-test, immunization, maintenance, delivery, recurring jobs, weight, account password, residents filter, microchip, assistant input, forecast picker, tag-link copy), `src/components/hub-icons.ts` (`save`, `filter`), `src/lib/releases.ts`, `docs/decisions/2026-10-07-bare-buttons-44px.md`. No `worker/`, no `supabase/`
- [x] Roles affected identified: all signed-in roles, because the buttons are on forms every role can reach; no permission or data change
- [x] Out of scope written down: the app header buttons (Lutan's call), the tab/chip/radio bare buttons (ruled not actions), and eight real actions not yet converted (listed in the decision audit)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` (photo-split, worker-upload-limit) merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 161s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: restyle only; each converted button keeps its `type`, `disabled` and handler, and only the element changed. The check loaded every page with the new buttons
- [ ] Data persists — n/a: no data or state changed
- [ ] Create / edit / delete all exercised — n/a: no data or state changed
- [ ] Empty state renders sensibly — n/a: no data or state changed
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed
- [ ] Boundary cases checked — n/a: no logic changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | resident, medical, management forms | no change in access | n/a: restyle only; page loads checked |
| management | management forms | no change in access | n/a: restyle only; page loads checked |
| staff | resident and medical forms | no change in access | n/a: restyle only; page loads checked |
| vet | vet screens | no change in access | n/a: restyle only; page loads checked |
| volunteer | volunteer screens | no change in access | n/a: restyle only; page loads checked |
| signed out | none of these | no change in access | n/a: login screens not touched |

- [ ] Every role above tested — n/a: no access change; the phone-width check loaded pages as admin, management, staff, vet, volunteer, head_of_medical and head_of_maintenance
- [ ] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no wording changed
- [ ] Translatable strings go through the translation path — n/a: no strings added; labels are the existing ones
- [x] Mobile viewport (375px) — no overflow, controls reachable: nine role/language runs, no sideways scroll, no component action under 44 px (output below)
- [ ] Browser console clean — n/a: not inspected separately; the check loaded every page and reported 0 warnings
- [ ] Network clean — n/a: not inspected separately; the check loaded every page and reported 0 warnings

## 6. Regression

- [x] The pages nearest the change still work: the check loaded 34 (staff) to 51 (admin) pages including the resident hub, edit, rehome, move, hospital and the medical forms
- [x] Shared file touched (`ActionButton`, `hub-icons.ts`) checked from an unrelated page: the check loads pages using them from residents, enclosures, management and admin
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the sync are green

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately not ticked; about half the notes remain. Status is in the decision; the remaining count goes on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-07-bare-buttons-44px.md`, with the per-note audit
- [x] `README.md` still accurate: it does not describe these buttons
- [x] **Release notes.** One line added to `unreleased` for staff and Heads who use these forms on phones
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "Thai gives the same notes as English" is the measured counts (staff 28/28, admin 43/43); the import-order mistake in the first conversion script is stated in its fix commit

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited:** the files are the script's own output, concatenated, not retyped
- [ ] Public pages re-checked — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager at deploy time
- [ ] `strip-baked-env` line seen — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] Production `--dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager at deploy time

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first conversion script placed imports above `"use client"` in 24 files (CRLF defeated its match). A directive-position check caught it; typecheck and lint did not | fixed in the next commit |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Decision for Lutan: the app header buttons** — Open menu 36×36, Assistant 34×30, Sign out 20×20. Recommendation in the decision: raise Sign out to 44×44 (the smallest control in the app, on every page); Open menu and Assistant are close and would fit. Not changed here | `docs/decisions/2026-10-07-bare-buttons-44px.md` |
| 2 | Look at a converted form on a phone in English and Thai: the Save button should be 44 px tall with an icon and nothing else on the row should have shifted. Before/after screenshots were **not** taken; the measurements stand in for them | `/residents/<id>/edit`, `/residents/<id>/rehome`, `/diets/new` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (bare-buttons-44px session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are listed, so only the person who looked may tick this

Manual verification by: pending: Lutan to look at a converted form on a phone and to decide the header buttons

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — deferred: Claude, when the PR is opened
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending

## Evidence: check-phone-width.mjs, before

```
--- staff-en
note: 28 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
34 page view(s) measured (staff; en), 12 skipped because the role cannot open them, 0 warning(s).
166 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- staff-th
note: 28 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
34 page view(s) measured (staff; th), 12 skipped because the role cannot open them, 0 warning(s).
166 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- admin-en
note: 43 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
51 page view(s) measured (admin; en), 3 skipped because the role cannot open them, 0 warning(s).
183 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- admin-th
note: 43 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
51 page view(s) measured (admin; th), 3 skipped because the role cannot open them, 0 warning(s).
183 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- management-en
note: 35 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
41 page view(s) measured (management; en), 5 skipped because the role cannot open them, 0 warning(s).
180 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- vet-en
note: 4 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
12 page view(s) measured (vet; en), 34 skipped because the role cannot open them, 0 warning(s).
3 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- volunteer-en
note: 6 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
9 page view(s) measured (volunteer; en), 37 skipped because the role cannot open them, 0 warning(s).
65 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- head_of_medical-en
note: 5 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
11 page view(s) measured (head_of_medical; en), 35 skipped because the role cannot open them, 0 warning(s).
65 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- head_of_maintenance-en
note: 6 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
11 page view(s) measured (head_of_maintenance; en), 35 skipped because the role cannot open them, 0 warning(s).
67 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
```

## Evidence: check-phone-width.mjs, after

```
--- staff-en
note: 12 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
34 page view(s) measured (staff; en), 12 skipped because the role cannot open them, 0 warning(s).
182 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- staff-th
note: 12 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
34 page view(s) measured (staff; th), 12 skipped because the role cannot open them, 0 warning(s).
182 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- admin-en
note: 26 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
51 page view(s) measured (admin; en), 3 skipped because the role cannot open them, 0 warning(s).
200 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- admin-th
note: 26 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
51 page view(s) measured (admin; th), 3 skipped because the role cannot open them, 0 warning(s).
200 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- management-en
note: 18 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
41 page view(s) measured (management; en), 5 skipped because the role cannot open them, 0 warning(s).
197 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- vet-en
note: 2 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
12 page view(s) measured (vet; en), 34 skipped because the role cannot open them, 0 warning(s).
5 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- volunteer-en
note: 3 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
9 page view(s) measured (volunteer; en), 37 skipped because the role cannot open them, 0 warning(s).
68 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- head_of_medical-en
note: 2 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
11 page view(s) measured (head_of_medical; en), 35 skipped because the role cannot open them, 0 warning(s).
68 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
--- head_of_maintenance-en
note: 3 bare <button>(s) under 44 px that no shared component renders (not failed: a button may be a stepper or a chip, not an action):
11 page view(s) measured (head_of_maintenance; en), 35 skipped because the role cannot open them, 0 warning(s).
70 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
```
