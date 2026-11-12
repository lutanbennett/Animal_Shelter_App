# Feature test plan

## Header

| | |
|---|---|
| Feature | The last five of Lutan's fourteen activity rulings: four unused Edit settings removed from the catalogue, `stock.usage` granted by the two forecast cards |
| Backlog item | `docs/backlog.md` → `#c4vn7` |
| Branch / worktree | `claude/adoring-dijkstra-b983e6` @ `C:\Development\Animal_Shelter_App-worktrees\adoring-dijkstra-b983e6` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #1515 |
| Tested by / date | Claude (Opus 5) / 2026-11-12 |
| Carries a migration? | yes — `0361_readonly_activities_and_stock_usage_card.sql` |
| Tested at SHA | the branch tip at the time of the final gates run; the gates block below is that run |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — four activities nothing ever asked at Edit become a new `readonly` kind (Read / None), and `stock.usage` is granted by the existing `food_forecast` and `medicine_forecast` cards; `#c4vn7` asked for exactly these two rulings to be built
- [x] Files/areas touched listed — `src/lib/permissions/` (`catalogue.ts`, `cards.ts`, `can.ts`, `require.ts`, `jobs.ts`), `src/lib/releases.ts`, `supabase/migrations/0361_…`, `docs/ungranted-activities-allowlist.json`, and six scripts that enumerate activity levels (`check-ungranted-activities`, `lib/readonly-checks`, `check-permission-catalogue`, `lib/permission-seed`, `check-home-screens`, `check-multi-role-build`). No route, page or component changed. **Two things outside the ruling, both forced by CI and both recorded as defects below:** `scripts/check-migration-numbers.mjs` + `scripts/lib/migrations.mjs` (the numbering rule was unsatisfiable) with eight new tests, and `scripts/gen-card-walkthrough.mjs` + the regenerated `docs/card-walkthrough.md` (`stock.usage` writes nothing)
- [x] Cards affected identified — `food_forecast` and `medicine_forecast` gain `stock.usage`; no card loses anything. The four removals change no card: every card holding one of those activities holds it at **read**, which is untouched (transient context only: who holds those cards today is irrelevant and was not recorded). Admin is unaffected, answering before a cell is read; the signed-out public is unaffected (no public page reads any of these)
- [x] Anything explicitly **out of scope** written down — the stock count-box mismatch recorded on the `stock.diets` / `stock.medications` allow-list entries is **moot under his rulings and deliberately not touched**; the silently-hidden controls (a `project_folders` login seeing photos with no Add and no message) are a courtesy gap recorded in #1511 and belong to somebody else's item; the nine records already in `adminOnlyOnPurpose` were not edited

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (fast-forward to `cbc2ec9a`)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 10s
=== gates: lint exited 0 after 148s
=== gates: test exited 0 after 39s
=== gates: build exited 0 after 80s
gates: typecheck=0 lint=0 test=0 build=0
```

An earlier run of the same tree reported `lint=1`, and the pipe it was first read through
(`node scripts/gates.mjs | tail`) returned **0** — the exact trap this section warns about. The
failure was real: `check-permission-catalogue`'s check B read the words `activity: "read"` inside a
new doc comment in `can.ts` as an activity key. The comment was reworded and the gates re-run in full;
the block above is that run.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — pending: **the number is now right and the second half of this line is NOT true, deliberately.** It is `0361`: `main` ends at `0359`, but PR #1513 (open, "[unfinished]") already claims `0360`, so the next free number is `0361`. Getting there took a renumber in each direction — the pre-commit hook has no network, so it cannot see open PRs and refuses `0361` as a gap, while CI runs the same script with `gh` and fails `migration-numbers` on the duplicate. CI is the authority; the hook's remedy is wrong whenever another PR holds the number. Two in-flight branches still carry a migration at once, which is against the rule and was this stream's call. Both are in `docs/decisions/2026-11-12-readonly-activities-and-stock-usage-card.md`, and the release manager needs to know before the production apply
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `362 applied, 1 pending`; it is what surfaced the duplicate `0360` above, by listing a row no file on `main` accounts for
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0360_readonly_activities_and_stock_usage_card.sql … ok`, exit 0, and again as `0361_…` after the renumber
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — first as `0360_…`, then, after CI refused that number, the row was removed with `--forget` and the file re-applied as `0361_…`. `--status` reads `0 pending` and lists no row of this stream's under the old name
- [x] File is re-runnable — the `kind` check constraint is dropped by discovered name and re-added, both catalogue rows and the card grant are `on conflict … do update`, and all four functions are `create or replace` with `drop trigger if exists` before each `create trigger`
- [x] Existing rows still read correctly after the change (checked against real dev data) — the file's own assertion block ran against dev's rows: the four activities are `readonly`, there are exactly four, `stock.usage` is on both forecast cards at level 2, and the four reads are still granted by cards (`raise notice … % cards hold their reads`)
- [x] **Constraints and defaults exercised against real rows** — the `--dry-run` is that harness: it runs the real DDL inside `begin … rollback` against dev's live rows, and the file's `do $a$` block raises on any of the four assertions above, so a dry-run that reported `ok` proves them. What the guards assert, and what makes this migration safe rather than merely applied: `permission_activities_guard_kind` refuses the kind change outright if **any** `role_permissions` cell or `card_grants` row holds one of the four at Edit — so the change could not have silently contradicted live data, and the fact that it applied is itself the evidence that no card or cell held one at Edit. The reciprocal guards were exercised by the upserts in the same file: `card_grants_guard_kind` passed `stock.usage` at 2 (a yes/no activity's only level) and would have raised on 1
- [x] Down-migration written, or the reason one is not needed is stated — not written, and the reason is that the change is reversible in one statement with nothing to lose: `update permission_activities set kind = 'level' where key in (…)` plus `delete from card_grants where activity = 'stock.usage'`. No column, table, view or row was dropped and no data was rewritten. Stated here rather than shipped as a file, since the repo does not keep unused down-migrations
- [x] Production apply plan stated for the release manager — apply `0361_readonly_activities_and_stock_usage_card.sql` to `dbkodyyxxhtygxcxmfcu` with `node scripts/apply-migrations.mjs --env production` **before** the deploy, because the code half reads the grant. Expect **one knock-on**: until it is applied, `node scripts/check-production.mjs activities-grantable` on production FAILS on `stock.usage at edit`, since the allow-list record that excused it is gone (as #1511's decision file required) and the card grant that closes it is in this file. That clears with the apply

## 4. Functional checks

- [x] Happy path works end to end — a login holding exactly `food_forecast` is served the **Stock between counts** link on Management → Diets, and the report itself at `/management/stock-usage`; same for `medicine_forecast` from Medications. Driven against the running dev server (`:3002`) with a one-card login, reading **what the server sent**: the HTML and the redirects, not a screenshot. The browser pane was not used for this, on purpose — `CLAUDE.md` records that it never fires `requestAnimationFrame` on a page loaded by its address, so only the layout hydrates and a working page can look dead
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written, so there is nothing to persist. The grant is a `card_grants` row, read fresh on every request; each login below was a fresh sign-in and saw it
- [ ] Create / edit / delete all exercised — n/a: nothing in this change writes. `stock.usage` opens a read-only report, and the four removals take away a setting nothing ever used
- [ ] Empty state renders sensibly — n/a: the report's own empty state is unchanged by this PR and was not touched
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input. The database's own refusals were exercised instead (section 3)
- [x] Boundary cases checked — the boundary here is the **level**, not a value, and both sides were exercised. `can(perms, "roles.view", "read")` still compiles and still answers yes for a `who_does_what` login (the page opened, below). `can(perms, "roles.view", "edit")` no longer compiles: a deliberate call was added to `src/lib/permissions/who-does-what.ts` and `npm run typecheck` exited **2** with

```
src/lib/permissions/who-does-what.ts(11,10): error TS2769: No overload matches this call.
  Overload 1 of 3, '(perms: Permissions | null | undefined, activity: "reports.expenses" | "roles.view" | "resident.who_and_where" | "photos.resident_medical", level: "read"): boolean', gave the following error.
```

  — which also shows the readonly overload carries exactly the four ruled keys and nothing else. The probe was reverted (`git status` clean). The database half of the same boundary is section 3

### Role access matrix

Every line below is one run of the dev server at `:3002` with a login holding **exactly** that card
(`node scripts/dev-signin.mjs --cards <card> --port 3002`, so no real role was touched and no other
stream was signed out). `REFUSED` means the server redirected to its own no-access page, which is
what `requirePermission` does — the status is 200 because the refusal is a page.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `food_forecast` | `/management/diets`, `/management/stock-usage` | the **Stock between counts** link is in the Diets page, and the report opens — this is the change | **as expected.** `/management/diets` 200 with `Stock between counts: compare stocktakes with the plan` present; `/management/stock-usage` 200 and the report rendered |
| exactly `medicine_forecast` | `/management/medications`, `/management/stock-usage` | same, from the Medications page | **as expected.** `/management/medications` 200 with the link present; `/management/stock-usage` 200 |
| exactly `who_does_what` | `/admin/who-does-what` | opens — `roles.view` **read** is untouched by the removal | **as expected.** 200 with the page's own title present. And `/management/stock-usage` REFUSED for this login, so the grant is not leaking |
| exactly `view_expenses` | `/management/expenses` | opens — `reports.expenses` **read** is untouched | **as expected.** 200, the report rendered |
| exactly `enclosures` | `/enclosures` | opens — `resident.who_and_where` **read** is untouched (this card is that read plus `facility.enclosures`) | **as expected.** 200, 224 KB of real content |
| exactly `add_medical_photos` | `/medical/photos` | opens — `photos.resident_medical` **read** is untouched | **as expected.** 200, no refusal |
| exactly `view_medical` | `/medical/photos` | REFUSED, and **not** because of this change: that page asks `photos.medical_add`, which this card does not hold | **as expected.** REFUSED. Checked so the row above is not read as proof of more than it is |
| signed out | `/management/stock-usage`, `/admin/who-does-what` | 307 to sign-in | **as expected.** `307 -> /login?next=…` for both |
| admin | everything | yes to every activity before a cell is read | **not driven, and deliberately not.** The `admin` login is keyed by role and shared by every stream, so re-keying it would sign another stream out. Admin's path is unchanged by this PR (the `perms.isAdmin` short-circuit in `can.ts` is not touched) and `check-permission-catalogue` asserts it on every lint run: *C Admin is yes with no cells*, plus *C an unknown key is no, even for Admin* |

- [x] Every login above tested, except the admin row, whose reason is in the row itself
- [x] A login that should not have access is blocked server-side — `/management/stock-usage` was hit **by its address** as `who_does_what`, `view_expenses`, `enclosures` and `view_medical`, and every one was refused by `requirePermission("stock.usage")` rather than merely unlinked; signed out it is a 307 to sign-in

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched. `/management/stock-usage` is `menu: false` in the route registry and is reached by its link on Diets, Medications and Deliveries, all three of which already gate on `can(perms, "stock.usage")`
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the `stock-usage` topic already exists and is keyed on the `stock.usage` activity, so it starts showing to the two cards' holders with no edit; no manual text states who may open it
- [ ] Translatable strings go through the translation path — n/a: no new string. The one new user-facing sentence is a release note, which is not translated
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no browser session was driven, on purpose (section 4 says why), so there was no console to read. What replaces it for this change: every page above was fetched from the dev server and its **own HTML** inspected, and the dev server's log showed no error for any of those requests
- [x] Network clean — every request made in section 4 is listed there with its status: 200 for each page that should open, 200 + the no-access page for each refusal, 307 to sign-in when signed out. No 4xx and no 5xx

## 6. Regression

- [x] The pages nearest the change still work — `/management/diets`, `/management/medications`, `/management/expenses`, `/admin/who-does-what` and `/medical/photos` were each served to a login holding exactly the card that opens it (section 4). **Not checked, and worth saying:** whether the Diets and Medications pages still withhold the count box and the Order link from those logins was not inspected in the HTML — that behaviour is `stock.diets`/`stock.medications` at **edit**, which this PR does not touch and which his ruling leaves with Admin
- [x] Any shared file touched checked from a second, unrelated page — `catalogue.ts`, `can.ts`, `require.ts` and `jobs.ts` are read by every guarded page, so unrelated pages were **loaded**, not read: `/enclosures` served 224 KB of real content to a login holding exactly `enclosures` (and that page asks `resident.who_and_where` at read, one of the four activities this PR changed), and `/medical/photos` served to `add_medical_photos` (which holds another of the four). Both would have been refused if the read had been lost
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync was a fast-forward of backlog commits only, and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#c4vn7` ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-12-readonly-activities-and-stock-usage-card.md`: why the ruling needed a third activity kind, why the removal is enforced three ways rather than commented, why this is one PR and not a schema PR first, and the duplicate `0360`
- [x] `README.md` still accurate — no change to anything it describes
- [x] **Release notes.** Would a shelter user notice this change? Yes, one half of it: `unreleased` in `src/lib/releases.ts` gained a line saying the Food forecast and Medicine forecast cards now open Stock between counts, and that correcting a count is unchanged. The four removals are invisible to everyone — no screen, save or setting anybody could reach ever used them — so they are deliberately not in the note. No step is outstanding before a user sees this beyond the ordinary production apply and deploy, which is what the note ships with
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every count in them is from a run quoted in this plan; the "no caller asks these at edit" claim is from a search of `src`, `scripts`, `supabase` and `worker` for all four keys, not from the walkthrough's say-so; the duplicate `0360` is from `--status` and from `git ls-tree` across every remote branch

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this change derives a date or an instant
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no date, threshold, rounding rule, retry window or pagination limit is touched. The one boundary this change does move is the permission level, and both sides of it are exercised in section 4 and section 3
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block and every quoted script line are as the runs printed them
- [ ] Public pages re-checked after a cache purge — n/a: no public page reads any of these activities

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes — `cards.ts` names the grant and `catalogue.ts` names the kinds, and `check-permission-catalogue` fails if either half ships alone, which is why they are one PR. **So the production apply runs BEFORE the deploy**, as written into the apply plan in section 3
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing is dropped or rewritten. Four rows change one text column; one table gains two rows
- [x] Apply plan stated — section 3, with the `activities-grantable` knock-on named

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the code half rolls back with the Pi rebuild (`./scripts/pi/deploy-pi.sh --ref <sha>`); `npx wrangler rollback --env production` reverts only the Worker fallback, and neither reverts the migration. The migration needs no down-migration to be safe to leave in place (it is additive and reversible in two statements, quoted in section 3), **but the two halves must not be left split for long in the other direction**: with 0360 applied and the code rolled back, the old build simply never asks for the Edit levels, so nothing breaks

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The brief's claim that the one-migration-at-a-time slot was free was wrong: `claude/adopter-update-app` (PR #1513) carries `0360` and had already applied it to dev | accepted and disclosed — this migration is `0361`; the decision file records both the clash and which check to trust |
| 2 | **medium** | `check-migration-numbers.mjs` was **unsatisfiable**: `0360` failed its open-PR rule and `0361` failed its gap rule, because "one past the highest" was worked out from `main` alone. Its own advice — "take the next free number" — was rejected by its own gap rule | **fixed in this PR**, at Lutan's direction: "the next free number" now counts numbers other open PRs hold (`numbersClaimedByOpenPrs()`), the PRs are read once for both halves, and `evaluate()` is exported with seven tests covering this case. Nothing weakened — a real gap, a number on main, two files sharing one, and a collision each still fail, each with a test |
| 3 | low | The pre-commit hook will still send you the wrong way: it runs the same script offline, where the open-PR check cannot run, so it refuses `0361` as a gap | accepted, deliberately not fixed — the script's header says the hook must never touch the network. CI (or `gh pr list`) is the authority; the decision file says so |
| 4 | low | Renumbering by searching `docs/backlog.md` for `0360` also rewrote two copies of a postcode (`Chiang Mai 50360`) and a sentence of another item | fixed — reverted and edited by hand; caught by reading the diff, not by a check |
| 5 | low | The card walkthrough generator treated `stock.usage` as a write and emitted a TODO asking where the write shows, on both forecast cards | fixed in this PR — it now carries the same kind of answer `roles.view` has: nothing is written, confirm the report opens and offers no control that changes a figure |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | the one user-visible change was driven with a card-only login (section 4); everything else is a setting nobody could reach |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-11-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing needs a person to look at it — the only change a user sees is the Stock between counts link, which was driven with a login holding exactly `food_forecast` and exactly `medicine_forecast`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet read
