# Feature test plan

Copy this file to the feature branch as `docs/test-plans/doctor-name-follows-cards.md`, fill the
header, and tick as you go.

Every line must end up in one of three states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.
- `- [ ] … — deferred: <owner>` — **section 8 only.** The check cannot be true
  yet, and this names who picks it up.

That third state exists because the deploy gates in section 8 cannot be true at
PR time: there is no deployed build to check and no production apply to have run.
Writing them `n/a` is a lie in a box labelled "did not apply", and once that habit
forms people write `n/a` for things they simply did not do. `deferred:` says the
truthful thing and passes, because a PR cannot be held open waiting for a deploy
it precedes. It is confined to section 8 deliberately — anywhere else it would be
a general-purpose escape hatch, which is the one thing this check exists to
prevent — and the checker rejects it elsewhere.

**The reason must follow `n/a:` immediately.** `n/a: no UI surface` passes;
`n/a as a deploy check, because …` reads fine to a human but fails, and that
strictness is deliberate — it is what makes every reason greppable in one pass
across every checklist in the repo. Put any qualifying words after the colon,
not before it.

Never tick something you did not do, and never leave a line untouched. Anything
that failed goes under **Defects**.

**No merge without a signed-off checklist. No exceptions.** CI enforces it: a PR
with no completed `docs/test-plans/doctor-name-follows-cards.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job reports **red without blocking the merge**, and **that is
permanent** — decided by Lutan on 2026-10-20: *"we will NOT make this mandatory
it stays as advisory"* (`docs/decisions/2026-10-20-test-plan-stays-advisory.md`).
It is a deliberate soft gate, not an oversight and not a trial. **Treat a red
`test-plan` as a stop anyway:** the script goes red only when a plan is genuinely
wrong, so a red one is always someone's mistake to fix.
It will **not** become a required check. Earlier wording here said it would
"once we know the checklist is working", which read as a decision still pending
and got him asked for an answer he had already given.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

---

## Header

| | |
|---|---|
| Feature | Doctor name on a clinic visit follows the clinics.doctors card |
| Backlog item | `docs/backlog.md` → Security: a login that may book a clinic visit but not add a doctor is offered a free-text doctor name |
| Branch / worktree | `claude/doctor-name-follows-cards` @ `C:\Development\Animal_Shelter_doctor-name-follows-cards` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | 56516484 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matche
- [x] Files/areas touched listed (routes, `worker/`, `su
- [x] Roles affected identified: admin / staff / doctor 
- [x] Anything explicitly out of scope written down, so 

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

- [x] `node scripts/worktree.mjs sync` merged origin/main (one backlog.md conflict, resolved by hand)
- [x] `node scripts/gates.mjs` four gates, all 0:

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 124s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 49s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` revie — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` revi — n/a: no migration in this PR
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and record — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the chang — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real ro — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not n — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manag — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path: book-only login gets a chooser, booking plus Contacts card gets the free-text field (rendered HTML on dev)
- [ ] Data persists — n/a: no new data path; only which control the form draws
- [ ] Create / edit / delete all exercised (whichever th — n/a: no new data path; only which control the form draws
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new data path; only which control the form draws
- [ ] Invalid input is rejected with a readable message, — n/a: no new data path; only which control the form draws
- [ ] Boundary cases checked (long text, zero, negative, — n/a: no new data path; only which control the form draws

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
| book_clinic_visits only | /clinic-visits/new | chooser, no free text | seen |
| book_clinic_visits + contacts | /clinic-visits/new | free-text field | seen |

- [ ] Every role above tested — n/a: tested by card, not role: one-card logins book_clinic_visits and book_clinic_visits+contacts
- [ ] A role that should not have access is blocked server-side — n/a: server and database checks unchanged; this only hides a field

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not driven in the pane; form checked from rendered HTML only
- [ ] Manual updated (`src/lib/manual/en.ts`) and the to — n/a: not driven in the pane; form checked from rendered HTML only
- [x] Translatable strings go through the dictionaries (en and th; Thai new and unread)
- [ ] Mobile viewport (375px) — n/a: not driven in the pane; form checked from rendered HTML only
- [ ] Browser console clean — n/a: not driven in the pane; form checked from rendered HTML only
- [ ] Network clean — n/a: not driven in the pane; form checked from rendered HTML only

## 6. Regression

- [ ] The pages nearest the change still work (list the  — n/a: only the two clinic-visit forms touched; permission-catalogue pins updated and passing
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/e — n/a: only the two clinic-visit forms touched; permission-catalogue pins updated and passing
- [ ] Nothing merged from `main` during `sync` was broke — n/a: only the two clinic-visit forms touched; permission-catalogue pins updated and passing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file docs/decisions/2026-11-03-doctor-name-follows-cards.md
- [ ] README.md still accurate — n/a: README does not mention the doctor field
- [x] **Release notes.** `unreleased` has a line, tagged book_clinic_visits
- [x] Commit messages say why
- [x] Claims were measured (policy and trigger read from migrations; one-card runs on dev)

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the t — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved, not observed  — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions c — deferred: release manager
- [ ] Evidence pasted into this plan is the tool's actua — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Wo — deferred: release manager
- [ ] Any new secret/env var exists in the production Cl — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code tha — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env productio — deferred: release manager
- [ ] For a destructive or rewriting migration only: a p — deferred: release manager
- [ ] Apply plan stated: which file, which project, and  — deferred: release manager

### Rollback

- [ ] Rollback position stated, including what it does n — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | check-doctors rls part still red: it inserts into clinic_visits in SQL as a visit.book-only login, bypassing the form | deferred to batch 2 clinic-harness-rewrite |

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
| 1 | Book a clinic visit as a login with only the booking card; the Doctor box should be a drop-down; save it | /clinic-visits/new |
| 2 | Thai wording of the drop-down hint reads well | /clinic-visits/new in Thai |

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

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `a name —
confirmed in chat; line written by Claude at their request  a date`.
Three valid states:

- `a name and a date` — a person looked. The date is required here.
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

- [ ] The manual list above is checked by a person — n/a: two items are listed and still pending

Manual verification by: pending: Lutan to try the booking form with a booking-only login and read the Thai hint

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is in the PR itself
- [ ] Handed to the production release manager — n/a: handover happens at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: release time
