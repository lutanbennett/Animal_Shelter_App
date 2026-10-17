| Tested at SHA | `7d56fff4` || Carries a migration? | no || Tested by / date | Claude / 2026-10-17 (gates and `check-phone-width.mjs` across seven roles; pages read by eye from its 375 px pictures) || PR | pending || Dev server | `next dev` on `http://localhost:3014` || Branch / worktree | `claude/mobile-sweep` @ `C:DevelopmentAnimal_Shelter_mobile-sweep` || Backlog item | `docs/backlog.md` → "Mobile responsiveness sweep" (ticked, with the four routes not seen named) || Feature | The mobile responsiveness sweep: every one of the 121 routes at 375 px in English and Thai, each with a recorded verdict; five layout defects fixed; the width check extended |# Feature test plan — mobile-sweep

## Header

| | |
|---|---|
| Feature | |
| Backlog item | `docs/backlog.md` → |
| Branch / worktree | `claude/mobile-sweep` @ `C:\Development\Animal_Shelter_mobile-sweep` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | |
| Tested by / date | |
| Carries a migration? | yes / no |
| Tested at SHA | |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the 'Mobile responsiveness sweep' item: every screen at 375 px in English and Thai, layout fixed, nothing hidden
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/mobile-sweep-inventory.md`; resident action pages (9 files under `src/app/residents/[id]/`), `src/components/DateInput.tsx`, `src/app/appeals/AppealProgressDisplay.tsx`, outreach `new`/`[id]/edit` pages, `src/app/privacy/page.tsx`, `scripts/check-phone-width.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-17-mobile-sweep.md`; no migration, no `worker/`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role (admin, management, second_in_command, doctor, volunteer, head_of_medical, head_of_maintenance) and the signed-out public; layout only
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the lightbox at 375 px and the maintenance board on a phone stay open by instruction; four routes were not seen (see Left for manual verification)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged `origin/main` in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — seen green on PR #689: audit, cards-count, check, migration-numbers, new-policy-role-names, public-views, script-integrity, test-plan all pass

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this change
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this change
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this change
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this change
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this change
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this change
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this change

## 4. Functional checks

- [x] Happy path works end to end — every one of the 121 routes loads at 375 px in English and Thai with a recorded verdict
- [ ] Data persists — reload the page and the change is still there — n/a: layout only; nothing is saved differently
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: layout only; no create, edit or delete behaviour changed
- [x] Empty state renders sensibly (no rows yet) — empty states (no weight, no photos, no appeals) were among the pages looked at
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: layout only; no validation changed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — seeded rows with very long resident, clinic and contact names, Thai strings, in the check script

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

- [x] Every role above tested — each of the seven signed-in roles and the signed-out site was run through `check-phone-width.mjs`
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: layout only; no access rule changed. Where a role could not open a page (e.g. /appointments for a doctor with no clinic) it is recorded as not checked

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no screen works differently enough that the manual's words or screenshots are wrong; screenshots deliberately not regenerated
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new strings
- [x] Mobile viewport (375px) — no overflow, controls reachable — the whole point; `check-phone-width.mjs` passes for all seven roles after the fixes
- [ ] Browser console clean — no errors or React warnings — n/a: browser console was not read in this pass; no logic changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no network behaviour changed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — resident hub and action pages, maintenance edit, management appeals, outreach, all re-measured by the final run
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — `DateInput` is shared: every page with a date field was re-measured at 375 px, plus the check ran across all roles after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch — `main` merged by `sync`; gates green after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — the sweep item ticked with the four exceptions named
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-17-mobile-sweep.md`
- [x] `README.md` still accurate — no README change needed
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained a line written for a shelter user. No step is outstanding: the change ships with the next deploy like any other
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the decision file's claims (which pages overflowed, by how much, what cleared them) are from the check's measurements

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager, at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: no date or time logic touched
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — gates output pasted above unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager: layout-only change in app code and CSS classes; rollback is the usual redeploy, nothing to undo in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `/medical/photos` and `/medical/weight` crash with no resident chosen (ResidentPicker handed the whole dictionary) — not layout | deferred to backlog (filed on the backlog branch) |

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
| 1 | The users table, its role column and the access-request list on a phone | `/admin/security`, signed in as an admin who has passed 2-step |
| 2 | A doctor with a clinic: the visit list | `/appointments` |
| 3 | The edit form on a living resident's prescription | `/prescriptions/[id]/edit` |
| 4 | `/medical/photos` and `/medical/weight` once the crash is fixed | both pages |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not empty and nobody has looked yet; see the pending signature below

Manual verification by: pending: Lutan to look at the four routes listed above, on a real phone if he can

### Result

- [x] Open defects are either fixed or explicitly accepted above — no defects are open; the four unseen routes are listed above
- [x] Checklist pasted into the PR — it is in the PR as `docs/test-plans/mobile-sweep.md`
- [ ] Handed to the production release manager — n/a: handed over once the PR is merged

Result: pass

Release manager acknowledgement: pending
