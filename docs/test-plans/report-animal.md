# Test plan: report-animal

## Header

| | |
|---|---|
| Feature | One public form for reporting an animal (stray, injured, welfare, lost pet) with a staff list behind a new card |
| Backlog item | `docs/backlog.md` → #z1qn7 |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: not opened at this commit |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | yes: 0372 |
| Tested at SHA | 7b3f58a02 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
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
- [x] `node scripts/gates.mjs` closing lines, exactly as the run printed them:

```
@@GATES@@
```
- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: new table, no existing rows
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet) — n/a: not exercised, the list only has the one test report
- [x] Invalid input is rejected with a readable message, not a crash
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: length limits are enforced by the form and the table checks and were not each exercised

### Role access matrix

Sign in as each login that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*): roles are
a transient grouping of cards and get rebuilt, so a row naming one stops being true. Test a
login holding exactly the card under test (`node scripts/dev-signin.mjs --cards <card> --port <yours>`,
card keys, not activity names), plus admin (outside the card system) and signed out. Where a page
needs two cards together, put both on one row. Do not name `staff` (retired, `0173`) or `resident`
(not a role: a resident is an animal). Read card keys from `/admin/who-does-what`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| exactly `<card key>` | | | |
| exactly `<card key>` | | | |
| signed out | | | |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: the staff page is opened from its card (menu: false); the public page is in the Services menu and footer, seen on /services/sterilisation
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: all strings are in en.ts and th.ts dictionaries, none go through the label-translation queue
- [ ] Mobile viewport (375px) — no overflow, controls reachable — pending: not checked at 375px
- [ ] Browser console clean — no errors or React warnings — n/a: console not read
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: network log not read

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched (`NavLinks.
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: README does not describe public pages or cards
- [x] **Release notes.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**`lannacare.org` is now a 301 to production and is a check of nothing.** It was
production until 2026-11-05 and UAT from then until 2026-11-08, so a plan written
from this template before today may name it as either, and both readings were
correct when written. **UAT is deployed on every release since 2026-11-08**
(`docs/release-procedure.md`, step 6), last of the three.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour. — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named. — deferred: release manager at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited. — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. — deferred: release manager at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager at deploy
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — deferred: release manager at deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — deferred: release manager at deploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-card-grants` part 2 fails on `ASSERT wrong refusal: role_cards.needs_an_approver_first` (0365 changed that refusal to a key; the check still expects English). Not caused by this change | deferred to backlog: for the planner to file |
| 2 | low | `check-who-does-what.mjs` cannot run: dev has no root project folder for Events. So the two new `animal_report.manage` probes were never run | deferred to backlog: for the planner to file |
| 3 | medium | No photo upload on the public form (the item names one) | deferred to backlog: for the planner to file |

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
| 1 | The Thai wording of the form, error messages and staff screen | /services/report-animal in Thai |
| 2 | The form at phone width | /services/report-animal at 375px |

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

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

<!-- guidance:start -->
The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `<name> —
confirmed in chat; line written by Claude at their request  Date: <yyyy-mm-dd>`.
Three valid states:

- `<name>  Date: <yyyy-mm-dd>` — a person looked. The date is required here.
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
<!-- guidance:end -->

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. — pending: the Thai wording and a phone-width look are for a person

Manual verification by: pending: the Thai wording and a phone-width look are for a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — pending: at release

Result: pass with accepted defects

Release manager acknowledgement: pending: at release
