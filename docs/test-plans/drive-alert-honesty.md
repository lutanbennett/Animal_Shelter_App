# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Drive alert honesty (#dalrt) |
| Backlog item | `docs/backlog.md` → `#dalrt` |
| Branch / worktree | `claude/drive-alert-honesty` @ `C:DevelopmentAnimal_Shelter_drive-alert-honesty` |
| Dev server | not used (no UI) |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | a54887ace |

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

- [x] `node scripts/worktree.mjs sync`
- [x] `node scripts/gates.mjs` ends with the `gates:` line, all four exit codes 0 (run after merging origin/main; output pasted unedited):

```
=== gates: typecheck exited 0 after 75s
=== gates: lint exited 0 after 256s
=== gates: test exited 0 after 59s
=== gates: build exited 0 after 256s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on main, and no  — n/a: no migration
- [ ] node scripts/apply-migrations.mjs --status reviewed before — n/a: no migration
- [ ] node scripts/apply-migrations.mjs --dry-run reviewed — n/a: no migration
- [ ] Applied to dev (qxkmhwybjggxvsfxsxbd) and recorded in  — n/a: no migration
- [ ] File is re-runnable (if not exists / or replace / drop  — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked — n/a: no migration
- [ ] Constraints and defaults exercised against real rows in  — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is s — n/a: no migration
- [ ] Production apply plan stated for the release manager (which  — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a genuine invalid_grant still maps to dead and mails (unchanged probe branch); proved by unit tests on the pure parts, with the key unset and no network
- [ ] Data persists — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: no UI surface; the change is a server-side alert path covered by unit tests

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
| admin | n/a: no page | n/a | n/a |
| no login | n/a: server-only alert, no page | n/a | n/a |
| signed out | n/a: no page | n/a | n/a |

- [ ] Every login above tested — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] A login that should not have access is blocked server-side (hitting th — n/a: no UI surface; the change is a server-side alert path covered by unit tests

## 5. Cross-cutting

- [ ] Nav entry correct (src/app/NavLinks.tsx) — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Manual updated (src/lib/manual/en.ts) and the topic reads correctly  — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Translatable strings go through the translation path, checked at /man — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Mobile viewport (375px) — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Browser console clean — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Network clean — n/a: no UI surface; the change is a server-side alert path covered by unit tests

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Any shared file touched (NavLinks.tsx, manual/en.ts, shared libs)  — n/a: no UI surface; the change is a server-side alert path covered by unit tests
- [ ] Nothing merged from main during sync was broken by this branch — n/a: no UI surface; the change is a server-side alert path covered by unit tests

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: the only visible effect is that a false alert stops and a real one is reworded; no page, tile or setting moved, and the fix reaches users only when the Worker is deployed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

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

- [ ] Tested SHA recorded in the header, and it is the tip of main at deploy time — deferred: Lutan, at his production deploy
- [ ] Deployed SHA matches the tested SHA — deferred: Lutan, at his production deploy

### On the deployed build

- [ ] Deployed to test: npm run deploy:test — deferred: Lutan, at his production deploy
- [ ] Smoke-tested on test.lannacare.org — deferred: Lutan, at his production deploy
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour. Workers run in — deferred: Lutan, at his production deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both s — deferred: Lutan, at his production deploy
- [ ] Evidence pasted into this plan is the tool's actual output, unedited. A hand-maintaine — deferred: Lutan, at his production deploy
- [ ] Public pages (/, /adopt, /our-work, /donate) re-checked after a cache purge or a 1 — deferred: Lutan, at his production deploy

### Deploy safety

- [ ] deploy: production → Supabase project <ref> line read and the ref matches production — deferred: Lutan, at his production deploy
- [ ] strip-baked-env: removed N env var(s) from the Worker bundle seen in the deploy output — deferred: Lutan, at his production deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan, at his production deploy

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production a — deferred: Lutan, at his production deploy
- [ ] node scripts/apply-migrations.mjs --env production --dry-run run and clean — deferred: Lutan, at his production deploy
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — deferred: Lutan, at his production deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — deferred: Lutan, at his production deploy

### Rollback

- [ ] Rollback position stated, including what it does not cover. Production is served by th — deferred: Lutan, at his production deploy

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

- [ ] Everything in this checklist that could be verified without human eyes — n/a: no UI surface; see section 4
- [ ] Nothing is ticked that was not actually executed — n/a: no UI surface; see section 4

Automated checks by: Claude  Date: 2026-11-22

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a p — n/a: no UI surface; see section 4

Manual verification by: n/a: nothing for a person to look at; all proved by unit tests

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: no UI surface; see section 4

Result: pass

Release manager acknowledgement: n/a: not yet released
