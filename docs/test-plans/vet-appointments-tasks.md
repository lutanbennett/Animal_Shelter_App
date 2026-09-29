# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Vet Appointments page: a vet's home is the clinic's visits, with record forms pre-linked; vets leave My tasks |
| Backlog item | `docs/backlog.md` → "A vet's work comes from their appointments: My tasks and the menu built around vet visits" |
| Branch / worktree | `claude/vet-appointments-tasks` @ `C:\Development\Animal_Shelter_vet-appointments-tasks` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | `d78d633` (gates run at this SHA; the plan and release/manual edits are all before it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a vet's home is a new `/appointments` page listing the clinic's visits with pre-linked record forms; vets lose My tasks (Lutan's steer, 2026-09-29, in `docs/decisions/2026-09-29-vet-appointments-page.md`)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/appointments/page.tsx`, `src/lib/vets/appointments.ts`, `NavLinks.tsx`, `my/page.tsx` (vet redirect), `no-access/page.tsx`, `app-access.ts`, `next-path.ts`, `hub-icons.ts`, both i18n dictionaries, `manual/en.ts`, `releases.ts`; no migration, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — vet (new page, new home, no My tasks); admin, management, staff and volunteer unchanged; signed out unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — a My tasks section for appointment follow-ups (Lutan chose a separate page); marking a visit done from the list (Edit is one click away); the vet visit form (next batch, on this shape); any RLS change, since 0108 and 0110 are consumed as they are

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged `origin/main`: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — see the pasted lines below
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 956s

gates: typecheck=0 lint=0 build=0
```

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

- [ ] Happy path works end to end — n/a: not driven: no vet account is available to this session and creating one is not something Claude does; left for manual verification row 1
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page; nothing is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only page; the forms it links to are unchanged
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven with a vet session; each of the three groups and the unlinked-clinic case has its own message in the code; left for manual verification row 1
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input on the page
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not driven; the To write up and Upcoming split uses the shelter-date `visitDate` and `todayIso` that the resident hub already uses; left for manual verification row 2

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
| admin | all shelter pages, My tasks | unchanged | not driven; only `/my` was edited and it still renders for a non-vet |
| management | as admin | unchanged | not driven; same `isShelter` branch |
| staff | as admin | unchanged | not driven; same `isShelter` branch |
| vet | `/appointments`, Residents | menu Appointments and Residents; `/my` redirects to `/appointments`; sign-in lands on `/appointments` | not driven (no vet account in this session); left for manual verification |
| volunteer | as admin | unchanged | not driven; same `isShelter` branch |
| signed out | nothing | `/appointments` goes to `/login` | not driven at the browser; the proxy gate is unchanged and `/appointments` is not a public path |

- [ ] Every role above tested — n/a: only signed out was driven; vet needs a vet account, and the other roles are unchanged in code, sharing the `isShelter` branch
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: signed out was driven; for signed-in non-vets the page calls `requireRole` with a vet-only test, which refuses to `/no-access`, but that was read from the code and not driven

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: read from `NavLinks.tsx` (shelter roles keep My tasks, a vet gets Appointments) but not viewed signed in as a vet; left for manual verification row 1
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: edited (new vet-only Appointments section, vet My tasks topic removed, menu sentences corrected) but `/manual` was not opened signed in; the build parses it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the page's strings are dictionary keys in en.ts and th.ts like the rest of the app; the translations screen manages only public text
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven; single-column list with wrapping links; left for manual verification row 3
- [ ] Browser console clean — no errors or React warnings — n/a: not driven with a vet session; left for manual verification row 1
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven with a vet session; left for manual verification row 1

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: `/my` and `/no-access` were edited but could not be loaded as a vet; left for manual verification row 1
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: `NavLinks.tsx`, `app-access.ts` and `manual/en.ts` were edited but no signed-in page could be loaded in this session; gates cover compilation only
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: `sync` reported already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked, with a pointer to the decisions file
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-09-29-vet-appointments-page.md`, including Lutan's answers to the two open questions
- [ ] `README.md` still accurate — n/a: the README does not describe a vet's menu or landing page
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained a vet line
- [x] Commit messages say why, not just what — the first commit records Lutan's steer; the rest are docs
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the acceptance (5) claim is stated in the decision as read from code (no form or action filters on status), not driven with two sessions

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager — the To write up boundary is Bangkok midnight via the existing `visitDate`; no fixed-instant test was written for the new partition
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: the boundaries here are date-passed vs today-or-later and the 30-day window; neither was asserted at both edges, which is why the timezone line above is deferred
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the gates lines are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. `npx wrangler rollback --env production` reverts the Worker in seconds; it does **not** revert migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager — code only, so `wrangler rollback` covers it; no migration to leave behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

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
| 1 | Signed in as a vet with a clinic set: sign-in lands on Appointments; the menu is Appointments and Residents; /my redirects to it; the three groups show the clinic's visits; each row opens Log procedure, Log blood test, Add prescription, Log weight and Edit with the visit preselected. A vet with no clinic sees the explanation. Console and network clean | /appointments as a vet |
| 2 | Acceptance (5): open Log procedure from a row, have someone mark that visit completed in a second session, then save — the procedure saves and is linked to the visit. Also a visit dated yesterday sits under To write up and one later today under Upcoming | /appointments and /vet-visits/[id]/edit in a second session |
| 3 | Phone width (375px): rows wrap without overflow; look and feel of the page | /appointments on a phone |

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

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so it is left for the person who looks

Manual verification by: pending: a vet signing in and using /appointments (rows 1-3 above), including the mark-done-while-writing-up case

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
