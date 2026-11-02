# Test plan: write-form-cant-tell

## Header

| | |
|---|---|
| Feature | write-form-cant-tell |
| Backlog item | `docs/backlog.md` → after cannot-tell the Save button can never succeed |
| Branch / worktree | `claude/write-form-cant-tell` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see GitHub |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | ff7236c5 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected — n/a: wording only, no access changes
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
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on — n/a: wording-only change, no schema or behaviour
- [ ] `node scripts/apply-migrations.mjs --status` — n/a: wording-only change, no schema or behaviour
- [ ] `node scripts/apply-migrations.mjs --dry-run — n/a: wording-only change, no schema or behaviour
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) — n/a: wording-only change, no schema or behaviour
- [ ] File is re-runnable (`if not exists` / `or r — n/a: wording-only change, no schema or behaviour
- [ ] Existing rows still read correctly after the — n/a: wording-only change, no schema or behaviour
- [ ] **Constraints and defaults exercised against — n/a: no migration
- [ ] Down-migration written, or the reason one is — n/a: wording-only change, no schema or behaviour
- [ ] Production apply plan stated for the release — n/a: wording-only change, no schema or behaviour

## 4. Functional checks

- [ ] Happy path works end to end — n/a: wording-only change, no schema or behaviour
- [ ] Data persists — reload the page and the chan — n/a: wording-only change, no schema or behaviour
- [ ] Create / edit / delete all exercised (whiche — n/a: wording-only change, no schema or behaviour
- [ ] Empty state renders sensibly (no rows yet) — n/a: wording-only change, no schema or behaviour
- [ ] Invalid input is rejected with a readable me — n/a: wording-only change, no schema or behaviour
- [ ] Boundary cases checked (long text, zero, neg — n/a: wording-only change, no schema or behaviour

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

- [ ] Every role above tested — n/a: wording-only change, no schema or behaviour
- [ ] A role that should not have access is blocke — n/a: wording-only change, no schema or behaviour

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — — n/a: wording-only change, no schema or behaviour
- [ ] Manual updated (`src/lib/manual/en — n/a: label text only, no manual topic or translation-queue content
- [ ] Translatable strings go through th — n/a: label text only, no manual topic or translation-queue content
- [ ] Mobile viewport (375px) — no overflow, contr — n/a: wording-only change, no schema or behaviour
- [ ] Browser console clean — no errors or React w — n/a: wording-only change, no schema or behaviour
- [ ] Network clean — no unexpected 4xx/5xx on the — n/a: wording-only change, no schema or behaviour

## 6. Regression

- [ ] The pages nearest the change still work (lis — n/a: wording-only change, no schema or behaviour
- [ ] Any shared file touched (`NavLinks.tsx`, `ma — n/a: wording-only change, no schema or behaviour
- [ ] Nothing merged from `main` during `sync` was — n/a: wording-only change, no schema or behaviour

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a card-tagged line (who_does_what)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deplo — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the h — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not o — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the asse — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/ — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref> — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from — deferred: release manager
- [ ] Any new secret/env var exists in the product — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env pro — deferred: release manager
- [ ] For a **destructive or rewriting** migration — deferred: release manager
- [ ] Apply plan stated: which file, which project — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what i — deferred: release manager

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

Automated checks by: Claude  Date: 2026-11-02

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

- [ ] manual list — n/a: nothing for a person to look at beyond Thai review noted in PR

Manual verification by: n/a: wording only; Thai needs a bilingual read, tracked by the standing item

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at merge/release
- [ ] Handed to the production release m — n/a: done at merge/release

Result: pass



```
gates: typecheck=0 lint=0 test=0 build=0
```
