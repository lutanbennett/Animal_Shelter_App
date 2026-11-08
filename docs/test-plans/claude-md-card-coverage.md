# Feature test plan


---

## Header

| | |
|---|---|
| Feature | claude-md-card-coverage |
| Backlog item | `docs/backlog.md` → #k2v8m, #c5nt2 |
| Branch / worktree | `claude/claude-md-card-coverage` @ `C:\Development\Animal_Shelter_claude-md-card-coverage` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not started: no page changed) |
| PR | pending |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | 5fa277f0 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — CLAUDE.md bullet, two decision files, backlog ticks; no code; Admin passage untouched
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — CLAUDE.md bullet, two decision files, backlog ticks; no code; Admin passage untouched
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — CLAUDE.md bullet, two decision files, backlog ticks; no code; Admin passage untouched
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — CLAUDE.md bullet, two decision files, backlog ticks; no code; Admin passage untouched

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
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all four exit 0

```
=== gates: typecheck exited 0 after 82s
=== gates: lint exited 0 after 335s
=== gates: test exited 0 after 70s
=== gates: build exited 0 after 442s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-f — n/a: docs-only change: no code, UI or data surface
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs-only change: no code, UI or data surface
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs-only change: no code, UI or data surface
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_mi — n/a: docs-only change: no code, UI or data surface
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — n/a: docs-only change: no code, UI or data surface
- [ ] Existing rows still read correctly after the change (checked against r — n/a: docs-only change: no code, UI or data surface
- [ ] **Constraints and defaults exercised against real rows** in a `begin;  — n/a: docs-only change: no code, UI or data surface
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs-only change: no code, UI or data surface
- [ ] Production apply plan stated for the release manager (which  — n/a: production is not reachable from a worktree; the 2026-11-07 measurement is cited with its date

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only change: no code, UI or data surface
- [ ] Data persists — reload the page and the change is still there — n/a: docs-only change: no code, UI or data surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs-only change: no code, UI or data surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only change: no code, UI or data surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs-only change: no code, UI or data surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: docs-only change: no code, UI or data surface

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
| n/a: docs-only | no page changed | n/a | n/a |

- [ ] Every login above tested — n/a: docs-only change: no code, UI or data surface
- [ ] A login that should not have access is blocked server-side (hitting th — n/a: docs-only change: no code, UI or data surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right car — n/a: docs-only change: no code, UI or data surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: docs-only change: no code, UI or data surface
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: docs-only change: no code, UI or data surface
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: docs-only change: no code, UI or data surface
- [ ] Browser console clean — no errors or React warnings — n/a: docs-only change: no code, UI or data surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: docs-only change: no code, UI or data surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs-only change: no code, UI or data surface
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs)  — n/a: docs-only change: no code, UI or data surface
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: docs-only change: no code, UI or data surface

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — 2026-11-08-claude-md-card-coverage.md
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: documentation only, no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: grep of CLAUDE.md and docs, and check-cards-count.mjs run locally; the production reading is cited with its date

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

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints bo — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works  — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a con — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover bot — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and  — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundl — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads  — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a product — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover — deferred: release manager

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

- [x] Everything in this checklist that could be verified without human eyes was: gates, check-cards-count.mjs (ok, 53 cards), greps of CLAUDE.md and docs. Production reads: the 2026-11-07 measurement is cited with its date, production is not reachable from a worktree
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

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

- [x] The manual list above is empty

Manual verification by: n/a: documentation only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above (none)
- [ ] Checklist pasted into the PR — n/a: docs-only change: no code, UI or data surface
- [ ] Handed to the production release manager — n/a: docs-only change: no code, UI or data surface

Result: pass

Release manager acknowledgement: pending: release manager reads this at release time
