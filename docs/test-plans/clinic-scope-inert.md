# Feature test plan — clinic-scope-inert

## Header

| | |
|---|---|
| Feature | clinic-scope-inert |
| Backlog item | `docs/backlog.md` → Security: THE APP STILL ASKS A FUNCTION THAT 0264 MADE INERT |
| Branch / worktree | `claude/clinic-scope-inert` @ `C:DevelopmentAnimal_Shelter_clinic-scope-inert` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | 2d404779 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the — see decision file
- [x] Files/areas touched listed (routes, `worker/`, `supabase/mig — see decision file
- [x] Roles affected identified: admin / staff / doctor / voluntee — see decision file
- [x] Anything explicitly **out of scope** written down, so the re — see decision file

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all four
gates (typecheck, lint, test, build) even when one fails, prints each one's own exit code, and refuses to start
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
- [x] `node scripts/gates.mjs` finished with all four gates at exit 0; real run pasted below

```
=== gates: typecheck exited 0 after 78s
=== gates: lint exited 0 after 213s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 312s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no  — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in  — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop  — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Existing rows still read correctly after the change (checked — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] **Constraints and defaults exercised against real rows** in  — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Down-migration written, or the reason one is not needed is s — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Production apply plan stated for the release manager (which  — n/a: documentation-only change, no code path altered (scope.ts comment only)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Data persists — reload the page and the change is still ther — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Empty state renders sensibly (no rows yet) — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: documentation-only change, no code path altered (scope.ts comment only)

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
| admin | n/a | n/a | n/a |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] A role that should not have access is blocked server-side (h — n/a: documentation-only change, no code path altered (scope.ts comment only)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads  — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Translatable strings go through the translation path, checke — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Browser console clean — no errors or React warnings — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: documentation-only change, no code path altered (scope.ts comment only)

## 6. Regression

- [ ] The pages nearest the change still work (list the ones check — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, sha — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] Nothing merged from `main` during `sync` was broken by this  — n/a: documentation-only change, no code path altered (scope.ts comment only)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch**  — n/a: the item is only on the backlog branch, not on main; left open and struck by the planner (see decision file)
- [x] Non-obvious design choices added as a new file in `docs/deci (docs/decisions/2026-11-02-clinic-scope-inert.md)
- [ ] `README.md` still accurate — n/a: documentation-only change, no code path altered (scope.ts comment only)
- [ ] **Release notes.** — n/a: a comment fix and a decision file; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were mea — n/a: documentation-only change, no code path altered (scope.ts comment only)

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints bo — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works  — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a con — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover bot — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and  — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundl — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads  — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a product — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover — deferred: release manager

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

- [x] Everything in this checklist that could be verified without 
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
Three valid states:
- a person looked, with the date.
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

- [x] The manual list above is empty, or every item in it was chec — list is empty

Manual verification by: n/a: nothing user-facing changed; decision file is a reading of migrations

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at PR/release time by others
- [ ] Handed to the production release manager — n/a: done at PR/release time by others

Result: pass with accepted defects

Release manager acknowledgement: n/a: pending release
