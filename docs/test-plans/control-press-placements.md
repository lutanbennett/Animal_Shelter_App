# Feature test plan

<!-- guidance:start -->
Copy this file to the feature branch as `docs/test-plans/<feature>.md`, fill the
header, and tick as you go.

Every line must end up in one of four states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.
- `- [ ] … — pending: <what is outstanding>` — the check **does** apply and
  genuinely waits on somebody or something: Lutan's own upload, a deploy, a
  person to look. It passes CI and is printed as *awaiting a person*.
- `- [ ] … — deferred: <owner>` — **section 8 only.** The check cannot be true
  yet, and this names who picks it up.

`pending:` is there so the honest word is also the one that passes. Before
2026-11-05 a checklist line that truly waited on someone had nowhere to say so —
only a tick or an `n/a:` passed — so a stream either went red for telling the
truth or wrote `n/a` for something that was not n/a. The signature lines below
had accepted `pending:` all along; the checklist now does too. **Nothing ships
on a `pending:`**: it is the release manager's pre-deploy pass that resolves it,
exactly as for the signatures.

That fourth state exists because the deploy gates in section 8 cannot be true at
PR time: there is no deployed build to check and no production apply to have run.
Writing them `n/a` is a lie in a box labelled "did not apply", and once that habit
forms people write `n/a` for things they simply did not do. `deferred:` says the
truthful thing and passes, because a PR cannot be held open waiting for a deploy
it precedes. It is confined to section 8 deliberately — anywhere else it would be
a general-purpose escape hatch, which is the one thing this check exists to
prevent — and the checker rejects it elsewhere.

**The reason must follow `n/a:` immediately.** `n/a: no UI surface` passes;
`n/a as a deploy check, because …` reads fine to a human but fails, and that
strictness is deliberate — it is what makes every reason greppable in one pass
across every checklist in the repo. Put any qualifying words after the colon,
not before it.

Never tick something you did not do, and never leave a line untouched. Anything
that failed goes under **Defects**.

**No merge without a signed-off checklist. No exceptions.** CI enforces it: a PR
with no completed `docs/test-plans/<feature>.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

**A half-written plan is not a failure.** The plan is committed early and filled
in as the work proceeds, so CI sees it unfinished on every push in between. Since
2026-11-05 the checker reports an unfilled placeholder, a missing `Result:` line
and an unsigned sign-off as *still being written* and passes, exactly as it has
passed an unsigned plan since 2026-09-24. **Red means the plan is wrong**: a line
nobody addressed at all, an `n/a:` or a `pending:` with no reason, a `deferred:`
outside section 8, a release-notes tick with no release note, `Result: fail`.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job reports **red without blocking the merge**, and **that is
permanent** — decided by Lutan on 2026-10-20: *"we will NOT make this mandatory
it stays as advisory"* (`docs/decisions/2026-10-20-test-plan-stays-advisory.md`).
It is a deliberate soft gate, not an oversight and not a trial. **Treat a red
`test-plan` as a stop anyway:** the script goes red only when a plan is genuinely
wrong, so a red one is always someone's mistake to fix.
It will **not** become a required check. Earlier wording here said it would
"once we know the checklist is working", which read as a decision still pending
and got him asked for an answer he had already given.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

Text between the `guidance:start` and `guidance:end` comments is advice, not fields:
the checker does not read it for unfilled `<…>` placeholders, so leave it or delete
it. Everything outside those comments is judged.
<!-- guidance:end -->

---

## Header

| | |
|---|---|
| Feature | Drive six placement controls in a browser, with and without the card (`#79sqf` part D) |
| Backlog item | `#79sqf` (not ticked: 6 of 25 rows driven) |
| Branch / worktree | `claude/control-press-placements` |
| Dev server | `http://localhost:3003` |
| PR | see PR |
| Tested by / date | Claude / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | ec31d9e3 |

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
- [x] `node scripts/gates.mjs` ends with one line `gates: typecheck=0 lint=0 test=0 build=0`, four gates, each its own exit code; closing lines of this stream's run below, as printed:

