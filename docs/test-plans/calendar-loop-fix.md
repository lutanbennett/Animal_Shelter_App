# Test plan: calendar-loop-fix

## Header

| | |
|---|---|
| Feature | Calendar loop fix: past/completed visits keep their event; poll never cancels on its own delete or a past visit |
| Backlog item | `docs/backlog.md` → calendar loop (item 1); duplicates check only (item 2) |
| Branch / worktree | `claude/calendar-loop-fix` @ `C:DevelopmentAnimal_Shelter_calendar-loop-fix` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | 8ca90dce |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched: `src/lib/clinics/` (calendar-change, calendar-sync, calendar-poll), `scripts/lib/readonly-checks.mjs`, `scripts/correct-calendar-cancelled.mjs`, docs. No migration, no worker.
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Out of scope: running anything on production, fixing item 2 (cause not established), restoring the cron, the live dev-calendar walkthrough (left for manual)

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

- [ ] `worktree.mjs sync` run before the PR — n/a: see SHA below; main merged just before opening the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no screen changed; behaviour covered by unit tests of the pure rules
- [ ] Data persists — reload the page and the change is still there — n/a: no screen changed; behaviour covered by unit tests of the pure rules
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no screen changed; behaviour covered by unit tests of the pure rules
- [ ] Empty state renders sensibly (no rows yet) — n/a: no screen changed; behaviour covered by unit tests of the pure rules
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no screen changed; behaviour covered by unit tests of the pure rules
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no screen changed; behaviour covered by unit tests of the pure rules

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no page or permission changed | n/a |
| management | n/a | no page or permission changed | n/a |
| staff | n/a | no page or permission changed | n/a |
| doctor | n/a | no page or permission changed | n/a |
| volunteer | n/a | no page or permission changed | n/a |
| signed out | n/a | no page or permission changed | n/a |

- [ ] Every role above tested — n/a: no screen changed; behaviour covered by unit tests of the pure rules
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no screen changed; behaviour covered by unit tests of the pure rules

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no UI surface; no page, nav, manual or translation change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface; no page, nav, manual or translation change
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface; no page, nav, manual or translation change
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface; no page, nav, manual or translation change
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface; no page, nav, manual or translation change
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface; no page, nav, manual or translation change

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: pure-rule unit tests and typecheck cover the files touched; no page loaded
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — ** — n/a: no shared UI file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: no shared UI file touched

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: item 1 is ticked on the backlog branch after merge (planner restores the four visits first); item 2 stays open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-27-calendar-loop.md`)
- [x] `README.md` still accurate (not touched)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-27-calendar-loop.md`)
- [x] Commit messages say why, not just what
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-27-calendar-loop.md`)

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: planner and release manager at release
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: planner and release manager at release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: planner and release manager at release
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: planner and release manager at release
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: planner and release manager at release
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the — deferred: planner and release manager at release
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: planner and release manager at release
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cach — deferred: planner and release manager at release

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref ** — deferred: planner and release manager at release
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snaps — deferred: planner and release manager at release
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: planner and release manager at release

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: planner and release manager at release
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` agains — deferred: planner and release manager at release
- [ ] For a ** — deferred: planner and release manager at release
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: planner and release manager at release

### Rollback

- [ ] Rollback position stated, ** — deferred: planner and release manager at release

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
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

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

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. a name, then
confirmed in chat, and the date.
Three valid states:

- a name and a date — a person looked. The date is required here.
- `n/a: <reason>` — there was nothing to look at.
- `pending: <what is outstanding>` — the work is done and something genuinely
  needs a person who has not got to it yet. **This does not fail the check**
  (changed 2026-09-24): it is the normal state for most of a PR's life, and a
  check that is permanently red is one people learn to filter. The checker prints
  *awaiting manual verification: <what>* and exits 0, so the outstanding item is
  on the record without drowning the signal. What still fails is a plan that is
  missing, incomplete or self-contradictory. Use `pending:` rather than reaching
  for `n/a` — green is no longer something you have to buy, and an `n/a` over a
  real outstanding item is a false assurance about the one thing you could not
  verify. **Nothing ships on a `pending:`** — the release manager's pre-deploy
  pass is what holds that line, not CI.

`n/a:` and `pending:` take **no `Date:` segment** — there is no date to record, so
write the line and stop. A trailing `Date: —` is accepted too, since existing
plans use it. A bare *name* with no date is still rejected, which is what stops an
empty signature quietly passing.

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list is not empty — n/a: not signed; a person has not looked yet

Manual verification by: pending: dev-calendar walkthrough (book, complete, cancel, archive one visit each and read the dev calendar) not yet run

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over when the PR is merged

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
