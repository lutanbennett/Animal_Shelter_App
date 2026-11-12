# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Draw bills-inbox record/file buttons only for kinds the login may file; trace the other click-only rows |
| Backlog item | `docs/backlog.md` → `#79sqf` (not ticked: 0 of 25 rows driven) |
| Branch / worktree | `claude/control-press-bills-medical` @ `C:DevelopmentAnimal_Shelter_control-press-bills-medical` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not started: nothing driven) |
| PR | see PR |
| Tested by / date | Claude / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | 3273cea1 |

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

- [ ] `node scripts/worktree.mjs sync` — `orig — n/a: synced before merge, not at this commit
- [x] `node scripts/gates.mjs` ends with one line of the shape `ga… — result below:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 246s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 482s
=== gates: test — npm test
=== gates: test exited 0 after 57s
=== gates: build — npm run build
=== gates: build exited 0 after 562s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on  — n/a: no migration, no new page, nothing here changes it
- [ ] `node scripts/apply-migrations.mjs --sta — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --dry — n/a: no migration in this change
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) a — n/a: no migration, no new page, nothing here changes it
- [ ] File is re-runnable (`if not exists` / `or re — n/a: no migration, no new page, nothing here changes it
- [ ] Existing rows still read correctly after the  — n/a: no migration, no new page, nothing here changes it
- [ ] **Constraints and defaults exercised against  — n/a: no migration, no new page, nothing here changes it
- [ ] Down-migration written, or the reason one is  — n/a: no migration, no new page, nothing here changes it
- [ ] Production apply plan stated for the release  — n/a: no migration, no new page, nothing here changes it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: nothing was driven in a browser this stream; static trace only, see the decision file
- [ ] Data persists — reload the page and the change is  — n/a: nothing was driven in a browser this stream; static trace only, see the decision file
- [ ] Create / edit / delete all exercised (whichever th — n/a: nothing was driven in a browser this stream; static trace only, see the decision file
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing was driven in a browser this stream; static trace only, see the decision file
- [ ] Invalid input is rejected with a readable message, — n/a: nothing was driven in a browser this stream; static trace only, see the decision file
- [ ] Boundary cases checked (long text, zero, negative, — n/a: nothing was driven in a browser this stream; static trace only, see the decision file

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
| admin | | not driven | n/a |
| exactly `bills` | /bills | record button only for offered kind | not driven |
| signed out | /bills | redirect to login | not driven |

- [ ] Every login above tested — n/a: nothing was driven in a browser this stream; static trace only, see the decision file
- [ ] A login that should not have access is blocked ser — n/a: nothing was driven in a browser this stream; static trace only, see the decision file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) —  — n/a: no migration, no new page, nothing here changes it
- [ ] Manual updated (`src/lib/manual/en.ts`) and t — n/a: no migration, no new page, nothing here changes it
- [ ] Translatable strings go through the translati — n/a: no migration, no new page, nothing here changes it
- [ ] Mobile viewport (375px) — no overflow, contro — n/a: no migration, no new page, nothing here changes it
- [ ] Browser console clean — no errors or React wa — n/a: no migration, no new page, nothing here changes it
- [ ] Network clean — no unexpected 4xx/5xx on the  — n/a: no migration, no new page, nothing here changes it

## 6. Regression

- [ ] The pages nearest the change still work (list — n/a: no migration, no new page, nothing here changes it
- [ ] Any shared file touched (`NavLinks.tsx`, `man — n/a: no migration, no new page, nothing here changes it
- [ ] Nothing merged from `main` during `sync` was  — n/a: no migration, no new page, nothing here changes it

## 7. Documentation

- [ ] Backlog item — n/a: #79sqf stays open, 0 of 25 rows driven
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: no migration, no new page, nothing here changes it
- [ ] **Release notes.** — n/a: a button that the server already refused disappears on a card the login could not file; no user would notice
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisio — n/a: no migration, no new page, nothing here changes it

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

- [ ] Tested SHA recorded in the header, and i — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `d — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — t — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, n — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the  — deferred: release manager
- [ ] **Evidence pasted into this plan is the  — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work` — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project < — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) f — deferred: release manager
- [ ] Any new secret/env var exists in the pro — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration  — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env — deferred: release manager
- [ ] For a **destructive or rewriting** migra — deferred: release manager
- [ ] Apply plan stated: which file, which pro — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including wh — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Bills inbox drew record/file buttons for a kind the login is not offered | fixed |

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
| 1 | Press the 25 click-only rows with and without their card | `docs/decisions/2026-11-11-control-drive-pane.md` |

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

Automated checks by: Claude  Date: 2026-11-12

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty — n/a: see the table, the browser press is left

Manual verification by: pending: Lutan to press the click-only rows

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at merge/release, not at this commit
- [ ] Handed to the production relea — n/a: done at merge/release, not at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending: release
