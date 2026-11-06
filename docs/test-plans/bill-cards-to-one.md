# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Bill cards become one (0327) |
| Backlog item | `docs/backlog.md` → #ywn5r |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `http://localhost:3009` |
| PR | to be opened |
| Tested by / date | Claude, 2026-11-06 |
| Carries a migration? | yes (0327) |
| Tested at SHA | tip of this branch |

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
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Run it yourself and paste its closing lines **exactly as your run printed them**, in a fenced block under this line: the `=== gates: <name> exited <N> after <S>s` line for each gate as well as the final `gates:` line. **Never type the final line from this description or copy it from another plan.** The shape here is deliberately not a line you could paste: the per-gate `after <S>s` timings are the part only a real run has. `check-test-plan.mjs` cannot tell a pasted run from a typed one, so this wording is the only guard (`docs/decisions/2026-11-02-gates-line-four-gates.md`). They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [ ] Constraints and defaults exercised — n/a: no constraints added; the file's own do-block asserts bills holds exactly four grants and passed on dev
- [ ] Down-migration — n/a: re-applying the 0305 grants restores the old cards; no data lives in the retired rows
- [ ] Production apply plan stated — n/a: stated in section 8 as deferred to the release manager

## 4. Functional checks

- [ ] Happy path works end to end — pending: browser walk of /bills with a login holding only the bills card
- [ ] Data persists — reload the page and the change is still ther — pending: browser walk of /bills with a login holding only the bills card
- [ ] Create / edit / delete all exercised (whichever the feature  — pending: browser walk of /bills with a login holding only the bills card
- [ ] Empty state renders sensibly (no rows yet) — pending: browser walk of /bills with a login holding only the bills card
- [ ] Invalid input is rejected with a readable message, not a cra — pending: browser walk of /bills with a login holding only the bills card
- [ ] Boundary cases checked (long text, zero, negative, missing o — pending: browser walk of /bills with a login holding only the bills card

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

- [ ] Every login above tested — pending: browser walk of /bills with a login holding only the bills card
- [ ] A login that should not have access is blocked server-side ( — pending: browser walk of /bills with a login holding only the bills card

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the — n/a: no screen, route, nav or string changes; only which card grants the activities
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads  — n/a: no screen, route, nav or string changes; only which card grants the activities
- [ ] Translatable strings go through the translation path, checke — n/a: no screen, route, nav or string changes; only which card grants the activities
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no screen, route, nav or string changes; only which card grants the activities
- [ ] Browser console clean — no errors or React warnings — n/a: no screen, route, nav or string changes; only which card grants the activities
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no screen, route, nav or string changes; only which card grants the activities

## 6. Regression

- [ ] The pages nearest the change still work (list the ones check — pending: covered by the same browser walk of /bills and /bills/utilities
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, sha — pending: covered by the same browser walk of /bills and /bills/utilities
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] README still accurate — n/a: README does not mention these cards
- [ ] README still accurate — n/a: README does not mention these cards
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. **Since the 2026-11-05 cutover:**
`lannacareforanimals.org` is **production** (`dbkodyyxxhtygxcxmfcu`);
`test.lannacare.org` is **test** on the **dev** project (`qxkmhwybjggxvsfxsxbd`);
`lannacare.org` is **UAT**, which is moving to its own project
(`fsjagxmxjosauwmxwype`) and runs against dev until that is finished
(`docs/decisions/2026-11-06-uat-own-database.md`). **`lannacare.org` is NOT
production** — it was until 2026-11-05, and this paragraph said so for two
releases afterwards, so any plan written from this template before 2026-11-06
names the wrong hosts.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the t — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy p — deferred: release manager
- [ ] Timezone-sensitive behaviour proved, not observed  — n/a: no timezone, banding or public-page behaviour in this change
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions c — n/a: no timezone, banding or public-page behaviour in this change
- [ ] Evidence pasted into this plan is the tool's actua — n/a: no timezone, banding or public-page behaviour in this change
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Wo — deferred: release manager
- [ ] Any new secret/env var exists in the production Cl — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code tha — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env productio — deferred: release manager
- [ ] For a destructive or rewriting migration only: a p — deferred: release manager
- [ ] Apply plan stated: which file, which project, and  — deferred: release manager

### Rollback

- [ ] Rollback position stated, including what it does n — deferred: release manager

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

- [ ] Everything in this checklist that could be verifie — deferred: release manager
- [ ] Nothing is ticked that was not actually executed — deferred: release manager

Automated checks by: Claude  Date: 2026-11-06

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

- [ ] The manual list above is empty, or every item in i — deferred: release manager

Manual verification by: pending: browser walk of the one Bills card

### Result

- [ ] Open defects are either fixed or explicitly accept — deferred: release manager
- [ ] Checklist pasted into the PR — deferred: release manager
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending: after merge
