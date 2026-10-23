| Tested at SHA | 9d4419ab |

## Header

| | |
|---|---|
| Feature | Triage of five check scripts (doctor harnesses, worker-origin, backup-prune) |
| Backlog item | `docs/backlog.md` → Triage the check scripts that are red today |
| Branch / worktree | `claude/check-scripts-doctor-triage` @ the sibling worktree folder |
| Dev server | not used (harness work) |
| PR | this branch's PR |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | 9d4419ab |

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` (see below)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries — n/a: no migration
- [ ] `node scripts/apply-migrations — n/a: no migration
- [ ] `node scripts/apply-migrations — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, scripts only
- [ ] Data persists  — n/a: no UI surface, scripts only
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface, scripts only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface, scripts only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface, scripts only
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface, scripts only

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

- [ ] Every role above tested — n/a: no UI surface, scripts only
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI surface, scripts only

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks — n/a: no UI surface, scripts only
- [ ] Manual updated (`src/lib/manual/en — n/a: no UI surface, scripts only
- [ ] Translatable strings go through the translation path, checked at `/management/translations — n/a: no UI surface, scripts only
- [ ] Mobile viewport (375px)  — n/a: no UI surface, scripts only
- [ ] Browser console clean  — n/a: no UI surface, scripts only
- [ ] Network clean  — n/a: no UI surface, scripts only

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI surface, scripts only
- [ ] Any shared file touched (`NavLinks — n/a: no UI surface, scripts only
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: no UI surface, scripts only

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: scripts only, nothing the README describes changed
- [ ] **Release notes.** n/a: check scripts are developer tooling and nobody at the shelter would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager (no deploy comes from this PR)
- [ ] Deployed SHA matches the tested SHA  — deferred: release manager (no deploy comes from this PR)

### On the deployed build

- [ ] Deployed to test — deferred: release manager (no deploy comes from this PR)
- [ ] Smoke-tested on `test — deferred: release manager (no deploy comes from this PR)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour — deferred: release manager (no deploy comes from this PR)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — deferred: release manager (no deploy comes from this PR)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager (no deploy comes from this PR)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 1 — deferred: release manager (no deploy comes from this PR)

### Deploy safety

- [ ] `deploy — deferred: release manager (no deploy comes from this PR)
- [ ] `strip-baked-env — deferred: release manager (no deploy comes from this PR)
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager (no deploy comes from this PR)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a — deferred: release manager (no deploy comes from this PR)
- [ ] `node scripts/apply-migrations — deferred: release manager (no deploy comes from this PR)
- [ ] For a **destructive or rewriting** migration only — deferred: release manager (no deploy comes from this PR)
- [ ] Apply plan stated — deferred: release manager (no deploy comes from this PR)

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager (no deploy comes from this PR)

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

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `NAME —
confirmed in chat; line written by Claude at their request  Date: DATE`.
Three valid states:

- `NAME  Date: DATE` — a person looked. The date is required here.
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

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: the production 0230 status check above, which only Lutan can run from the main checkout

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted into the PR when it is opened
- [ ] Handed to the production release manager — n/a: no production change; the filed fault item carries the release gate

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet read by the release manager
