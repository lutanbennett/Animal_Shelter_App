# Feature test plan

## Header

| | |
|---|---|
| Feature | `permissions-catalogue`: the permission catalogue in code (`src/lib/permissions/`), `can()`, `requirePermission()`, the route registry, and stock moved off `canStocktake`/`canRecordDelivery` as the pattern |
| Backlog item | `docs/backlog.md` → Auth → **The roles the shelter actually has**, F2 first part. Not ticked: a status line names this PR |
| Branch / worktree | `claude/permissions-catalogue` @ `C:\Development\Animal_Shelter_permissions-catalogue` |
| Dev server | `next dev` on `http://localhost:3002` (`.port`) |
| PR | recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | 1d54fdbc |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the catalogue as a TypeScript file equal to `0132`, a fail-closed `can()`, `requirePermission()`, a route registry and a lint check, with stock's two predicates replaced by `stock.count` and `stock.delivery`
- [x] Files/areas touched listed: new `src/lib/permissions/` (`catalogue.ts`, `can.ts`, `load.ts`, `require.ts`, `routes.ts`); `scripts/check-permission-catalogue.mjs` and `package.json` lint; `src/app/stocktake/{page,actions}.ts(x)`, `src/app/deliveries/{page,actions}.ts(x)`, `src/app/NavPane.tsx`; `src/lib/management/{stocktake,stock-receipts}.ts` (two predicates deleted); `src/lib/recurring-jobs/eligibility.ts` (two role lists); two check scripts lost a roles assertion; `docs/decisions/2026-10-03-permissions-catalogue.md`; `docs/backlog.md`. No `supabase/`, no `worker/`
- [x] Roles affected identified: every role that opens `/stocktake`, `/deliveries` or sees the Stocktake menu entry (admin, management, staff, volunteer allowed; vet, public viewer, signed out refused). Intended change for any of them: none
- [x] Anything explicitly **out of scope** written down: no RLS policy (`perm-convert-*`), no migration, no other area (the three sweeps), `eligibility.ts`'s other rules, building the sidebar from the registry (`home-screens`), the medication-label part (3) stocktake-menu rule, `stocktake-cards-phone`'s rendering

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines pasted below, as printed:

  ```
  === gates: typecheck — npm run typecheck
  === gates: typecheck exited 0 after 26s
  === gates: lint — npm run lint
  === gates: lint exited 0 after 170s
  === gates: build — npm run build
  === gates: build exited 0 after 263s
  gates: typecheck=0 lint=0 build=0
  ```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (0133 stays free)
- [ ] `--status` reviewed — n/a: no migration in this PR (0133 stays free)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR (0133 stays free)
- [ ] Applied to **dev** — n/a: no migration in this PR (0133 stays free)
- [ ] File is re-runnable — n/a: no migration in this PR (0133 stays free)
- [ ] Existing rows still read correctly — n/a: no migration in this PR (0133 stays free)
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration; the catalogue's agreement with `0132` is asserted by `scripts/check-permission-catalogue.mjs` (section 4)
- [ ] Down-migration written — n/a: no migration in this PR (0133 stays free)
- [ ] Production apply plan stated — n/a: no migration in this PR (0133 stays free)

## 4. Functional checks

- [x] Happy path works end to end: every role's answer for `stock.count` and `stock.delivery`, built from the seeded cells of `0132`, equals the truth table of the predicate it replaced (`scripts/check-permission-catalogue.mjs`, group D, 6 roles and no role)
- [ ] Data persists — n/a: nothing is written by this change
- [ ] Create / edit / delete — n/a: nothing is written by this change; stocktake and delivery writes are untouched below their guard
- [ ] Empty state renders sensibly — n/a: no new UI surface: behaviour is unchanged by design, and the permission wiring is covered in the role matrix below
- [x] Invalid input is rejected with a readable message, not a crash: `can()` answers false for no permissions, an unknown key, a bad level, a missing cell and a malformed cell (group C, 14 assertions); an unknown key written anywhere is a lint failure (group B)
- [x] Boundary cases checked: Admin with no cells, a read cell asked to edit, an edit cell asked to read, a cell for a key this build does not know, a level of `3` or `"2"`, null and undefined permissions

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
| admin | `/stocktake`, `/deliveries`, Stocktake menu entry | all open (Admin is yes to every known activity) | asserted by script; page not driven |
| management | same | all open (`stock.count`, `stock.delivery` seeded at 2) | asserted by script; page not driven |
| staff | same | all open | asserted by script; page not driven |
| vet | same | refused: no cells for either | asserted by script; page not driven |
| volunteer | `/stocktake`, menu entry; not `/deliveries` | stocktake opens, deliveries refused, no Deliveries link on the sheet | asserted by script; page not driven |
| signed out | `/stocktake`, `/deliveries` | redirect to `/login` | curl: GET /stocktake and /deliveries both 307 to /login?next=… (by the request proxy, before the page guard runs) |

