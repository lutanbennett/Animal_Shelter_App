# Feature test plan

## Header

| | |
|---|---|
| Feature | Three additive migrations: `diet_types.is_standard` with a one-standard index and a backfill of diet-less residents (`0087`), `record_stocktake()` to save a whole count sheet in one transaction (`0088`), and `is_known_drive_file` revoked from anon and authenticated (`0089`) |
| Backlog item | `docs/backlog.md` → **Take `is_known_drive_file` back from anon** (ticked here). Schema halves of **Standard diet: flag it, make a diet mandatory at intake, and show special diets on enclosure cards** and **Stocktake page: count everything in one go** (not ticked: they close with their feature branches) |
| Branch / worktree | `claude/schema-diet-stocktake-drivefile` @ `C:\Development\Animal_Shelter_schema-diet-stocktake-drivefile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003`, used only to fetch the photo proxy signed out |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (automated) / 2026-09-26 |
| Carries a migration? | yes: `0087_standard_diet_flag.sql`, `0088_record_stocktake.sql`, `0089_is_known_drive_file_revoke.sql` |
| Tested at SHA | `df58e0c` (branch on `main` @ `3fffb91`): migrations, harnesses and the allow-list change. The later commit adds only this plan, `decisions.md`, the backlog tick and the release-notes line |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three additive migrations, exactly the three the brief lists. `0087` flags the standard diet and backfills (the planning default, flagged in the PR for Lutan to overrule). `0088` adds the one-transaction stocktake save. `0089` revokes the drive-file lookup
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): the three migrations; `scripts/check-public-views.mjs` (allow-list); new dev-only rollback harnesses `scripts/check-standard-diet.mjs` and `scripts/check-stocktake.mjs`; `src/lib/releases.ts` (one `unreleased` line); `docs/decisions.md`, `docs/backlog.md`, this plan. No route, component, `worker/` or shared lib code
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. `0087`: nobody's access changes; the new column is covered by `diet_types`' table grants and RLS. `0088`: EXECUTE for authenticated and service_role, and the function itself admits only admin and management (as today's stock edit does). `0089`: anon and authenticated lose EXECUTE on `is_known_drive_file`; nothing in the app calls it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no UI. `record_intake` still accepts a null diet, because the intake form still sends one for "None yet"; refusing it belongs to the feature branch, which changes form, action and RPC together. Moving the standard on Management → Diets, special-diet markers on enclosure cards, and the stocktake page are all feature work

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.` before the work. After the PR opened, main gained #133 (Drive failure messages, `ced8216`). The second sync conflicted only in `src/lib/releases.ts`, where both PRs added an `unreleased` line, and both lines were kept. #133 carries no migration and does not call `is_known_drive_file`, `record_stocktake` or `is_standard` (grep of `src/`). CI re-runs the three gates on the merged tree
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run at `1a9d4ee`; closing lines as printed:

  ```
  === gates: build exited 0 after 185s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0087_standard_diet_flag.sql, 0088_record_stocktake.sql, 0089_is_known_drive_file_revoke.sql (against origin/main 3fffb91, highest 0086_app_access_gate.sql)`. `gh pr list --state open` returned `[]`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 86 applied, 3 pending.`, `On origin/main, not applied here: 0`, `Applied here, no file on origin/main: 0`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0087_standard_diet_flag.sql … ok`, `dry-run 0088_record_stocktake.sql … ok`, `dry-run 0089_is_known_drive_file_revoke.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0087_standard_diet_flag.sql … ok`, `applying 0088_record_stocktake.sql … ok`, `applying 0089_is_known_drive_file_revoke.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): both harnesses run their file twice. `0087` flags by name only when nothing is flagged, and its harness moves the flag and re-runs the file to show it stays moved and no rows are added. `0089` is revoke/grant only
