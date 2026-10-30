## Header

| | |
|---|---|
| Feature | Assistant version 2 scoping (a plan, seven streams) |
| Backlog item | `docs/backlog.md` → Assistant → In-app chat assistant that does things (LLM version 2) |
| Branch / worktree | claude/assistant-v2-scoping in the assistant-v2-scoping worktree |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | the PR for this branch |
| Tested by / date | Claude, 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | e2d48793 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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
- [x] `node scripts/gates.mjs` run; closing lines pasted below
- [ ] CI green on the PR (runs the same three). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on main, and no other in-flight branch carries — n/a: no code changed, this PR is a plan and a decision file only
- [ ] node scripts/apply-migrations.mjs --status reviewed before applying — n/a: no code changed, this PR is a plan and a decision file only
- [ ] node scripts/apply-migrations.mjs --dry-run reviewed — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Applied to dev (qxkmhwybjggxvsfxsxbd) and recorded in schema_migrations — n/a: no code changed, this PR is a plan and a decision file only
- [ ] File is re-runnable (if not exists / or replace / drop … if exists) — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Constraints and defaults exercised against real rows in a begin; … rollback; harness — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no code changed, this PR is a plan and a decision file only

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Data persists — reload the page and the change is still there — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no code changed, this PR is a plan and a decision file only

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

- [ ] Every role above tested — n/a: no code changed, this PR is a plan and a decision file only
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no code changed, this PR is a plan and a decision file only

## 5. Cross-cutting

- [ ] Nav entry correct (src/app/NavLinks.tsx) — appears for the right roles, no dead links — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Manual updated (src/lib/manual/en.ts) and the topic reads correctly at /manual — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Translatable strings go through the translation path, checked at /management/translations — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Browser console clean — no errors or React warnings — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no code changed, this PR is a plan and a decision file only

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Any shared file touched (NavLinks.tsx, manual/en.ts, shared libs) checked from a secon — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Nothing merged from main during sync was broken by this branch — n/a: no code changed, this PR is a plan and a decision file only

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked, the build has not happened; the item's title was rewritten on the backlog branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] README.md still accurate — n/a: no code changed, this PR is a plan and a decision file only
- [ ] **Release notes.** — n/a: a plan, nothing a shelter user sees
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every claim about what exists was read from the files and `git log`

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of main at deploy time — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Deployed SHA matches the tested SHA — deploy.mjs prints both the target project and the  — n/a: no code changed, this PR is a plan and a decision file only

### On the deployed build

- [ ] Deployed to test: npm run deploy:test — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Smoke-tested on test.lannacare.org — the happy path works on the deployed Workers build, — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour. Workers run in — n/a: no code changed, this PR is a plan and a decision file only
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both s — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Evidence pasted into this plan is the tool's actual output, unedited. A hand-maintaine — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Public pages (/, /adopt, /our-work, /donate) re-checked after a cache purge or a 1 — n/a: no code changed, this PR is a plan and a decision file only

### Deploy safety

- [ ] deploy: production → Supabase project <ref> line read and the ref matches production — n/a: no code changed, this PR is a plan and a decision file only
- [ ] strip-baked-env: removed N env var(s) from the Worker bundle seen in the deploy output — — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no code changed, this PR is a plan and a decision file only

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production a — n/a: no code changed, this PR is a plan and a decision file only
- [ ] node scripts/apply-migrations.mjs --env production --dry-run run and clean — it executes — n/a: no code changed, this PR is a plan and a decision file only
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no code changed, this PR is a plan and a decision file only
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — n/a: no code changed, this PR is a plan and a decision file only

### Rollback

- [ ] Rollback position stated, including what it does not cover. Production is served by th — n/a: no code changed, this PR is a plan and a decision file only

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

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. the name —
confirmed in chat; line written by Claude at their request  Date, in yyyy-mm-dd form.
Three valid states:

- A name and a date — a person looked. The date is required here.
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

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing to look at, no UI or code changed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body carries the per-deliverable account instead
- [ ] Handed to the production release manager — n/a: nothing deploys from this PR

Result: pass

Release manager acknowledgement: n/a: nothing deploys from this PR

## Gates output

```
gates: typecheck=0 lint=0 test=0 build=0
```
