# Feature test plan: video-upload-fault

## Header

| | |
|---|---|
| Feature | Video upload failures name the step that failed |
| Backlog item | `docs/backlog.md` → ADDING A VIDEO TO AN ADOPTION UPDATE FAILS (retitled, still open: cause not found) |
| Branch / worktree | `claude/video-upload-fault` @ `C:DevelopmentAnimal_Shelter_video-upload-fault` |
| Dev server | `http://localhost:3002` |
| PR | see the PR |
| Tested by / date | Claude, 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | 7c21f43c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all four
gates (typecheck, lint, test, build) even when one fails, prints each one's own exit code, and refuses to start
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
- [x] `node scripts/gates.mjs` ends with one line of the shape `ga — four gates, run in this worktree after sync:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 103s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 289s
=== gates: test — npm test
=== gates: test exited 0 after 29s
=== gates: build — npm run build
=== gates: build exited 0 after 229s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this change
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this change
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this change
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this change
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAU — n/a: no migration in this change
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this change
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this change

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: see the Defects and Left tables; dev drove start, Drive and finish, but the failing cases (a 4xx from Drive, a dropped connection) were not forced on dev
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: see the Defects and Left tables; dev drove start, Drive and finish, but the failing cases (a 4xx from Drive, a dropped connection) were not forced on dev
- [ ] Empty state renders sensibly (no rows yet) — n/a: see the Defects and Left tables; dev drove start, Drive and finish, but the failing cases (a 4xx from Drive, a dropped connection) were not forced on dev
- [x] Invalid input is rejected with a readable message, not a crash
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: see the Defects and Left tables; dev drove start, Drive and finish, but the failing cases (a 4xx from Drive, a dropped connection) were not forced on dev

### Role access matrix

Sign in as each login that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*): roles are
a transient grouping of cards and get rebuilt, so a row naming one stops being true. Test a
login holding exactly the card under test (`node scripts/dev-signin.mjs --cards <card> --port <yours>`,
card keys, not activity names), plus admin (outside the card system) and signed out. Where a page
needs two cards together, put both on one row. Do not name `staff` (retired, `0173`) or `resident`
(not a role: a resident is an animal). Read card keys from `/admin/who-does-what`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| exactly `<card key>` | | | |
| exactly `<card key>` | | | |
| signed out | | | |

- [ ] Every login above tested — n/a: see the Defects and Left tables; dev drove start, Drive and finish, but the failing cases (a 4xx from Drive, a dropped connection) were not forced on dev
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: see the Defects and Left tables; dev drove start, Drive and finish, but the failing cases (a 4xx from Drive, a dropped connection) were not forced on dev

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: not applicable: no page, nav or manual change; strings go through the dictionary and are in both en and th
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not applicable: no page, nav or manual change; strings go through the dictionary and are in both en and th
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: not applicable: no page, nav or manual change; strings go through the dictionary and are in both en and th
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not applicable: no page, nav or manual change; strings go through the dictionary and are in both en and th
- [x] Browser console clean — no errors or React warnings
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not applicable: no page, nav or manual change; strings go through the dictionary and are in both en and th

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not applicable: only the video uploader's messages changed
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loadi — n/a: not applicable: only the video uploader's messages changed
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: not applicable: only the video uploader's messages changed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If n Added a line in `unreleased`.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do  — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so any — deferred: release manager at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not onl — deferred: release manager at deploy time
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose ab — deferred: release manager at deploy time
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolv — deferred: release manager at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still c — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the  — deferred: release manager at deploy time
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…ro — deferred: release manager at deploy time
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns d — deferred: release manager at deploy time
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy time

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./sc — deferred: release manager at deploy time

## Defects found

| 1 | medium | The original fault (Lutan's .MOV) did not reproduce on dev, so the cause is unfixed. The message now names the step. | deferred to backlog (item retitled) |

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

| 1 | Lutan adds the same .MOV to an adoption update on the deployed build and reads which sentence appears (and the browser console line) | test.lannacare.org / production |
| 2 | The Thai wording of the four new messages reads naturally | adoption update form, Thai language |

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

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, only the person who looked may tick it

Manual verification by: pending: Lutan reproducing the upload on his own screen, and a Thai reader on the new wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the PR merges on green; the release manager reads it at release time

Result: pass with accepted defects

Release manager acknowledgement: n/a: acknowledged at release time
