# Test plan: diets-ingredients-design

## Header

| | |
|---|---|
| Feature | Diets made of ingredients: design note |
| Backlog item | `docs/backlog.md` → Diets made of ingredients |
| Branch / worktree | `claude/diets-ingredients-design` |
| Dev server | n/a |
| PR | see PR |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | n/a: docs only |

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

- [ ] node scripts/worktree.mjs sync  origin/main merged in cleanly — n/a: no code or schema in this PR; it adds one design document only
- [ ] node scripts/gates.mjs ends gates: typecheck=0 lint=0 build=0. Paste its clo — n/a: no code or schema in this PR; it adds one design document only
- [ ] CI green on the PR (runs the same three). This one cannot be true in the commi — n/a: no code or schema in this PR; it adds one design document only

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on main, and no other in-flight bran — n/a: no code or schema in this PR; it adds one design document only
- [ ] node scripts/apply-migrations.mjs --status reviewed before applying — n/a: no code or schema in this PR; it adds one design document only
- [ ] node scripts/apply-migrations.mjs --dry-run reviewed — n/a: no code or schema in this PR; it adds one design document only
- [ ] Applied to dev (qxkmhwybjggxvsfxsxbd) and recorded in schema_migrations — n/a: no code or schema in this PR; it adds one design document only
- [ ] File is re-runnable (if not exists / or replace / drop … if exists) — n/a: no code or schema in this PR; it adds one design document only
- [ ] Existing rows still read correctly after the change (checked against real dev da — n/a: no code or schema in this PR; it adds one design document only
- [ ] Constraints and defaults exercised against real rows in a begin; … rollback — n/a: no code or schema in this PR; it adds one design document only
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no code or schema in this PR; it adds one design document only
- [ ] Production apply plan stated for the release manager (which file, which project, — n/a: no code or schema in this PR; it adds one design document only

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code or schema in this PR; it adds one design document only
- [ ] Data persists  reload the page and the change is still there — n/a: no code or schema in this PR; it adds one design document only
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no code or schema in this PR; it adds one design document only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no code or schema in this PR; it adds one design document only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no code or schema in this PR; it adds one design document only
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, date — n/a: no code or schema in this PR; it adds one design document only

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

- [ ] Every role above tested — n/a: no code or schema in this PR; it adds one design document only
- [ ] A role that should not have access is blocked server-side (hitting the URL direc — n/a: no code or schema in this PR; it adds one design document only

## 5. Cross-cutting

- [ ] Nav entry correct (src/app/NavLinks.tsx)  appears for the right roles, no dea — n/a: no code or schema in this PR; it adds one design document only
- [ ] Manual updated (src/lib/manual/en.ts) and the topic reads correctly at /manua — n/a: no code or schema in this PR; it adds one design document only
- [ ] Translatable strings go through the translation path, checked at /management/tr — n/a: no code or schema in this PR; it adds one design document only
- [ ] Mobile viewport (375px)  no overflow, controls reachable — n/a: no code or schema in this PR; it adds one design document only
- [ ] Browser console clean  no errors or React warnings — n/a: no code or schema in this PR; it adds one design document only
- [ ] Network clean  no unexpected 4xx/5xx on the feature's pages — n/a: no code or schema in this PR; it adds one design document only

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no code or schema in this PR; it adds one design document only
- [ ] Any shared file touched (NavLinks.tsx, manual/en.ts, shared libs) checked fr — n/a: no code or schema in this PR; it adds one design document only
- [ ] Nothing merged from main during sync was broken by this branch — n/a: no code or schema in this PR; it adds one design document only

## 7. Documentation

- [ ] Backlog item ticked — n/a: this PR is the first of three steps; the item stays open for the schema and app PRs
- [ ] Design choices recorded — n/a: the design note itself is the record; the decision file lands with the app PR
- [ ] `README.md` still accurate — n/a: no code or schema in this PR; it adds one design document only
- [ ] **Release notes.** — n/a: a design document, nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the code facts in the note were read from migrations 0051, 0087, 0090, 0118, 0211 and the forecast function bodies; the 40 to 10 bags figure is Lutan's

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip o… — deferred: release manager (docs only, nothing to deploy)
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` pri… — deferred: release manager (docs only, nothing to deploy)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test`… — deferred: release manager (docs only, nothing to deploy)
- [ ] Smoke-tested on `test.lannacare.org` — the happy path … — deferred: release manager (docs only, nothing to deploy)
- [ ] **Timezone-sensitive behaviour proved, not observed at… — deferred: release manager (docs only, nothing to deploy)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cov… — deferred: release manager (docs only, nothing to deploy)
- [ ] **Evidence pasted into this plan is the tool's actual … — deferred: release manager (docs only, nothing to deploy)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) r… — deferred: release manager (docs only, nothing to deploy)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line rea… — deferred: release manager (docs only, nothing to deploy)
- [ ] `strip-baked-env: removed N env var(s) from the Worker… — deferred: release manager (docs only, nothing to deploy)
- [ ] Any new secret/env var exists in the production Cloudf… — deferred: release manager (docs only, nothing to deploy)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that … — deferred: release manager (docs only, nothing to deploy)
- [ ] `node scripts/apply-migrations.mjs --env production --… — deferred: release manager (docs only, nothing to deploy)
- [ ] For a **destructive or rewriting** migration only: a p… — deferred: release manager (docs only, nothing to deploy)
- [ ] Apply plan stated: which file, which project, and whet… — deferred: release manager (docs only, nothing to deploy)

### Rollback

- [ ] Rollback position stated, **including what it does not… — deferred: release manager (docs only, nothing to deploy)

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

Automated checks by: Claude  Date: 2026-10-21

### Manual verification
- [x] The manual list above is empty, or every item in it was checked by a person. — the list is empty

Manual verification by: n/a: a design document, nothing to look at beyond reading it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is committed in the PR
- [ ] Handed to the production release manager — n/a: docs only, nothing to release

Result: pass

Release manager acknowledgement: pending
