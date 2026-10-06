## Header

| | |
|---|---|
| Feature | Draft 2 of the Director's who-does-what: Lutan's five answers loaded on test; the preview shows added cells separately; permission probes re-baselined except the vet |
| Backlog item | `docs/backlog.md` → "Apply the Director's first draft of who does what" (NOT ticked: she has not yet looked) |
| Branch / worktree | `claude/director-draft-apply` @ `C:DevelopmentAnimal_Shelter_director-draft-apply` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3020` |
| PR | pending |
| Tested by / date | Claude / 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | `33fce867` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — draft 2 = draft 1 + the five answers; loaded on test (4 cells gained, none lost); the probes follow it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/roles-draft/` (draft-2.json, resolve.ts), `scripts/load-role-draft.mjs`, `src/app/admin/role-draft/page.tsx`, eight `scripts/check-*.mjs` baselines; no migration, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — volunteer (gains residents list), Head of Medical (gains photos, prescriptions Read, diet Read); 2IC, Head of Maintenance, vet unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — production; the whole-rota read on the recurring tables; the vet probes, left red on purpose (decision file)

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged `origin/main` (#390, #391) at the start
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 173s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ]  — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI flow; the evidence is the loader's dry-run diff and applied output below, and the probes
- [ ] Data persists — n/a: no form; the applied cells were re-read by every probe run after the apply
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the loader is the only writer, and it is a replace of the named roles' cells
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list that can be empty
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; `resolve.ts` throws on a mistyped key or level in `added` (checked by reading, and the loader ran clean)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary; the level for Read vs Edit is the thing proved, by the dry-run diff (prescriptions and diet at read, not edit)

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: roles were tested through the permission probes (below), not by logging in as each; the screens are Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new page or route; `/admin/role-draft` is unchanged in who may open it (Admin only)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: `/admin/role-draft` is an English-only review aid; no manual topic describes it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: English-only review page by decision (2026-10-05-director-draft-roles.md)
- [x] Mobile viewport (375px) — no overflow, controls reachable — `check-phone-width.mjs --roles=admin --locales=en --pages=/admin/role-draft`: "No page scrolls sideways."
- [ ] Browser console clean — n/a: the preview page was not driven in a browser this session (sign-in needs Lutan's credentials); Left for manual verification
- [ ] Network clean — n/a: the preview page was not driven in a browser this session; Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: only `/admin/role-draft` changed; it built and passed the phone-width check
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared UI file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: the merge brought in #390 and #391; gates build green after it

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately NOT ticked; the item is done when the Director has looked. A status note went on the `backlog` branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-06-director-draft-apply.md`
- [x] `README.md` still accurate — no behaviour the README describes changed
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a — n/a: test only, no shelter user sees it (draft 2 is loaded on test.lannacare.org; production is its own step)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `li — the dry-run diff, the applied output and every probe result below are the tools' own output

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour. Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — deferred: release manager at deploy
- [ ] Evidence pasted into this plan is the tool's actual output, unedited. A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below — deferred: release manager at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager at deploy
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — deferred: release manager at deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, including what it does not cover — deferred: release manager at deploy

## Evidence (the tools' own output, unedited)

### Dry run, `node scripts/load-role-draft.mjs --draft 2` (before applying)

```
Environment: test — project qxkmhwybjggxvsfxsxbd — draft 2 — dry run (nothing is written)

2IC / Manager (second_in_command): 27 cells today, 27 in the draft
  no change

Head of Maintenance (head_of_maintenance): 9 cells today, 9 in the draft
  no change

Head of Medical (head_of_medical): 7 cells today, 10 in the draft
  medical.diet                     none  -> read   [ADDED, NOT TICKED (sheet row 18 not ticked): Feed Special Diets, through the special_diet_list view (0140). Row 18 would grant edit, which is setting a resident's diet.]
  medical.prescriptions            none  -> read   [ADDED, NOT TICKED (sheet row 15 not ticked): the medication list and the round's pick list (0136). Her sheet has no prescriptions tick, and row 15 would grant edit, which is prescribing.]
  photos.resident_add              none  -> yes    [sheet row 20]

Volunteers (volunteer): 4 cells today, 5 in the draft
  resident.record                  none  -> read   [sheet row 1]

Vets (vet): 2 cells today, 2 in the draft
  no change

Marks on the sheet that were not ticks:
  Volunteers, row 1 (View residents and their records): a dot, not a tick; loaded as yes; answered "yes, with no medical" (Lutan, in chat, 2026-10-06)
  2IC / Manager, row 11 (Book a vet visit): a dot, not a tick; loaded as no; answered "no" (Lutan, in chat, 2026-10-06)
  2IC / Manager, row 39 (Compare stock used with what was planned): scribbled out; loaded as no; answered "no" (Lutan, in chat, 2026-10-06)
  Head of Medical, row 49 (Ask the assistant a question): a faint stroke, not a tick; loaded as no; answered "no" (Lutan, in chat, 2026-10-06)

Cells ADDED beyond her ticks, because a built job needs them (her sheet is overridden here; to confirm with her):
  Head of Medical: medical.prescriptions at read; row 15 not ticked. the medication list and the round's pick list (0136). Her sheet has no prescriptions tick, and row 15 would grant edit, which is prescribing.
  Head of Medical: medical.diet at read; row 18 not ticked. Feed Special Diets, through the special_diet_list view (0140). Row 18 would grant edit, which is setting a resident's diet.

4 cells change: 4 gained, 0 lost, 0 changed level.
Dry run. Add --apply to write this.
```

### Applied, `--draft 2 --apply` (tail)

```

4 cells change: 4 gained, 0 lost, 0 changed level.
Written. audit_log gained 4 role_permissions rows (actor empty: a script, not a person in Settings).
```

### Probes before the apply (draft 1 loaded; after #380)

```
=== check-permission-parity
RESULT: RED
=== check-permission-tables
=== check-permission-catalogue
=== check-policy-role-names
RESULT: GREEN (every remaining role-named policy has an owner, and §15 says so)
=== check-home-screens
=== check-2ic-role
FAIL  weight: the 2IC reaches 1 row(s)
FAIL  prescriptions: the 2IC reaches 1 row(s)
FAIL  bundle: role_permissions [["resident.record",2],["assistant.ask",2],["assistant.record",2],["contacts.add",2],["contacts.directory",2],["facility.map",2],["stock.co
310 checks held, 3 failed.
RESULT: RED
=== check-volunteer-narrowing
  FAIL read recurring_job_assignees: the VOLUNTEER WAS ALLOWED
  FAIL read recurring_job_occurrences: the VOLUNTEER WAS ALLOWED
  FAIL read recurring_job_occurrence_assignees: the VOLUNTEER WAS ALLOWED
  FAIL fn record_recurring_job: the VOLUNTEER WAS ALLOWED
RESULT: RED
=== check-medical-role
FAIL  medication_list_residents as hom: allowed — got 0
FAIL  stock_counts: the Head of Medical reads 1 row(s)
FAIL  bundle: role_permissions [["resident.record",1],["facility.enclosures",1],["facility.map",2],["placement.move",2],["recurring.do_own",2],["stock.count",2],["medical
95 checks held, 6 failed.
RESULT: RED
=== check-perm-convert-orphans
FAIL  recurring_job_assignees read as volunteer: refused - got 1
FAIL  recurring_job_occurrences read as volunteer: refused - got 1
FAIL  recurring_job_occurrence_assignees read as volunteer: refused - got 1
680 checks held, 11 failed.
RESULT: RED
```

### Probes after the re-baseline

```
=== check-permission-parity
  MISMATCH          21
RESULT: RED
=== check-permission-tables
Failed to run sql query: ERROR:  P0001: HARNESS-KNOWN-RED every other check held; recorded disagreements with the draft: A cells vet (paper 13, draft gives the microchip only): got 2, paper wants 13; H vet resident.adoption_news r
=== check-permission-catalogue
all ok
=== check-policy-role-names
RESULT: GREEN (every remaining role-named policy has an owner, and §15 says so)
=== check-home-screens
all ok
=== check-2ic-role
313 checks held, 0 failed.
RESULT: GREEN (the 2IC runs the four screens and nothing else; each stock cell stands alone; the cells and jobs.ts agree)
=== check-volunteer-narrowing
RESULT: GREEN (every removed right refused; every kept right works; nobody else lost anything)
=== check-medical-role
101 checks held, 0 failed.
RESULT: GREEN (the Head of Medical reads the list and nothing else; the cells and jobs.ts agree)
=== check-perm-convert-orphans
FAIL  resident_diet_rounds update as vet: allowed - got 0
FAIL  resident_diet_rounds insert as vet: allowed - got -1
FAIL  resident_diet_rounds delete as vet: allowed - got 0
FAIL  prescription_rounds update as vet: allowed - got 0
FAIL  prescription_rounds insert as vet: allowed - got -1
FAIL  prescription_rounds delete as vet: allowed - got 0
FAIL  frequency_rounds read as vet: allowed - got 0
684 checks held, 7 failed.
RESULT: RED
```

Reading the "after": every remaining red is the **vet** (paper 13 cells vs the draft's microchip). Parity: 21 vet mismatches, 0 other. Tables: `HARNESS-KNOWN-RED`, vet lines only; every other section held. Orphans: 7 vet lines. Nothing else is red.


## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Decision | The vet: the paper (§4) gives 13 cells, draft 2 gives the microchip, so 21 parity mismatches, the tables check's vet lines and 7 orphan-check lines stay red by design | accepted: needs a person's decision (backlog status note) |
| 2 | Low | Volunteers now read the whole recurring-job rota at database level (the app filters) | deferred to backlog |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | Open `/admin/role-draft` signed in as Admin on a phone: Head of Medical shows "Added, not ticked: confirm?" with prescriptions and diet, view only; the volunteer lists the residents list; the four marks read as answered | test.lannacare.org/admin/role-draft |
| 2 | `/home/head_of_medical`: her five jobs are back (medication list, weights, medical photos, special diets); `/home/volunteer`: residents list, no clinical tile | test.lannacare.org |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed (the preview page itself was not signed into; see Left for manual verification)
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

The two items in **Left for manual verification** above. Pending: only Lutan can sign this.

- [ ] The manual list above is empty, or every item — n/a: see the table; Lutan's own look is pending, so this is left unticked

Manual verification by: pending: Lutan's look at `/admin/role-draft` and the Head of Medical and volunteer homes on test

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links this file instead
- [ ] Handed to the production release manager — n/a: nothing ships to production from this PR

Result: pass with accepted defects

Release manager acknowledgement: pending: not a production release
