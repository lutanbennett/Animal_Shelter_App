## Header

| | |
|---|---|
| Feature | tags-remaining-boxes: public strip of # tags, intake and housing-move note boxes taggable |
| Backlog item | `docs/backlog.md` → Resident operations, #tags |
| Branch / worktree | `claude/tags-remaining-boxes` @ `C:DevelopmentAnimal_Shelter_tags-remaining-boxes` |
| Dev server | `http://localhost:3001` |
| PR | see GitHub |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | 0612abe3 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 98s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 267s
=== gates: test — npm test
=== gates: test exited 0 after 48s
=== gates: build — npm run build
=== gates: build exited 0 after 397s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on main, and no  — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] node scripts/apply-migrations.mjs --status reviewed before — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] node scripts/apply-migrations.mjs --dry-run reviewed — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Applied to dev (qxkmhwybjggxvsfxsxbd) and recorded in  — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] File is re-runnable (if not exists / or replace / drop  — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Existing rows still read correctly after the change (checked — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Constraints and defaults exercised against real rows in  — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Down-migration written, or the reason one is not needed is s — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Production apply plan stated for the release manager (which  — n/a: no migration or new page; the change is two note boxes and a public text strip

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Data persists — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Empty state renders sensibly (no rows yet) — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: no migration or new page; the change is two note boxes and a public text strip

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
| admin | not driven | n/a | n/a |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] A role that should not have access is blocked server-side (h — n/a: no migration or new page; the change is two note boxes and a public text strip

## 5. Cross-cutting

- [ ] Nav entry correct (src/app/NavLinks.tsx) — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Manual updated (src/lib/manual/en.ts) and the topic reads  — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Translatable strings go through the translation path, checke — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Mobile viewport (375px) — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Browser console clean — n/a: no migration or new page; the change is two note boxes and a public text strip
- [ ] Network clean — n/a: no migration or new page; the change is two note boxes and a public text strip

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (NavLinks.tsx, manual/en.ts, sha — n/a: no migration or new page; the change is two note boxes and a public text strip
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line for the two taggable boxes and the public name. It records that assistant notes do not link yet, which is stated plainly, so no step is outstanding before a user sees it.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of mai — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test — deferred: release manager at deploy
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager at deploy
- [ ] Timezone-sensitive behaviour proved, not observed at a con — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover bot — deferred: release manager at deploy
- [ ] Evidence pasted into this plan is the tool's actual output — deferred: release manager at deploy
- [ ] Public pages (/, /adopt, /our-work, /donate) re-chec — deferred: release manager at deploy

### Deploy safety

- [ ] deploy — deferred: release manager at deploy
- [ ] strip-baked-env — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads  — deferred: release manager at deploy
- [ ] node scripts/apply-migrations.mjs --env production --dry-ru — deferred: release manager at deploy
- [ ] For a destructive or rewriting migration only — deferred: release manager at deploy
- [ ] Apply plan stated — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, including what it does not cover — deferred: release manager at deploy

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
| 1 | Tag in the intake note and the housing move note; see it under Mentioned in. Tag in temperament, see a plain name on /adopt and /r. Not driven in a browser by the stream. | Dev, port 3001 |

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

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

- [ ] The manual list above is empty — n/a: the list has one item, so only a person who looked may tick this

Manual verification by: pending: press # in the intake note and the Edit resident housing move note, save, and check Mentioned in on the tagged resident; then open /adopt and /r for a resident whose temperament has a tag and confirm a plain name

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed at release cut

Result: pass

Release manager acknowledgement: n/a: given at release
