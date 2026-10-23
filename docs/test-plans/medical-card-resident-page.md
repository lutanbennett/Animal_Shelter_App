# Test plan: medical-card-resident-page

## Header

| | |
|---|---|
| Feature | The resident page opens for a login holding a medical edit (read-only outside the medical sections); `/residents` hides buttons a login cannot use |
| Backlog item | `docs/backlog.md` → FAILED CARD (medical_records) and the facility-card `/residents` buttons item |
| Branch / worktree | `claude/medical-card-resident-page` @ `C:\Development\Animal_Shelter_medical-card-resident-page` |
| Dev server | `http://localhost:3007` (`.port`) |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | 7dbcdf42 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a who-and-where login with a medical edit opens the resident page, editable only in the medical sections; the list hides unusable buttons
- [x] Files/areas touched listed: `src/app/residents/[id]/` (page, hub, section page), `src/app/residents/page.tsx` and `ResidentsTable.tsx`, `src/lib/residents/who-and-where.ts`, `scripts/check-permission-catalogue.mjs` (pins), releases, decision, backlog. No migration
- [x] Roles affected identified: head_of_medical, second_in_command and any card login holding a medical edit gain the page; volunteer, head_of_maintenance and doctor unchanged
- [x] Anything explicitly **out of scope** written down: the Operations tile and menu entry (filed as its own backlog item), and resident photos and adoption updates for a who-and-where login (still `sees_all_residents()`, named in 0249)

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (it prints `test=0` too):

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)

## 4. Functional checks

- [x] Happy path works end to end: signed in as head_of_medical on dev, `/residents/<id>` opened (no redirect) with Log weight as its only add button and no edit, housing, death or microchip controls; its housing and weight tabs open and its edit, move and hospital pages are refused
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this change; the hub only shows or hides controls
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no writes added; the controls that write are hidden or unchanged
- [ ] Empty state renders sensibly (no rows yet) — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no migration; 0249 landed and was applied to dev yesterday (251 applied, 0 pending)

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
| admin | `/residents/<id>` | unchanged: scope all, full controls | proof script: admin unchanged (100 residents) |
| management | `/residents/<id>` | unchanged | proof script: management unchanged |
| staff | — | n/a: retired role | n/a |
| doctor | `/residents/<id>` | unchanged: own_clinic, so neither the redirect nor read-only mode applies | proof script: doctor unchanged |
| volunteer | `/residents/<id>` | still bounced to `/r/<id>` | driven in the browser: landed on `/r/<id>`; proof script: 0 rows |
| signed out | `/residents/<id>` | n/a: no change to the sign-in gate | n/a |

- [ ] Every role above tested — n/a: admin, management, doctor and head_of_maintenance were checked by the proof script (14 checks, GREEN) rather than in a browser; volunteer and head_of_medical were driven
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): head_of_medical fetched `/residents/<id>/edit`, `/move` and `/hospital` directly and the resident's name was absent from each; the database still refuses every resident write for them

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change; the Operations entry is filed as its own item
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the brief forbids touching the manual this batch; a permission fix changes nothing a user reads
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new strings in the app, only the release note
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven at 375 px; the change only removes buttons and links and adds no layout. Listed under Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: the browser console was not read; the dev server log showed only 200s for the pages loaded
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: `/residents` and the hub returned 200 in the dev server log

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/residents` as a scope-all card login (buttons follow permissions) and as head_of_medical; the hub and its housing and weight tabs
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page: `who-and-where.ts` is also read by `/r/<code>`, and the volunteer's `/r/<id>` loaded after the redirect
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync reported origin/main already merged, so nothing new came in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: both items ticked, the walkthrough item given a note and left open (17 cards remain); the Operations-tile half filed as a new item on the backlog branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `2026-10-23-medical-card-resident-page.md`
- [ ] `README.md` still accurate — n/a: README does not describe resident page permissions
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for the Medical records card. No manual step is outstanding: 0249 is applied to dev and production gets it with the release
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)
- [ ] `README.md` still accurate — n/a: README does not describe resident page permissions
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager (no migration and no production effect; no migration in this PR, and the page change ships with the next release)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/dev-signin.mjs --cards` makes a scope-all role, so a card login from it never exercises the who-and-where path; verified with head_of_medical instead | accepted, noted in the decision file |
| 2 | low | Operations tile and menu entry still shown to a login holding only a facility card | deferred to backlog (filed) |
| 3 | low | Photos and adoption updates are empty for a who-and-where login (0249 left them on `sees_all_residents()`) | deferred: separate schema stream, named in 0249 |

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
| 1 | The hub on a real phone (375 px) as Head of Medical or the second-in-command: nothing overflows, only the buttons they may use appear | `/residents/<id>` |
| 2 | The Residents list as a login with only a facility card: no New resident, Book visit, Log immunizations or Download buttons | `/residents` |

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

The items in **Left for manual verification** above. Claude drove the hub as head_of_medical and volunteer on dev, but this line is for a person: it is left pending rather than signed on Lutan's behalf.

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not empty, two items are pending (see the pending signature below)

Manual verification by: pending: two rows above for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing in this PR ships to production

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet handed over
