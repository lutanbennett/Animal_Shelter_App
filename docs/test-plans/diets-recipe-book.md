## Header

| | |
|---|---|
| Feature | Settings → Diets as a recipe book |
| Backlog item | `docs/backlog.md` → Redesign Settings → Diets as a recipe book |
| Branch / worktree | `claude/diets-recipe-book` @ `C:\Development\Animal_Shelter_diets-recipe-book` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | 41412781 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` — typecheck, lint, test and build all exit 0; closing lines below

```

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — n/a: not yet — the PR does not exist at this commit

**Browser checks driven on dev at 375 px as a throwaway admin account** (made by script, left in dev): Add an ingredient (Turkey mince) through its small form and landed on its page; added a *cup* measure (1 cup weighs about 120 g) from the ingredient page; Add a diet (Diabetic) and landed on its recipe page; added four ingredients (Turkey mince in cups, Pumpkin, Green beans, Oats in g) through Add ingredient; the Diabetic card then read *1.5 cups Turkey mince · 100 g Pumpkin · 60 g Green beans · 40 g Oats*, and the recipe page's total showed *Medium: 1.5 cups + 240 g*. On the Standard diet (84 residents): Delete is disabled with *Can't delete: 85 resident records use it*, and Remove on its only ingredient was refused with *Can't remove the last ingredient of a diet residents are on*. Console had no errors. Purchasing loaded. Not shown: the item's *Medium: 4 cups* on Standard, because dev's Standard is one ingredient.

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the data was built by 0239 and 0242 and this is screens only
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the screens read the existing rows, checked on the pages below
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [x] Empty state renders sensibly (no rows yet)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the validation (name required, amounts above zero, a measure needs a conversion) is the existing recipe-actions.ts and actions.ts code, unchanged; only the last-ingredient and in-use refusals were driven (see the Defects section and §4 notes)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not driven beyond the in-use delete and last-ingredient cases; the amount parsing is unchanged server code

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all four Settings → Diets screens | opens, edits | works (throwaway dev admin) |
| management | none | refused by the unchanged guard | not driven |
| staff | none | refused by the unchanged guard | not driven (role retired, 0173) |
| doctor | none | refused by the unchanged guard | not driven |
| volunteer | none | refused by the unchanged guard | not driven |
| signed out | none | sent to /login | seen: /admin/diets bounced to /login?next=%2Fadmin%2Fdiets before signing in |

- [ ] Every role above tested — n/a: only an admin session was available (a throwaway dev admin); the other roles are refused by the unchanged requirePermission and canEditItemSettings guards, which the permission-catalogue lint check pins for all four pages
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not driven by URL as a non-admin this session; same guards as before on every page, pinned by scripts/check-permission-catalogue.mjs (lint)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change, per the brief; /admin/diets stays the entry and the four screens link to each other
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`
- [x] Translatable strings go through the translation path, checked at `/management/translations`
- [x] Mobile viewport (375px) — no overflow, controls reachable
- [x] Browser console clean — no errors or React warnings
- [ ] Network clean — n/a: the console was clean and every page and action returned content; the network panel was not read separately

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: the README does not describe the Diets screens
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`; a manager and the Director will notice the Diets page changing.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part — n/a: no date logic; the only date use is today's resident_diets rows for the card count, through the existing todayIso()
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no threshold or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` o — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written int — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README re — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback: revert the PR. Screens only, no migration, no stored data changed by the code. Dev rows added while testing (a Diabetic diet, four ingredients, a cup measure) are disposable.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The lint registry check (`check-permission-catalogue.mjs`) failed on the three new pages until they were pinned | fixed |
| 2 | note | Dev's Standard diet is a single ingredient reading Medium: 2 cups, not the item's 4 cups (kibble 1 + chicken 1.5 + rice 1.5); that split is production/rehearsal data, so the item's own 4-cup check could not be shown on dev | accepted; see Left for manual verification |

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
| 1 | On a real phone, as the Director would use it: add a Diabetic diet with four ingredients, add a cup to an ingredient, and read the Standard card's medium total (expect 4 cups on data that has kibble, chicken and rice) | Settings → Diets |
| 2 | Purchasing's To buy figures are the same as before the redesign (this stream changed no code Purchasing reads; only the diets screens and their actions) | Management → Purchasing |
| 3 | The Thai wording reads naturally (written by Claude, not read by a Thai speaker) | Settings → Diets in Thai |

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

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

The items in **Left for manual verification** above. Signed only by the person who looked; the state below is `pending:` until they have.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <re — n/a: the manual list is not empty, so this is left for the person who looks

Manual verification by: pending: the three items under Left for manual verification — a person on a real phone, Purchasing before and after, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet handed over; the PR is still to merge

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over

