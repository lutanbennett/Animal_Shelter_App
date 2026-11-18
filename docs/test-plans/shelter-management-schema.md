# Feature test plan — shelter-management-schema


---

## Header

| | |
|---|---|
| Feature | PADMIN list, `is_product_admin()` and the cross-shelter `product_admin_shelters()`, schema half of `#shmgt` |
| Backlog item | `docs/backlog.md` → `#shmgt` (not ticked: first of two halves) |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | not started — no UI surface; proof driven against the dev database directly |
| PR | opened after this plan |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | yes — `0411_product_admins.sql`, `0412_product_admins_owner.sql` |
| Tested at SHA | `SHAHERE` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog i — Adds the PADMIN list (`product_admins`), `is_product_admin()` and the cross-shelter `product_admin_shelters()`, `#shmgt` schema half, exactly what the brief asked
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, — `supabase/migrations/0411_product_admins.sql`, `0412_product_admins_owner.sql`, `docs/hard-coded-security-registry.json`, `docs/decisions/2026-11-18-product-admin-list-schema.md`, this plan
- [x] Cards affected identified (the cards whose behaviour changes; who hold — no card changes and none is created (Lutan: no roles or cards); Admin bypass untouched; the list is a named exception recorded under `outsideTheCardSystem.productAdmin`
- [x] Anything explicitly out of scope written down, so the release manager  — the screen, any write function for `shelters`, whether the surface lives in the shelter app at all (decision file), and production (dev only)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — branch cut from `origin/main` `6c390bfc0` minutes earlier; nothing new to merge
- [x] `node scripts/gates.mjs` — GATESLINE
- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-f — `check-migration-numbers.mjs`: ok, `0411` and `0412` against highest `0410`; this is the batch's only migration carrier
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 410 highest applied, 0 pending before; 412 applied after
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0411_product_admins.sql … ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrat — `applying 0411_product_admins.sql … ok` then `applying 0412_product_admins_owner.sql … ok`; 412 applied. **Both are applied to dev**
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — `if not exists`, `or replace`, `drop policy if exists`, owner change inside a guarded `do` block
- [x] Existing rows still read correctly after the change (checked against r — no existing table changed; `shelters`/`shelter_hosts` untouched and still return their two rows through `product_admin_shelters()`
- [x] Constraints and defaults exercised against real rows in a `begin; … ro — exercised live on dev with two disposable logins (see the decision file, Proved): non-member refused everywhere, PADMIN at aal1 reads, aal1 insert refused by `product_admins_insert_requires_aal2`, delete removed nothing; rows and logins removed afterwards. `pending: aal2 write not driven, no authenticator on a dev session`
- [x] Down-migration written, or the reason one is not needed is stated — each file's header carries a TO UNDO line (drop functions, drop table / alter owner back)
- [x] Production apply plan stated for the release manager (which file, whic — `0411` then `0412` on `dbkodyyxxhtygxcxmfcu` with the next release, in order; nothing reads them yet so any time is safe; not applied here

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: no UI surface; src/ is forbidden to this schema half

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
| admin (outside the card system) | `product_admin_shelters()`, `product_admins` | refused: Admin is not a PADMIN | n/a — covered by the non-member run below, a login holding no role and no card |
| a login holding no role and no card (disposable, aal1) | the list, the shelters, both functions | empty / false; `select shelters` permission denied; self-insert refused | PASS, output in the PR body and decision file |
| a PADMIN at aal1 (placed by service role) | list, shelters | reads both; insert and delete refused by the aal2 policy | PASS; `pending:` the aal2 success half, no authenticator |
| signed out | nothing | nothing | n/a — anon holds no grant and no execute on either function (`check-migration-grants`) |

- [ ] Every login above tested — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] A login that should not have access is blocked server-side (hitting th — n/a: no UI surface; src/ is forbidden to this schema half

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right car — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface; src/ is forbidden to this schema half
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface; src/ is forbidden to this schema half

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none: no page reads these objects; the build gate compiles the whole app unchanged
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs)  — n/a: no UI surface; src/ is forbidden to this schema half
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch (follow-ups go — n/a: deliberately NOT ticked, two-half item and this is the first half; planner files the note. Searched the backlog for shelters/PADMIN: `#shmgt` and `#onbrb` only, neither closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (` — `docs/decisions/2026-11-18-product-admin-list-schema.md`
- [x] `README.md` still accurate — it does not describe these objects
- [ ] Release notes. Would a shelter user notice this change? If so, `unrele — n/a: schema only; no screen reads these objects yet and nothing a shelter user sees changes
- [x] Commit messages say why, not just what — yes
- [x] Claims in commit messages and `docs/decisions.md` were measured, not r — the proof claims were measured against dev, output in this plan's PR body and the decision file

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

- [x] Tested SHA recorded in the header — SHA in the header
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the tar — n/a: pre-production gate belongs to the release manager; this PR deploys nothing

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the dep — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of t — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] Evidence pasted into this plan is the tool's actual output, unedited.  — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after  — n/a: pre-production gate belongs to the release manager; this PR deploys nothing

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref ma — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: pre-production gate belongs to the release manager; this PR deploys nothing

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes,  — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] For a destructive or rewriting migration only: a production backup exi — n/a: pre-production gate belongs to the release manager; this PR deploys nothing
- [ ] Apply plan stated: which file, which project, and whether it runs befo — n/a: pre-production gate belongs to the release manager; this PR deploys nothing

### Rollback

- [ ] Rollback position stated, including what it does not cover. Production — n/a: pre-production gate belongs to the release manager; this PR deploys nothing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | strict tenancy lint flags `scheduled_writer_runs` (rule 3, missing `definer_all`); pre-existing, not this PR's table | deferred to backlog (planner to file) |

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
| 1 | A PADMIN at **aal2** can insert and delete a PADMIN row (no authenticator on a dev session) | the app half's step-up page, next batch |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes — the migration, policies and functions were all run against dev
- [x] Nothing is ticked that was not actually executed — the aal2-success half is `pending` in section 3, not ticked as seen

Automated checks by: Claude  Date: 2026-11-18

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a p — pending: the aal2 write by a PADMIN (Left for manual verification, row 1)

Manual verification by: pending: aal2 write by a PADMIN, no authenticator on a dev session

### Result

- [x] Open defects are either fixed or explicitly accepted above — none open; one pre-existing lint finding on `scheduled_writer_runs` reported under Defects
- [x] Checklist pasted into the PR — pasted
- [ ] Handed to the production release manager — n/a: handed over by the PR body's apply plan; no release is cut here

Result: pass with accepted defects

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
