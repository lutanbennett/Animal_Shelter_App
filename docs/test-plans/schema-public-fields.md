# Feature test plan

## Header

| | |
|---|---|
| Feature | Schema halves for three items: WhatsApp / Messenger / X on `site_content` (`0092`), stock count history written by `record_stocktake()` (`0093`), and a resident's hook line and ideal home on the public profile (`0094`) |
| Backlog item | `docs/backlog.md` → "More ways to contact the shelter: Facebook Messenger, WhatsApp and X (Twitter)", "Actual usage from stocktakes, compared with planned usage", "Public site redesign" part 3. None ticked here: each closes with its batch-2 feature branch |
| Branch / worktree | `claude/schema-public-fields` @ `C:\Development\Animal_Shelter_schema-public-fields` |
| Dev server | n/a: none started, nothing to render |
| PR | opened from this commit |
| Tested by / date | Claude (automated) / 2026-09-26 |
| Carries a migration? | yes: `0092_contact_channels.sql`, `0093_stock_counts.sql`, `0094_resident_hook_ideal_home.sql` |
| Tested at SHA | branch on `main` @ `3c2c9ae`; migrations, harness and gates as committed in this PR's first commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three additive schema changes, each the "schema PR first" half its backlog item names, and no app code
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0092`–`0094`, `scripts/check-stocktake.mjs` (now replays 0093 and asserts the history), `docs/decisions.md`, this plan. No route, component, `worker/` or shared lib
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. `stock_counts` is readable by admin, management, staff and volunteer, and written only through `record_stocktake()` (whose callers are unchanged from 0091). Vets read none of it, and anon is refused. Signed-out visitors can read `site_content` and `public_resident_profiles` as before, with new columns that are all null today
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no UI, no admin fields, no manual. **Stock received is not recorded**, so actual usage cannot be computed yet (decisions.md, 2026-09-26). The single-cell stock edit on Management writes no history. The hook and ideal home are not on `public_resident_cards`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: merged `3c2c9ae` before any work, no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`: closing lines as printed: `=== gates: build exited 0 after 247s` then `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: highest on `origin/main` @ `3c2c9ae` is `0091_record_stocktake_staff.sql`; `gh pr list --state open` returned `[]`. `node scripts/check-migration-numbers.mjs` is run again by the pre-commit hook and CI
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 91 applied, 3 pending.`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed. The first dry-run **failed on 0094**: `function approved_translations(unknown, uuid) does not exist`. That was a real defect (#1 below), not the pending-file artefact CLAUDE.md warns about. After the fix: `dry-run 0092_contact_channels.sql … ok`, `dry-run 0093_stock_counts.sql … ok`, `dry-run 0094_resident_hook_ideal_home.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0092_contact_channels.sql … ok`, `applying 0093_stock_counts.sql … ok`, `applying 0094_resident_hook_ideal_home.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): guarded columns, `create table/index if not exists`, `drop policy if exists`, `create or replace`, `on conflict do nothing`, and a back-fill guarded by `not exists`. `check-stocktake.mjs` runs 0093 twice and asserts the second run adds no history rows (K0)
- [x] Existing rows still read correctly after the change (checked against real dev data): `pg_get_viewdef('public_resident_profiles')` was read before and after 0094. The two are identical apart from `hook_line, ideal_home` appended, and both return 2 rows. `check-public-views.mjs` passes on dev: `public_resident_profiles: anon can SELECT — HTTP 200`, `site_content: anon can SELECT — HTTP 200`, `stock_counts: anon SELECT is refused — HTTP 401`
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. There are two harnesses, both against dev and both rolled back.
  - `node scripts/check-stocktake.mjs` proves `record_stocktake` still behaves as 0088 promises now that it writes history. All of the earlier assertions (A–J) still pass on top of 0093. New assertions:
    - K0: the back-fill writes one row per counted item, and nothing on a second run.
    - K1: one history row per listed item. They share one `stocktake_id` and have the stored figure, the unit, the item's own `stock_counted_at` (= `now()`) and the caller. There is no row for the unlisted item.
    - K2: refused calls (F, G and the volunteer refusal) write no history.
    - K3: each call gets its own `stocktake_id` and is attributed to its caller.
    - K4: staff can read the history but get 42501 on insert (so a count cannot be back-dated), update and delete. A vet reads 0 rows, and anon gets 42501.
    - K5: deleting a counted medication succeeds and cascades its history.

    Output, unedited:

    ```
    status 400
    Failed to run sql query: ERROR:  P0001: HARNESS-OK 0088, 0091 twice, 0093 twice | K0 back-fill one row per counted item, none on re-run | K1 one history row per listed item: one stocktake id, stored figure, unit, same stamp, caller; none for the unlisted row | K2 refusals write no history | K3 each call its own stocktake id, attributed | K4 staff read-only, vet sees none, anon refused | K5 delete cascades | A 2 meds + 1 diet in one call, all stamped now() | B same figure restamps | C zero is a count | D unlisted row untouched | E admin ok, null and [] lists ok | F refused, nothing written: | management: {"medication_updated":2,"diet_types_updated":1,"counted_at":"2026-09-26T08:36:24.223174+00:00"} |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  A stock count cannot be negative. |  The same medication is listed twice. |  Stocktake not saved: 1 of 2 medications were found. Reload  |  Every medication count needs an id and a number. Leave out  |  Every medication count needs an id and a number. Leave out  |  The medication counts must be a list. | staff ok | volunteer ok | bad diet list stops the meds | G vet, public_viewer and role-less refused by the guard, anon by the grant | I staff and volunteer save both tables; still refused before writing | J staff cannot update either table directly; definer + search_path | H grants
    CONTEXT:  PL/pgSQL function inline_code_block line 230 at RAISE
    ```
  - A session harness (scratch, not committed) covered 0092 and 0094. For 0092: `whatsapp_number = '+66 81 234 5678'` and `javascript:` in `messenger_url` / `x_url` are each a `check_violation`, while `66812345678`, `https://m.me/…` and `https://x.com/…` are accepted. For 0094: setting an English `hook_line` queues a pending en→th translation, a Thai `ideal_home` queues th→en, and `public_resident_profiles` returns the new value. As anon, `hook_line, ideal_home` are selectable and the profile count is still 2, so adopted and deceased residents are still hidden. Result: `all assertions passed`. A negative control (expecting 3 profiles) failed as it should: `P0001: anon profile count changed`. Afterwards `stock_counts` still held its 6 back-filled rows, so the rollback held
  - Nothing is back-filled by 0092 or 0094; the new columns are null on every row
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: all additive. To undo, drop the columns and `stock_counts`, re-create `public_resident_profiles` without the two columns, and re-apply 0091's `record_stocktake` in a new file
- [x] Production apply plan stated for the release manager (which file, which project, when): after merge, from the main checkout, `node scripts/apply-migrations.mjs --env production --dry-run` and then the same without `--dry-run`, against `dbkodyyxxhtygxcxmfcu`. Run it before the deploy that ships any of the batch-2 features. It is safe any time before that, because no deployed code reads the new columns, and the deployed stocktake page's call to `record_stocktake` has the same signature and result

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, and no code reads these yet. The RPC's happy path with history is harness K1/K3
- [ ] Data persists — reload the page and the change is still there — n/a: no page reads the new columns
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI. History insert is K1, and the refused update/delete is K4; item delete is K5
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI. All new columns are null, and `public_resident_profiles` still returns the same rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI. The database checks are exercised in the session harness (0092) and F/K4 (0093)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI. A zero count (C), a negative count (F), a formatted WhatsApp number and a `javascript:` link (0092) are covered in the harnesses

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `record_stocktake`; `stock_counts` | saves with history; reads | harness E: saved, 1 history row |
| management | `record_stocktake`; `stock_counts` | saves with history; reads | harness A/K1: 3 rows, one stocktake |
| staff | `record_stocktake`; `stock_counts` direct | saves with history; read-only | harness I/K3: saved; K4: reads, 42501 on insert / update / delete |
| vet | `record_stocktake`; `stock_counts` | refused; reads nothing | harness G: refused; K4: 0 rows |
| volunteer | `record_stocktake` | saves with history | harness I/K3: saved, attributed |
| signed out | `stock_counts`; `public_resident_profiles`; `site_content` | refused; reads; reads | K4 and `check-public-views.mjs`: 401 on `stock_counts`, 200 on the other two |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): `check-public-views.mjs` sends anon's `GET /rest/v1/stock_counts` and gets `HTTP 401`. A vet is filtered to 0 rows by RLS (K4)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user operates yet; each feature branch updates its own topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no page shows them yet. The database half is proven: `hook_line` and `ideal_home` are `translatable_fields` rows, and the session harness shows both queued as pending
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no page loaded
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/adopt` and `/adopt/[id]` read `public_resident_profiles`, whose definition is unchanged apart from two appended columns and whose anon row count is unchanged (2). `/stocktake` calls `record_stocktake` with the same signature and result shape, and all of the 0088/0091 assertions still pass. `/admin/website` reads `site_content`, which only gains nullable columns
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file — n/a: no shared runtime file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged `3c2c9ae` (backlog edits and the 0.6.0 release cut) before any change here. None of it touches `supabase/`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: all three items close with their batch-2 feature branches
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-26 — Contact channels, stock count history, and a resident's hook and ideal home (`0092`–`0094`)". It covers WhatsApp as digits, what `stock_counts` can and cannot compute, the resident fields being translatable, and the `private.` qualification trap
- [x] `README.md` still accurate: it does not list migrations, tables or RPCs
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing a user can see changes. The new columns are empty and unread, and the stocktake page saves as it did (the history it now writes is not shown anywhere yet). Each feature's own PR adds its line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Measured:
  - "Unqualified names would have brought adopted residents back": the dry-run error, plus the live `pg_get_viewdef` showing `private.` on both.
  - "Refusals write no history" and "cannot be back-dated": K2 and K4.
  - "Delete still works": K5.
  - "Size needs no schema": `residents.size` is in the live view definition, and `/adopt/[id]/page.tsx` renders it.

  Reasoned, not measured:
  - The E.164 15-digit limit, and that wa.me takes digits only. Both come from their published specs.
  - That the single-cell edit writes no history. This follows from the code: `updateMedicationStock` does a plain `update` and no trigger inserts history.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no runtime code changes
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no runtime code
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; `counted_at` is a `now()` timestamptz
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band or threshold. The WhatsApp digit-count limits (7–15) are a sanity bound, not a rule anything depends on
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, who reads it against a rerun of `check-stocktake.mjs`
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no deploy; the public views' output is unchanged

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — n/a: no deploy needed for this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy needed for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code reads it
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (production reads are refused from a worktree)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: additive columns, a new table, a view with appended columns and a function re-created with the same signature. The back-fill only inserts into the new table
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy: see the last line of §3

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. The schema is additive and safe to leave. To remove it, write a down-migration (§3). Re-applying 0091's `record_stocktake` alone stops the history without losing it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (caught before apply) | 0094 first copied 0060's view text, which names `approved_translations` and `resident_current_state` unqualified. Both moved to `private` (0082, 0086). The first failed the dry-run. The second would have applied cleanly and bound to the gated public view, so adopted and deceased residents would have reappeared on `/adopt` | fixed: both qualified `private.`. The live definition was compared before and after, and the anon profile count is unchanged |

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
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links `docs/test-plans/schema-public-fields.md`, which is the record
- [ ] Handed to the production release manager — n/a: not yet; that happens at the production apply, after merge

Result: pass

Release manager acknowledgement: n/a: no release manager has read it yet
