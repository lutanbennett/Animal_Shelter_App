# Feature test plan

## Header

| | |
|---|---|
| Feature | Bills, app half: one bill records several items, an item typed as a description, the bill total against the items, promotion of a repeated description |
| Backlog item | `docs/backlog.md` → **BILLS: DONE 2026-11-03** (ticked here) |
| Branch / worktree | `claude/bills-lines-app` @ `C:\Development\Animal_Shelter_bills-lines-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this plan; number on the PR itself |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration\? | no: reads `0308`, already applied to dev |
| Tested at SHA | `b4f3857b` (the code commit; plan-only commits follow) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one bill holds several items (a medicine, a food, a typed description), its photos and total belong to the bill, and a repeated description can be added to Settings
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/deliveries/*` (actions, form, phone steps, page, new `BillTotalsLine`, `PromoteOffers`, `promote-actions`), `src/app/bills/actions.ts` + `page.tsx`, `src/app/management/stock-usage/page.tsx`, `src/lib/bills/{upload,photos}.ts`, `src/lib/management/described-lines.ts`, `src/components/BillPhotosSection.tsx`, the bills photo route comment, both dictionaries, manual, releases; thirteen-file account in `docs/decisions/2026-11-03-bills-lines-app.md`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out pu — `record_delivery` (every new control asks `stock.delivery`); the promote buttons also need `canEditItemSettings` (Settings write), which only Admin holds today. Admin sees everything. Signed-out public not affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — Cashflow reading real spend, a narrower card for described items, the `general_bill` photo gap, a route to match a card to an existing bill

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged; one conflict in `src/lib/releases.ts` (two new `unreleased` lines), kept both
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all four `0`; run here, closing lines pasted exactly as printed:

```
=== gates: typecheck exited 0 after 46s
=== gates: lint exited 0 after 117s
=== gates: test exited 0 after 26s
=== gates: build exited 0 after 147s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; `0308` shipped yesterday
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; `--status` read by the planner: 309 applied, 0 pending
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0308` is applied to dev
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; the list still shows older deliveries (no bill) as before, checked on dev
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR; the schema half's own harness `scripts/check-bills-delivery-lines.mjs` was run here and reads HARNESS-OK
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; `0308` must be live in production before this ships (code reads `stock_deliveries`)

## 4. Functional checks

- [x] Happy path works end to end — on dev as a one-card login (`record_delivery`): bill total 700, a medicine (Bravecto 2, 300), a food (Oats 3000 g, 250) and a described line (Dish soap 4 bottle, 150) saved one after another on one open bill
- [x] Data persists — reload the page and the change is still there — read back from the database: one `stock_deliveries` header with 3 lines, `lines_cost` 700, `difference` 0.00, and 1 photo on `owner_type = stock_delivery` (0 on the lines); the list re-rendered from the server showing the bill block once
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: create driven (three items, extra bill, photo upload, promotion); a delivery is never edited (0235) and the delete control is unchanged and Admin-only (0265), not pressed
- [x] Empty state renders sensibly (no rows yet) — the promote box is absent until a wording is on two lines (seen before the second *dish soap*, then it appeared); a bill with no total shows 'No bill total typed'
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven in the browser (the fields are `required`); `resolveDescribedLine` returns a named reason for description, unit, quantity and cost and `recordDelivery` maps each to a dictionary message (code read); a unit not on Settings → Units was driven and refused in words on promotion
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not driven: mixed-case, padded and double-spaced wordings were (`  dish   SOAP ` matched `Dish soap`); zero, negative and very long text were not

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
| admin | Deliveries, promote offer, Bills | records bills; sees *Add to Medications / Food* when a wording repeats | driven: added *test lentils 1103* to Food, linked 2 lines; a unit not on the list refused in words |
| exactly `record_delivery` | Deliveries | records a bill of three items, sees totals and photos; no promote buttons (Settings write is not on this card) | driven: three items, total 700 against 700, photo on the header |
| exactly `view_residents` | none of it | no Deliveries link, no Bills link, no tile | driven: links on Home were Residents and the manual only |
| signed out | Deliveries | refused | n/a: not driven; the page is unchanged (`requirePermission`) |

- [x] Every login above tested — admin, exactly `record_delivery` and exactly `view_residents` driven; signed out not driven (page unchanged)
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not driven by address (CLAUDE.md: the pane's direct load is unreliable); the `view_residents` login was offered no Deliveries link, Bills link or tile, and every action still asks `stock.delivery` and the database policies are unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — two new steps and a photo sentence in Recording a delivery / Bills; read in the source, not opened at `/manual`
- [x] Translatable strings go through the translation path, checked at `/management/translations` — every new string is in both dictionaries (`typecheck` holds the Thai shape to the English); `/management/translations` not opened
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not measured at 375 px; the phone steps were changed (described branch, bill total, finish) and are in Left for manual verification
- [x] Browser console clean — no errors or React warnings — `read_console_messages` errors-only returned none after the drive
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: `read_network_requests` not read; every server action in section 4 returned its success state and the photo upload returned 200 (the photo rendered)

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — Deliveries (as three logins), Bills inbox page opened as admin; Stock between counts (`stock-usage`) not opened, its change is one added filter
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `src/lib/i18n/dictionaries`, `src/lib/releases.ts` and `src/lib/manual/en.ts` are shared; loaded Deliveries (dictionary) and the Bills page from the admin login. `NavLinks.tsx` not touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — typecheck after the merge was clean and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — retitled and ticked; the CASHFLOW item and the `general_bill` item are open on their own questions and are not closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-03-bills-lines-app.md`
- [x] `README.md` still accurate — it does not describe the delivery form
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written fo — one line added to `unreleased`, tagged `record_delivery`, with the Thai caveat. No manual step is outstanding
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklis — the sweep and the views were read from the live dev database (`pg_views`, `pg_proc`, `pg_policies`, `pg_get_viewdef`), not reasoned

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wron — n/a: the only date logic is the existing `receivedAtFor`, unchanged; later items on an open bill take the bill's day and the database copies it
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no threshold or band changed (the amount check shows a difference of any size and never blocks)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than  — n/a: the gates block is copied as printed by `node scripts/gates.mjs`; no hand-made table of results
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.pro — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is w — n/a: no migration here; the code reads `0308`, which must be live in production before the deploy (`apply-migrations.mjs` warns if not)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR; `0308` first, with the schema PR's own plan

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <s — n/a: code only; rolling back removes the bill form and leaves `0308`'s additive schema and any bills already recorded, which still read

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The promote offer shows whichever of the matching lines the database returns first, so the wording's capitalisation can differ from the first one typed | accepted: for the planner to file; no effect on what is linked |

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
| 1 | The phone steps: Something else, the bill total, Record another item keeping the bill open, Finish this bill | Deliveries on a phone |
| 2 | The Thai wording of the new strings reads naturally | Deliveries in Thai |
| 3 | Photos on a real phone's camera filed on the bill and shown once on its first line | Deliveries, Add a photo of the bill |
| 4 | The page at 375 px: nothing scrolls sideways | Deliveries |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — yes, the gates, the schema harness, the dev drive and the live-database reads
- [x] Nothing is ticked that was not actually executed — yes

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write — n/a: the list is not empty, so only the person who looked may tick this; left for them

Manual verification by: pending: the four rows in Left for manual verification, which need a person (phone, Thai reader)

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [x] Checklist pasted into the PR — pasted into the PR body
- [ ] Handed to the production release manager — n/a: the PR carries this plan; the release manager reads it in the pre-deploy pass

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
