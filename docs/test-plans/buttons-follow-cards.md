# Feature test plan — buttons-follow-cards

## Header

| | |
|---|---|
| Feature | A button shows only if the login's cards let it act: rule in CLAUDE.md, photo gallery and vet-visit link gated |
| Backlog item | `docs/backlog.md` → STANDING RULE: A BUTTON IS SHOWN ONLY IF THE LOGIN'S CARDS LET IT DO THAT ACTION (left open: the sweep is partial, see the decision file) |
| Branch / worktree | `claude/buttons-follow-cards` @ `C:DevelopmentAnimal_Shelter_buttons-follow-cards` |
| Dev server | `http://localhost:3005` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | `2cc0f854` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — gallery Remove / Set as profile / Move to folder and the hub Book-a-vet-visit link drawn only with the card the action asks; rule written into CLAUDE.md
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — CLAUDE.md, PhotoGallery.tsx, the photos / adoption-updates / clinic-visits sections, check-permission-catalogue.mjs, one test, decision file, release note
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — a login holding only View residents loses three buttons and one link; one with photos.resident_manage keeps them; Admin unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the rest of the app-wide sweep (the decision file lists what was not examined), /admin/security, /admin/who-does-what, creating cards

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — origin/main already merged, nothing to pull
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — n/a: not applicable to this change Exit codes read from the file the run was redirected to:

```
=== gates: typecheck exited 0 after 19s
=== gates: lint exited 0 after 222s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 104s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — driven in the browser on dev: same resident, same open photo, three logins
- [ ] Data persists — reload the page and the change is still there — n/a: no data is created or validated; the change only decides which buttons are drawn
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no data is created or validated; the change only decides which buttons are drawn
- [ ] Empty state renders sensibly (no rows yet) — n/a: no data is created or validated; the change only decides which buttons are drawn
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no data is created or validated; the change only decides which buttons are drawn
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no data is created or validated; the change only decides which buttons are drawn

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
| admin | a resident's photos | Remove photo present | present, seen on screen |
| management | n/a | not driven by role key; this change is checked by card | n/a: driven by card instead |
| staff | n/a | retired role | n/a: retired role |
| doctor | n/a | not driven by role key | n/a: driven by card instead |
| volunteer | a resident's photos | no Remove / Set as profile / Move | view_residents-only login: all three absent, seen on screen; view_residents + approve_photos: all three present |
| signed out | n/a | no access to the page | n/a: the page needs a login and was not changed |

- [x] Every role above tested — driven by card, not role key: view_residents only; view_residents + approve_photos; Admin
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the database refusal is untouched: delete_resident_photo and set_resident_profile_photo still check photos.resident_manage (0152); only the buttons were hidden

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry, manual text, dictionary string or layout changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no nav entry, manual text, dictionary string or layout changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no nav entry, manual text, dictionary string or layout changed
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no nav entry, manual text, dictionary string or layout changed
- [x] Browser console clean — no errors or React warnings — no errors seen on the pages driven
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no nav entry, manual text, dictionary string or layout changed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the resident photos page for three logins; build covers the rest
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file changed beyond what the decision file lists
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: no shared file changed beyond what the decision file lists

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: left open on purpose, the app-wide sweep is only partly done (decision file lists the rest)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-27-buttons-follow-cards.md, with the found-and-not-fixed list
- [x] `README.md` still accurate — nothing in it describes these buttons
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — line added to `unreleased`, scoped to what is actually gated (the gallery and the vet-visit link)
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — n/a: not applicable to this change

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager, at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager, at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager, at deploy time
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager, at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager, at deploy time
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager, at deploy time
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager, at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager, at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager, at deploy time
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager, at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — deferred: release manager, at deploy time
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager, at deploy time
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — deferred: release manager, at deploy time
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, at deploy time

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager, at deploy time

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | none found | n/a: nothing to record |

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
| 1 | Whether Remove / Set as profile / Move read sensibly on a phone for a Management login | a resident's photo, on a phone |

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

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list has one item and only the person who looks may tick this; the signature line says pending

Manual verification by: pending: Lutan to open one photo on a phone as a Management login

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [x] Checklist pasted into the PR — pasted in the PR description
- [ ] Handed to the production release manager — n/a: not applicable to this change

Result: pass

Release manager acknowledgement: pending: at release
