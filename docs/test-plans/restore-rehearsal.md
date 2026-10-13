# Feature test plan

## Header

| | |
|---|---|
| Feature | Restore rehearsal: a production backup restored locally and checked; the private schema added to backups; README restore recipe corrected; `scripts/restore-rehearsal.mjs` for the quarterly repeat |
| Backlog item | `docs/backlog.md` → *Rehearse a restore from a production backup* (status note, not ticked: the Supabase half is open) |
| Branch / worktree | `claude/restore-rehearsal` @ `C:\Development\Animal_Shelter_restore-rehearsal` |
| Dev server | not used: no app code changed |
| PR | opened from this branch |
| Tested by / date | Claude, with Lutan present, 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `5f41cc62` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a production backup was decrypted and restored into a throwaway local PostgreSQL 17 server and checked table by table; the restore found and fixed a gap in the backup itself (`private` schema), corrected the README recipe, and made the quarterly repeat one script. The item's Supabase-project half is not done and is filed separately
- [x] Files/areas touched listed: `scripts/backup.mjs` (one line: `SCHEMAS` gains `private`, plus its comment), new `scripts/restore-rehearsal.mjs`, `README.md` "Backups", `docs/backlog.md` (status notes on two items), `docs/decisions/2026-10-13-restore-rehearsal-local.md`, this plan
- [x] Roles affected identified: none of the app's roles. Only the administrator who restores backups; no route, page or database object changes
- [x] Anything explicitly **out of scope** written down: restoring into a Supabase project and signing in (filed on the `backlog` branch as *Restore a production backup into a real Supabase project and sign in*); the untried path of rebuilding `private` by hand for a pre-fix backup; the backup's `flow_state` exclusion leaving one dangling FK (harmless on Supabase, where the table exists)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 180s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; the restored database's `schema_migrations` was read instead (194 rows, newest `0193_can_see_drive_file.sql`, matching production after today's release)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real data): the restore of production's backup was compared table by table with the counts inside the archive (90 tables, 5,100 rows, all equal), and one resident's linked records (placements, diets, clinic visits) were checked as counts, not values
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — n/a: no migration; the restore's own foreign keys were counted instead (140 of 141 in the Supabase stand-in, the missing one pointing at the deliberately excluded `auth.flow_state`)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/restore-rehearsal.mjs <post-fix backup> --identity <key>` printed REHEARSAL PASSED with nine `ok` checks, run by Claude and then by Lutan in his own PowerShell
- [x] Data persists — n/a as an app check; the equivalent here is that every row in the archive is present in the restored database, which the script asserts per table
- [ ] Create / edit / delete all exercised — n/a: no app feature; the script creates and deletes only its own scratch server, and the folder was confirmed gone after each run
- [x] Empty state renders sensibly: the script on a backup missing `private` (made before this branch) fails and names the 38 unexpected errors, the missing views (20 of 43) and policies (286 of 290), exit 1
- [x] Invalid input is rejected with a readable message: missing arguments print the usage line; a `key.txt` that Notepad saved as `key.txt.txt` is named in the message (the case Lutan hit)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no user input beyond two file paths and an optional port

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface changed | n/a |
| management | n/a | no app surface changed | n/a |
| staff | n/a | no app surface changed | n/a |
| doctor | n/a | no app surface changed | n/a |
| volunteer | n/a | no app surface changed | n/a |
| signed out | n/a | no app surface changed | n/a |

- [ ] Every role above tested — n/a: no route, page, RPC or policy changed
- [ ] A role that should not have access is blocked server-side — n/a: no route, page, RPC or policy changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: an administrator's laptop procedure, documented in README "Backups", not a shelter-user task
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: `backup.mjs` with the new `SCHEMAS` ran against production (`--local`, no upload, with Lutan's permission) and printed `Dumping schemas public, private, auth`; `check-backup-encryption.mjs`, `check-backup-folder.mjs` and `check-backup-prune.mjs` all exit 0
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately not ticked; the item asks for a Supabase project and sign-in, which were not done. A dated status note says what was proved, and the Supabase half is its own item on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-13-restore-rehearsal-local.md`)
- [x] `README.md` still accurate: "Backups" now describes `private`, the `share` folder, the quarterly rehearsal and the corrected Supabase recipe
- [ ] **Release notes.** — n/a: internal recovery rehearsal and a README correction — nothing a shelter user would see.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every count in the decision file and README (38 errors, 20 of 43 views, 286 of 290 policies, 140 of 141 FKs, 90 tables, 5,100 rows) is from a run on 2026-10-13. The one unmeasured claim, that Supabase's `postgres` user may set `session_replication_role`, is labelled unproved in both

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing served changes; `backup.mjs` runs on the Pi from the released checkout, not from a Worker
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no served change
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date; the backup timestamp code is unchanged
- [ ] **Boundary or banding change** — n/a: no threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates lines above are pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no served change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no Worker deploy needed for this change
- [ ] `strip-baked-env` seen in the deploy output — n/a: no Worker deploy needed for this change
- [ ] Any new secret/env var exists in production — n/a: no new variable

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration. Note for later releases: the restore recipe has now been exercised locally (this plan), which the template's caveat said it had not
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR and redeploy the Pi; backups then go back to omitting `private`, which loses no data. Nothing in the database changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | `backup.mjs` never dumped the `private` schema: every backup before this branch restores all rows but ~15 views (incl. `resident_current_state`) and 4 policies fail | fixed (`SCHEMAS`); reaches the Pi's nightly run with the next release |
| 2 | High | README Supabase recipe restored `auth` last, so the 20 FKs to `auth.users` fail quietly | fixed in README; unproved on Supabase, deferred to backlog |
| 3 | Medium | README recipe never created the `private` schema, which `pg_restore --schema` does not do | fixed in README; deferred to backlog with #2 |
| 4 | Low | The laptop's PostgreSQL had no `share` folder, so it could not run a server; the planner's check missed it | fixed (folder added from the same EDB 17.11 zip); README and the script both name it |
| 5 | Low | The backup's `flow_state` exclusion leaves one FK (`saml_relay_states` → `flow_state`) uncreatable in a local restore | accepted: harmless on Supabase, where the table exists; listed as a known error in the script |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan followed the corrected recipe himself and found every step clear | README "Backups" → *Rehearsing a restore* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: awaiting Lutan's confirmation in chat

Manual verification by: pending: Lutan to confirm he followed the corrected recipe

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: happens at the next release cut, after merge

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
