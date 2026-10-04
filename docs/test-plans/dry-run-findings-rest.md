# Feature test plan

## Header

| | |
|---|---|
| Feature | Dry-run findings F-10 (a refused save keeps the form, one shared hook for 36 forms) and F-21 (My tasks: Done today with Undo, ask before finishing a waiting job) |
| Backlog item | `docs/backlog.md` → Dry-run findings → F-10 and F-21 (both ticked, with status lines) |
| Branch / worktree | `claude/dry-run-findings-rest` @ `C:\Development\Animal_Shelter_dry-run-findings-rest` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `main` after release 0.18.0 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a refused Server Action no longer resets the form (`useKeptForm`), and My tasks lists what you finished today with Undo and asks before finishing a job that is waiting for another
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/lib/use-kept-form.ts` (new) and 34 form components under `src/app/`; `src/app/my/MyTaskList.tsx`, `src/app/my/page.tsx`, `src/lib/my-tasks/done-today.ts` (new), `src/lib/my-tasks/types.ts`; both dictionaries (`my.doneToday`, `my.recurring.waitingConfirm`); `src/lib/manual/en.ts` (one step); `src/lib/releases.ts`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: every role that submits any of the 36 forms (behaviour on a refusal and on success); My tasks readers (admin, management, staff, volunteer)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: F-08, F-09, F-11's remainder, F-15; the menu badge at Completed (not reproduced from code, needs a browser look); `ImmunizationForm` keeping its ticks in state after a successful save (older, separate quirk, noted in the decision file); `ChangePasswordForm`, which already had its own local fix

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (`main` cut 0.18.0 and emptied `unreleased`), resolved to `unreleased` holding only this PR's line
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 148s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the Done-today query reads existing columns and was not run against dev rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not run in a browser this session; no signed-in session could be set up, see Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: not run; this is the Done-today check, listed for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not run in a browser; the success path (form clears) is listed for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not run; the strip renders nothing when there are no rows (`doneRows.length > 0`), by reading only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not run; refusal behaviour is the manual item 1
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not run; the shelter-day filter on `done_at` is reasoned (query takes a day either side, `todayIso` decides) and not tested at the 00:00 to 07:00 Thai window

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | My tasks, all forms | unchanged access | not exercised |
| management | My tasks, all forms | unchanged access | not exercised |
| staff | My tasks, its forms | unchanged access | not exercised |
| vet | its forms | unchanged access | not exercised |
| volunteer | My tasks | unchanged access; no maintenance Undo without `maintenance.jobs` edit | not exercised |
| signed out | nothing | unchanged | not exercised |

- [ ] Every role above tested — n/a: no access rule changed; the strip reads rows under the reader's own session and Undo goes through the existing actions, which enforce their own rules
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route or policy added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: one step added to "Seeing what's assigned to you"; covered by `acceptance-matrix --check` inside `npm run lint`, not opened at `/manual` in a browser
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new strings are dictionary keys in both languages, not stored free text
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven this session; listed for manual verification
- [ ] Browser console clean — n/a: no browser session
- [ ] Network clean — n/a: no browser session

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): none loaded in a browser; `tsc`, `eslint` and a full `next build` pass over all 34 converted forms
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `manual/en.ts` got one added string; the shared hook is the change itself and is listed for manual verification on Move, Immunizations and an admin create form
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merged tree passes the gates above

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): F-10 and F-21 ticked, each with a status line saying what was not done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-refused-save-keeps-the-form.md`
- [x] `README.md` still accurate: it does not describe form handling
- [x] **Release notes.** `src/lib/releases.ts`'s `unreleased` gained a line: a refused save keeps what you chose, and My tasks remembers what you did today
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The gates line is tool output. Reasoned and worded as such: that React 19's post-action form reset is the cause of both symptoms (read from behaviour and the existing `ChangePasswordForm` comment, not yet watched in a browser)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the Done-today filter uses `todayIso` on `done_at`; the 00:00 to 07:00 Thai window is listed under manual verification
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only evidence is the gates line above, pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the merge; no schema or data changed, and an Undo done from the strip is an ordinary recurring or maintenance write that stays

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Menu badge reported not to drop at Completed (F-21): not reproduced from the code, which already excludes Completed | deferred to backlog: needs a browser look |
| 2 | Low | `ImmunizationForm` keeps ticks and residents in state after a successful save while the DOM reset clears the ticks | accepted: older quirk, outside F-10; in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Cause the refusal and watch the form, at 375 px, English and Thai.** Move a resident on its intake day: Zone and Enclosure stay chosen, the notes stay, "Space available" matches the picker. Log an immunization dated tomorrow: every tick, resident and the note stay | dev, `http://localhost:3012` |
| 2 | A successful save still clears a create form (Admin → Zones, add one) and Move still goes through, including after the capacity-warning dialog | dev |
| 3 | My tasks: mark a recurring job done, reload, see it under Done today, press Undo, see it back in the list. Same for Skip and for a maintenance job set to Completed | dev |
| 4 | Done on a job that says Waiting for another job asks first; Cancel leaves it, "Mark done anyway" records it; Thai wording reads right | dev |
| 5 | Done today after 00:00 Thai but before 07:00 shows that morning's work, not yesterday's | test.lannacare.org |
| 6 | Menu badge drops when a due maintenance job is set to Completed (F-21's unreproduced part) | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; nothing was driven in a browser this session

Manual verification by: pending: a person, for items 1 to 6 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
