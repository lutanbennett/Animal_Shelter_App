# Feature test plan: iphone-date-picker

## Header

| | |
|---|---|
| Feature | The calendar button beside every date box opens the date picker on an iPhone |
| Backlog item | `docs/backlog.md` → BUG: the calendar button beside every date box does nothing on an iPhone |
| Branch / worktree | `claude/iphone-date-picker` @ `C:\Development\Animal_Shelter_iphone-date-picker` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | this PR |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | 309285a3 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the native date input is laid invisibly over the calendar button so a tap lands on it, and desktop keeps `showPicker()`
- [x] Files/areas touched listed: `src/components/DateInput.tsx` only in code (every form with a date uses it), plus releases.ts, backlog, a decision file; no migration, no worker/
- [x] Roles affected identified: everyone who fills a date field on a phone; no permission changes
- [x] Out of scope written down: no change to the typed DD/MM/YYYY parsing, `src/lib/date-input.ts`, `DateTimeInput` logic, or any form; the real iPhone is Lutan's to tap

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on /management/donations/new at 375 px the native input has exactly the button's box, is the top element at its centre, has opacity 0; setting a date on it fills the typed box (05/10/2026)
- [ ] Data persists — n/a: no stored data; the submitted ISO value is unchanged code
- [ ] Create / edit / delete — n/a: a form widget, no records of its own
- [ ] Empty state — n/a: an empty box was not changed
- [x] Invalid input is rejected with a readable message: a date past `max` still gets "Date must be 22/10/2026 or earlier." from the typed box
- [x] Boundary cases checked: `max` (today) kept on the native input and the typed box's range message; disabled state passes `disabled` to the overlay input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | donation form | calendar button works as above | ok (dev-signin admin, aal1) |
| management | same widget | no permission logic | not driven |
| staff | retired | n/a | n/a |
| doctor | same widget | no permission logic | not driven |
| volunteer | same widget | no permission logic | not driven |
| signed out | n/a | no date fields signed out | not driven |

- [ ] Every role above tested — n/a: the widget has no role logic; admin driven
- [ ] A role that should not have access is blocked server-side — n/a: no access rule added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no wording or flow changed, the button is where it was
- [ ] Translatable strings — n/a: the button label "Open calendar" is unchanged, only moved to the input
- [x] Mobile viewport (375px) — no overflow: page scrollWidth did not exceed 375
- [x] Browser console clean — no errors or React warnings seen
- [ ] Network clean — n/a: no network requests added

## 6. Regression

- [x] The pages nearest the change still work: donation form (date box typed and picked). Not driven: Log weight, Intake, Book a clinic visit (same component), left for the iPhone pass
- [ ] Shared file touched checked from a second page — n/a: DateInput is the one shared file and it was loaded on the donation form; releases.ts is a list
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought docs only

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added: `docs/decisions/2026-10-22-date-input-native-overlay.md`
- [x] `README.md` still accurate: it does not describe the date box
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`: the calendar button now opens the date picker on an iPhone. No deploy or hand step is outstanding; the only open item is Lutan seeing it on his phone, and nothing ships on a pending manual line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The iOS cause is labelled a hypothesis; the geometry and the validity message were measured on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change — n/a: `min`/`max` pass through unchanged
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: only the gates line, pasted verbatim
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (code only: redeploy the previous SHA)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Real iPhone: tap the calendar button on Log weight, Intake and Book a clinic visit; the wheel opens, a chosen date fills the box, a future date is refused where it should be | iPhone Safari |
| 2 | Desktop Chrome: clicking the calendar button still opens the picker | Desktop |
| 3 | Android Chrome and the Thai locale unchanged | Phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1 to 3 are pending, so this is left unticked on purpose

Manual verification by: pending: Lutan taps the calendar button on a real iPhone (Log weight, Intake, Book a clinic visit)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: not until the iPhone check is done

Result: pass
