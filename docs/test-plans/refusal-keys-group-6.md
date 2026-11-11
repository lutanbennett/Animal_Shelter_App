# Feature test plan


---

## Header

| | |
|---|---|
| Feature | refusal-keys-group-6 |
| Backlog item | `docs/backlog.md` → #3nuwy (programme; stays open) |
| Branch / worktree | `claude/refusal-keys-group-6` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | yes, 0358 |
| Tested at SHA | bac0c501 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), 
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

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: origin/main merged at the PR step; migration number check passed against origin/main 3b92c755
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — 

```
=== gates: typecheck exited 0 after 210s
=== gates: lint exited 0 after 613s
=== gates: test exited 0 after 96s
=== gates: build exited 0 after 509s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: function bodies only, no rows or columns changed
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$`  — n/a: no constraint or default; only the twelve raised messages changed (now eleven keys)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: 0178 bodies are the previous definition and can be re-applied
- [ ] Production apply plan stated for the release manager (which file, which project, when) — pending: release manager applies 0358 to production before the deploy that carries the callers

## 4. Functional checks

- [ ] Happy path works end to end — pending: on-screen Thai refusal not driven in this session
- [ ] Data persists — reload the page and the change is still there — n/a: no data written by this change
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create/edit flow changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or empty state
- [ ] Invalid input is rejected with a readable message, not a crash — pending: stock refusal not yet provoked on screen
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: wording only

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
| admin | stocktake and stock-edit screens | not driven | pending |
| exactly the card stock.count | stocktake | not driven; SQL checks unchanged | pending |
| signed out | n/a | n/a | n/a |

- [ ] Every login above tested — pending: no on-screen run; permission checks are unchanged SQL
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: checks unchanged from 0178

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no behaviour change a manual topic describes
- [x] Translatable strings go through the translation path, checked at `/management/translations`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change
- [ ] Browser console clean — no errors or React warnings — pending: not driven
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — pending: not driven

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — pending: not driven in a browser
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page —  — n/a: no shared nav or manual file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: not yet — sync happens at the PR step

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: programme item #3nuwy stays open; its progress line is updated on the backlog branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a — n/a: only the language of a refusal changes; no shelter user would notice in English
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typec

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they a — n/a: no dates
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no boundary or banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results i
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anon — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.m — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bund — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *be — deferred: yes, 0358 plus callers; production apply first, pinned with --upto because 0348 (destructive) and 0350-0352 are pending ahead of it; release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable — n/a: function replacement only
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: 0358 to production before the deploy, pinned with --upto (0348 destructive, 0350-0352 pending)

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollbac — deferred: additive function redefinition; rollback is the Pi rebuild, migration safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | none found | n/a |

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
| 1 | Provoke a stock refusal in Thai on screen (stale stocktake page); every page checks the card before the call, so it needs a deliberately stale page. Keys proved by direct calls on dev; fallback proved by db-refusal.test.mjs. | stocktake and stock-edit screens |
| 2 | A Thai speaker reads the eleven new Thai sentences (#y1dqu); unread by a human | refusals block of th.ts |

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

Automated checks by: Claude  Date: 2026-11-11

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever f — n/a: nothing signed for; the two items are pending below

Manual verification by: pending: the Thai is the stream's own and unreviewed (#y1dqu)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
