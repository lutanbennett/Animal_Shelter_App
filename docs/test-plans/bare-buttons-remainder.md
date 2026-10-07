# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The eight real actions #405 left (vet-visit remove-resident ✕, Record chip, Add a new carer, Select residents, Add more, Change, Show anyway) move onto the shared 44 px components, with the dialog buttons beside them; the rest are ruled in the decision file |
| Backlog item | `docs/backlog.md` → Bare `<button>`s under 44 px on phones (**left open**: header pending, unreachable buttons ruled, not all converted) |
| Branch / worktree | `claude/bare-buttons-remainder` @ `C:\Development\Animal_Shelter_bare-buttons-remainder` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | linked from the PR itself |
| Tested by / date | Claude (bare-buttons-remainder session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `d480cf90` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the eight listed actions (and Show anyway's real home, `LargerScreenNotice`) are `ActionButton` / `RowActionButton`, so the 44 px check now guards them
- [x] Files/areas touched listed: `ResidentPicker`, `MicrochipForm`, `CarerPicker`, `LargerScreenNotice`, `CapacityWarningDialog`, `ConfirmDialog`, `MoveFolderDialog`, `DeceasedBanner`, the `addMore` wording in `en.ts`/`th.ts`, `releases.ts`, backlog, decision. No `worker/`, no `supabase/`, not `AppHeader.tsx`
- [x] Roles affected identified: everyone who can open a form with the resident picker (admin, management, staff, vet), the resident page chip line (admin, staff, vet), rehome (admin, management, staff), any delete confirmation (all roles that delete)
- [x] Out of scope written down: the app header (Lutan's decision pending), MyTaskList pills, PhotoGallery lightbox, UnitsPanel (backlog follow-ups), about 80 unread files

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 145s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the handlers are unchanged (same `onClick` / `type="submit"`); the 44 px check loaded each converted page and measured the controls. Not clicked through by hand: see Left for manual verification
- [ ] Data persists — n/a: no data path changed
- [ ] Create / edit / delete all exercised — n/a: no data path changed
- [ ] Empty state renders sensibly — n/a: no list or empty state changed
- [ ] Invalid input is rejected — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: styling swap only (long Thai labels are covered by the check's Thai run)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all pages | unchanged | check ran as admin, en + th |
| management | all pages | unchanged | ran |
| staff | all pages | unchanged | ran |
| vet | vet pages | unchanged | ran |
| volunteer | volunteer pages | unchanged | ran |
| signed out | n/a | unchanged | n/a: no route or permission changed |

- [x] Every role above tested — the 44 px check ran as seven roles (adds head of medical and head of maintenance), English and Thai
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual's words for these buttons (Record chip, Add a new carer) are unchanged, and it does not quote "Add more"
- [ ] Translatable strings go through the translation path — n/a: only `common.addMore` lost a leading "+", in both dictionaries
- [x] Mobile viewport (375px) — no overflow, controls reachable: the check at 375 px reports "No page scrolls sideways." (338 page views, en + th)
- [ ] Browser console clean — n/a: no signed-in browser session; the check script reports page errors as warnings and printed "0 warning(s)"
- [ ] Network clean — n/a: no network path changed

## 6. Regression

- [x] The pages nearest the change still work: vet-visit form, immunization form, rehome, resident page, Contacts and Vets (the check loaded each and measured them)
- [x] Any shared file touched checked from a second, unrelated page by loading it: `ConfirmDialog` (every delete confirmation) and `ResidentPicker` are shared; the check loaded the pages that host them, but opening a dialog was not driven (see the manual list)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

### The 44 px check, before and after

`node scripts/check-phone-width.mjs`, all roles, English and Thai, same dev server. Excerpts of the real output.

Before (`origin/main` @ `060c0ace`):

```
note: 52 bare <button>(s) under 44 px that no shared component renders
      "Show anyway" (in main) 116.2 x 38 px  on 6 page(s), e.g. /management/contacts
      "Add a new carer" (in main) 105.9 x 20 px  on 1 page(s)
      "Remove ZZ Width … Sir Reginald Fl" (in main) 7 x 20 px  on 1 page(s)
      "+ Add more" (in main) 100.3 x 34 px  on 1 page(s)
      "Record chip" (in main) 90.9 x 16 px  on 1 page(s)
      "Select residents" (in main) 132.5 x 34 px  on 1 page(s): /immunizations/new
338 page view(s) measured … 1590 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
```

After the eight (before the Show anyway fix): 38 notes, with none of Add a new carer, Remove ✕, Add more, Record chip or Select residents; 1612 component actions measured; the same two closing lines. After the Show anyway fix, `--roles=admin --pages=/management/contacts,/vets` (en + th):

```
note: 6 bare <button>(s) under 44 px … (the three header buttons, English and Thai)
4 page view(s) measured (admin; en + th) … 6 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
```

The script prints one list merged across roles, so #405's per-role counts (staff 12, admin 26, management 18) were not reproduced; the merged figure is 52 → 38.

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open (header decision pending; unreachable buttons ruled, not all converted); a status line was added instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-07-bare-buttons-remainder.md`
- [x] `README.md` still accurate — nothing in it describes these controls
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line, written for a user (the 7 px ✕, Record chip, Add a new carer and the rest)
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — except the sizes in the decision's "unreachable" table, which it states were read from classes, not measured

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change asserted on both edges — n/a: no threshold logic
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the output above is excerpted from the real runs (head and closing lines), with elisions marked
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | #405's audit said "Show anyway" was in `CapacityWarningDialog`; the note comes from `LargerScreenNotice` | fixed: both converted |
| 2 | info | MyTaskList pills, PhotoGallery lightbox, UnitsPanel remain under 44 px | deferred to backlog (item filed on the backlog branch) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Before/after screenshots at 375 px of the vet-visit ✕, Record chip and Add a new carer. **Not taken**: the browser pane was not signed in and Claude does not type credentials, so the check's measurements above are the evidence instead | `/vet-visits/new?residentId=…`, `/residents/<id>`, `/residents/<id>/rehome` |
| 2 | Open and use the resident picker on a phone: chips wrap sensibly with the new 44 px ✕, Done / Cancel fit, selection still works | `/vet-visits/new`, `/immunizations/new` |
| 3 | A confirmation box (any delete) still reads and fits, in English and Thai | any admin delete |
| 4 | Record chip form: Save and Cancel, and Correct on a resident that has a chip | resident page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (bare-buttons-remainder session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan has not looked yet

Manual verification by: pending: the four items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; follows the merge

Result: pass

Release manager acknowledgement: pending