- [x] Existing rows still read correctly after the change (checked against real dev data): read back after the apply: `"standard":["Standard Kibble + Chicken"]`, `"backfilled":4`, `"living_without":0`; the four were three 2026-09-24 test intakes taken in with "None yet" and one resident whose only diet had ended
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. `check-standard-diet.mjs` asserts the column shape and the partial unique index, exactly one standard (the named one), nobody living left without a current diet, one standard-from-today row per such resident, deceased and adopted untouched, a planted resident with a diet booked for today + 5 backfilled only to today + 4, a second standard refused, and a moved flag surviving a re-run. `check-stocktake.mjs` creates throwaway management, admin, staff, role-less and anon logins and asserts: two medications and a diet type saved in one call share `now()`, an unchanged figure is restamped, zero is a count, an unlisted row is untouched, and null or `[]` lists are fine. Null, missing, string, negative, repeated (also by upper-case id), non-uuid and unknown ids are refused with nothing written, even when a valid row came first or the bad row was in the other list. Staff and role-less callers are refused by the function's guard, anon by the grant, and the grants read anon no, authenticated and service_role yes. Output after the apply, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK shape: is_standard not null default false + partial unique index | one standard, the named one | 1 living resident(s) without a current diet before (incl. 1 planted booked-ahead), 0 after, one standard-from-today row each | deceased/adopted untouched | booked-ahead resident stops at today + 4 | second standard refused | move then re-run keeps the moved flag and adds no rows
  CONTEXT:  PL/pgSQL function inline_code_block line 14 at RAISE
  ```

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK file ran twice | A 2 meds + 1 diet in one call, all stamped now() | B same figure restamps | C zero is a count | D unlisted row untouched | E admin ok, null and [] lists ok | F refused, nothing written: | management: {"medication_updated":2,"diet_types_updated":1,"counted_at":"2026-09-26T00:44:23.1968+00:00"} |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  A stock count cannot be negative. |  The same medication is listed twice. |  Stocktake not saved: 1 of 2 medications were found. Reload  |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  The medication counts must be a list. | bad diet list stops the meds | G staff and role-less refused by the guard, anon by the grant | H grants
  CONTEXT:  PL/pgSQL function inline_code_block line 93 at RAISE
  ```

  Before the apply, the same `check-standard-diet.mjs` reported `5 living resident(s) without a current diet before (incl. 1 planted booked-ahead)`, which is the four real residents plus the planted one
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: `0088` is a new function (drop it) and `0089` is a grant (re-grant to anon and authenticated). `0087` adds a column and index (drop them); its backfilled `resident_diets` rows carry the note `Backfilled with the shelter's standard diet (0087)…` and can be deleted by that note if Lutan overrules the backfill
- [x] Production apply plan stated for the release manager (which file, which project, when): `node scripts/apply-migrations.mjs --env production --dry-run`, then without `--dry-run`, from the main checkout after merge, against `dbkodyyxxhtygxcxmfcu`. No code in this PR reads any of it, so it can go before or after any deploy. `0089` is safe there because production already runs 0.5.0, whose photo proxy no longer calls the function

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; no app code calls `record_stocktake` or reads `is_standard` yet. The RPC's happy path is harness case A
- [ ] Data persists — reload the page and the change is still there — n/a: no page reads these objects yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI; the writes the schema allows (save counts, move the flag) are exercised in the harnesses
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI; empty lists to the RPC are harness case E
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI; the RPC's own messages for each invalid input are harness case F above
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI. At the database: zero and negative counts (C, F), a diet booked to start later (F of the diet harness)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `record_stocktake` | saves | harness E: saved |
| management | `record_stocktake` | saves | harness A: saved |
| staff | `record_stocktake` | refused by the function | harness G: `Not authorized to record a stocktake.` |
| vet | `record_stocktake` | refused, same guard as staff | not run separately: the guard admits only admin and management, and the role-less login also got `Not authorized` |
| volunteer | `record_stocktake` | refused, same guard as staff | not run separately, as vet |
| signed out | `record_stocktake`, `is_known_drive_file` | refused by the grant | harness G and `check-public-views`: `permission denied`, HTTP 401 for both |

