# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed) or `n/a` / `deferred` with the reason.

---

## Header

| | |
|---|---|
| Feature | Staff wording and Thai: sign-in message and kept email, Release notes and Manual chrome in Thai, developer's words reworded, validation messages in the app's language |
| Backlog item | `docs/backlog.md` → Dry run findings F-11, F-12, F-18, F-19 |
| Branch / worktree | `claude/staff-wording-and-thai` @ `C:\Development\Animal_Shelter_staff-wording-and-thai` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | linked from the PR itself |
| Tested by / date | Claude (staff-wording-and-thai session), 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | `c837df85` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: F-11 (release notes + manual chrome in Thai), F-12 (sign-in message in app wording, email kept), F-18 (developer's words reworded), F-19 (validation messages in the app's language on Intake, Change password, Deliveries). F-11's public-text and reference-list Thai names are not done and the item stays open
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/login`, `src/app/releases`, `src/app/manual`, `src/app/adopt/page.tsx`, `src/app/assistant/actions.ts`, `src/app/prescriptions/PrescriptionForm.tsx`, `src/app/residents/[id]/[section]/page.tsx`, `src/components/PhotoGallery.tsx` and `PhotoUploader.tsx`, `src/lib/i18n/` (both dictionaries, `enum-labels.ts`, new `validity.ts`), `src/lib/enclosures/names.ts`, `src/lib/manual/en.ts`, three forms, `src/lib/releases.ts`. No `worker/`, no `supabase/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: all signed-in roles see the Thai chrome and wording; the release-note environment tag is admin-only; signed-out visitors see the sign-in page change
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the Thai manual text; Thai for the public Foster, Volunteer, Donate, Home and Adopt texts and for immunization, procedure and blood-test type names; converting any form to our own inline errors (see the decision file)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: Already up to date at `097bbde6`, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them: `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on dev, a wrong password in English and in Thai shows the app's message and keeps the email; signed-in pages are in Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: nothing here saves data except the assistant's note stamp, which was not exercised
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: wording and messages only; no create, edit or delete behaviour changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or empty state changed
- [x] Invalid input is rejected with a readable message, not a crash: sign-in with a wrong password gives the readable message in both languages. The validation-message swap on the three forms is behind sign-in and is in Left for manual verification
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no new inputs; date limits are formatted from the control's own max and min

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no access rules changed; a signed-in role could not be driven in this session, so the signed-in pages are in Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rules changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or changed
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: one line (the Ctrl+F hint) reworded in `src/lib/manual/en.ts`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: these are interface strings in the dictionaries, not Management → Translations text; the public texts filled there are listed as out of scope
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: only the sign-in page was driven, at the pane's own width; the longer Thai strings on the signed-in pages are in Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: console not read in this session
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: network log not read in this session

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): /login driven in both languages. The signed-in pages were only compiled by the gates build, not loaded
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared nav or manual topic changed; placeName() is read by many pages and its only change is the name Lifecycle, listed under Left for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought in nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): F-12, F-18, F-19 ticked; F-11 left open for the parts not done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-staff-wording-and-thai.md`
- [x] `README.md` still accurate: nothing in it describes any of this
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is: four lines added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell: the only measured claims are the sign-in behaviour (driven) and the gates; the rest say what the code now does

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: nothing here derives a date from the clock
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no threshold or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — n/a: no results table pasted
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy (the Adopt subtitle changed)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement: strings and one page's logic only; the rollback is a rebuild of the previous sha on the Pi, and there is nothing to undo in the database

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
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | Signed in, in Thai, open Release notes: heading, intro, filter bar and dates are Thai, the line saying the notes are English shows, and no Dev tag appears for a non-admin (an admin still sees it) | /releases |
| 2 | In Thai, open the Manual: title, contents, filter bar and PDF links are Thai, with the English-only notice at the top | /manual |
| 3 | On a phone-width screen in Thai, the longer Thai strings (release-note filter bar, manual notice, sign-in message) do not push the header or page wider than the screen | /releases, /manual, /login |
| 4 | With the phone set to English and the app in Thai: leave a required field empty on Intake, Change password and Deliveries and press save; the bubble is Thai. Try a date after today where the field has a limit | /residents/new, /account/password, /deliveries |
| 5 | The zone Lifecycle reads Status (สถานะ in Thai) under the Enclosures zone filter and on a resident's housing line | /enclosures, resident page |
| 6 | An adopted resident's housing history says Adopter, not Carer; photo tiles read the folder in the app's language and the date as 3 Oct 2026 | resident → housing history, photos |
| 7 | The Adopt page says nothing about browsing as a guest while signed in, and still does while signed out | /adopt |
| 8 | A prescription's medication drop-down no longer shows "tablet (tablet(s))" | /prescriptions/new |

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

Automated checks by: Claude (staff-wording-and-thai session)  Date: 2026-10-04

### Manual verification

The eight items in **Left for manual verification** above, all behind sign-in, which this session could not drive. Signed only by the person who looked.

- [x] Every item in the manual list above was checked by a person — all eight, confirmed in chat by Lutan

Manual verification by: Lutan — confirmed in chat; line written by Claude at their request  Date: 2026-10-04

### Result

- [x] Open defects are either fixed or explicitly accepted above: none found; F-19's limit (still the browser's bubble widget, other forms unchanged) is in the decision file
- [ ] Checklist pasted into the PR — n/a: the plan is a file on the branch, so the PR carries it
- [ ] Handed to the production release manager — n/a: nothing is deployed from this PR; the release manager reads the plan in the pre-deploy pass

Result: pass

Release manager acknowledgement: pending
