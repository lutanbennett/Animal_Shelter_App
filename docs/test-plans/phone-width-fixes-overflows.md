# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason. (Filed as `phone-width-fixes-overflows.md`: the name
`phone-width-fixes.md` is the 2026-10-03 plan of an earlier stream on a branch of
the same name.)

---

## Header

| | |
|---|---|
| Feature | Three pages that scrolled sideways at 375 px no longer do: the Rehome / foster form and the Medications and Diets pages |
| Backlog item | `docs/backlog.md` → Mobile: Three pages scroll sideways at 375 px |
| Branch / worktree | `claude/phone-width-fixes` @ `C:\Development\Animal_Shelter_phone-width-fixes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-05 |
| Carries a migration? | no |
| Tested at SHA | recorded in the PR after the final sync |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the three overflows the guard found are fixed at the element
- [x] Files/areas touched listed: `src/components/ActionLink.tsx` (`shrink-0` only on the icon-only variant), `src/components/CarerPicker.tsx` and `src/app/residents/[id]/rehome/RehomeForm.tsx` (`min-w-0` on the flex columns and fieldsets), `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-05-phone-width-fixes.md`
- [x] Roles affected identified: admin, management, staff (Rehome); admin, management (Medications, Diets). `ActionLink` is shared, but only labelled (`iconOnlyOnMobile={false}`) links change, and only by being allowed to wrap
- [x] Out of scope written down: a base-layer `fieldset { min-width: 0 }` rule (proposed in the decision file, not added), and the parked Mobile responsiveness sweep

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the PR; result in the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — output in the PR
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Run against dev with the guard on port 3004. Before the fix (the guard's first run, from the backlog item): Rehome +244 px, Medications and Diets +88 px each. After a first attempt (`min-w-0` on the select's wrapper only) the guard still failed six Rehome rows by 241–243 px, naming `div.flex.min-w-0.flex-col.gap-1 > select#carerId` at 592 px: the fieldsets were the remaining cause. After the fix, the full run, as printed:

```
326 page view(s) measured (admin, management, staff, vet, volunteer, head_of_medical; en + th), 242 skipped because the role cannot open them, 0 warning(s).
No page scrolls sideways.
exit 0
```

- [x] Happy path works end to end: the guard ends `No page scrolls sideways.` for all six roles in English and Thai
- [ ] Data persists — n/a: no data is written by this change
- [ ] Create / edit / delete all exercised — n/a: layout classes only
- [ ] Empty state — n/a: layout classes only
- [ ] Invalid input is rejected with a readable message — n/a: no input handling changed
- [x] Boundary cases: the guard seeds a carer with a long name and phone ("Lutan Bennett · 0624870160 …"), the case that made the select 595 px wide
- [x] Red was real before it went green: the first run and the intermediate run above failed on exactly these elements

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Rehome, Medications, Diets | no sideways scroll | pass (guard) |
| management | Rehome, Medications, Diets | no sideways scroll | pass (guard) |
| staff | Rehome | no sideways scroll | pass (guard) |
| vet / volunteer / head_of_medical | other pages using `ActionLink` | unchanged | pass (guard) |
| signed out | n/a | n/a | n/a |

- [x] Every role above tested
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: no manual topic describes these layouts; nothing about how to use the pages changed
- [ ] Translatable strings — n/a: no strings added; Thai was run through the guard
- [x] Mobile viewport (375px): measured by the guard in English and Thai. Whether the carer option text is still readable enough to choose from is left for manual verification
- [ ] Browser console clean — n/a: class names only
- [ ] Network clean — n/a: class names only

## 6. Regression

- [x] The nearest things still work: every other page the guard measures (326 views) still does not scroll sideways, including those using `ActionLink`
- [x] Shared files touched (`src/lib/releases.ts`, `docs/backlog.md`, `ActionLink`, `CarerPicker`) re-read after editing; icon-only `ActionLink` keeps `shrink-0`
- [x] Nothing merged from `main` during `sync` was broken: see the gates in the PR

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-05-phone-width-fixes.md`, including the fieldset finding and the proposed base-layer rule
- [ ] `README.md` still accurate — n/a: it does not describe these pages
- [x] **Release notes.** `unreleased` gained a line in `src/lib/releases.ts`, written for admin, management and staff
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The px figures are from the guard's output; the fieldset cause was found because the first fix measurably did not work

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — n/a: not deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** — n/a: not a boundary change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys in this PR
- [ ] `strip-baked-env` seen — n/a: nothing deploys in this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; class names only, no schema or data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Rehome page: Carer picker 595 px wide (+244 px) | fixed: `min-w-0` on the columns and fieldsets |
| 2 | low | Medications and Diets: "Stock between counts" link `shrink-0` (+88 px each) | fixed: `shrink-0` only on icon-only `ActionLink` |
| 3 | low | The backlog's suggested fix (`min-w-0` on the column) was not enough: fieldsets default to `min-width: min-content` | fixed; base-layer rule proposed in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | At 375 px, in English and Thai, the Carer select on Rehome / foster is capped to the screen and you can still tell carers apart and pick the right one | `/residents/{id}/rehome`, a resident, dev or test |
| 2 | The "Stock between counts" link wraps onto a second line and reads well | `/management/medications`, `/management/diets` at 375 px |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the two items are left for Lutan to look at

Manual verification by: n/a: not yet — the two items above are left for Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: deferred: release manager

Result: pass

Release manager acknowledgement: n/a  Date: 2026-10-05
