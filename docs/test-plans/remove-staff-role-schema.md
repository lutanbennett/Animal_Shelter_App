# Feature test plan — remove-staff-role-schema

## Header

| | |
|---|---|
| Feature | Schema half of "Remove the Staff role": archive the Staff role, refuse it to any live login, and stop if anyone live still holds it |
| Backlog item | `docs/backlog.md` → **Remove the Staff role: Lanna's roles are Admin, Management, 2IC, Maintenance, Medical, Doctor and Volunteer** (ticked by the app PR that follows) |
| Branch / worktree | `claude/remove-staff-role-schema`, pushed from the `claude/remove-staff-role` worktree @ `C:\Development\Animal_Shelter_remove-staff-role` |
| Dev server | not started — this PR changes no app code; the screens are the next PR |
| PR | this PR |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | yes — `0173_retire_staff_role.sql` |
| Tested at SHA | `827975a9` (origin/main) plus this branch's files |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — steps (1)–(3) of the item: move the Staff logins (dev done, production has none live), then archive the `roles` row rather than delete it; `staff` stays in `app_role`
- [x] Files/areas touched listed — `supabase/migrations/0173_retire_staff_role.sql`; `scripts/check-staff-retired.mjs`; `docs/decisions/2026-10-09-staff-role-removed.md`; this plan
- [x] Roles affected identified — staff: retired, no live login holds it (dev: 1 moved to Management, 12 test logins archived; production: Lutan, 2026-10-09, the only Staff login is already archived). Every other role: unchanged, and moving a login between live roles still works (E)
- [x] Anything explicitly **out of scope** written down — every role picker, the manual, the acceptance matrix, the home screens and the release-notes line are the next PR; dropping the enum value is impossible and not attempted; the old check scripts that build a synthetic Staff login are left as historical records (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in effect: branch created from `origin/main` `827975a9` and nothing has landed since; checked with `git log origin/main -1`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 207s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0173` against highest `0172`; the brief gives this stream `0173` and says no other live stream carries a migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `172 applied, 1 pending`, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0173_retire_staff_role.sql … ok`; `check-migration-grants` ok (the new function is revoked from public, anon, authenticated)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0173_retire_staff_role.sql … ok`, after the 13 live Staff logins on dev were moved (Lutan chose Management for his own test login; the 12 `@example.test` / `@example.invalid` logins were archived)
- [x] File is re-runnable — the guard re-checks, the archive touches only a live row, the function is create-or-replace and the trigger is dropped first; G re-runs the guard block
- [x] Existing rows still read correctly after the change — archived Staff logins keep their `role_id`; the `roles` row and its `role_permissions` cells are kept; `count(*) where archived_at is not null` on `roles` is exactly 1
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `node scripts/check-staff-retired.mjs`, live after the apply: **A** the staff row is archived and is the only archived role; **B** no live login holds Staff; **C** un-archiving a former Staff login is refused; **D** moving a live Management login onto `'staff'` through the enum is refused; **E** moving it to Volunteer works; **F** a fresh `user_roles` insert with `'staff'` is refused; **G** with Staff put back live for one login, 0173's guard stops with "cannot be retired". Result: `staff retired: HARNESS-OK (A-G asserted on dev, rolled back)`
- [x] Down-migration written, or the reason one is not needed is stated — not written: undoing is `update roles set archived_at = null where key = 'staff'` and dropping one trigger, and nothing needs it unless Lutan reverses the ruling
- [x] Production apply plan stated for the release manager — see §8. **Release blocker: before this ships, list who holds Staff on production and move each one; anyone still holding Staff when it ships cannot sign in.** Lutan checked on 2026-10-09: none live. The guard re-checks at apply time and stops, naming them, if that has changed

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no app code in this PR; the database paths are in §3, the screens in the next PR's plan
- [ ] Data persists — n/a: no UI surface; writes and refusals are in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, update and refusals in §3 (C–F)
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the trigger's message is "The Staff role is retired: choose another role for this login."
- [ ] Boundary cases checked — n/a: no UI surface; archived vs live logins are C and G

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a — no permission cell or policy changed |
| management | unchanged | unchanged | a Management login moved to Volunteer and back to Staff in the harness: only Staff refused (D, E) |
| staff | nothing; cannot be given | retired | A, B, D, F |
| doctor, volunteer, 2IC, Maintenance, Medical | unchanged | unchanged | n/a — no permission cell or policy changed |
| signed out | nothing | nothing | n/a — no grant added |

- [x] Every role above tested — the role changes in the harness; no permission changed for any other role
- [x] A role that should not have access is blocked server-side — D and F: the refusals are a database trigger, not a screen

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface in this PR
- [ ] Manual updated — n/a: the next PR's
- [ ] Translatable strings go through the translation path — n/a: none
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — n/a for pages: on dev, until the app PR merges, choosing Staff on Settings → Security is refused by the database with the trigger's message; every other role still saves (E)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — created from `827975a9`; gates ran on it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: ticked by the app PR, which finishes the item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-staff-role-removed.md`: the reversal of 2026-10-03, the order, the guard, the trigger, and what is not done
- [x] `README.md` still accurate — it names no role list
- [ ] **Release notes.** — n/a: nobody sees a difference until the app PR, which carries the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the Staff logins and role rows were queried on dev; the fail-closed joins read from `0132`/`0133`/`0167`; every behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates and harness output above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads no role

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: the app PR follows and should ship in the same release, so nobody on production is offered Staff in a picker the database then refuses
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager. **It stops, naming them, if any live production login holds Staff; move each one on Settings → Security first.**
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: nothing is dropped or rewritten; one row is archived
- [x] Apply plan stated — `0173` on production with the release carrying the app PR, after the dry run above is clean

### Rollback

- [x] Rollback position stated — a code rollback does not revert `0173`; older code still offers Staff in its pickers, and saving it is refused with a readable message. Nobody loses access. To undo the ruling: un-archive the row and drop `user_roles_take_live_role`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | Archiving alone would lock out any live Staff login, silently | fixed: `0173` stops, naming them; asserted by G |
| 2 | medium | The enum→role sync (`0132`) would map a new `'staff'` straight onto the archived row, making a login that can do nothing | fixed: `user_roles_take_live_role`; asserted by D and F |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface in this PR; the screens are the app PR's | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface in this PR

Manual verification by: n/a: no UI surface in this PR; the app PR carries the screens

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, with the blocker in the PR body

Result: pass

Release manager acknowledgement: n/a: not yet released
