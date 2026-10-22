# Feature test plan: planner-handover-303

## Header

| | |
|---|---|
| Feature | Planner handover edition `303`, plus three production-conduct rules promoted into the `plan-day` skill (step 7) from a live calendar incident on 2026-10-22 |
| Backlog item | `docs/backlog.md` → none. The handover is the planner loop's own paperwork (skill step 8), not a backlog item; the findings it records were filed as their own items on the `backlog` branch |
| Branch / worktree | `claude/planner-handover-303` @ `C:\Development\Animal_Shelter_planner-handover-303` |
| Dev server | not started — documentation only, nothing to render (port 3010 if ever needed) |
| PR | opened from this branch after this plan passes the checker |
| Tested by / date | Claude (planner session) / 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | `4d5baa4a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the header says it, and it matches skill step 8
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/planner-handover.md`, `.claude/skills/plan-day/SKILL.md`, `docs/test-plans/planner-handover-303.md`. No `src/`, no `worker/`, no migration
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none — no shelter user or role can see any of this; it is read by the next planner chat
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the calendar incident's remaining fault (whether the Pi's app process holds the four calendar env values) is NOT fixed here and cannot be — reading it is refused to Claude as a production read. The handover records it as Lutan's and stops

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `origin/main` merged in: already up to date; `worktree.mjs sync` then pushed the branch
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — see the pasted output below
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 128s

gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Data persists — reload the page and the change is still there — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

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

- [ ] Every role above tested — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no pages — but `node scripts/gates.mjs` builds the whole app and exits 0, which is the available equivalent
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared app file touched. The one shared file in this PR is the `plan-day` skill, and the equivalent check was done by reading its two neighbouring blocks for contradictions — which is how the stale CI instruction was found
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` was already up to date; gates clean afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: this PR has no backlog item. The handover is the planner loop's own paperwork (skill step 8), and the round's nine backlog ticks landed in their own streams' PRs (#828–#837)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — the choice in this PR is *what to promote into the skill and what to leave in the handover*, and skill step 8 is where that reasoning belongs by design. The calendar incident's own design decisions were recorded by the stream that fixed it (`docs/decisions/2026-10-22-calendar-event-environment-tag.md`), not here
- [x] `README.md` still accurate — unaffected: it describes the app, not the planner loop
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", roles: [...] }`, because a plain string is shown to every live role, including ones who cannot open the page. You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: nobody using the shelter app can see any of this. It is the planner loop's own handover and skill; no page, component, manual topic, dictionary or Worker file is touched, so there is no shelter-user change to describe
- [x] Commit messages say why, not just what — one commit for the document and the skill, saying what the round measured and why the three conduct rules were promoted rather than left in the handover, plus this plan's own commit
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — every figure in the handover was read from a tool this session: six `get_usage` readings (the three batch-3 streams are still running), `check-menu-coverage.mjs` for the gate, `apply-migrations.mjs --status` for `0247` being applied, the Google Calendar API for the five production events and their creation times, two Supabase Management API reads for the seven cancelled visits and the six queued bookings, and `wc -l` for this document's own length (162). **And one figure is deliberately absent: the model and effort each stream ran on were NOT read, because every session was idle by the time `/plan-day` ran — the handover says so rather than inferring them from what was recommended**

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | The planner deleted four events from the **production** calendar behind a guard that read `extendedProperties.private.visitId`, while the code matches on `clinic_visits.calendar_event_id` — and told Lutan nothing would be cancelled or emailed. A cancellation email followed. | fixed — rule 1 of the new step 7 block requires naming and quoting the field the code reads before a destructive step |
| 2 | Medium | "Verified identical" was restated as current forty minutes after the reading, by which time a stream had separated the two calendar ids as instructed. | fixed — rule 2: a measurement is reported with its clock and re-read before being relied on |
| 3 | Medium | Lutan was told the calendar was safe to work in, with no mention of the quarter-hourly sweep; he added six appointments, saw none appear, and reported the feature broken. | fixed — rule 3: state the visible latency whenever you say a feature works |
| 4 | Low | The dials (model/effort) were not read for any of six merged streams, so the round yields no model finding. | accepted this round, and recorded in the handover as the thing to sequence differently: read the dial while the session is live |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
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
| 1 | Nothing. The deliverable is a document and a skill file; no page, no deployed behaviour, no surface a person has to look at. | — |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [ ] Everything in this checklist that could be verified without human eyes was run, not assumed — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Nothing is ticked that was not actually executed — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
Three valid states:

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

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — the manual list is empty — there is nothing for a person to look at in a planner document, so nothing is being signed for (this line's own note permits the filler to tick it in that case)

Manual verification by: n/a: nothing for a person to look at — no UI, no page, no deployed behaviour; the document is the deliverable and the checker validates its shape

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Checklist pasted into the PR — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface
- [ ] Handed to the production release manager — n/a: this PR changes only `docs/planner-handover.md`, the `plan-day` skill and this plan — no `src/`, no `worker/`, no migration, no UI surface

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches production or a release; the handover is merged by the planner on green CI per `CLAUDE.md`
