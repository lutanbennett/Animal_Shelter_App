# Test plan: bills-dry-run-fixes

## Header

| | |
|---|---|
| Feature | Four Management dry-run fixes: bill→delivery cost and attach, deliveries in Likely matches, appeal resident search, Publish/Unpublish word |
| Backlog item | `docs/backlog.md` → Management, four items from the 2026-10-18 dry run |
| Branch / worktree | `claude/bills-dry-run-fixes` @ `C:DevelopmentAnimal_Shelter_bills-dry-run-fixes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR body |
| Tested by / date | Claude, 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | e920b0c3 |

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

- [x] `node scripts/worktree.mjs sync` — merged, already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — gates: typecheck=0 lint=0 test=0 build=0
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser: the cost parser has a unit test, the rest is for manual verification
- [ ] Data persists — n/a: not exercised in a browser this session; see Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not exercised in a browser this session; see Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not exercised in a browser this session; see Left for manual verification
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not exercised in a browser this session; see Left for manual verification
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not exercised in a browser this session; see Left for manual verification

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
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no permission change; the pages keep their existing checks
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not exercised in a browser this session; see Left for manual verification

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not driven in a browser this session; see Left for manual verification
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not driven in a browser this session; see Left for manual verification
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: not driven in a browser this session; see Left for manual verification
- [ ] Mobile viewport (375px) — n/a: not driven in a browser this session; see Left for manual verification
- [ ] Browser console clean — n/a: not driven in a browser this session; see Left for manual verification
- [ ] Network clean — n/a: not driven in a browser this session; see Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not loaded in a browser this session
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: not loaded in a browser this session
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: not loaded in a browser this session

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — all four ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-19-bills-dry-run-fixes.md
- [ ] `README.md` still accurate — n/a: no README-level behaviour changed
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message — n/a: no README-level behaviour changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits — the unconfirmed Likely matches cause is stated as such in the decision file

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Same lost-backslash date pattern at src/app/admin/security/actions.ts:294, out of scope | deferred to backlog |

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
| 1 | On Bills, type a cost, tap Record a new delivery from this bill: cost box is filled, and after saving the delivery has that cost and the bill leaves the waiting list | /bills, /deliveries |
| 2 | A recent delivery appears under Likely matches (if the delivery already had a cost it is deliberately not offered) | /bills |
| 3 | Start an appeal: search picker works; dead, adopted and outreach animals are absent | /management/appeals/new |
| 4 | Unpublish / Publish shows its word | /management/shelter-friends |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks




- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

The four items in Left for manual verification are for a person to look at. No browser check of item 1 was driven this session; the cost parser has a unit test (`src/lib/bills/cost-param.test.mjs`).

- [ ] The manual list above is empty — n/a: four items remain for a person to look at

Manual verification by: pending: the four items in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over when the release is cut

Result: pass with accepted defects