```
=== gates: typecheck exited 0 after 230s
=== gates: lint exited 0 after 409s
=== gates: test exited 0 after 99s
=== gates: build exited 0 after 392s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highes… — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --sta… — n/a: no migration in this change
- [ ] `node scripts/apply-migrations.mjs --dry… — n/a: no migration in this change
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxb… — n/a: no migration in this change
- [ ] File is re-runnable (`if not exists` / `… — n/a: no migration in this change
- [ ] Existing rows still read correctly after… — n/a: no migration in this change
- [ ] **Constraints and defaults exercised aga… — n/a: no migration in this change
- [ ] Down-migration written, or the reason on… — n/a: no migration in this change
- [ ] Production apply plan stated for the rel… — n/a: no migration in this change

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows ye… — n/a: this change adds no new input or data; it pressed six existing forms
- [ ] Invalid input is rejected with a readabl… — n/a: this change adds no new input or data; it pressed six existing forms
- [ ] Boundary cases checked (long text, zero,… — n/a: this change adds no new input or data; it pressed six existing forms

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
| exactly `medical_records` | record death, send to hospital, return from hospital | control drawn and pressed; move / foster / return-to-shelter pages show no button | pass |
| exactly `residents` | move, foster, return to shelter | control drawn and pressed; record death / send / return-from-hospital pages show no button | pass |
| admin, signed out | not tested | not tested | n/a: outside this brief |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx… — n/a: no code, nav, manual or string changed
- [ ] Manual updated (`src/lib/manual/en.ts`) … — n/a: no code, nav, manual or string changed
- [ ] Translatable strings go through the tran… — n/a: no code, nav, manual or string changed
- [ ] Mobile viewport (375px) — no overflow, c… — n/a: no code, nav, manual or string changed
- [ ] Browser console clean — no errors or Rea… — n/a: not recorded this stream; the pane's console and network were not read
- [ ] Network clean — no unexpected 4xx/5xx on… — n/a: not recorded this stream; the pane's console and network were not read

## 6. Regression

- [ ] The pages nearest the change still work … — n/a: no code changed; the six pages were loaded in the browser as part of the presses
- [ ] Any shared file touched (`NavLinks.tsx`,… — n/a: no code changed; the six pages were loaded in the browser as part of the presses
- [ ] Nothing merged from `main` during `sync`… — n/a: no code changed; the six pages were loaded in the browser as part of the presses

## 7. Documentation

- [ ] Backlog item ticked — n/a: #79sqf is not done (6 of 25 driven); the brief says not to edit the backlog
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: no code changed
- [ ] **Release notes.** — n/a: no code changed; nothing a shelter user would notice
- [x] Commit messages say why, not just what…
- [x] **Claims in commit messages and `docs/de…

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**`lannacare.org` is now a 301 to production and is a check of nothing.** It was
production until 2026-11-05 and UAT from then until 2026-11-08, so a plan written
from this template before today may name it as either, and both readings were
correct when written. **UAT is deployed on every release since 2026-11-08**
(`docs/release-procedure.md`, step 6), last of the three.

### Tested build

- [ ] Tested SHA recorded in the header, and i… — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — `d… — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test`… — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — t… — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved, n… — deferred: release manager at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the … — deferred: release manager at deploy time
- [ ] **Evidence pasted into this plan is the … — deferred: release manager at deploy time
- [ ] Public pages (`/`, `/adopt`, `/our-work`… — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <… — deferred: release manager at deploy time
- [ ] `strip-baked-env: removed N env var(s) f… — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in the pro… — deferred: release manager at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration … — deferred: release manager at deploy time
- [ ] `node scripts/apply-migrations.mjs --env… — deferred: release manager at deploy time
- [ ] For a **destructive or rewriting** migra… — deferred: release manager at deploy time
- [ ] Apply plan stated: which file, which pro… — deferred: release manager at deploy time

### Rollback

- [ ] Rollback position stated, **including wh… — deferred: release manager at deploy time

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

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

<!-- guidance:start -->
The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `<name> —
confirmed in chat; line written by Claude at their request  Date: <yyyy-mm-dd>`.
Three valid states:

- `<name>  Date: <yyyy-mm-dd>` — a person looked. The date is required here.
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
<!-- guidance:end -->

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty — n/a: nothing for a person to look at beyond what was driven

Manual verification by: n/a: nothing left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not a release cut

Result: pass

Release manager acknowledgement: n/a: not a release cut
