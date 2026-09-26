# Feature test plan

## Header

| | |
|---|---|
| Feature | `record_stocktake()` becomes security definer and admits staff and volunteers as well as admin and management, so the people who walk the shelves can use the stocktake sheet (`0091`) |
| Backlog item | Second schema half of **Stocktake page: count everything in one go**. Not ticked here: it closes with `claude/stocktake` |
| Branch / worktree | `claude/stocktake-schema` @ `C:\Development\Animal_Shelter_stocktake-schema` |
| Dev server | n/a: none started, nothing to render |
| PR | #140 |
| Tested by / date | Claude (automated) / 2026-09-26 |
| Carries a migration? | yes: `0091_record_stocktake_staff.sql` |
| Tested at SHA | `b0b7a60` (branch on `main` @ `a6e693a`): migration and harness. The later commit adds only this plan and `decisions.md` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item said "same roles as today's stock edit". Lutan widened that on 2026-09-26 to staff and volunteers, and this is the database half of the change
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0091_record_stocktake_staff.sql`, `scripts/check-stocktake.mjs` (now replays 0088 then 0091), `docs/decisions.md`, this plan. No route, component, `worker/` or shared lib code
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Staff and volunteer gain `record_stocktake`. Admin and management are unchanged. Vet, public_viewer, role-less and signed-out users are still refused. No table policy changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no UI. Staff will reach the function through the stocktake page (`claude/stocktake`). The single stock cell on the Management pages stays management-only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: the branch was cut from `origin/main` @ `a6e693a`. After the PR opened, main gained #141 (public-site-home) and #142 (worktree tooling), and `sync` merged both cleanly. Neither touches `supabase/`, `record_stocktake` or anything this branch changes; CI re-runs the three gates on the merged tree
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`: run at `b0b7a60`, closing lines as printed: `=== gates: build exited 0 after 277s` then `gates: typecheck=0 lint=0 build=0`
- [x] CI green on the PR (runs the same three): PR #140, run 36214059960 at `ddbf786` — `check` pass (1m25s), `migration-numbers` pass. `test-plan` failed only because this plan was not yet committed; it is added in the next commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0091_record_stocktake_staff.sql (against origin/main a6e693a, highest 0090_standard_diet_functions.sql)`. `gh pr list --state open` returned `[]`. The only other `*-schema` worktree has nothing beyond `main`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 90 applied, 1 pending.`, `On origin/main, not applied here: 0`, `Applied here, no file on origin/main: 0`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0091_record_stocktake_staff.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0091_record_stocktake_staff.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace` with the same signature and return type, and an idempotent revoke/grant. The harness runs the file twice
- [x] Existing rows still read correctly after the change (checked against real dev data): no column or row changes. The harness reads and writes real `medication` / `diet_types` rows inside a rollback
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-stocktake.mjs`, run after the apply. It replays 0088, then 0091 twice, and creates throwaway management, admin, staff, volunteer, vet, public_viewer, role-less and anon logins. All of 0088's assertions (A–F, H) are kept. New assertions:
  - I: staff and volunteer each save a medication and a diet type in one call, stamped `now()`. A volunteer's negative count is still refused, with nothing written.
  - G: vet, public_viewer and role-less logins are refused by the guard, anon by the grant.
  - J: a direct `update medication` / `update diet_types` as staff touches 0 rows, and the function is `prosecdef` with `search_path=public`.

  Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0088 then 0091 twice | A 2 meds + 1 diet in one call, all stamped now() | B same figure restamps | C zero is a count | D unlisted row untouched | E admin ok, null and [] lists ok | F refused, nothing written: | management: {"medication_updated":2,"diet_types_updated":1,"counted_at":"2026-09-26T03:10:58.300112+00:00"} |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  A stock count cannot be negative. |  The same medication is listed twice. |  Stocktake not saved: 1 of 2 medications were found. Reload  |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  The medication counts must be a list. | staff ok | volunteer ok | bad diet list stops the meds | G vet, public_viewer and role-less refused by the guard, anon by the grant | I staff and volunteer save both tables; still refused before writing | J staff cannot update either table directly; definer + search_path | H grants
  CONTEXT:  PL/pgSQL function inline_code_block line 130 at RAISE
  ```
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: to undo, re-apply `0088`'s definition in a new file. No data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `node scripts/apply-migrations.mjs --env production --dry-run`, then again without `--dry-run`, from the main checkout after merge, against `dbkodyyxxhtygxcxmfcu`. Production already has 0088. No deployed code lets a staff user reach the function until the stocktake page ships, so this can go any time before that deploy

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface. The RPC's happy path for staff and volunteer is harness I
- [ ] Data persists — reload the page and the change is still there — n/a: no page calls the function yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI. The one write (saving counts) is exercised per role in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI. Empty lists are harness E
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI. The function's messages are harness F and I
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI. Zero and negative counts are harness C, F and I

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `record_stocktake` | saves | harness E: saved |
| management | `record_stocktake` | saves | harness A: saved |
| staff | `record_stocktake`; direct UPDATE | saves; direct UPDATE touches nothing | harness I: saved; J: 0 rows |
| volunteer | `record_stocktake` | saves | harness I: saved |
| vet | `record_stocktake` | refused | harness G: `Not authorized to record a stocktake.` |
| public_viewer | `record_stocktake` | refused | harness G: `Not authorized to record a stocktake.` |
| signed out | `record_stocktake` | refused by the grant | harness G: `permission denied for function record_stocktake` |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): vet, public_viewer and role-less logins are refused inside the function, anon by the grant

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user operates yet. The feature branch updates the Management topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no translatable fields
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no page loaded
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page calls `record_stocktake` yet. All of 0088's assertions for admin and management (A–F, H) still hold after 0091, in the same harness run
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file — n/a: no shared runtime file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: #141 and #142 were merged in after the PR opened. This branch changes no runtime code, and neither of them calls `record_stocktake` or touches `supabase/migrations/`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the stocktake item closes with `claude/stocktake`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-26 — Staff and volunteers can save a stocktake; `record_stocktake` is security definer (`0091`)"
- [x] `README.md` still accurate: it does not list migrations or RPCs
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing a user can reach calls the function yet. The stocktake page's own PR adds the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "Staff still cannot update either table directly" is harness J (0 rows). "No UPDATE policy for staff and volunteers" comes from reading `0027`/`0043`/`0051`, and J measures it. "An RLS policy cannot be limited to one column" is how Postgres works (policies act on rows; column limits are grants), so that one is reasoned, not measured

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no runtime code changes
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no runtime code
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band or threshold. The role list is covered role by role
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, who reads it against a rerun of the harness
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: public pages do not call this function

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — n/a: no deploy needed for this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy needed for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code reads it
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (production reads are refused from a worktree)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: replaces one function, no data changes
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy: see the last line of §3

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. To undo, re-apply 0088's definition in a new migration. Once the stocktake page ships, that would also stop staff and volunteers saving from it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | None: there is no screen to look at | — |

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
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links `docs/test-plans/stocktake-schema.md`, which is the record
- [ ] Handed to the production release manager — n/a: not yet; that happens at the production apply, after merge

Result: pass

Release manager acknowledgement: n/a: no release manager has read it yet
