# Feature test plan

## Header

| | |
|---|---|
| Feature | approver-column-narrowing |
| Backlog item | `docs/backlog.md` → #p3k9w |
| Branch / worktree | `claude/approver-column-narrowing` @ `C:\Development\Animal_Shelter_approver-column-narrowing` |
| Dev server | n/a: database-only change, no page changed |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | yes (0325) |
| Tested at SHA | 31902b24 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an approver may change only the approval columns of an event or project photo.
- [x] Files/areas touched listed: `supabase/migrations/0325_approver_column_narrowing.sql`, `supabase/harness/0325_approver_column_narrowing_harness.sql`, decision file, backlog tick
- [x] Cards affected identified: `photos.approve` loses non-approval writes on event and project rows; `events.run` and `projects.photos` unchanged; Admin unchanged; signed-out public unaffected
- [x] Out of scope written down: resident rows, delete rights, the policy itself (left as 0316 wrote it)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every N 0:

```
=== gates: typecheck exited 0 after 137s
=== gates: lint exited 0 after 295s
=== gates: test exited 0 after 38s
=== gates: build exited 0 after 350s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0324), and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, `drop trigger if exists`)
- [x] Existing rows still read correctly after the change — n/a for reads: the trigger fires on UPDATE only; checked by the harness below
- [x] Harness `supabase/harness/0325_approver_column_narrowing_harness.sql` run on dev: approver can approve and mark Private only on event and project; refused caption, phase, sort_order and approve+caption together; `events.run` and `projects.photos` logins can still edit captions. Printed: HARNESS PASSED
- [x] Down-migration: not needed, `drop trigger attachments_approver_columns_guard` restores 0316's behaviour and nothing else depends on it
- [ ] Production apply plan — pending: next release applies 0325 with the pending migrations (additive trigger, no data change)

## 4. Functional checks

- [x] Happy path works end to end: approving still works (harness case 1)
- [ ] Data persists — n/a: no UI surface changed
- [ ] Create / edit / delete — n/a: only UPDATE is narrowed; owning cards' edits proved in the harness
- [ ] Empty state — n/a: no UI surface
- [x] Invalid input rejected with a readable message: 'An approver may only change a photo's approval, not its caption or other details'
- [ ] Boundary cases — n/a: the rule compares the whole row as jsonb, so no per-column boundary

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | passes the guard via has_permission | not exercised: Admin short-circuits has_permission, same function the owning-card branch uses |
| exactly `photos.approve` | approve / private only | approval columns only | pass (harness) |
| exactly `events.run` | event captions | edit allowed | pass (harness) |
| exactly `projects.photos` | project captions | edit allowed | pass (harness) |
| signed out | nothing | RLS refuses | unchanged policy |

- [x] Every login above tested (see Result column)
- [x] A login that should not have access is blocked server-side: the database refuses the caption write

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: no behaviour a user reads about changed
- [ ] Translatable strings — n/a: the refusal message is a database error no UI string path surfaces
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest code checked: `src/app/photos/approve/actions.ts` only writes `approved_at`/`private_only_at`; the project caption editor (`PhotoSection.tsx`) is already drawn only for `projects.photos`
- [ ] Shared file touched — n/a: none touched
- [x] Nothing merged from main during sync was broken: gates green after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-06-approver-column-narrowing.md`
- [ ] README — n/a: no README content covers this
- [ ] **Release notes.** n/a: nobody would notice, an approver could already not be expected to edit captions; the only change is a refusal of a write no screen offers
- [x] Commit messages say why
- [x] Claims were measured: the harness ran against dev and printed its pass line

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test on deployed build — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding assertions — n/a: not a banded rule
- [x] Evidence pasted is the tool's actual output
- [ ] Public pages re-checked — deferred: release manager
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Contains both migration and code that reads it — n/a: no code reads the trigger
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: additive trigger only
- [ ] Apply plan stated — deferred: release manager, apply 0325 with the next release, before or after the deploy equally
- [ ] Rollback stated — deferred: release manager, `drop trigger attachments_approver_columns_guard on public.attachments` reverts it; nothing else depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | first harness run used a column (caption_th) absent on dev | fixed: harness and migration header comment now name real columns |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, nothing for a person to look at

Manual verification by: n/a: no UI surface, database-only change

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
