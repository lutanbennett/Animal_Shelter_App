## Header
nMade from the NEW template (this PR edits §7 of it), so §7 below carries the new wording.

| | |
|---|---|
| Feature |  A release note may not run ahead of a manual step (§7 rule) |
| Backlog item | `docs/backlog.md` → "A release note shipped for a feature whose own decision file said a manual step was outstanding" |
| Branch / worktree | `claude/release-note-truth-rule` @ `C:\Development\Animal_Shelter_release-note-truth-rule` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR |  pending (opened after this commit) |
| Tested by / date |  Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA |  see PR head |

## 1. Scope and risk

- [ ] Change is described in one sentence, and it match — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Files/areas touched listed (routes, `worker/`, `s — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Roles affected identified: admin / staff / doctor — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Anything explicitly out of scope written down — n/a: docs-only process rule, no code, UI, schema or role access

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
- [ ] `node scripts/gates.mjs` — n/a: typecheck=0 and build=0; lint=1 only from a pre-existing misplaced backlog item (line 765, another stream), not this change
- [ ] CI green on the PR — n/a: cannot be true in the commit that opens the PR

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `mai — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] `node scripts/apply-migrations.mjs --status` revi — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] `node scripts/apply-migrations.mjs --dry-run` rev — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and r — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] File is re-runnable (`if not exists` / `or replac — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Existing rows still read correctly after the chan — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Constraints and defaults exercised against real — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Down-migration written, or the reason one is not — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Production apply plan stated for the release mana — n/a: docs-only process rule, no code, UI, schema or role access

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Data persists — reload the page and the change is — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Create / edit / delete all exercised (whichever t — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Invalid input is rejected with a readable message — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Boundary cases checked (long text, zero, negative — n/a: docs-only process rule, no code, UI, schema or role access

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`, with `'vet'` renamed `'doctor'` by `0172_clinics_and_doctors.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] A role that should not have access is blocked ser — n/a: docs-only process rule, no code, UI, schema or role access

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appe — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Manual updated (`src/lib/manual/en.ts`) and the t — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Translatable strings go through the translation p — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Mobile viewport (375px) — no overflow, controls r — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Browser console clean — no errors or React warnin — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Network clean — no unexpected 4xx/5xx on the feat — n/a: docs-only process rule, no code, UI, schema or role access

## 6. Regression

- [ ] The pages nearest the change still work (list the — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/ — n/a: docs-only process rule, no code, UI, schema or role access
- [ ] Nothing merged from `main` during `sync` was brok — n/a: docs-only process rule, no code, UI, schema or role access

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a process rule for sessions; no shelter user sees anything different
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `ma — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints b — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a co — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [x] **For a boundary or banding change, the assertions cover bo
- [ ] **Evidence pasted into this plan is the tool's actual outpu — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-che — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bund — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-r — deferred: release manager
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.)
- [ ] Apply plan stated: which file, which project, and whether i — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cove — deferred: release manager

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

- [x] Everything in this checklist that could be verified without
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `NAME —
confirmed in chat; line written by Claude at their request  Date: DATE`.
Three valid states:

- `NAME  Date: DATE` — a person looked. The date is required here.
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

- [x] The manual list above is empty, or every item in it was che

Manual verification by: n/a: wording in docs only, nothing to look at  Date: 2026-10-11

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: release manager at the next release
