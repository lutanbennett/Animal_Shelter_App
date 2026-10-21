## Header

| | |
|---|---|
| Feature | Cancelled visits counted apart from real ones; archive PDFs |
| Backlog item | `docs/backlog.md` → Clinic visits: cancelled visits are counted as visits |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | b536be3e |

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three). This one cannot be true in the commit that cre — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` — n/a: no migration in this PR
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Data persists — reload the page and the change is still — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Empty state renders sensibly (no rows — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Invalid input is rejected with a readable message, not a — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, — n/a: not driven in a browser this session — listed under Left for manual verification

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
| admin | Resident Clinic visits section | Cancelled folded below main list | not driven |
| management | same | same | not driven |
| staff | retired role | n/a | n/a |
| doctor | same | same | not driven |
| volunteer | same | same | not driven |
| signed out | none | redirected, unchanged | unchanged code |

- [ ] Every role above — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL — n/a: not driven in a browser this session — listed under Left for manual verification

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Translatable strings go through the translation path, checked at — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Mobile viewport (375px) — no overflow, controls — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Browser console clean — no errors or React — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's — n/a: not driven in a browser this session — listed under Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work (list the ones — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked — n/a: not driven in a browser this session — listed under Left for manual verification
- [ ] Nothing merged from `main` during `sync` was broken by this — n/a: not driven in a browser this session — listed under Left for manual verification

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour. Workers — deferred: production release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band — deferred: production release manager
- [ ] Evidence pasted into this plan is the tool's actual output, unedited. A — deferred: production release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare — deferred: production release manager

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the — deferred: production release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — — deferred: production release manager
- [ ] For a destructive or rewriting migration only: a production backup exists and — deferred: production release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or — deferred: production release manager

### Rollback

- [ ] Rollback position stated, including what it does not cover. Production is — deferred: production release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Not driven in a browser | accepted; listed for manual check |

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
| 1 | Resident with 3 completed, 1 booked, 2 cancelled shows 4 visits on the hub, 4 in the main list and a folded Cancelled (2) below; rebooking moves one back | /residents/[id] and /residents/[id]/clinic-visits |
| 2 | Deceased resident archive PDF lists cancelled visits under Cancelled visits | Refresh archive on a deceased resident on dev |

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

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat.
Three valid states:

- a name and date — a person looked.
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

- [ ] The manual list above is empty, or every item in it was checked by a person. If — n/a: not applicable to this change

Manual verification by: pending: Lutan to look at items 1 and 2 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted into the PR body when it is opened
- [ ] Handed to the production release manager — n/a: release manager reads it from the PR

Result: pass with accepted defects

Release manager acknowledgement: pending
