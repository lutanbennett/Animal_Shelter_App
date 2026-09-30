| volunteer | `/admin/website` | redirected by `requireAdminUser` | not re-tested, guard unchanged || vet | `/admin/website` | redirected by `requireAdminUser` | not re-tested, guard unchanged || staff | `/admin/website` | redirected by `requireAdminUser` | not re-tested, guard unchanged || management | `/admin/website` | redirected by `requireAdminUser` | not re-tested, guard unchanged |# Feature test plan

Filled from `docs/test-plan-template.md`.

---

## Header

| | |
|---|---|
| Feature | Settings → Website split into tabs, Pages as an accordion |
| Backlog item | `docs/backlog.md` → Settings → Website: break the page into tabs so it is manageable |
| Branch / worktree | `claude/website-settings-tabs` @ `C:DevelopmentAnimal_Shelter_website-settings-tabs` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | linked from the PR itself |
| Tested by / date | Claude (website-settings-tabs session), 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item: the page is five tabs (Home page, Contact & settings, Pages, Gallery, Our work) with a one-editor-at-a-time accordion inside Pages
- [x] Files/areas touched: `src/app/admin/website/{page,WebsiteTabs,PagesAccordion,SitePageForm}.tsx`, both i18n dictionaries, `manual/en.ts`, `releases.ts`. No `worker/`, no migration, no server actions changed
- [x] Roles affected: admin only (the page is behind `requireAdminUser`, unchanged)
- [x] Out of scope: the unsaved-changes prompt the backlog suggested (nothing is unmounted, so nothing is lost by switching); a Thai manual (none exists); the accordion-only alternative was not built

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (both sides added `unreleased` lines), resolved by keeping both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — re-run after the final sync; closing line below
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

- [x] Happy path works end to end: every tab opens; the Donate page row opened, edited and Saved (server action `updateSitePage("donate")` returned Saved)
- [x] Data persists — the save went through the unchanged server action and the page re-rendered with the row still open
- [x] Create / edit / delete: only edit exists on the page-editors and was exercised; hero, gallery and project removal are unchanged components, only their parent moved (checked present in their tab)
- [ ] Empty state renders sensibly (no rows yet) — n/a: the sections and their empty states are unchanged components
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no validation was touched; actions untouched
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input handling changed

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
| admin | `/admin/website` | all tabs, editors and saves | pass (dev, signed in as admin) |
| management | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| signed out | `/admin/website` | redirected to login | not re-tested, guard unchanged |

- [ ] Every role above tested — n/a: admin-only page, `requireAdminUser()` untouched
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: admin-only page, `requireAdminUser()` untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or moved
- [x] Manual updated (`src/lib/manual/en.ts`, The public website topic: tabs, Pages accordion and #deep links)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no free text stored; tab labels are dictionary strings, en and th added
- [x] Mobile viewport — the browser pane was at phone width (~590px): tab strip scrolls sideways, accordion rows wrap, no page overflow seen in the screenshot
- [x] Browser console clean — no errors read from the pane
- [x] Network clean — dev server log shows only 200s for the page and its POST

## 6. Regression

- [x] Nearest pages still work: `/admin/website` all five tabs loaded; other admin pages untouched
- [x] Shared files (`manual/en.ts`, `releases.ts`, both dictionaries) — the dictionaries are read by this page (tab labels, Thai missing, Edited) and by the whole app, which loaded fine as the page rendered after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates exit 0 on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Design choices in `docs/decisions/2026-09-30-website-settings-tabs.md`
- [ ] `README.md` still accurate — n/a: README does not describe the Website page layout
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — n/a: no timezone, concurrency or numeric claims were made

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager at deploy time
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager at deploy time
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback: revert the PR; no schema or data change, so nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A deep link `?tab=contact` painted the Home tab until hydration | fixed: `page.tsx` passes `?tab=` to the tabs so the first paint is right |

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
| 1 | Hero photo and gallery upload still work (and a failed upload says Photo storage is not connected); vet-visit estimate saves and still feeds the cashflow forecast; each Contact & settings field saves. These forms and actions are untouched, and were seen present in the right tab, but not each saved | Settings → Website, on dev |
| 2 | The Thai missing tag and the accordion read well on a real phone | Settings → Website → Pages |

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

Automated checks by: Claude (website-settings-tabs session)  Date: 2026-09-30

### Manual verification

The items in **Left for manual verification** above, for the person who looks.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: items 1 and 2 above need a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending

```
gates: typecheck=0 lint=0 build=0
```
