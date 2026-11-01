# Feature test plan — plan-day-skill-trim

## Header

| | |
|---|---|
| Feature | Trim the plan-day skill: cut passages a later one made redundant, fix the gates-timeout bug, add the automated-event condition |
| Backlog item | `docs/backlog.md` → **`.claude/skills/plan-day/SKILL.md` GREW BY 65 LINES IN ONE PR AND NOBODY OWNS TRIMMING IT** |
| Branch / worktree | `claude/plan-day-skill-trim` @ `C:\Development\Animal_Shelter_plan-day-skill-trim` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR list for `claude/plan-day-skill-trim` |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `8a1a7b8a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked  — one trimming pass over `.claude/skills/plan-day/SKILL.md`, plus the gates-timeout fix and the automated-event condition on starting sessions; matches the backlog item and the brief
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared li — `.claude/skills/plan-day/SKILL.md`, `docs/backlog.md` (tick), this plan
- [x] Roles affected identified — none; the file is read by the planner session only
- [x] Anything explicitly **out of scope** written down, so the release manager is not — `CLAUDE.md`, `docs/planner-handover.md`, the other skills, `src/`, `scripts/`; no rule changed meaning

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — origin/main merged in cleanly before the gates
- [x] `node scripts/gates.mjs` ends `gates — exit codes read from the run, output to a scratchpad file:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 131s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 301s
=== gates: test — npm test
=== gates: test exited 0 after 24s
=== gates: build — npm run build
=== gates: build exited 0 after 368s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Data persists — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

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
| admin | n/a | docs-only, no page | n/a |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Mobile viewport (375px) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Browser console clean — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Network clean — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a secon — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on th — ticked on this branch, title rewritten to say it is done
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface (the PR body carries the cut and kept lists, which is the record)
- [ ] `README.md` still accurate — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/li — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [x] Commit messages say why, not just what — yes
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Deployed SHA matches the tested SHA — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintaine — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 1 — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

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
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty — n/a: docs-only change to the planner skill file, no UI, schema, role or deploy surface

Manual verification by: n/a: nothing to look at, a Markdown instruction file read only by the planner session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: no production surface; docs-only

Result: pass

Release manager acknowledgement: n/a: docs-only, no deploy
