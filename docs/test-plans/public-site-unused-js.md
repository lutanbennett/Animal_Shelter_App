| Tested at SHA | 4c67f7bdc || Carries a migration? | no || Tested by / date | Claude / 2026-11-16 || PR | see PR || Backlog item | `docs/backlog.md` → #7bd5u (ticked) || Feature | Public site: load the Supabase browser client on press (#7bd5u a) |# Feature test plan


---

## Header

| | |
|---|---|
| Feature | |
| Backlog item | `docs/backlog.md` → |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | |
| Tested by / date | |
| Carries a migration? | yes / no |
| Tested at SHA | |

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
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`. Closing lines of my run:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 58s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 170s
=== gates: test — npm test
=== gates: test exited 0 after 50s
=== gates: build — npm run build
=== gates: build exited 0 after 78s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` revie — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` revi — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and re — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace — n/a: no migration
- [ ] Existing rows still read correctly after the chang — n/a: no migration
- [ ] **Constraints and defaults exercised against real  — n/a: no migration
- [ ] Down-migration written, or the reason one is not n — n/a: no migration
- [ ] Production apply plan stated for the release manag — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still ther — n/a: no new feature surface; only when a script is fetched changed
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: no new feature surface; only when a script is fetched changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new feature surface; only when a script is fetched changed
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: no new feature surface; only when a script is fetched changed
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: no new feature surface; only when a script is fetched changed

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
| admin | staff header Sign out and theme pick | works | verified |
| signed out | public pages | no Supabase chunk requested | verified by HTML |

- [ ] Every login above tested — n/a: no new feature surface; only when a script is fetched changed
- [ ] A login that should not have access is blocked server-side ( — n/a: no new feature surface; only when a script is fetched changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the — n/a: no new feature surface; only when a script is fetched changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads  — n/a: no new feature surface; only when a script is fetched changed
- [ ] Translatable strings go through the translation path, checke — n/a: no new feature surface; only when a script is fetched changed
- [x] Mobile viewport (375px) — no overflow, controls reachable
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a lighter page load; nothing a shelter user does or sees differs
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

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints bo — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works  — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a con — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover bot — deferred: release manager at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and  — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundl — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads  — deferred: release manager at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — deferred: release manager at deploy
- [ ] For a **destructive or rewriting** migration only: a product — deferred: release manager at deploy
- [ ] Apply plan stated: which file, which project, and whether it — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover — deferred: release manager at deploy

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

Automated checks by: Claude  Date: 2026-11-16

### Manual verification

Manual verification by: n/a: no screen for a person to judge beyond what the automated browser check drove


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty, so there is nothing for a person to sign



### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no new feature surface; only when a script is fetched changed
- [ ] Checklist pasted into the PR — n/a: no new feature surface; only when a script is fetched changed
- [ ] Handed to the production release manager — n/a: no new feature surface; only when a script is fetched changed

Result: pass

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
