# Feature test plan — `perm-convert-vet`

## Header

| | |
|---|---|
| Feature | The vet's 54 policies ask `is_clinic_login()` (the clinic scope) instead of the role, with no change in access |
| Backlog item | `docs/backlog.md` → **`perm-convert-vet`** (was ticked as declined; status line added: built on the scope, the declined part still declined) |
| Branch / worktree | `claude/perm-convert-vet` @ `C:\Development\Animal_Shelter_perm-convert-vet` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | yes: `0167_perm_convert_vet.sql` |
| Tested at SHA | the `claude/perm-convert-vet` tip this file is committed in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for. The match is partial **on purpose**: the brief asked for `has_permission()` and no change in access, and those conflict for the vet. Lutan chose the scope route in chat (decision file §1)
- [x] Files/areas touched listed: `supabase/migrations/0167_perm_convert_vet.sql`, `scripts/check-policy-role-names.mjs` (`OWNERS` emptied), `scripts/check-new-policy-role-names.mjs` (one comment), `scripts/check-perm-convert-vet.mjs` (new), `docs/roles-and-permissions.md` §15, `docs/decisions/2026-10-09-perm-convert-vet.md`, `docs/backlog.md`
- [x] Roles affected identified: **vet** (54 policies rewritten; same answers). Admin, management, staff and volunteer are probed and unchanged. Signed-out public: no grant on any of the 29 tables
- [x] Anything explicitly **out of scope** written down: the vet's cells (still cosmetic; 21 parity lines stay red by decision), the 16 functions and 9 views (`perm-drop-enum`'s), the `has_permission()` cache measurement (batch 80)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 167s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `0166` highest on `origin/main`, `gh pr list --state open` empty; `check-migration-numbers` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 166 applied, `0167` the only pending file
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0167_perm_convert_vet.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0167_perm_convert_vet.sql … ok`
- [x] File is re-runnable: `create or replace function` and `alter policy` to fixed text; re-running it inside `check-perm-convert-vet.mjs` after the apply gave 0 differences
- [x] Existing rows still read correctly after the change: every login's row counts on all 29 tables are identical before and after (below)
- [x] **Constraints and defaults exercised against real rows** in a rolled-back harness: `scripts/check-perm-convert-vet.mjs`. It asserts that for all 52 logins, the counts of rows selectable on each of the 29 tables are identical before and after running `0167` in the same transaction. For the six vets and one login of each other role, it asserts the same for the rows an update and a delete reach. It also asserts that `is_clinic_login()` equals `current_user_role() = 'vet'` for every login, and that vets read non-empty tables. Before the apply: `2262 probes, 0 differences; vets read rows on 134 table probes; is_clinic_login() agrees with the enum for 52/52 logins` / `RESULT: GREEN`. Against a mutant (function answers no): `196 differences` / `RESULT: RED`
- [x] Down-migration written, or the reason one is not needed is stated: not written. To undo, re-run the 54 `alter policy` statements with `(select public.is_clinic_login())` replaced by `current_user_role() = 'vet'::app_role`, then `drop function is_clinic_login()`. The rewrite is mechanical in both directions, and no data changes
- [x] Production apply plan stated: `0167_perm_convert_vet.sql` to production (`dbkodyyxxhtygxcxmfcu`) by Lutan from the main checkout after the merge, `--status --env production` then `--dry-run` first. No deploy-ordering constraint (`-- consumer: none`)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the database answers are proved identical by the harness, and a vet's page check is in the manual list
- [ ] Data persists — reload the page and the change is still there — n/a: no data is written by this change
- [x] Create / edit / delete all exercised (whichever the feature has): select, update and delete probed under each login's JWT, before and after. Insert is not probed, because each insert policy's `with check` is the same substitution as its table's update policy
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked: logins with no live role, archived staff and management rows, and every role key including `public_viewer`'s absence of logins; `is_clinic_login()` agreed for all 52

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the 29 tables through its own policies | unchanged | unchanged (probed: select, update, delete) |
| management | same | unchanged | unchanged (probed) |
| staff | same | unchanged | unchanged (probed) |
| vet | own clinic's residents and records, reference lists, the clinic list, enclosures, recurring jobs | unchanged | unchanged for all six vet logins (probed); non-empty on 134 table probes |
| volunteer | its cells | unchanged | unchanged (probed; also the three roles that borrow it) |
| signed out | nothing: no `anon` grant on any of the 29 tables | unchanged | no grant, checked on dev |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side: under the mutant, the vets' reads dropped to 0, so the policies are what admits them; non-vet answers were unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user does changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: as row counts per login on all 29 tables those pages read (harness), not by loading them. Loading as a vet is in the manual list
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: none touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged (`Already up to date.`); gates green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: `perm-convert-vet` was already ticked (declined) and now carries a BUILT status. Foundation 3 and the `has_permission()` cache item got status lines; the cache item is **not** ticked (the measurement is owed)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-09-perm-convert-vet.md`
- [x] `README.md` still accurate (it does not describe policies)
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no one's access changes and no screen changes; it renames the question the database asks a vet's login
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (54 on 29, 49 `TO public`, 52 logins, 16 functions and 9 views, parity numbers) were each read from dev in this session. The earlier "15 functions" was recounted, and found to be 16

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Vet and non-vet logins, live and archived rows, every role key, and a mutant on the far side (vets answered no) to show the probe moves
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public read policy changed; `anon` holds no grant on these tables

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed, and only the policies call `is_clinic_login()`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies and one function only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` is irrelevant. To undo, run the reverse substitution in §3. If any production policy text differs from dev's, `alter policy` sets dev's text, so `--dry-run` on production is the place to notice that, before the apply

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High, found before any code | The brief asked for `has_permission()` with no change in access; the vet's cells made that a silent narrowing of all six clinic logins, and the item was a declined one | fixed: stopped and asked; Lutan chose the scope route |
| 2 | Low | The "15 functions" `perm-drop-enum` waits on is 16: `current_user_vet_ids()` compares the role as plain text | fixed: corrected in the decision file and backlog |
| 3 | Info | The 21 vet parity lines stay red | accepted: Lutan's 2026-10-07 decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a vet (clinic) login: the clinic's residents list, one resident's visits, prescriptions and weights load as before, and another clinic's resident does not appear | dev, `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 waits for someone with a vet login

Manual verification by: pending: Lutan (item 1, a vet login's pages)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