- [ ] Every role above tested — n/a: each role's answer is asserted by script from the seeded cells; no role login was available to drive the pages, so the browser pass is under Left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): signed out, `GET /stocktake` and `GET /deliveries` redirect to `/login`, driven in the browser pane (below). A signed-in refusal is the same `refuse()` as before; not driven for a vet (see manual list)

## 5. Cross-cutting

- [x] Nav entry correct: Stocktake in the menu is `can(await loadPermissions(), "stock.count")`, asserted for all roles by the same truth table; `NavLinks.tsx` itself is unchanged
- [ ] Manual updated — n/a: no behaviour a person would read about changed
- [ ] Translatable strings — n/a: no new people-facing string; refusals reuse the existing `notAuthorized` entries
- [ ] Mobile viewport (375px) — n/a: no new UI surface: behaviour is unchanged by design, and the permission wiring is covered in the role matrix below
- [x] Browser console clean: no errors on `/login` after the redirect from `/stocktake`
- [x] Network clean: the redirect is a 307 to `/login`, no 4xx/5xx on the way

## 6. Regression

- [x] The pages nearest the change still work: `/login` (target of the redirect) loaded; `/stocktake` and `/deliveries` compile (build) and typecheck
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the shared files touched (`NavPane.tsx`, `require-role.ts`'s comment, `eligibility.ts`) are exercised by every signed-in page and the `check-recurring-job-eligibility.mjs` script ("Every case held"); no signed-in page was driven because no role login was available to this session — listed under manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought docs only (release record 0.16.0, release procedure)

## 7. Documentation

- [ ] Backlog item ticked — n/a: the roles item is deliberately not ticked (brief): a status line names this PR instead, and the follow-up is filed on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-03-permissions-catalogue.md`
- [x] `README.md` still accurate: it names no predicate or role list this PR removed
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: behaviour is unchanged by design: the same roles reach the same pages and the same refusal wording appears
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions` were measured, not reasoned:** the identical-behaviour claim is asserted by script against the seeded cells, not argued; the `check-stocktake-sheet.mjs` import failure was confirmed pre-existing from the unchanged import line in `HEAD`

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic touched
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] Boundary or banding change — n/a: no threshold or band; `can()`'s level comparison is covered both sides (read cell vs edit, edit cell vs read)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited:** the gates lines are copied from `scripts/gates.mjs`
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration in this PR (0133 stays free)
- [ ] Production dry-run — n/a: no migration in this PR (0133 stays free)
- [ ] Destructive migration backup — n/a: no migration in this PR (0133 stays free)
- [ ] Apply plan stated — n/a: no migration in this PR (0133 stays free)

### Rollback

- [ ] Rollback position stated: revert this PR; nothing in it changes the schema or a policy, so there is nothing a rollback does not cover — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

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
| 1 | Sign in as **volunteer**: Stocktake is in the menu and opens; `/deliveries` is refused (the in-app no-access page); the sheet shows no "Record a delivery" link | `/stocktake`, `/deliveries` |
| 2 | Sign in as **vet**: no Stocktake menu entry; `/stocktake` and `/deliveries` both refused | same |
| 3 | Sign in as **staff** or **management**: both pages open, the Deliveries link shows, a stocktake and a delivery save | same |
| 4 | A refused save: not reachable from the UI; the action returns the unchanged `notAuthorized` wording | n/a without a hand-built request |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; the role pass is for whoever signs in as each role to tick

Manual verification by: pending: the role pass in the table above, by a person

### Result

- [x] Open defects are either fixed or explicitly accepted above: none found
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened; the file is the record
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass

Release manager acknowledgement: n/a: not at PR time
