# Test plan: enclosure-photos-app

## Header

| | |
|---|---|
| Feature | Tag a photo to an enclosure when the animal is not known (`/photos/add`), and on Photos to approve choose the resident(s), keep it private, move a wrongly tagged waiting photo or discard; System status lists those unchosen for 30 days (the app half of 0218) |
| Backlog item | `docs/backlog.md` → "Add resident photos: tag a photo to an ENCLOSURE when you do not know which resident it is" (ticked here) |
| Branch / worktree | `claude/enclosure-photos-app` @ `C:\Development\Animal_Shelter_enclosure-photos-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | pending: number assigned on open |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | 24b375a7 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one sentence: a volunteer who does not know the animal tags the enclosure, and Management chooses the resident(s) from the animals that were there, with their photos
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — src/app/photos/add (flow, EnclosureChooser, uploadPending), src/app/api/photos/pending (new route), src/app/photos/approve (page, PendingQueue, ApproveQueue, pending-actions), src/lib/photos (pending, dates, approval), DriveClient.copyFile, System status, both dictionaries, manual, acceptance-matrix entries, releases.ts, backlog
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — admin and management (publish: see and assign); a login holding photos.shelter_add (volunteer once given the card) files; Head of Medical cannot file a pending photo; signed out refused
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the service-role folder read in the Shelter route and a real enclosure list for volunteers (separate schema PR); giving the card or tile to any role (Lutan, in Settings)

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR (0218 did all the schema)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR (0218 did all the schema)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR (0218 did all the schema)
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR (0218 did all the schema)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR (0218 did all the schema)
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR (0218 did all the schema)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR (0218 did all the schema)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR (0218 did all the schema)
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR (0218 did all the schema)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification; the pending list renders nothing when empty and the resident list keeps its sentence
- [x] Invalid input is rejected with a readable message, not a crash — assignPendingPhoto refuses a login that may not publish, nobody chosen, more than 8 residents, a missing photo or resident; reassignWaitingPhoto refuses a photo no longer waiting; the upload route refuses a bad type, bad bytes, no or unknown enclosure; each has a sentence in both dictionaries; read in the code, not driven
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: the only bounds are 8 residents per photo and the Bangkok day for the Drive folder, the latter asserted in src/lib/photos/dates.test.mjs

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

- [ ] Every role above tested — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the route and both actions re-check photos.shelter_add / photos.resident_publish / photos.resident_manage before any Drive call, and the database (RLS, can_file_pending_photo, assign_pending_photo) refuses the rest; not driven by hitting the URL

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no menu entry added; the page and tile already existed and the tile count now includes pending photos
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic Adding photos: if you don't know the resident, and two steps added to Approving photos; the acceptance matrix check passes; not loaded at /manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: strings are in both dictionaries (en, th), not the translations table
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification (Thai at 375 px is on the manual list)
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven in a browser this session (no signed-in Management or volunteer login was used against Drive and the dev database); typechecked, linted, built and listed under Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the build compiled /photos/add, /photos/approve, /admin/status and the new route; check-permission-catalogue, check-home-screens and acceptance-matrix --check pass inside lint; src/lib/photos/approval.test.mjs still passes
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: manual/en.ts, the dictionaries, drive.ts and approval.ts were edited; the build compiled every page that imports them (build=0), not loaded by hand
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync reported origin/main already merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — the enclosure item ticked with a done note; no other open item's outcome is closed by this work
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-17-enclosure-photos-app.md
- [x] `README.md` still accurate — it does not describe photo approval
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — ticked: `unreleased` gained a line describing the I don't know, tag the enclosure path, choosing the resident, keeping a photo off the website, moving a wrongly filed photo and the 30-day list; it does not say who has the Add Shelter Photos card, and no deploy or hand step is outstanding for what it says
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the Bangkok-day folder rule is asserted by test; the Drive ordering is reasoned from the two failure modes and says so in the decision file, and was not exercised against Drive

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: production release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: production release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: production release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: production release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration in this PR (0218 did all the schema)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration in this PR (0218 did all the schema)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR (0218 did all the schema)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR (0218 did all the schema)

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: production release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | The route, the three actions and both pages were never run against Drive and the dev database in this session, only typechecked, linted, built and unit-tested | accepted: first items on the manual list |
| 2 | Low | A volunteer's enclosure list is the enclosures an animal lives in now (they cannot read `enclosures`); an empty enclosure is not offered | accepted: recorded in the decision file and the manual; a real list is the follow-up schema PR |
| 3 | Low | If Drive fails after the database call, the file stays in Unsorted or the old folder and the person is told; the photo shows normally | accepted: the quieter failure, recorded in the decision file |

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
| 1 | As a login holding Add Shelter Photos on a phone: pick a photo, tap I don't know, tag the enclosure, tap a zone then an enclosure; it saves with a tick and reads Saved, waiting for approval; it is on no resident's page; recent enclosures appear next time | /photos/add |
| 2 | As Management: the photo is on Photos to approve as Taken in <enclosure>, resident not chosen, with the animals that were there that day and their photos; tap one, tap Assign and approve; it is on that animal's Photos tab, approved, and the Drive file is in its Shelter folder | /photos/approve; the resident's Photos tab; Drive |
| 3 | Assign one photo to two animals: both get it, each with its own Drive file (delete one and the other stays) | /photos/approve; both residents |
| 4 | Tick Keep it off the website and assign: the photo is on the animal's page marked Waiting for approval, and is not on the public page | resident Photos tab; public resident page |
| 5 | Search for someone who was not in the enclosure and assign; on a waiting resident photo tap Wrong animal? and move it | /photos/approve |
| 6 | Discard: confirmation, then gone from the list and the tile count; file in Drive's bin | /photos/approve; Drive |
| 7 | Settings → System status shows Photos with no resident: amber for a pending photo older than 30 days (back-date one in dev), green otherwise | /admin/status |
| 8 | Phone at 375 px in English and in Thai: the zone and enclosure chips with long enclosure names, the candidate tiles, the buttons | /photos/add; /photos/approve |
| 9 | As a login without photos.resident_publish: Photos to approve is refused; a signed-out visitor never sees an unassigned photo | /photos/approve; /api/photos |
| 10 | Ticking the card onto Volunteer, Management and the 2IC is Lutan's step in Settings; nothing in this PR grants it | Settings → Who does what |

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

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

The items in **Left for manual verification** above are for the person who looks.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: Lutan to tag a photo to an enclosure as a volunteer login and assign it as Management on a phone, in English and Thai

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over
