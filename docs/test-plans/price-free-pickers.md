# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Price-free pickers: the medicine and diet pickers and their embeds read `picker_medications` / `picker_diet_types`; staff stop reading the price columns (`0151`) |
| Backlog item | `docs/backlog.md` → "Give the medicine and diet pickers a price-free view, then take staff off the price columns (N1, N2)"; status note on the Security item (volunteer-prices half) |
| Branch / worktree | `claude/price-free-pickers` @ `C:\Development\Animal_Shelter_price-free-pickers` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3025` (not started: the queries were driven with real logins through PostgREST) |
| PR | linked from the PR itself |
| Tested by / date | Claude (price-free-pickers session), 2026-10-07 |
| Carries a migration? | yes — `0151_price_free_pickers.sql` |
| Tested at SHA | the PR head; the tree was uncommitted when the checks ran, then committed unchanged |

## 1. Scope and risk

- [x] Change is described in one sentence: the pickers and every embed on the medicine and diet lists read two price-free views, then the add and register cells come out of the two read policies, so staff stop reading `cost_per_unit` (N1, N2); it matches the backlog item
- [x] Files/areas touched: `supabase/migrations/0151_price_free_pickers.sql`; `src/lib/prescriptions/options.ts`, `src/lib/diets/options.ts`, `src/lib/diets/special.ts`, `src/app/residents/new/page.tsx`, `src/app/prescriptions/actions.ts`, the resident page and sections, `src/lib/archive/resident-record.ts`, `src/lib/residents/export.ts`; `scripts/check-price-free-pickers.mjs`, `scripts/lib/permission-probes.mjs`
- [x] Roles affected: staff (loses the price columns), a configured role holding only the add or register cell (same), admin and management (unchanged), vet (reads the tables by `vet_read_*`, unchanged, but see Defects), volunteer (already read neither)
- [x] Out of scope: the vet half of the Security item and its C-tail, `stock_receipts` and `stock_counts` (already cell-based), the vet picker question

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

- [ ] `node scripts/worktree.mjs sync` — n/a: run immediately before the PR and reported in it, not at this commit
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: lint exits 1 on a backlog line this branch did not write (`check-backlog-sections`: the advisory item below `## Completed`); as printed: `gates: typecheck=0 lint=1 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number 0151 is one above the highest on `main` (0150); no other in-flight branch carries one (brief)
- [x] `--status` reviewed: 150 applied, 1 pending
- [x] `--dry-run` reviewed: `0151_price_free_pickers.sql … ok` (views part; the policy part was added after and re-run by hand)
- [x] Applied to **dev** by the runner, then the final file re-run against dev by hand (the 0147/0148 precedent) after it gained the policy part and the medical cells
- [x] File is re-runnable: `create or replace view`, `drop policy if exists` then create
- [x] Existing rows read correctly: driven as a throwaway staff and management login against real dev rows
- [x] Harness `node scripts/check-price-free-pickers.mjs`: 65 checks in one rolled-back transaction, each principal's JWT: table read, view read and the add insert for 11 principals on both tables, plus sweeps that the views carry exactly their columns and no select policy names the add or register cell. Result: GREEN
- [ ] Down-migration written — n/a: additive views and a narrowing of two policies; undoing it is re-creating the two old select policies, which are in 0148
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production --dry-run`, then apply 0151 to `dbkodyyxxhtygxcxmfcu` from the main checkout, before the deploy (the code reads the views). Lutan's

## 4. Functional checks

- [x] Happy path: as a staff login both pickers return names and units, both embeds return names, and a new medication inserts with no read-back
- [x] Data persists: the inserted medication was visible to the service role, then removed
- [ ] Create / edit / delete all exercised — n/a: no write behaviour changed except the generated id on the add-while-recording insert, which was exercised
- [ ] Empty state renders sensibly — n/a: no new screen
- [ ] Invalid input is rejected — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: no values, dates or lengths involved

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
| admin | pickers, price tables | reads both views and both tables | harness: allowed on all four reads, as expected |
| management | pickers, price tables | reads both views and both tables (holds the price cells) | harness and a real login: allowed on all four |
| staff | pickers, embeds, add-medication | reads both views, **neither table**; the add insert works | harness and a real login: views 200 with names, `cost_per_unit` returns no rows, insert without read-back succeeded |
| vet | tables via `vet_read_*` | still reads both tables; reads neither view on dev (the draft matrix gives the vet no medical cells) | harness: as stated. See Defects D1 |
| volunteer | none | reads neither view nor table | harness: refused on all five probes |
| signed out | none | no grant on the views or tables | n/a: the views grant `authenticated` only; no anon probe was run |

- [x] Every role tested at the database: admin, management, staff, vet, volunteer, no role and five configured roles in the harness; staff and management also as real logins
- [x] Blocked server-side: a staff login's direct select of `cost_per_unit` on `medication` and `diet_types` returns no rows

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user does or sees changes
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven in a browser; queries were driven with real logins through PostgREST (see Left for manual verification)
- [ ] Network clean — n/a: not driven in a browser; every PostgREST call above returned 200

## 6. Regression

- [x] Nearest pages: `next build` compiled the resident page, sections, intake and prescription routes, and their queries were run as staff and management
- [ ] Shared file touched — n/a: none of `NavLinks.tsx`, `manual/en.ts` or `releases.ts` touched
- [ ] Nothing merged from `main` during `sync` was broken — n/a: sync is run at PR time and reported there

## 7. Documentation

- [x] N1/N2 item ticked; the Security item carries a status note for the volunteer-prices half only
- [x] `docs/decisions/2026-10-07-price-free-pickers.md`
- [x] `README.md` does not describe the pickers' tables
- [ ] **Release notes.** n/a: every picker and list shows the same names; no price was on any staff screen
- [x] Commit messages say why
- [x] Claims were measured: the embed behaviour, the vet gap and the staff probes were run against dev, not reasoned

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — deferred: release manager at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager at deploy
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — deferred: release manager at deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager at deploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| D1 | Medium | A vet's resident page reads medicine and diet names by embed. Those embeds now read the views, which admit a login by cell. In the seeded matrix (`0132`) the vet holds `medical.prescriptions` and `medical.diet`, so names show. On dev, which holds the Director's draft matrix, the vet holds neither, so the vet's embeds return no name ("unknown medication"). Not fixed here: a role named in a view contradicts the cell model, and the vet's cells are the Director's open question | accepted; recorded in the decision file and to be raised on the backlog branch |

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
| 1 | As staff in a browser: open a resident with a prescription and a diet, and the prescription and diet forms; names, units and quantities show, no "unknown medication" | `/residents/<id>`, `/prescriptions/new`, `/residents/new` |

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

Automated checks by: Claude (price-free-pickers session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list has one item and only the person who looked may tick this (pending)

Manual verification by: pending: Lutan to look at the resident page and the two forms as staff in a browser (the one row above)

### Result

- [x] Open defects are either fixed or explicitly accepted above (D1 accepted)
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the PR before `deploy:prod`; nothing is handed over by this session

Result: pass with accepted defects

Release manager acknowledgement: pending
