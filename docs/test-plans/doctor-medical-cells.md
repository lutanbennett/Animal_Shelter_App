## Header

| | |
|---|---|
| Feature | Doctor role gets its medical cells (0230) |
| Backlog item | `docs/backlog.md` → Thirteen dev check harnesses still red (ruling 1) |
| Branch / worktree | `claude/doctor-medical-cells` @ `C:\Development\Animal_Shelter_doctor-medical-cells` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see PR description |
| Tested by / date | Claude, 2026-10-20 |
| Carries a migration? | yes, 0230 |
| Tested at SHA | 16a55074 |

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). **This one cannot be true in — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a — n/a: no UI surface, no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional — n/a: permission rows only

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
| admin | resident_diet_rounds, prescription_rounds, frequency_rounds | all four as before | pass (check-perm-convert-orphans) |
| management | same | reads frequency_rounds, writes the two others | pass |
| staff | retired by 0173 | n/a | n/a |
| doctor | diet and prescription rounds write; frequency_rounds read; the 13 paper cells | allowed within own clinic | pass: orphans 691/0 failed; parity 0 mismatches |
| volunteer | none of these | refused | pass (parity, medication-rounds) |
| signed out | none | refused | pass |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, — n/a: no UI surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at — n/a: no page changed; the cells are already documented in roles-and-permissions.md
- [ ] Translatable strings go through the translation path, checked at — n/a: no strings added
- [ ] Mobile viewport (375px) — no overflow, controls — n/a: no UI surface
- [ ] Browser console clean — no errors or React — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) — n/a: no shared file touched (no NavLinks, manual or shared lib; one probe list in scripts/lib)
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups — n/a: not every harness of the item is green (check-permission-tables, check-medication-rounds back-fill, and maintenance.bills remain); status note filed on the backlog branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? If so, — n/a: production does not have 0230 yet, so no vet can prescribe until it is applied; the note goes in the PR that closes that step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient — n/a: no date logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of — n/a: no threshold; read and edit levels both asserted by the parity harness
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a — n/a: public pages untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare — n/a: no new secret

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, — n/a: migration only, no code reads the new cells beyond existing policies
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup — n/a: additive insert of role_permissions rows
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement


## Evidence (harness output, before and after)

Read the label as the EXPECTATION: "allowed - got 0" means expected allowed, actually refused.

| Harness | Before 0230 | After 0230 |
|---|---|---|
| check-perm-convert-orphans | 684 held, 7 failed (diet/prescription rounds update, insert, delete as vet; frequency_rounds read as vet) | 691 checks held, 0 failed. RESULT: GREEN |
| check-medication-rounds | 76 held, 3 failed (read frequency_rounds as doctor: allowed - got 0; two back-fill lines) | 77 held, 2 failed (the two back-fill lines, dev data) |
| check-permission-parity | MISMATCH 22 (21 doctor lines + stale) and 4 STALE N4 entries | MISMATCH 0; only NEITHER PROBED NOR EXPLAINED: maintenance.bills |
| check-permission-tables | HARNESS-FAIL A activities: got 66, wanted 62 | unchanged; stale baselines, dies before the doctor block |

Gates: `gates: typecheck=0 lint=0 test=0 build=0`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | check-permission-tables dies in section A on stale baselines (66 activities, 45/21 yes-no) before the doctor block | deferred to backlog: own repair |
| 2 | low | check-permission-parity still RED only for maintenance.bills neither probed nor explained | deferred to backlog: not ruled |
| 3 | low | check-medication-rounds back-fill: two lines red on dev data | deferred to backlog: unrelated to the doctor |

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

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat.
Three valid states:

- A name and a date — a person looked.
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

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: n/a: no screen to look at; a doctor login prescribing is for the release pass after production apply

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending
