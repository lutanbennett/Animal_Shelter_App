# Feature test plan


---

## Header

| | |
|---|---|
| Feature | A shelter's own full and short names, set from the platform console (#shnms) and where public names come from (#shnam) |
| Backlog item | `docs/backlog.md` → `#shnms`, `#shnam` |
| Branch / worktree | `claude/shelter-own-name` @ `C:\Development\Animal_Shelter_shelter-own-name` |
| Dev server | `http://localhost:3010` |
| PR | this PR |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | yes, 0424 |
| Tested at SHA | f7d5cef61 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Names form on the platform console + RPC 0424; #shnam established as a missing value, not a hard-coded string
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — src/app/platform/{actions.ts,ProductAdminPanel.tsx}, dictionaries en/th, supabase/migrations/0424, docs
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labe — none: the console is product-administrator plus aal2, outside the card system; no card changes; the signed-out public is unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — a shelter renaming itself in its own Settings (would need a card); the adopt-profile contact-email fallback

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

- [x] `node scripts/worktree.mjs sync` — origin/main already merged
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> te — gates: typecheck=0 lint=0 test=0 build=0
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot b — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries — 0424 via check-migration-numbers
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — status read: 425 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied to dev, ok
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — drop if exists, create or replace, re-stated grants
- [x] Existing rows still read correctly after the change (checked against real dev data) — the screen read Lanna's existing names back into the form
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: name validation is length and non-empty in the RPC; the press was refused by the harness classifier, see Left for manual verification
- [x] Down-migration written, or the reason one is not needed is stated — TO UNDO is in the file header
- [x] Production apply plan stated for the release manager (which file, which project, when) — apply 0424 to production before deploying code that reads the two new columns

## 4. Functional checks

- [ ] Happy path works end to end — pending: pressing Save on a shelter in the console; the press was refused by the harness classifier
- [ ] Data persists — pending: depends on the Save press
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: edit only, and the press is pending
- [x] Empty state renders sensibly (no rows yet) — shelters with no names show empty inputs (driven on /platform)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: client and server both refuse empty or over-long names with a readable message; not pressed
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: limits 120 and 60 are in the RPC, the action and maxLength; not pressed

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

- [ ] Every login above tested — n/a: no card governs this screen; the only gate is product administrator at aal2, driven as a product administrator
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails — n/a: unchanged gate: the RPC refuses anyone not on the product-administrator list, and anyone at aal1

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: product-administrator console, not in the shelter manual
- [x] Translatable strings go through the translation path, checked at `/management/translations — en and th dictionary entries added
- [ ] Mobile viewport (375px) — n/a: same form shape as the receipts form beside it; not measured at 375px
- [ ] Browser console clean — n/a: no console check run
- [ ] Network clean — n/a: no network check run

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — /platform loaded and rendered every shelter card
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a secon — n/a: no shared nav or manual file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog — both items ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-11-20-shelter-own-name.md
- [ ] `README.md` still accurate — n/a: README does not describe the console's forms
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/li — n/a: only a product administrator sees the console; no shelter user would notice
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate — the table of surfaces in the decision file was read from code, and says so

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — deferred: release manager at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintaine — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 1 — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a — deferred: release manager at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager at deploy
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: release manager at deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by th — deferred: release manager at deploy

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
| 1 | Press Save on a shelter's Names form, reload, confirm the names persist (the harness refused this press) | /platform, as a product administrator at aal2 |

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

Automated checks by: Claude  Date: 2026-11-20

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

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Save press on a shelter's Names form

Manual verification by: pending: a person presses Save on a shelter's Names form in /platform

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
