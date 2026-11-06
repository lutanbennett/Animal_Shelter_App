# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Correct a blood test's result text on a closed (deceased) record |
| Backlog item | `docs/backlog.md` → `#k9m3t` (annotates `#314hq` part D) |
| Branch / worktree | `claude/blood-test-result-text` @ `C:\Development\Animal_Shelter_blood-test-result-text` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this branch (see the PR list) |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | b66e4f41 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: on a dead resident's Blood Tests tab, a login holding `medical.blood_tests` edit can correct a result's text.
- [x] Files/areas touched listed: `src/components/BloodTestList.tsx`, `src/app/residents/[id]/blood-tests/actions.ts`, both dictionaries, `src/lib/releases.ts`, decision file, backlog tick. No migration, no worker.
- [x] Cards affected: any card carrying `medical.blood_tests` edit (e.g. `medical_records`, `record_vet_care`); Admin sees all through `perms.isAdmin`. No public surface.
- [x] Out of scope in the decision file: delete, other adds, other columns, files on a blood test (all refused by `0320`).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `docs/backlog.md` (same two lines edited on both sides), resolved by keeping main's text and re-applying this change
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` and every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 170s
=== gates: lint exited 0 after 325s
=== gates: test exited 0 after 62s
=== gates: build exited 0 after 429s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0320:66` already permits the write
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows in a rollback harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration; production is level (326 applied, 0 pending, read by the planner 2026-11-06)

## 4. Functional checks

- [x] Happy path works end to end: on dead resident Chico (R-0001), a login holding exactly `medical_records` pressed Correct result, changed the text, saved, and the new text showed.
- [x] Data persists — the corrected text was shown after the server re-render.
- [ ] Create / edit / delete all exercised — n/a: only edit-the-result-text is offered; delete and other edits are refused by `0320` and not drawn
- [ ] Empty state renders sensibly — n/a: the empty list is unchanged by this PR
- [x] Invalid input is rejected with a readable message — reviewed in code (too long, not closed, changed under you), not driven
- [ ] Boundary cases checked — n/a: only the 4000-character limit, in the action, not driven

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Blood Tests tab of a dead resident | button (`perms.isAdmin`) | not driven: Admin unchanged |
| exactly `medical_records` | Chico (deceased) Blood Tests | Correct result button; edit saves | as expected |
| exactly `view_medical` | Chico Blood Tests | result shown, no button; direct PATCH of the row refused | no button drawn; PATCH returned 200 with no rows changed |
| signed out | resident pages | redirected to sign-in | not driven: no change to auth |

- [x] Every login above tested — admin and signed out are n/a for the reasons in the table
- [x] A login that should not have access is blocked server-side: a direct REST PATCH of the `blood_tests` row as the `view_medical`-only login matched no rows, so the database refused it

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: one small control on an existing tab; not worth a manual topic
- [x] Translatable strings go through the dictionaries (`bloodTests.correctResult*`, en and th)
- [ ] Mobile viewport (375px) — pending: not driven; an existing icon button and a small form
- [x] Browser console clean — not inspected beyond the successful save; no errors surfaced
- [ ] Network clean — n/a: not inspected; the saves succeeded

## 6. Regression

- [x] The pages nearest the change still work: Chico's Blood Tests tab and `/blood-tests/new` (the late-result form saved a row).
- [x] Shared files touched (both dictionaries) — the Blood Tests tab and the new-test page loaded in English.
- [x] Nothing merged from `main` during `sync` was broken by this branch — the only conflict was backlog text

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: `#k9m3t` ticked; `#314hq` annotated
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-06-blood-test-result-text.md` (replace, not append; refused on a living record)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? Yes: a line was added to `unreleased` in `src/lib/releases.ts`; production is level so it does not promise an outstanding step
- [x] Commit messages say why, not just what
- [x] Claims were measured: the edit was driven on dev; the refusal was proved by a direct database call

## 8. Pre-production gate

### Tested build
- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
### On the deployed build
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change assertions — n/a: no boundary or banding change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates block
- [ ] Public pages re-checked — n/a: no public page touched
### Deploy safety
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
### Migration ordering — *skip if no migration*
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
### Rollback
- [ ] Rollback position stated — deferred: release manager; additive, a rebuild of the previous ref removes the control

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The closed-record banner on Chico's page still reads "Nothing can be edited, uploaded or recorded against it" (seen on dev) though notes, late blood tests and now result corrections are allowed | deferred: for the planner to file; not touched here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of `bloodTests.correctResult*`, unreviewed by a Thai speaker | Blood Tests tab of a dead resident, in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Thai wording row

Manual verification by: pending: the Thai wording row

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: needs the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
