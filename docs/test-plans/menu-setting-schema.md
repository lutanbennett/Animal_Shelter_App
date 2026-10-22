# Feature test plan — menu-setting-schema

## Header

| | |
|---|---|
| Feature | Schema half of the per-role Show the menu setting: `roles.show_menu boolean not null default true` |
| Backlog item | `docs/backlog.md` → **Tiles instead of the left-hand menu for every login but Admin** (left open: this is the schema half only) |
| Branch / worktree | `claude/menu-setting-schema` @ `C:\Development\Animal_Shelter_menu-setting-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-22 |
| Carries a migration? | yes — `0247_role_show_menu.sql` |
| Tested at SHA | `fc95a9fc` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one column, `roles.show_menu`, default true, the setting the menu removal will read
- [x] Files/areas touched listed — `supabase/migrations/0247_role_show_menu.sql`, `docs/decisions/2026-10-22-role-show-menu-schema.md`, this plan. Nothing under `src/`
- [x] Roles affected identified — none see a change: every role is `true` and nothing reads the column
- [x] Anything explicitly **out of scope** written down — the layout reading it, the removal of `NavPane`, any settings panel: the `menu-removal` stream

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one docs file, `docs/backlog.md`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Output redirected to a file and the exit codes read:

```
=== gates: build exited 0 after 203s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0247` against highest `0246`; no open `*-schema` PRs
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 247 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; the consumer-header warning was fixed by listing only the path
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0247_role_show_menu.sql … ok`; `--status` then lists it as applied here
- [x] File is re-runnable — one `alter table … add column if not exists`
- [x] Existing rows still read correctly after the change — additive column with a default, so every existing row reads `true`
- [ ] Constraints and defaults exercised against real rows — n/a: no check constraint or trigger added; the default is Postgres's own, and the write policy is unchanged and inherited from `0132`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: `alter table roles drop column show_menu` reverts it, and old code ignores the column
- [x] Production apply plan stated for the release manager — `0247` on production with the next release, any time before the `menu-removal` feature deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this column yet
- [ ] Data persists — n/a: no UI surface, no code reads this column yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code reads this column yet
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads this column yet
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: a not-null boolean has none a user can reach

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `roles` table | unchanged (writes at 2-step, audited) | n/a — no policy changed; `roles_admin_all`, the aal2 policies and `audit_roles` from `0132` already cover the column |
| management | `roles` table | unchanged | n/a — as above |
| staff | `roles` table | unchanged | n/a — as above |
| vet | `roles` table | unchanged | n/a — as above |
| volunteer | `roles` table | unchanged | n/a — as above |
| signed out | nothing | nothing | n/a — no grant changed |

- [ ] Every role above tested — n/a: no policy and no grant changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the menu-removal stream writes the Home screen topic
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of `roles`; the column only adds
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought `docs/backlog.md` only; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, the removal remains; no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-22-role-show-menu-schema.md`
- [x] `README.md` still accurate — it does not list `roles` columns
- [ ] **Release notes.** — n/a: no shelter user would notice; nothing reads the column
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the existing policies and audit trigger were read in `0132`; the apply was run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the consumer is the later `menu-removal` stream, so `0247` must be on production before that deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0247` on production with the next release

### Rollback

- [x] Rollback position stated — code rollback does not revert `0247` and does not need to: older code ignores the column

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry run warned the `-- consumer:` header was misparsed (commas and prose) | fixed — header lists only the path |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads this column yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