- [ ] Every role above tested — n/a: vet and volunteer are refused by the same `not in ('admin', 'management')` guard staff and role-less logins were refused by; no page is involved
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff and role-less refused inside the function; anon refused at `/rest/v1/rpc/record_stocktake` and `/rest/v1/rpc/is_known_drive_file` (HTTP 401, `check-public-views.mjs`); `has_function_privilege` for `is_known_drive_file` on dev reads `anon false, authenticated false, service_role true, postgres true`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user operates yet; the feature branches update the intake, Enclosures and Management topics
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no translatable fields added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no page loaded in a browser; the only runtime check was curl against the photo proxy
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: the dev server's log showed `No server errors found.` after the photo-proxy requests below

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked). The photo proxy, signed out, on `next dev` port 3003 against dev after `0089`: a public resident photo `200 image/jpeg` (twice), and a blood-test/procedure attachment `404 application/json` (twice). `check-public-views.mjs` exited 0 with 113 `ok` lines, including `is_known_drive_file(): anon EXECUTE is refused — HTTP 401`, `is_public_drive_file(): anon can EXECUTE — HTTP 200`, `is_public_drive_file(): yes for a public resident photo — true`, `is_public_drive_file(): no for a blood-test/procedure file — false`. `check-public-drive-file.mjs` (calls `is_known_drive_file` as the owner) and `check-app-access-gate.mjs` both ended `HARNESS-OK`. `test.lannacare.org` could not show this: it sends every signed-out request to `/login` (307)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file — n/a: no shared runtime file touched. `releases.ts` gained one string in `unreleased`, covered by typecheck and build
- [x] Nothing merged from `main` during `sync` was broken by this branch: the one merge brought in #133, which touches Drive uploads and the admin page. This branch changes no runtime code, and none of #133 calls the three objects changed here

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): "Take `is_known_drive_file` back from anon" ticked. The standard-diet and stocktake items stay open for their feature branches
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-26 — Standard diet flag, stocktake RPC, `is_known_drive_file` revoked (`0087`–`0089`)": flag not name, zero-or-one, clear-then-set, the backfill default and how it differs from `0069`, why `record_intake` is left alone, one function for both tables, absent vs null, the in-function guard, and why authenticated lost `is_known_drive_file` too
- [x] `README.md` still accurate: it does not list migrations or RPCs
- [x] **Release notes.** Would a shelter user notice this change? Yes, the backfill: a resident with no diet now shows the standard one on their Diet tab. `unreleased` gained a line saying so and how to change it. The flag, the RPC and the revoke have no visible effect
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "Dev had four" is the read-back above. "no function, policy or view calls it" is a `pg_proc` / `pg_policies` / `pg_views` search on dev that returned null for all three. "`now()` is fixed per transaction, which gives every row the same time" is harness A (both medications equal `now()`). The row-by-row unique check behind "clear then set" is Postgres's documented behaviour for a non-deferrable unique index; the harness exercises clear-then-set, not the single-statement failure

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no runtime code changes; the dev database the test site reads already has the migrations
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no runtime code; the test site's gate sends signed-out requests to login, and the proxy was checked on `next dev` instead (§6)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `0087` dates the backfill with `shelter_today()`, the shelter-date function every other migration uses; nothing else here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band or threshold. The one boundary, "current diet" (`start_date <= today` and `end_date` null or `>= today`), is exercised by a diet ending yesterday and one starting at today + 5
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, who reads it against a rerun of the two harnesses
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: public pages do not call `is_known_drive_file`; the photo proxy they use was checked in §6

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — n/a: no deploy needed for this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy needed for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code reads it. The ordering that matters is `0089` after 0.5.0, which production already runs
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (production reads are refused from a worktree)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: additive; `0087` inserts `resident_diets` rows and changes none
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy: §3's last line

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. Undoing is the reverse DDL in §3's down-migration line; the backfilled rows are found by their note. Re-granting `is_known_drive_file` to anon would reopen the hole it closes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Found while testing, not caused by this branch: `check-stock-on-hand.mjs` fails its precondition `FAIL A medication: 4 rows with a non-null new column` because dev has real counts since 0.5.0, and `check-shelter-friends.mjs` fails because it replays `0076`, which names `approved_translations` from before `0082` moved it to `private`. Both would fail the same way on `main` | accepted: both harnesses assume the database as it was before their own later migrations; reported in the PR |
| 2 | Low | Found while writing `0088`: a non-uuid id would have failed with a raw cast error, and the same id in two cases would have slipped the duplicate check and failed later as "1 of 2 found" | fixed before commit: ids are checked for uuid form and compared as uuid; harness F covers both |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | None: there is no screen to look at. (Whether the backfill stands is a decision for Lutan, raised in the PR description, not a check) | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person: empty, no UI surface

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: no release manager has read it yet
