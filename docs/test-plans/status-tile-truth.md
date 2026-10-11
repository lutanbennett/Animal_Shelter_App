## Header

| | |
|---|---|
| Feature | status-tile-truth |
| Backlog item | `docs/backlog.md` → System status Pi origin; Status alert mail (part) |
| Branch / worktree | `claude/status-tile-truth` @ `C:\Development\Animal_Shelter_status-tile-truth` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | pending |
| Tested by / date | Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | 74de0c31 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that cre — n/a: covered by gates and code reading only, nothing else exercised

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries — n/a: no migration, none allowed
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration, none allowed
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration, none allowed
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration, none allowed
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration, none allowed
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, none allowed
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, none allowed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration, none allowed
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration, none allowed

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification

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
| admin | /admin/status | unchanged by this PR | not tested |
| management | /admin/status | unchanged by this PR | not tested |
| staff | /admin/status | unchanged by this PR | not tested |
| doctor | /admin/status | unchanged by this PR | not tested |
| volunteer | /admin/status | unchanged by this PR | not tested |
| signed out | /admin/status | unchanged by this PR | not tested |

- [ ] Every role above tested — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Translatable strings go through the translation path, checked at `/management/translations — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven in a browser; the Pi path needs a Pi, see Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: covered by gates and code reading only, nothing else exercised
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a secon — n/a: covered by gates and code reading only, nothing else exercised
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: covered by gates and code reading only, nothing else exercised

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, 
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and thi

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they a — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results i — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anon — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.m — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bund — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *be — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollbac — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Release mail tile is blind on the Pi (grey, true wording) | deferred to backlog |
| 2 | moderate | A real sent=0 from the Worker cannot be cleared from a Pi-drawn page | deferred to backlog |

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
| 1 | On lannacare.org after the Pi code deploy: Pi origin tile reads Working / drawn by the Pi, Status alert mail tile is no longer red, alert buttons are greyed with a sentence. Production was never read from these sessions. | lannacare.org /admin/status (release manager) |

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

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

Signed only by the person who looked; Claude does not sign it. Currently `pending:` on the production look.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: production look at /admin/status after the Pi deploy (release manager or Lutan)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file; it is not pasted
- [ ] Handed to the production release manager — n/a: handover is the Left for manual verification row, until the release manager reads it

Result: pass with accepted defects

Release manager acknowledgement: pending
