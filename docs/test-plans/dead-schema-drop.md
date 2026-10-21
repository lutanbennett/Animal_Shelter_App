# Test plan: dead-schema-drop (0243)

## Header

| | |
|---|---|
| Feature | Drop the dead diet columns, the 0239 bridge, `set_standard_diet` and `role_home_tiles` |
| Backlog item | `docs/backlog.md` → Diets as recipes, cleanup migration; Diets made of ingredients |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | yes: `0243_dead_schema_drop.sql` |
| Tested at SHA | 47945fde |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: part (3), the cleanup migration `0243`, plus the dead `role_home_tiles` table
- [x] Files/areas touched: `supabase/migrations/0243_dead_schema_drop.sql`, `src/app/admin/diets/actions.ts`, `src/app/admin/diets/page.tsx`, `scripts/check-dead-schema-drop.mjs` (new), `scripts/check-perm-functions.mjs`, `scripts/check-standard-diet-functions.mjs` (deleted), `docs/backlog.md`, `docs/decisions/2026-10-21-dead-schema-drop.md`
- [x] Roles affected: admin only (Settings → Diets counts); no role sees a changed number
- [x] Out of scope: the five management pages (they read `diet_forecast`, which `0239` had already moved onto recipes, so nothing to change), the audit label and `undo.ts` mapping for `role_home_tiles` (kept on purpose), both dictionaries

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `docs/backlog.md` (main had reworded and moved the cleanup item), resolved by taking main's text and ticking it
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three). This one cannot be true in the commit that creates the PR, so wr — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main` (0242), and no other in-flight branch carries one (`migration numbers: ok` from the commit hook)
- [x] `--status` reviewed (1 pending: 0243)
- [x] `--dry-run` reviewed: `dry-run 0243_dead_schema_drop.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`): `applying 0243_dead_schema_drop.sql … ok`
- [x] File is re-runnable (`drop … if exists` throughout; the two views are dropped and recreated)
- [x] Existing rows still read correctly: forecasts, both restated views and `special_diet_list` compared before and after on real dev data (next line). Dev holds only 2 diet types and 91 resident diet records, a small sample
- [x] **Constraints and defaults exercised against real rows** — `node scripts/check-dead-schema-drop.mjs` runs the file's own text in a rolled-back transaction on dev and asserts: `diet_forecast` and `stock_diet_forecast` identical before and after over October 2026 and over every date; `picker_diet_types` and `stock_diet_types` keep every row and remaining column; `special_diet_list` 6 rows before and after; the bridge triggers, `set_standard_diet`, the six dropped columns and `role_home_tiles` are gone; both views keep select for authenticated and not anon. Output: `forecast_rows: 2`, `diet_forecast_differences: 0`, `stock_diet_forecast_differences: 0`, `picker_diet_types_differences: 0`, `stock_diet_types_differences: 0`, `special_diet_list_rows_before_after: 6 / 6`, `triggers_left: 0`, `functions_left: 0`, `columns_left: 0`, `role_home_tiles_left: 0`, `view_grants_ok: true`, `ok`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: a drop of columns nothing reads; the dropped table was a copy of the role cards, which stay the source of truth
- [x] Production apply plan: `0243` goes with the release that carries this app (the old app inserts `daily_qty_*` on a new ingredient, the new app does not). Run `--status --env production` first

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no new UI; the change removes dead schema and two reads, and Settings → Diets was not driven in a browser (see Left for manual verification)
- [ ] Data persists — n/a: no new UI; the change removes dead schema and two reads, and Settings → Diets was not driven in a browser (see Left for manual verification)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no new UI; the change removes dead schema and two reads, and Settings → Diets was not driven in a browser (see Left for manual verification)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new UI; the change removes dead schema and two reads, and Settings → Diets was not driven in a browser (see Left for manual verification)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new UI; the change removes dead schema and two reads, and Settings → Diets was not driven in a browser (see Left for manual verification)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no new UI; the change removes dead schema and two reads, and Settings → Diets was not driven in a browser (see Left for manual verification)

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
| admin | Settings → Diets | unchanged | not driven in a browser |
| management | n/a | no change | n/a |
| staff | n/a | no change | n/a |
| doctor | n/a | no change | n/a |
| volunteer | n/a | no change | n/a |
| signed out | n/a | no change | n/a |

- [ ] Every role above tested — n/a: no permission changed; the views keep their grants (`view_grants_ok: true`)
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no permission changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-visible behaviour changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no page was loaded
- [ ] Network clean — n/a: no page was loaded

## 6. Regression

- [x] The pages nearest the change are covered by typecheck and build, and the data they read (`diet_forecast`, the pickers) by the harness; not loaded in a browser
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file (`NavLinks.tsx`, manual, shared libs) touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates were run after the merge

## 7. Documentation

- [x] Backlog items ticked on this branch: the cleanup item and Diets made of ingredients. The home-screen item was already ticked
- [x] Decision file: `docs/decisions/2026-10-21-dead-schema-drop.md`
- [x] `README.md` still accurate (no mention of the dropped objects)
- [ ] **Release notes.** n/a: dead schema removed and a forecast function already on the recipe tables; the numbers a user sees are unchanged (forecast differences: 0)
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured: that `diet_forecast` was already on recipes comes from reading the live function bodies on dev (`pg_proc`), and from the before/after comparison

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour. Workers run in UTC wherever they a — n/a: no date or timezone logic touched
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no threshold or band touched
- [ ] Evidence pasted into this plan is the tool's actual output, unedited. A hand-maintained table of results i — n/a: the only evidence pasted is tool output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production. `scripts/lib/env.m — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production apply must happen *be — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh. (Additive nullable — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated, including what it does not cover. Production is served by the Pi, so the rollbac — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The brief said `diet_forecast` still read the legacy columns; it did not (`0239` moved it). Not a product defect | accepted: recorded in the decision file |

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
| 1 | Settings → Diets as admin: add an ingredient, put it in a recipe, try to delete it, and see the records count | the deployed build after `0243` is applied |

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

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

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

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. If the list is empty, whoever f — n/a: one item is listed and nobody has looked yet

Manual verification by: pending: the Settings → Diets check on the deployed build after 0243 is applied

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit; this file is the checklist
- [ ] Handed to the production release manager — n/a: not yet; handed over at release

Result: pass with accepted defects

Release manager acknowledgement: pending: at release
