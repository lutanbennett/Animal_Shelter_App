# Feature test plan

## Header

| | |
|---|---|
| Feature | Second schema half of the standard-diet item (`0090`): `set_standard_diet(id)` moves the standard as clear-then-set in one transaction, and `record_intake` refuses a missing diet |
| Backlog item | `docs/backlog.md` → **Standard diet: flag it, make a diet mandatory at intake, and show special diets on enclosure cards** (not ticked: it closes with `claude/standard-diet`) |
| Branch / worktree | `claude/standard-diet-schema-2` @ `C:\Development\Animal_Shelter_standard-diet-schema-2` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007`, not used: no UI |
| PR | opened from this commit |
| Tested by / date | Claude (automated) / 2026-09-26 |
| Carries a migration? | yes: `0090_standard_diet_functions.sql` |
| Tested at SHA | `29e994e` (branch on `main` @ `172eeeb`): the migration and its harness. The later commit adds only this plan and `decisions.md` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the two database pieces of the item `0087` could not carry, a one-transaction move of the standard and a refused null diet at intake. The feature brief said "add no migration"; Lutan chose this separate schema PR (in chat, 2026-09-26) over dropping either piece
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0090_standard_diet_functions.sql`; new dev-only rollback harness `scripts/check-standard-diet-functions.mjs`; `docs/decisions.md`, this plan. No route, component, `worker/` or shared lib code
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. `set_standard_diet`: admin and management only (function guard), EXECUTE for authenticated and service_role, never anon. `record_intake`: same callers as before; each of them now gets an error for a null diet
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no UI. The intake form, the Make-standard button and the enclosure markers are `claude/standard-diet`. Until that merges, main's intake form still offers "None yet", which on dev now fails with `Choose a diet for the new resident…`; production gets both in one release

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: the branch was created from `origin/main` @ `172eeeb` minutes before, and `git log HEAD..origin/main` was empty when this plan was written
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run at `29e994e`; closing lines as printed:

  ```
  === gates: build exited 0 after 242s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0090_standard_diet_functions.sql (against origin/main 172eeeb, highest 0089_is_known_drive_file_revoke.sql)`. `gh pr list --state open` returned nothing
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 89 applied, 1 pending.`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0090_standard_diet_functions.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0090_standard_diet_functions.sql … ok`, then `This checkout: 90 applied, 0 pending.`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace` and idempotent grants only; the harness runs the whole file twice before asserting
- [x] Existing rows still read correctly after the change (checked against real dev data): no table changes. The harness moves the real dev standard ("Standard Kibble + Chicken") to "Renal diet" and back out by rollback; after the run dev still has one standard
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. `check-standard-diet-functions.mjs` creates throwaway management, admin, staff, role-less and anon logins and asserts: management moves the standard and exactly one row is flagged, the new one (A); admin re-setting the current standard is a no-op that succeeds (B); an unknown id is refused and the clear is rolled back with it, so the standard stays (C); null is refused (D); staff and role-less callers are refused by the function's guard and anon by the grant, and nothing moved (E); `record_intake` as staff with no diet is refused and writes no resident (F); with a diet it writes the resident and one open-ended diet row from the intake date (G); `set_standard_diet` is anon no / authenticated and service_role yes, and `record_intake`'s grants are the same before and after the file (H). Output after the apply, unedited:

  ```
  Failed to run sql query: ERROR:  P0001: HARNESS-OK file ran twice | A management moved it to "Renal diet", one standard | B admin re-set it, still one | C unknown id refused, standard kept | D null refused | E staff/role-less refused by the guard, anon by the grant | F intake with no diet refused, nothing written | G staff intake with a diet: resident + one diet row from intake date | H grants: set_standard_diet anon no, authenticated/service_role yes; record_intake unchanged (anon=false, authenticated=true, service_role=true)
  CONTEXT:  PL/pgSQL function inline_code_block line 92 at RAISE
  ```
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: `set_standard_diet` is a new function (drop it); `record_intake` goes back by re-running `0064`'s `create function` body as `create or replace`, which drops only the null check
- [x] Production apply plan stated for the release manager (which file, which project, when): `node scripts/apply-migrations.mjs --env production --dry-run`, then without it, from the main checkout, against `dbkodyyxxhtygxcxmfcu`, in the same release as `claude/standard-diet` and **before** its deploy: that branch calls `set_standard_diet`, and applying `0090` ahead of the old intake form would make "None yet" fail there

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; nothing calls `set_standard_diet` yet. The happy paths are harness cases A and G
- [ ] Data persists — reload the page and the change is still there — n/a: no page reads these functions yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI; the one write (move the standard) is harness A–C
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI; the functions' own messages are harness C, D, F
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI. At the database: re-setting the current standard (B) and an unknown id (C)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `set_standard_diet` | moves it | harness B: ok |
| management | `set_standard_diet` | moves it | harness A: ok |
| staff | `set_standard_diet`; `record_intake` | refused; intake needs a diet | harness E: `Not authorized…`; F/G |
| vet | `set_standard_diet` | refused, same guard as staff | not run separately: the guard admits only admin and management, and the role-less login was refused too |
| volunteer | `set_standard_diet` | refused, same guard as staff | not run separately, as vet |
| signed out | `set_standard_diet` | refused by the grant | harness E: `ERR 42501` |

- [ ] Every role above tested — n/a: vet and volunteer are refused by the same `not in ('admin', 'management')` guard that refused staff and a role-less login; no page is involved
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff and role-less refused inside the function, anon by the missing EXECUTE grant (harness E, H)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user operates yet; `claude/standard-diet` updates the intake and Enclosures topics
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no translatable fields added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no page loaded
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): intake through `record_intake` with a diet, as a staff login, is harness G; the existing `check-standard-diet.mjs` (`0087`) still ends `HARNESS-OK` against the same database
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file — n/a: no shared runtime file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged; the branch is on the tip of `main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the item closes with `claude/standard-diet`, which ticks it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-26 — Moving the standard diet is an RPC; `record_intake` refuses a missing diet (`0090`)"
- [x] `README.md` still accurate: it does not list migrations or RPCs
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing on screen changes until `claude/standard-diet` ships the form; its release-notes line covers the mandatory diet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "an unknown id rolls the clear back too" is harness C; "`create or replace` keeps the grants" is harness H comparing before and after. The row-by-row unique check behind clear-then-set is Postgres's documented behaviour for a non-deferrable unique index, carried over from `0087`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no runtime code; the dev database the test site reads already has `0090`
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no runtime code in this PR
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: neither function derives a date; `record_intake` dates the diet row with the intake date it is given
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band or threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, who reads it against a rerun of the harness
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page calls either function

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — n/a: no deploy for this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code here; the feature PR reads it, and the apply plan in §3 puts `0090` in the same release, before that deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (production reads are refused from a worktree)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: functions only, no data changed
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy: §3's last line

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. Undoing is the down-migration in §3. Rolling back the feature Worker without `0090` would leave the old intake form's "None yet" failing, so the two roll back together

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None | — |

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
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links the plan, which is the record
- [ ] Handed to the production release manager — n/a: not yet — happens at the production apply, after merge

Result: pass

Release manager acknowledgement: n/a: no release manager has read it yet
