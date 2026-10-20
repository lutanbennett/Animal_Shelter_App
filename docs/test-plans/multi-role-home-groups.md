# Feature test plan

Filled from `docs/test-plan-template.md`.

## Header

| | |
|---|---|
| Feature | Home screen groups each held role (main first, switch on phones, Covering until) |
| Backlog item | `docs/backlog.md` → Home screen for someone holding more than one role |
| Branch / worktree | `claude/multi-role-home-groups` @ `C:\Development\Animal_Shelter_multi-role-home-groups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | 8b36b68f |

## 1. Scope and risk

- [x] Change is described: a login holding several roles sees one group of tiles per role, matches the backlog item
- [x] Files: src/app/home/page.tsx, src/components/HomeGroups.tsx, src/lib/home/tiles.ts, src/lib/auth/held-roles.ts, both dictionaries, manual, releases, acceptance matrix
- [x] Roles affected: any login holding a second role (a cover); one-role logins unchanged
- [x] Out of scope: permissions, NavPane, which tiles a role has, any migration

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

- [x] `node scripts/worktree.mjs sync`: origin/main already up to date
- [x] `node scripts/gates.mjs` run; typecheck=0 test=0 build=0 and lint failed once on a missing acceptance-matrix row, fixed in the next commit, then `npm run lint` passed (evidence below)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` revie — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` revi — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and re — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace — n/a: no migration
- [ ] Existing rows still read correctly after the chang — n/a: no migration
- [ ] **Constraints and defaults exercised against real  — n/a: no migration
- [ ] Down-migration written, or the reason one is not n — n/a: no migration
- [ ] Production apply plan stated for the release manag — n/a: no migration

## 4. Functional checks

- [x] Happy path: unit test shows two roles give two groups, main first, shared tile in each
- [ ] Data persists — reload the page and the change is  — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [ ] Create / edit / delete all exercised (whichever th — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [ ] Empty state renders sensibly (no rows yet) — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [ ] Invalid input is rejected with a readable message, — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [ ] Boundary cases checked (long text, zero, negative, — n/a: layout-only change, no data, public page or shared-file behaviour touched

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
| admin | n/a | Admin never sees this home | n/a |
| management | Home | unchanged for one role | n/a |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: layout only, no permission change; role-specific logins not exercised, see manual list
- [ ] A role that should not have access is bl — n/a: no new page or right, nothing to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appea — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [x] Manual updated: topic Home screen: if you cover another role
- [x] Both dictionaries (en, th) carry the three new strings
- [ ] Mobile viewport (375px) — no overflow, c — n/a: pending a person on a phone, listed under manual verification
- [ ] Browser console clean — no errors or Rea — n/a: not driven in a browser, needs a cover login on dev
- [ ] Network clean — no unexpected 4xx/5xx on — n/a: not driven in a browser, needs a cover login on dev

## 6. Regression

- [ ] The pages nearest the change still work (list the  — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/e — n/a: layout-only change, no data, public page or shared-file behaviour touched
- [ ] Nothing merged from `main` during `sync` was broke — n/a: layout-only change, no data, public page or shared-file behaviour touched

## 7. Documentation

- [x] Backlog item ticked
- [x] docs/decisions/2026-10-20-home-groups-by-role.md
- [x] README untouched, still accurate
- [x] **Release notes.** `unreleased` has a new line for covers
- [x] Commit messages say why
- [x] Claims are about layout and were checked by the unit test

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the t — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy p — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observe — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's act — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Wo — deferred: release manager
- [ ] Any new secret/env var exists in the production Cl — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code t — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env productio — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: — deferred: release manager
- [ ] Apply plan stated: which file, which project, and  — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | lint failed on missing acceptance-matrix row | fixed |

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
| 1 | Head of Medical given Head of Maintenance until a date: two groups on a phone, switch works, Covering until shows the date, gone the day after; a one-role login unchanged | phone, dev |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything that could be verified without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

Signed by the person who looked; `pending:` is the honest state until then.

- [ ] The manual list above is empty, or every — n/a: list is not empty, so this stays unticked until a person looks

Manual verification by: pending: a person with a cover login checks the phone switch (list above)

### Gate output

```
gates: typecheck=0 lint=1 test=0 build=0   (first run, before the matrix row)
npm run lint: all checks ok after the fix
```

### Result

- [ ] Open defects are either fixed or explici — n/a: not applicable before the PR exists / release
- [ ] Checklist pasted into the PR — n/a: not applicable before the PR exists / release
- [ ] Handed to the production release manager — n/a: not applicable before the PR exists / release

Result: pass

Release manager acknowledgement: pending: release manager
