# Feature test plan — diets-readers-per-serving-schema

## Header

| | |
|---|---|
| Feature | Link 2 of 4 of "one serving" diets: the feeding sheet view reads `qty_per_serving`, the old quantity columns become nullable, the 0250 bridge is guarded against NULL |
| Backlog item | `docs/backlog.md` → **Simplify diets to "one serving" recipes** (left open: the app half and the drop remain) |
| Branch / worktree | `claude/diets-readers-per-serving-schema` @ `C:\Development\Animal_Shelter_diets-readers-per-serving-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | yes — `0258_diets_readers_per_serving.sql` |
| Tested at SHA | `642c04d6` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `special_diet_list` reads per-serving amounts, `qty_small/medium/large` accept NULL, and the bridge trigger cannot blank a recipe
- [x] Files/areas touched listed — `supabase/migrations/0258_diets_readers_per_serving.sql`, `scripts/check-diets-readers-per-serving.mjs`, `docs/decisions/2026-10-24-diets-readers-per-serving-schema.md`, `docs/backlog.md` (note), this plan. Nothing in `src/`
- [x] Roles affected identified — the view is read by roles with medical diet read and clinical visibility (medical diets page); no permission changed
- [x] Anything explicitly **out of scope** written down — the app no longer writing the old columns (link 3) and dropping them and the bridge (link 4)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends with all gates 0. Exit codes read directly from the script's own output:

```
=== gates: build exited 0 after 349s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0258` after `0257`; migration-number check passed; no other schema branch in flight
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 258 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0258_diets_readers_per_serving.sql … ok`
- [x] File is re-runnable — `create or replace` for the view and function, `drop not null` is idempotent. The harness runs the file's text again inside its transaction after the real apply, and passes
- [x] Existing rows still read correctly after the change (checked against real dev data) — 7 feeding-sheet rows before and after, same rows, every column but `daily_quantity` identical, no figure moved for a line in proportion
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness (`scripts/check-diets-readers-per-serving.mjs`). Asserted: same rows and columns before/after; no `daily_quantity` moves for in-proportion lines; the three columns accept NULL; the three `> 0` CHECKs remain; blanking `qty_small` (and all three) leaves `qty_per_serving` untouched; an edit to a real Small value still re-derives it. Result: 10 checks held, 0 failed, rolled back
- [x] Down-migration written, or the reason one is not needed is stated — not needed: the view is replaced in place, the columns still exist with their data, and re-adding NOT NULL is possible only while no row is NULL (link 3 is what introduces NULLs)
- [x] Production apply plan stated for the release manager — `0258` on `dbkodyyxxhtygxcxmfcu` at release, by the normal apply; production may be behind on other files, so read `--status --env production` first

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the view's rows were compared in §3's harness
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and update on `diet_ingredients` exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface; NULL `qty_small` is the boundary and is in §3's harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | special diets list | unchanged | harness read the view as an admin: 7 rows before and after |
| other roles | n/a | unchanged | n/a — no policy or grant changed; the view's grants are re-stated identically |
| signed out | nothing | nothing | n/a — grants revoked from anon as before |

- [ ] Every role above tested — n/a: no permission changed; grants re-stated as 0242 had them
- [ ] A role that should not have access is blocked server-side — n/a: no access rule written

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the view keeps its columns and their order (asserted), so `src/lib/diets/special-list.ts` and the medical diets page read it unchanged; the build gate compiles them
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; a SCHEMA LINK 2 DONE note was added, links 3 and 4 remain
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-diets-readers-per-serving-schema.md`
- [x] `README.md` still accurate — it does not describe this view
- [ ] **Release notes.** — n/a: no shelter user would notice; the one visible effect (an out-of-proportion line showing its Small-based figure) is recorded for Lutan, and the user-facing change is links 3 and 4
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the moved Renal diet figures (22 to 16.5) came from the harness output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the view uses `shelter_today()` exactly as before; nothing new derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates output above is unedited; no deploy output yet
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; no `src/` change. The old app keeps working: it still writes the old columns, and the bridge still fills `qty_per_serving`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: not destructive; no data rewritten, constraints only relaxed
- [x] Apply plan stated — `0258` on production at release, normal apply

### Rollback

- [x] Rollback position stated — code rollback does not revert `0258`; the old app is unaffected by it. Restoring the old view would need a new migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Five feeding-sheet rows for one out-of-proportion line (Renal diet: 22 before, 16.5 now) change because the sheet now follows the Small-based serving, as the forecasts have since 0254 | accepted: the 0250 finding, Lutan's call on whether to correct the line; the harness prints it each run |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the Renal diet's Medium/Large amounts should be corrected to the 1 : 1.5 : 2 proportion | Admin → Diets |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: its one item is a decision about data, not a check of this change

Manual verification by: n/a: no UI surface to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
