# Feature test plan

## Header

| | |
|---|---|
| Feature | One person, more than one role, the app half: Add a role / Remove on Security, the union in the home, the rota, My tasks and the manual, and a list of covers ending this week |
| Backlog item | `docs/backlog.md` → **One person, more than one role** (ticked here; part 1 was #620) |
| Branch / worktree | `claude/multi-role-build` @ `C:\Development\Animal_Shelter_multi-role-build` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no — reads `0196` and `0197` (#620), on `main` and applied to dev |
| Tested at SHA | `dbf9b41f` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an Admin can give a login a second role with an optional last day, and that person's home, menu, manual, rota picker and My tasks then count both roles, ending on their own the day after
- [x] Files/areas touched listed: `src/app/admin/security/` (actions, page, `UsersTable`, new `CoversEnding`), `src/lib/permissions/can.ts` (`roles`), `src/lib/home/tiles.ts` + `roles.ts` + `src/app/home/page.tsx`, `src/lib/auth/held-roles.ts` (new) + `app-users.ts`, `src/lib/recurring-jobs/eligibility.ts`, the recurring-jobs page, actions and form, `src/lib/my-tasks/recurring.ts`, `src/lib/manual/audience.ts` + `for-topic.ts`, `releases` page, `who-does-what.ts`, `eslint.config.mjs` (allow-list), both dictionaries, the manual, `releases.ts`, `scripts/check-multi-role-build.mjs`
- [x] Roles affected identified: Admin sets covers; any role that is covered by a second one (Head of Medical + Head of Maintenance is the worked case) sees more; a login with one role is meant to see exactly what it saw before
- [x] Out of scope written down: no card or grant changes, no schema, Admin is never an additional role, Senior Staff and per-shelter roles are untouched, no edit-end-date control (Remove then Add), no Thai manual (there is none)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (two new `unreleased` lines at the same spot), resolved by keeping both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the output file:

```
=== gates: typecheck exited 0 after 45s
=== gates: lint exited 0 after 119s
=== gates: test exited 0 after 4s
=== gates: build exited 0 after 102s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0196`/`0197` merged in #620
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; #620 applied both to dev
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration; the new reads (`user_roles` with `is_main`, dates and the `roles` embed) were run against dev and returned all 49 live rows
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; the constraints and triggers were exercised by `scripts/check-multi-role-schema.mjs` in #620
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0196` and `0197` must be live in production before this ships, and ride in the release that carries #620 (`apply-migrations.mjs` warns if not)

## 4. Functional checks

- [x] Happy path works end to end: on dev, a disposable login (`dryrun-cover-20261014@example.test`) given Head of Medical as main and Head of Maintenance as an additional role ending today signed in and saw the four Head of Medical tiles plus Do Maintenance on `/home`
- [x] Data persists — the roles are rows in `user_roles`; the home was built fresh from `my_permissions()` on each load
- [ ] Create / edit / delete all exercised — n/a: the Security panel itself (Add a role, Remove) sits behind an Admin login with an authenticator app and could not be driven; the rows it writes were made by service-role script. Listed under Left for manual verification
- [x] Empty state renders sensibly: the Covers-ending list renders nothing at all when there are none (`CoversEnding` returns null), and a login with no addable role shows no Add-a-role button
- [x] Invalid input is rejected with a readable message: `addExtraRole` refuses Admin and the public viewer, a role already held, a last day before today (shelter date) and a login with no live main role, each with its own sentence in both dictionaries (code read; the database refuses Admin regardless, #620)
- [x] Boundary cases checked: a cover whose `ends_on` is today still showed its tile that day; the same row with `ends_on` yesterday dropped the tile on the next load (Do Maintenance gone from `/home`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security → Add a role / Remove | allowed after 2-step; Admin cannot be added as a second role | not driven (2-step); guards are the same `refuseUnlessAdmin` as every action there |
| management | home, Who does what | curated Management home, plus any second role's tiles | not driven; `check-home-screens.mjs` still passes and the union path is covered in `check-multi-role-build.mjs` |
| second_in_command | home | unchanged | one-role home hashed identical before and after (below) |
| head_of_maintenance | home | unchanged | as above |
| head_of_medical (with Maintenance cover) | home, `/maintenance`, My tasks | both homes' tiles | driven on dev: four medical tiles + Do Maintenance; `/maintenance`, `/my`, `/manual` load |
| doctor | home | unchanged | as above |
| volunteer | home | unchanged | as above |
| signed out | n/a | no change | n/a: nothing public changed |

- [x] Every role above tested — the six default roles by `scripts/check-multi-role-build.mjs` (A: one-role homes hashed before/after) and the cover case by driving dev; the Admin panel is in the manual list
- [x] A role that should not have access is blocked server-side: every Security action begins with `refuseUnlessAdmin` (Admin + 2-step); the cover's eligibility only decides whom pickers offer, the database still enforces (`role_can`, RLS, #620)

Single-role identity, as printed by the script (hash of the home tiles of every default role, `homeTilesFor` vs `homeTilesForRoles`):

```
single-role homes hashed: before c2bd7bd10632 after c2bd7bd10632
```

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added or changed; the menu is the union through the same permissions it already read
- [x] Manual updated (`src/lib/manual/en.ts`): a step in "Accounts and roles" on Add a role, the last day, Remove and the covers list
- [x] Translatable strings go through the translation path: the `cover` block and five new errors are in both `en.ts` and `th.ts`; `typecheck` holds Thai to the English shape
- [ ] Mobile viewport (375px) — n/a: the new Security controls were not measured at 375 px because Security needs Admin + 2-step; it is a desk page, and the check is in Left for manual verification. The home tiles are the existing component
- [x] Browser console clean: no errors after sign-in, the home, and the page loads above
- [x] Network clean — the pages driven loaded without 4xx/5xx

## 6. Regression

- [x] The pages nearest the change still work: `/home`, `/maintenance`, `/my`, `/manual` for the cover account; `check-home-screens.mjs` all ok; lint's `acceptance-matrix --check` ok
- [x] Shared file checked from a second page: `src/lib/manual/en.ts` loaded at `/manual`; `src/lib/releases.ts` is covered by lint and the build
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch. Searched for `user_roles`, cover, Senior Staff, rota, recurring and one role: Senior Staff and per-shelter roles are not closed and say so in the decision
- [x] Non-obvious design choices: `docs/decisions/2026-10-14-multi-role-ui.md`
- [x] `README.md` still accurate — it does not describe how roles combine
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The claim that a one-role login is unchanged is the hash above; the claim a cover ends the day after was observed on dev (tile present with `ends_on` today, gone with yesterday). The one claim not measured is Security's own panel, which is in the manual list

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the day a cover stops is decided by the database's `shelter_date()` (#620, tested there at both edges); this PR only reads the shelter's today to hide expired rows and refuse a past last day. The both-edges check on dev above is the evidence
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the boundary is the database's; observed on both sides (today kept, yesterday dropped) above
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gate and hash lines are copied as printed; no hand-made table of results
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0196`/`0197`, which must be live in production first. `apply-migrations.mjs` warns if they are not
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; #620's files go first, in the same release

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref hides the panel and the union, and any cover rows stay in `user_roles`, still enforced by the database (they would give access the UI no longer shows, so remove covers before rolling back)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The first `homeTilesForRoles` dropped "Add photos" for single-role logins too (the doctor lost it); the single-role hash check caught it | fixed: the tidy applies only when a login holds more than one role |
| 2 | minor | There is no way to change a cover's last day; it is Remove then Add | accepted: noted in the decision, not asked for |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As Admin (with the authenticator app): on Security, pick a Head of Medical, Add a role → Head of Maintenance with a last day, see "until …" and Remove, see Admin missing from the list, see them in Covers ending this week when the day is within seven days, and read it at 375 px | Settings → Security on Test |
| 2 | A real covering person on a phone: both sets of tiles, a maintenance job offered on the rota and moved on, and nothing offered the day after | Test, signed in as the cover |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; the two rows above are awaiting a person

Manual verification by: pending: Admin panel and a real cover on a phone, rows 1 and 2 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
