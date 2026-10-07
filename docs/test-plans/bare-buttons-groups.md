# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed) or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Last three groups of bare buttons under 44 px: My tasks, photo lightbox, Units panel, account menu |
| Backlog item | `docs/backlog.md` → Mobile: "Bare `<button>`s under 44 px on phones" (left open, status note added) |
| Branch / worktree | `claude/bare-buttons-groups` @ `C:\Development\Animal_Shelter_bare-buttons-groups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | linked from the PR itself |
| Tested by / date | Claude (bare-buttons-groups session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `09ad29e5` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — My tasks Undo/Skip/Add note/Done, the photo lightbox buttons, the Units panel buttons and the account-menu button moved onto the shared 44 px button
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/my/MyTaskList.tsx`, `src/components/PhotoGallery.tsx`, `src/components/UnitsPanel.tsx`, `src/app/AccountMenu.tsx`, `src/components/ActionButton.tsx` (new `success` variant), `src/lib/releases.ts`, `docs/backlog.md`, a decision file. No route, `worker/` or migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: everyone on a phone; My tasks is volunteers, staff and managers; the lightbox is anyone who opens a resident's photos; Units is management
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the tabs and filter chips the check still notes (ruled not actions, decision file), ~80 unread files with a raw button, the header buttons #413 settled

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged; one conflict in `src/lib/releases.ts` because main cut a release, resolved so `unreleased` holds only this PR's line
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this stream
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration on this stream
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration on this stream
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration on this stream
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration on this stream
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this stream
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration on this stream

## 4. Functional checks

- [x] Happy path works end to end — `check-phone-width.mjs` (en; staff, admin, management) exits 0 and every shared action is at least 44 px; note count staff 5, admin+management 17 and the account menu gone from them. Not clicked through by hand: My tasks Done/Skip and the lightbox actions run unchanged handlers
- [ ] Data persists — reload the page and the change is still there — n/a: no data change; only element and class changes, same handlers
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: handlers are untouched; nothing was exercised by hand
- [ ] Empty state renders sensibly (no rows yet) — n/a: no empty-state code changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: class changes only

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

- [ ] Every role above tested — n/a: no access change; the 375 px check ran as staff, admin and management
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no behaviour or label changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no label touched; existing dictionary keys reused
- [x] Mobile viewport (375px) — no overflow, controls reachable — the 375 px check: no page scrolls sideways, every component action 44 px. The photo lightbox is not reachable by the check (see manual list)
- [ ] Browser console clean — no errors or React warnings — n/a: not inspected
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not inspected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures` and 31 other staff pages, plus admin and management pages, loaded by the check
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — `ActionButton.tsx` (one added variant) is used on the other pages the check loaded; all measured at 44 px
- [x] Nothing merged from `main` during `sync` was broken by this branch — post-merge typecheck, lint and build all 0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the item stays open: lightbox look and ~80 unread files remain; a status note was added instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-07-bare-buttons-groups.md`
- [x] `README.md` still accurate — nothing in it concerns these buttons
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — one line in `unreleased`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — sizes are from the check's measurements

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: no migration, no date logic, no public page touched
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no migration, no date logic, no public page touched
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — n/a: no migration, no date logic, no public page touched
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: no migration, no date logic, no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration, no date logic, no public page touched
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration, no date logic, no public page touched
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration, no date logic, no public page touched
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration, no date logic, no public page touched

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Account menu, resident tabs, Cashflow and Website filter tabs still note under 44 px | tabs ruled chips, account menu fixed |

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
| 1 | Open a photo, then Remove photo, and Set as profile / Move: buttons stack, each is easy to tap, nothing runs off the 375 px dialog. The 44 px check cannot open the lightbox | A resident → Photos, on a phone |
| 2 | My tasks: Add note, Skip, Done and Undo wrap sensibly and still do their job | /my on a phone |

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

Automated checks by: Claude (bare-buttons-groups session)  Date: 2026-10-07

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked. Not signed: pending.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: the photo lightbox at 375 px, My tasks on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links to this file on the branch instead of pasting it
- [ ] Handed to the production release manager — n/a: not yet; the release manager reads it before deploy

Result: pass

Release manager acknowledgement: pending
