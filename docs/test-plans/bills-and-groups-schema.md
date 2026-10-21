# Feature test plan — bills-and-groups-schema

## Header

| | |
|---|---|
| Feature | Two schema changes in one PR: `0240` shuts clinic logins out of the bills inbox; `0241` adds `role_groups` and `role_cards.group_id` |
| Backlog item | `docs/backlog.md` → **`check-bills-roles` is red** (ticked) and **Tile groups on a role's home** (retitled, left open for the app half) |
| Branch / worktree | `claude/bills-and-groups-schema` @ `C:\Development\Animal_Shelter_bills-and-groups-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | yes — `0240_bills_inbox_no_clinic_login.sql`, `0241_role_groups.sql` |
| Tested at SHA | `ab882101` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the database refuses the bills inbox to a clinic login, and tile groups get their tables seeded so no home changes
- [x] Files/areas touched listed — the two migrations, `docs/decisions/2026-10-21-bills-inbox-and-role-groups-schema.md`, `docs/backlog.md`, this plan
- [x] Roles affected identified — doctor (clinic login) loses the bills inbox at the database; admin, management, 2IC, Head of Maintenance and shelter roles with `medical.visits` keep it; `role_groups` is Admin-only and read by nothing yet
- [x] Anything explicitly **out of scope** written down — all of `src/`: Who does what learning groups, the home and landing pages drawn from data, the menu-coverage check are `role-home-app`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (a backlog change), pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit code read directly:

```
=== gates: build exited 0 after 126s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — #807, all 9 checks passing on `a9aa7cf4` (seen via the PR bar, 2026-10-21)

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0240`/`0241` against highest `0239`; `gh pr list` empty; the commit hook's number check passed against `origin/main`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 240 applied, 2 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — both files `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0240 … ok`, `applying 0241 … ok`
- [x] File is re-runnable — `or replace`, `if not exists`, `drop … if exists`; the seed is `on conflict do nothing`
- [x] Existing rows still read correctly after the change — `role_cards` only gains a nullable column, all null; `check-cards-schema` function checks pass
- [x] **Constraints and defaults exercised against real rows** — `node scripts/check-bills-roles.mjs` before: `91 checks held, 5 failed. RESULT: RED` (all five the doctor reaching the inbox); after: `96 checks held, 0 failed. RESULT: GREEN`, script unchanged
- [x] Down-migration written, or the reason one is not needed is stated — not needed: `0240` is a function body (`create or replace` with 0189's body reverts it); `0241` is additive and nothing reads it
- [x] Production apply plan stated for the release manager — apply both with the next release (`--status --env production` first). `0240` is safe alone: the app already hid the inbox from a clinic login

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface changed; the inbox rights are proved by `check-bills-roles` in §3
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; inbox add/read/delete are probed per role in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | bills inbox | yes | yes (check-bills-roles) |
| management | bills inbox | yes | yes |
| 2IC | bills inbox | yes | yes |
| Head of Maintenance | bills inbox | yes | yes |
| doctor | bills inbox | no | refused (was allowed before 0240) |
| volunteer | bills inbox | no | refused |

- [x] Every role above tested — by `check-bills-roles.mjs`, each login's own JWT on dev
- [x] A role that should not have access is blocked server-side — doctor and volunteer refused by RLS

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the manual never told a doctor about the inbox
- [ ] Translatable strings go through the translation path — n/a: no app strings; the seeded Thai group names are data
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-bills-roles` covers every other bills path (filing, matching, maintenance bills) and all 91 held before and after; build compiles
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — bills item ticked; tile groups retitled, left open. Searched for `can_use_bills_inbox`, `role_cards`, `role_groups`: no other open item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-bills-inbox-and-role-groups-schema.md`
- [x] `README.md` still accurate — it does not describe these
- [ ] **Release notes.** — n/a: no shelter user notices — canUseBills() already hid the Bills page from a clinic login, so the doctor never had the screen; 0240 shuts only the database door, and role_groups is read by nothing until role-home-app
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the before/after is the script's output; the one reasoned claim (the two check-cards-schema drifts predate this) is labelled as such in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates involved
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; gates and harness output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `0240`'s consumer `access.ts` is unchanged, `0241`'s consumer does not exist yet
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive plus one function body
- [x] Apply plan stated — see §3

### Rollback

- [x] Rollback position stated — code rollback needs nothing; reverting `0240` means re-running 0189's function body, which reopens the door, so do not

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-cards-schema` reports role_permissions drift for the doctor and a dry-run account on dev | accepted — not from this branch (neither file touches role_permissions); noted in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing reads role_groups yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
