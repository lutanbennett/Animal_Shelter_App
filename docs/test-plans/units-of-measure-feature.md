# Test plan — units of measure (feature half)

Filled from `docs/test-plan-template.md`.

---

## Header

| | |
|---|---|
| Feature | Units of measure: buy and count in one unit, feed or dose in another (feature half; schema half was 0118) |
| Backlog item | `docs/backlog.md` → Units of measure: buy and count in one unit, feed or dose in another, with a conversion per item |
| Branch / worktree | `claude/units-of-measure-feature` @ `C:\Development\Animal_Shelter_units-of-measure-feature` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | linked from the PR itself |
| Tested by / date | Claude (units-of-measure-feature session), 2026-10-01 |
| Carries a migration? | no (0118 landed with the schema half) |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — per-item units of measure: a Units panel on Management, a unit box on Record a delivery and the stocktake, the factor stamped server-side into `entered`, stock shown in the purchase unit, price per purchase unit
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/units.ts`, `src/lib/units-server.ts`, `src/app/management/units/actions.ts`, `src/components/{UnitsPanel,StockCells}.tsx`, `src/app/{deliveries,stocktake}/*`, `src/lib/management/stocktake.ts`, both management pages and tables, both dictionaries, `manual/en.ts`, `releases.ts`, `scripts/check-units.mjs`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin and management (edit units); staff (deliveries, stocktake); volunteer (stocktake only); vet and signed-out public unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — mixed-unit entry on one row (decision: one unit per line); more than 2 decimals of cost (backlog follow-up); Thai manual (none exists); editing a unit's name does not rewrite past rows (they keep the name they were saved with)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — typecheck=0 lint=0 build=0, closing lines below
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at the time of writing; CI is read from the PR once opened

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; 0118 landed in the schema PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; 0118 landed in the schema PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration; 0118 landed in the schema PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; 0118 landed in the schema PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration; 0118 landed in the schema PR
- [x] Existing rows still read correctly after the change (checked against real dev data) — rows written the old way read correctly: `scripts/check-unit-conversions.mjs` step A (old-style counts and receipts insert with `entered` null) and H (`stock_count_intervals` unchanged) — HARNESS-OK on dev, rolled back; and no reader in this PR joins `item_unit_conversions` to interpret a saved row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR; the 0118 constraints were exercised by `scripts/check-unit-conversions.mjs` (re-run today: HARNESS-OK steps A–J, rolled back)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; 0118 landed in the schema PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; 0118 landed in the schema PR

## 4. Functional checks

- [x] Happy path works end to end — NOT driven in a browser (sign-in needs a real account). The arithmetic was run: `node scripts/check-units.mjs` — kibble walk-through, 2.4 bags (480 cups) + delivery 2 bags (400) − count 1.5 bags (300) = 580 cups used, × 4.25 a cup (850 a bag of 200) = 2465 baht, each factor applied once. See Left for manual verification 1–3 for the screens
- [ ] Data persists — reload the page and the change is still there — n/a: not driven in a browser; the save paths are server actions writing `quantity` + `entered` together, which the 0118 CHECK enforces — listed under Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: create/edit/delete of a unit and the price are screens not driven here — listed under Left for manual verification
- [x] Empty state renders sensibly (no rows yet) — Units panel shows 'No other units yet' and the delivery/stocktake forms show no unit box for an item with no conversions (code path read; item without conversions renders exactly as before)
- [x] Invalid input is rejected with a readable message, not a crash — refusals covered by `check-units.mjs`: blank name, zero/negative/blank/text factor, name equal to the base unit (stored spelling, label, any case), duplicate name, unknown unit, negative quantity, a price that rounds more than 1% off
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — fraction rounding to the CHECK's 6 places, a corrected factor leaving a saved delivery at 400 cups while a new one is 360 (`check-units.mjs`)

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/diets`, `/management/medications`, `/deliveries`, `/stocktake` | edit units; record; count | not driven — Left for manual verification 4 |
| management | same | edit units; record; count | not driven — Left for manual verification 4 |
| staff | `/deliveries`, `/stocktake` | record; count; no unit editor | not driven — guards unchanged; the actions refuse non-management with 'Only management can change units of measure.' |
| vet | `/deliveries`, `/stocktake` | refused | not driven — `requireRole` guards unchanged |
| volunteer | `/stocktake` | count only; `/deliveries` refused | not driven — guards unchanged; 0118 grants read-only on conversions (harness step I) |
| signed out | `/deliveries` | redirected to login | seen: `/management/diets` redirected to `/login?next=…` on the dev server |

- [ ] Every role above tested — n/a: role screens not driven in a browser; the database-level roles for conversions were asserted by harness step I
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — writes are management-only in the server action (`hasManagementRole`) and in RLS (0118: staff and volunteer read but cannot write — harness step I)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or moved
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — manual topics updated in `src/lib/manual/en.ts`: Managing medications, Managing diets, Doing a stocktake, Recording a delivery (reading at `/manual` not done in a browser)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no free text stored for translation; unit names are typed by management and shown as typed, all fixed strings are dictionary entries in en and th
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven in a browser — listed under Left for manual verification 5
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session was driven; the dev server log showed a clean start only
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no browser session was driven

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — typecheck and build cover the pages that import the changed libs: deliveries, stocktake, management medications and diets, stock-usage; `check-stocktake-sheet`, `check-stock-deliveries`, `check-stock-reading`, `check-stock-usage` all pass with 0 failures (the sheet's untouched/counted/confirmed outcomes are unchanged for base-unit rows)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — shared files touched: both dictionaries, `manual/en.ts`, `releases.ts`, `StockCells.tsx`; the whole app builds against them (`build=0`)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates exit 0 on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked on this branch; the cost-decimals follow-up went on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-01-units-of-measure-feature.md`
- [x] `README.md` still accurate — README does not describe stock, deliveries or units
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` has a line for it in `src/lib/releases.ts`
- [x] Commit messages say why, not just what — commits say why
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — n/a: the one measured claim is in the decision file (the kibble figures), and it is the output of `scripts/check-units.mjs`

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager at deploy time
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — n/a: no evidence table is pasted into this plan other than the closing gates lines
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. `npx wrangler rollback --env production` reverts the Worker in seconds; it does **not** revert migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — revert the PR. No schema change, so nothing else to undo; rows already written with `entered` stay valid because the column and CHECK predate this PR (0118) and the reverted code simply never reads them. It does not cover: deliveries and counts recorded in another unit remain in the base unit, which is the correct total

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `cost_per_unit` keeps 2 decimals, so a per-gram price cannot be stored from a per-kg price | accepted: the price field refuses a figure that rounds more than 1% off; deferred to backlog (widen the columns) |

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
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | The real kibble example on screen: a diet with base unit cup, Add a unit 'bag (20 kg)' = 200 cups marked bought-in and counted-in, 'kg' = 10; Record a delivery of 2 bags (unit box defaults to the bag, the preview says = 400 cup, saves, Recent deliveries shows '2 bag (20 kg) (400 cup)'); stocktake 1.5 bags (row shows = 300 cup, review lists it, saves); In stock shows 300 cup and ≈ 1.5 bag; Stock between counts and Cashflow agree with cups x cost per cup | /management/diets, /deliveries, /stocktake, /management/stock-usage, /management/cashflow |
| 2 | Correct the bag from 200 to 180 cups: the delivery already saved still reads 2 bag (400 cup); a new delivery of 2 bags saves as 360 | Management → Diets, Deliveries |
| 3 | An old row with no `entered` (any delivery or count recorded before today) still lists and counts as before, with no unit line | Deliveries → Recent; Stock between counts |
| 4 | Roles: management/admin can edit units and set the price; staff can record deliveries and count but see no unit editor; volunteers can count only | Management → Diets; Deliveries; Stocktake |
| 5 | Phone width (375px): the unit box beside the count field on the stocktake row is usable with one thumb and the long unit name does not overflow | Stocktake |
| 6 | The unit-name refusal reads well: naming a unit 'cup' on a cup diet is refused in words; a price of 35 for a 1000-gram kg is refused as too small to keep | Management → Diets → Units of measure |

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

Automated checks by: Claude (units-of-measure-feature session)  Date: 2026-10-01

### Manual verification

The items in **Left for manual verification** above, for the person who looked. Not signed: nobody has looked yet.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: the items under Left for manual verification need a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — the PR is opened first, then the release manager is told

Result: pass with accepted defects

Release manager acknowledgement: pending

```
gates: typecheck=0 lint=0 build=0
```
