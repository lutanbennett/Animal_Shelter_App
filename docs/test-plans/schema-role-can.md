# Feature test plan

## Header

| | |
|---|---|
| Feature | `role_can(role_key, activity, level)`: a `security definer` boolean about another role's cell, callable by whoever sets up rotas (function half only; `role-can-app` follows) |
| Backlog item | `docs/backlog.md` → Architecture → **Recurring-job eligibility asks about another person's role** (status line added; **not ticked**, the app half remains) |
| Branch / worktree | `claude/schema-role-can` @ `C:\Development\Animal_Shelter_schema-role-can` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | pending — opened after this commit |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes — `0133_role_can.sql` |
| Tested at SHA | the commit that adds this plan, merged with `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one `security definer` function answering "may this role do this activity?" for any role, readable by Management, with the caller check inside it; the item's app half is not part of this
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0133_role_can.sql`; `scripts/check-role-can.mjs`; `docs/decisions/2026-10-03-role-can.md`; `docs/roles-and-permissions.md` (§15 note); `docs/backlog.md` (status line); this plan. No route, component, `worker/` or `src/` change
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — nobody's access changes; the function is read by nothing. Management and Admin may call it, anyone may ask about their own role, everyone else is refused (tested below)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the RPC wiring, `canDoJob`, the rota form's picker (`role-can-app`, batch 41); no "list a role's cells" variant by design; no second migration number claimed (`0134` is `perm-convert-medical`'s)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`git merge origin/main`, no conflict)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:

  ```
  === gates: build exited 0 after 168s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0132_permission_tables.sql`; the brief gives this branch `0133`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `132 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0133_role_can.sql … ok`, with the expected consumer warning (`eligibility.ts` does not read it yet)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied, then redone once after the harness found a bug (drop the function, delete its `schema_migrations` row, re-apply): the file was this branch's own unmerged migration
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `create or replace function`; the harness replays the whole file inside its transaction and re-asserts
- [x] Existing rows still read correctly after the change (checked against real dev data) — the harness runs against dev's real roles and seeded 122 cells; nothing existing is altered
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-role-can.mjs`. It **failed first**: `HARNESS-FAIL C staff refused with a null role: got false, wanted ERR:42501` (a null role key made the caller test null, so the refusal was skipped); fixed with a `coalesce`. Output after the fix, unedited:

  ```
  HARNESS-OK 0133_role_can.sql asserted live | A: 660 answers equal has_permission() under each role's own login; missing cell, unknown activity, archived role, no-role person, unknown key, nulls, mistyped level all no | B: Admin yes without a row, unknown activity included; no for bad level or null | C: management, admin and the service role answered; staff, vet, volunteer, public viewer, no-role, archived person, archived-role holder and anon refused (42501) about any other role, answered about their own | D: the door is recurring.manage, so an edit to that cell moves it | | E: the file replays and the grants hold
  ```

  Asserted include **the caller who must be refused** (seven kinds of login plus anon, each against four target roles, an unknown role and a null), the four "answers no" cases, Admin yes with no rows, and that removing Management's `recurring.manage` cell closes the door. Everything rolled back.
- [x] Down-migration written, or the reason one is not needed is stated — not needed: `drop function role_can(text, text, text)`; nothing reads it
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0133_role_can.sql` to production `dbkodyyxxhtygxcxmfcu`, `--env production --dry-run` first; additive, read by nothing, so order against any deploy does not matter

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing calls the function yet; the harness is the check
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, the function stores nothing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface, a read-only function
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; invalid arguments (null, unknown activity or role, mistyped level) answer false, covered by the harness; an unpermitted caller gets `insufficient_privilege`
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface; the boundary is the caller check, covered by the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `role_can` about any role | answered | harness: 660-answer parity run as Admin |
| management | `role_can` about any role | answered | harness: volunteer yes, vet no, admin yes |
| staff | own role only | other roles refused (42501) | harness |
| vet | own role only | other roles refused (42501) | harness |
| volunteer | own role only | other roles refused (42501) | harness |
| signed out | nothing | refused | harness: anon has no `execute` |

- [x] Every role above tested — plus a public viewer, a login with no role, an archived person and the holder of an archived role
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the caller check is inside the function, so there is no UI to hit; refused with `42501` for every unpermitted login in the harness

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-facing change
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page calls it

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no code reads the function and no existing object changed
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the merged tree (see §2)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked, only the function half is done; a status line names this PR and `role-can-app` as what is left
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-03-role-can.md`: who may call it and why, the four "answers no" cases, the Admin predicate's single source, and the bug the harness found
- [x] `README.md` still accurate — it does not describe the permission functions
- [ ] **Release notes.** n/a: no shelter user can notice a database function that nothing calls yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The parity claim is the 660-answer run, and the null-role refusal gap was found by the harness failing before it was believed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — the permission boundary is asserted on both sides: Management and Admin in, seven kinds of login and anon out, and the door moves when the `recurring.manage` cell does (removed from Management, granted to the volunteer)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the harness line above is as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page or view reads the function

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: migration only, no code reads it; the app half is `role-can-app`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: additive, one new function
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: stated in §3: `0133` to production, either side of any deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: `drop function role_can(text, text, text)` undoes it and nothing reads it; code rollback is unaffected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium (caught before merge) | A null `p_role_key` from an unpermitted caller skipped the refusal and answered `false` | fixed in `0133` (`coalesce`), re-applied to dev, harness green |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no UI surface, nothing a person would look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending
