# Feature test plan — role-floor-schema

## Header

| | |
|---|---|
| Feature | The 2IC and both Heads stop being offered boxes the system refuses (scope `who_and_where`; `sees_all_residents()` and `sees_all_contacts()` read the role's own scope), and deleting a maintenance job becomes its own box, `maintenance.delete` |
| Backlog item | `docs/backlog.md` → **Who does what, before (e): a configured role's boxes are refused by the volunteer floor it borrows** (status note added; item left open for `databaseWider`) |
| Branch / worktree | `claude/role-floor-schema` @ `C:\Development\Animal_Shelter_role-floor-schema` |
| Dev server | not started: the behaviour is in the database and was measured per login by script; the page change is one prop |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | yes: `0179_role_floor_schema.sql` |
| Tested at SHA | `ca5cafb5` (gates `typecheck=0 lint=0 build=0` on this tree; the later commits only add this plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the 2IC and both Heads stop being offered boxes the database refuses (their scope becomes who-and-where, the two scope functions read it), and deleting a maintenance job becomes its own box (2IC yes, Head of Maintenance no); the third part of the item, `databaseWider`, is spun out and says so on the backlog
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0179_role_floor_schema.sql`, `src/app/maintenance/[id]/` (page + view: the Delete button asks `maintenance.delete`), `src/lib/permissions/{catalogue,fixed-for-now}.ts`, both dictionaries, one manual line, `scripts/` harness baselines and `scripts/lib/permission-probes.mjs`, `docs/` (decision, backlog note, roles paper §4 row), `src/lib/releases.ts`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — 2IC gains deleting a maintenance job; Head of Maintenance loses it (the database already refused it, the button now hides); the 2IC and Heads lose boxes on Who does what that were never true. Admin, Management, doctor, volunteer: unchanged, measured by `check-who-does-what.mjs`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `databaseWider` (nine either-or policies) spun out to the backlog; `user_roles.role`, `current_user_role()`, `legacy_role`, `has_app_access`, `has_shelter_floor()` left for `perm-drop-enum`; the `*_ROLES` lists are `perm-role-lists`

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — already up to date with `origin/main` at `03506232`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — closing line below
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit


Closing lines of `node scripts/gates.mjs`:

```
=== gates: build exited 0 after 195s

gates: typecheck=0 lint=0 build=0
```

`node scripts/check-who-does-what.mjs`, dev, before and after `0179` (the script's own summary):

```
before (after 0178):  boxes 300  OBEYED 177  WRONG 38  STICKY 15  INERT 70
after 0179:           boxes 306  OBEYED 184  WRONG 27  STICKY 15  INERT 80   UNLISTED 0  STALE 0  OVERLISTED 0
OK: every probed box is obeyed or listed in FIXED_FOR_NOW.
```

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0179`; highest on `main` was `0178`; `worktree.mjs sync` printed `migration numbers: ok`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 178 applied, 1 pending before the apply
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0179_role_floor_schema.sql … ok` (no dependency on another pending file, so none of the dry-run trap)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0179_role_floor_schema.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `drop constraint if exists` then add, `create or replace`, `on conflict`, `drop policy if exists`; the role updates and deletes are idempotent
- [x] Existing rows still read correctly after the change (checked against real dev data) — `check-who-does-what.mjs` reads every role's boxes against the live rows before and after (see the results below)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — under each role's own login: `check-perm-convert-residents`, `-people`, `-work` (fixtures now use scope `who_and_where` / `name_phone`; a role with `maintenance.jobs` Edit alone cannot delete a job, one holding `maintenance.delete` can), `check-2ic-role`, `check-medical-role`, `check-volunteer-narrowing`, `check-perm-functions --applied`, `check-director-answers-schema`: all GREEN
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: not written: the header comment says how to put it back (restore the `0144` and `0147` functions and the `0149` policy, put the scope back, drop the activity); nothing outside dev depends on it yet
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0179` on production project `dbkodyyxxhtygxcxmfcu`, before the app deploy, by the release manager

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser by Claude: the database answers are measured per login by script, and the phone check is left for Lutan below
- [ ] Data persists — reload the page and the change is still there — n/a: no new data is entered by a user; the change is to what a role is offered
- [x] Create / edit / delete all exercised (whichever the feature has) — delete of a maintenance job exercised in the database per role: allowed for Admin, Management and a role holding `maintenance.delete`, refused for a role with `maintenance.jobs` Edit alone (`check-perm-convert-work`, `check-who-does-what`)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or empty state touched
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input form touched
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no free input; the boundary is the box on and off, which `check-who-does-what.mjs` flips for every cell

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`, with `'vet'` renamed `'doctor'` by `0172_clinics_and_doctors.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Delete a maintenance job; every box | Yes (a rule, no cell) | `check-who-does-what` control: allowed by every probe |
| management | Delete a maintenance job | Yes (`maintenance.delete`, seeded by `0179`) | allowed, per login |
| staff | n/a | role retired by `0173` | no login holds it |
| doctor | nothing changed | unchanged (clinic scope) | unchanged (its boxes stay under the `clinicRule` entry) |
| volunteer | nothing changed | unchanged (who-and-where) | unchanged; its scope is now `who_and_where` instead of `all`, refused as before |
| signed out | nothing | refused | not touched by this change; not re-probed |

- [x] Every role above tested — each live role by script, as itself; Admin is the control
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the delete is refused by the policy, not only hidden: a role without `maintenance.delete` deleting a job gets no row back (probe `delete from maintenance where id = $JOB`)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the maintenance topic's delete line now says who can; read in `src/lib/manual/en.ts`, not loaded at `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: one new activity name, in both dictionaries; no user-entered text
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven by Claude; the one visible change (Delete hidden or shown) is in the manual table for Lutan at 375 px
- [ ] Browser console clean — no errors or React warnings — n/a: no page was loaded by Claude
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page was loaded by Claude

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not loaded; the maintenance job page type-checks and builds (`gates` build=0) and its only change is one prop
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: `manual/en.ts` and the dictionaries are shared, one line each; not loaded at runtime by Claude (`gates` build=0)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: the branch was already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: deliberately not ticked: parts 1 and 2 are done and a status note says so; `databaseWider` is open on the `backlog` branch, so the item stays open (brief: do not half-tick)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-11-role-floor-schema.md`, including the 2IC / Head of Maintenance split and its reason
- [x] `README.md` still accurate — nothing in it describes these functions or roles
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — three lines at the top of `unreleased`: the 2IC can delete a job, the Head of Maintenance can no longer (said plainly), and the grid no longer offers boxes the system refused
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the box counts come from `check-who-does-what.mjs` runs before and after; claims about other harnesses are marked not investigated where they were not

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager: the tested SHA is in the header; it becomes the tip of `main` only at merge
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: Lutan / release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: no date logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no threshold, rounding or window; the boundary is a yes/no box, flipped on and off for every cell by the script
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the `check-who-does-what.mjs` summary below is its output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — yes: the maintenance page and the catalogue need the `maintenance.delete` activity, so the production apply of `0179` runs before the deploy, and the Head of Maintenance loses a Delete button that never worked when it lands
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no table rewrite; it narrows one check constraint and removes nine cells that the database already refused
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0179_role_floor_schema.sql`, production project `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — rebuild the previous ref on the Pi; the migration need not be reverted (the old code would simply show the Head's Delete button again, and the database would refuse it as it did); it does not cover the removed 2IC cells, which were refused anyway

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Dev-only harnesses are red for reasons this change did not cause: `check-permission-tables` at section F (6 audit rows on dev that are not 0134's: 4 role deletions and 2 cell changes), `check-permission-parity` (21 doctor mismatches), `check-role-write-policies` (14 doctor write failures), `check-maintenance-role` (stale bundle: `assistant.ask`, `facility.map`, `maintenance.photos`; and one error probe). None is in CI. | accepted: pre-existing; this PR re-baselined only what it changed |
| 2 | Info | The Head of Maintenance loses the Delete button, which only ever produced an error. | accepted: Lutan's answer, 2026-10-11; release note written |

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
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as the **2IC** at 375 px on a maintenance job: Delete job is there, it works, and her Who does what row shows the delete box as Yes | `test.lannacare.org`, after `0179` is applied to dev (it is) |
| 2 | Signed in as the **Head of Maintenance** at 375 px on the same job: there is no Delete job button, and the other buttons still work | same |
| 3 | Signed in as the **2IC** and as each **Head**: Settings → Who does what no longer offers resident-changing boxes (2IC: adopter news, move, hospital, rehome, death; both Heads: move) or change/add a contact (2IC); the 2IC can still open a resident (who and where) and the contacts book (name and phone). **The one thing only Lutan can judge: that these three roles can now do exactly what he expects.** | same |

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

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: not yet — one item waits for Lutan

Manual verification by: pending: Lutan to sign in as the 2IC and each Head on dev at 375 px (the three rows above)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — the harness drift listed under Defects is accepted; nothing in this change is open
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
