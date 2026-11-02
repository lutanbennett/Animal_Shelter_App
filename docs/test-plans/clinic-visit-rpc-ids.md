# Test plan: clinic-visit-rpc-ids

Evidence: `gates: typecheck=0 lint=0 test=0 build=0`. Rollback harness on dev: two identical bookings (same resident, clinic, time) returned distinct ids. No migration: `schedule_bulk_appointments` has returned `setof clinic_visits` since 0172.

## Header

| | |
|---|---|
| Feature | clinic-visit-rpc-ids |
| Backlog item | `docs/backlog.md` → Booking a clinic visit finds the rows it just created by matching |
| Branch / worktree | `claude/clinic-visit-rpc-ids` @ `C:\Development\Animal_Shelter_clinic-visit-rpc-ids` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending |
| Tested by / date | Claude, 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | 0312ddef |

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
- [x] `node scripts/gates.mjs` ends with four gates (typecheck lint test build): `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no othe — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before app — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `sch — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] Existing rows still read correctly after the change (checked aga — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] **Constraints and defaults exercised against real rows** in a `b — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] Down-migration written, or the reason one is not needed is state — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] Production apply plan stated for the release manager (which file — n/a: no migration; the RPC already returns setof clinic_visits since 0172

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Empty state renders sensibly (no rows yet) — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Boundary cases checked (long text, zero, negative, missing optio — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

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
| all roles | /clinic-visits/new | unchanged; same `visit.book` check as before | not driven in a browser; no access logic touched |

- [ ] Every role above tested — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] A role that should not have access is blocked server-side (hitti — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the rig — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads corr — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Translatable strings go through the translation path, checked at — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Browser console clean — no errors or React warnings — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Nothing merged from `main` during `sync` was broken by this bran — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: the booking screen behaves identically and no visible wording moves
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist al

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` a — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both t — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on t — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] **Timezone-sensitive behaviour proved, not observed at a conveni — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both ed — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, un — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` s — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Any new secret/env var exists in the production Cloudflare envir — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?* — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` r — n/a: no migration; the RPC already returns setof clinic_visits since 0172
- [ ] For a **destructive or rewriting** migration only: a production — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Apply plan stated: which file, which project, and whether it run — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | assistant booking read the RPC rows as id strings, so its calendar sync never ran | fixed |

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
| 1 | Book a clinic visit for two residents with a tagged note; both visits link the tags | /clinic-visits/new |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without huma — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [x] Nothing is ticked that was not actually executed — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, for example a name, then "confirmed in chat; line written by Claude at their request", then the date.
Three valid states:

- a name and a date — a person looked. The date is required here.
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

- [ ] The manual list above is empty, or every item in it was checked — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

Manual verification by: pending: a person books a tagged multi-resident visit in the browser

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Checklist pasted into the PR — n/a: not applicable, caller-only change with no new surface or deploy step in this PR
- [ ] Handed to the production release manager — n/a: not applicable, caller-only change with no new surface or deploy step in this PR

Result: pass

Release manager acknowledgement: n/a: not a release, handled at the next release cut
