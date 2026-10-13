# Feature test plan — photo-rpc-schema

## Header

| | |
|---|---|
| Feature | Schema half of "an internal photo is one RPC": `can_see_drive_file(text)` |
| Backlog item | `docs/backlog.md` → **An internal photo costs seven queries; make it one RPC** (left open, the route half remains) |
| Branch / worktree | `claude/photo-rpc` @ `C:\Development\Animal_Shelter_photo-rpc` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number assigned at creation |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | yes — `0193_can_see_drive_file.sql` |
| Tested at SHA | `c7652ca8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one security-invoker function answering the seven selects the photo route runs, written like `is_public_drive_file()`
- [x] Files/areas touched listed — `supabase/migrations/0193_can_see_drive_file.sql`, `scripts/check-can-see-drive-file.mjs`, `docs/decisions/2026-10-13-can-see-drive-file.md`, this plan
- [x] Roles affected identified — none yet: no code calls the function. Once the route does, every role that opens an internal photo
- [x] Anything explicitly **out of scope** written down — the route change and the before/after query count are the second PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged in, nothing new
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the script's closing line: `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0192`), and no other in-flight branch carries one — the brief gives this stream the only slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 193 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run flagged the missing `revoke … from anon`; added, second run `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0193_can_see_drive_file.sql … ok`
- [x] File is re-runnable — `create or replace`, idempotent revoke and grant
- [x] Existing rows still read correctly after the change — no table or view changed, only a function added
- [x] **Constraints and defaults exercised against real rows** — `check-can-see-drive-file.mjs` on dev, read-only: for 345 real and made-up Drive ids, under anon, service_role and one login of every role, the function and a replica of the route's seven selects agree on every id (0 disagreements). Admin, management and service_role see 343; doctor 1; head_of_maintenance 2; second_in_command 2; volunteer, head_of_medical and a role-less login 0. Includes ids that do not exist and the empty string. Anon is refused the function itself, which the route reads as "not found"
- [x] Down-migration written, or the reason one is not needed is stated — not needed: a new function nothing calls; `drop function can_see_drive_file(text)` undoes it
- [x] Production apply plan stated — `0193` on `dbkodyyxxhtygxcxmfcu` before the route PR's deploy (otherwise the route would get "function not found" and refuse every internal photo)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this yet
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no data written
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; a non-existent id returns false (asserted in §3)
- [ ] Boundary cases checked — n/a: no UI; non-existent and empty ids asserted in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | function | same answers as the seven selects | pass — 343 of 345, 0 disagreements |
| management | function | same | pass — 343, 0 disagreements |
| staff | retired role | n/a | n/a: retired in 0173 |
| doctor | function | same | pass — 1, 0 disagreements |
| volunteer | function | same | pass — 0, 0 disagreements |
| signed out | nothing | refused | pass — anon has no EXECUTE |

- [x] Every role above tested — every live role plus anon, service_role and a role-less login
- [x] A role that should not have access is blocked server-side — volunteer, head_of_medical and a role-less login see 0 of 345; anon is refused the function

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: none
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing in the app changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing new came in; gates ran on the branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, the route PR closes it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-13-can-see-drive-file.md`
- [x] `README.md` still accurate — it does not list functions
- [ ] **Release notes.** — n/a: no code calls the function yet, nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the equivalence figures are the script's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the figures here are the script's
- [ ] Public pages re-checked after a cache purge — n/a: the public site does not use this function

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the `-- consumer` header names the route, which is the next PR. `0193` must be on production before that deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a backup exists — n/a: additive only
- [x] Apply plan stated — `0193` on production before the route PR's release

### Rollback

- [x] Rollback position stated — leaving the function in place is harmless; nothing calls it until the route PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry run: no `revoke … from anon` | fixed |
| 2 | info | One branch raising "permission denied" now fails the whole call (the old path swallowed it per table) | accepted — no live role is affected; the route PR treats an error as "not found" |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads this yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
