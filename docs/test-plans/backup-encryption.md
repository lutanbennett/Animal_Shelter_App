# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed),
or `n/a` / `deferred` with the reason.

---

## Header

| | |
|---|---|
| Feature | Weekly backup encrypted to an age public key, session tables excluded, Drive link no longer logged (DB-1) |
| Backlog item | `docs/backlog.md` → Encrypt the weekly backup and keep session tables out of it (DB-1, High) |
| Branch / worktree | `claude/backup-encryption` @ `C:\Development\Animal_Shelter_backup-encryption` |
| Dev server | not used; no page changed (`http://localhost:3010` was available) |
| PR | linked from the PR itself |
| Tested by / date | Claude (backup-encryption session), 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item: `scripts/backup.mjs` encrypts every dump with age to the administrator's public key before the upload and the local copy, leaves out the session tables and stops logging the Drive link; the Weekly backup tile reads the new `.dump.age` name
- [x] Files/areas touched: `scripts/backup.mjs`, `scripts/lib/backup-crypto.mjs` (new), `scripts/decrypt-backup.mjs` (new), `scripts/check-backup-encryption.mjs` (new), `src/lib/status/health.ts` (one filter), `package.json` (`age-encryption`), `.env.example`, `README.md`, `docs/pi-hosting.md`, a decision file. No migration, no `worker/`, no page
- [ ] Roles affected identified — n/a: a script run by the administrator or cron; the only app surface is a status tile's file-name filter, which admins already see
- [x] Out of scope: generating the key pair, installing the public key, re-sharing the Drive folder, deleting the old plaintext dumps and the Pi's `backup.log`, rotating anything exposed (all Lutan's, see the manual table); a restore of real data into a scratch project; DB-2's move to an always-on schedule (already the Pi)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one docs file), and `sync` pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing line, as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

`node scripts/check-backup-encryption.mjs` (15 checks, all PASS, exit 0) is the repeatable evidence for the rows below marked *check*.

- [x] Happy path works end to end: an encrypt → decrypt round trip returns byte-identical data with a throwaway key (*check*), and `scripts/decrypt-backup.mjs` decrypted a file written by `encryptBackup` with the throwaway key and refused a second run over the existing output (exit 1)
- [ ] Data persists — n/a: nothing is stored by the app; the output is a file
- [ ] Create / edit / delete all exercised — n/a: not a CRUD feature
- [x] Empty state: `backup.mjs` with no recipient exits 1 with "Backups are always encrypted…" **before** the database is touched (*check*)
- [x] Invalid input is rejected with a readable message: a private key (`AGE-SECRET-KEY…`) as recipient, junk, and an empty value are each refused (*check*); a wrong key cannot decrypt (*check*)
- [x] Boundary cases: two recipients, either can decrypt (*check*); the ciphertext is age format and contains none of the plaintext (*check*); a `pg_dump` result that is not a custom-format archive (`PGDMP`) is not encrypted or uploaded, by reading the code (not provoked)
- [x] Exclusions: `pg_dump` receives `--exclude-table=auth.refresh_tokens`, `auth.sessions` and `auth.mfa_*` (plus `one_time_tokens`, `flow_state`) (*check*, on the argument list)
- [x] No plaintext on disk and no Drive link: `backup.mjs` has no `--file=` and never requests `webViewLink` (*check*, on the source)
- [ ] The dump → encrypt → upload → prune path against the real database and Drive — n/a: this machine has no `SUPABASE_DB_PASSWORD` for dev, so `backup.mjs` stopped at that message. The pieces were tested separately; the first real run is in the manual table

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no page or route changed | n/a |
| management | n/a | no page or route changed | n/a |
| staff | n/a | no page or route changed | n/a |
| vet | n/a | no page or route changed | n/a |
| volunteer | n/a | no page or route changed | n/a |
| signed out | n/a | no page or route changed | n/a |

- [ ] Every role above tested — n/a: no access rule touched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: an operator script; the README "Backups" section is its manual and was updated
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The nearest thing, the Weekly backup tile on `/admin/status`: only the file-name filter changed (`.dump` → `.dump.age`); typecheck and build pass. Not loaded in a browser (see the manual table)
- [x] Shared file touched (`src/lib/status/health.ts`): grep for `.dump` across `src/` finds no other reader of the backup file names
- [x] Nothing merged from `main` during `sync` was broken: one docs file came in; gates exit 0 on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: not ticked, on purpose: the encryption is not in place end to end until Lutan installs the public key and re-shares the folder. A status note goes on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-09-30-backup-encryption.md` (public key not passphrase, in-process encrypt, extra excluded tables, tile filter)
- [x] `README.md` still accurate: Backups section rewritten for the key pair, the recipient, the restore step and the re-enrolment consequence; `docs/pi-hosting.md` and `.env.example` updated too
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: this follow-up only corrects where the key is recorded; the forced sign-out line shipped in #296
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned, except one, which is worded as an intent: that `maxBuffer` 2 GiB is enough (a database of megabytes is far below it; not measured at size)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager (only the tile filter is in the Worker bundle)
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; the Weekly backup tile shows the newest `.dump.age`, and reads red until one exists
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change covers both edges — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the gates line above is verbatim; the round-trip checks are re-run with one command
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: `BACKUP_AGE_RECIPIENT` is read by the script from `.env.deploy.production` on the Pi and laptop, not by the Worker

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR and the script returns to plaintext dumps. Nothing app-side needs undoing except the tile filter; encrypted `.dump.age` files already made stay readable with the private key and need no migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The Weekly backup tile matched only `.dump`, so it would have gone red 15 days after the first encrypted run | fixed: matches `.dump.age`, so it also stops vouching for a plaintext backup |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Generate the key pair** on Lutan's own machine (`age-keygen`), save the whole file in the password manager, delete the file. Not on the Pi, not in chat | Lutan's machine |
| 2 | **Install the public key**: `BACKUP_AGE_RECIPIENT=age1…` in `.env.deploy.production` on the Pi and on the laptop, then `git pull && npm ci` on each | Pi and laptop |
| 3 | **First real run**: `node scripts/backup.mjs --env production --local-copy ~/backups/lannacare` on the Pi. Expect "encrypted for 1 recipient(s)", "link not logged", a `.dump.age` in Drive and on the SSD, and no `.dump` left | Pi |
| 4 | **Restore rehearsal**: fetch that file, `node scripts/decrypt-backup.mjs … --identity <key file>`, `pg_restore` into a scratch project (never production), sign in, then delete the plaintext. This is what closes DB-2's rehearsal and the Deployment "Rehearse a restore" item | Lutan's machine, a scratch Supabase project |
| 5 | **Delete the old plaintext dumps** in Drive `Backups/` and `~/backups/lannacare/*.dump`, and empty `~/backups/backup.log` (it holds a live Drive link per week) | Drive, Pi |
| 6 | **Re-share the Drive folder**: move `Backups/` out of the application root into its own folder shared with the administrator only, and repoint `GOOGLE_DRIVE_ROOT_FOLDER_ID`/the tile's lookup accordingly, or share nothing by link | Drive |
| 7 | **Rotate what was exposed**: treat earlier links and the plaintext dumps as exposed (password hashes, TOTP secrets, refresh tokens): sign everyone out and consider re-enrolling authenticator apps | Supabase dashboard |
| 8 | Weekly backup tile on `/admin/status` reads green after the first encrypted run | `/admin/status` |

### Rollout progress, 2026-10-02 (guided session)

Done: **1** key pair generated by Lutan (public key `age1fz65…y56v9sv3cxyp` is the recipient; the private key is in his iPhone Passwords and on a hardware-encrypted USB stick, nowhere else). **2** `BACKUP_AGE_RECIPIENT` set on the laptop and the Pi; the Pi checkout was fast-forwarded to `main` and `npm ci` run (backup scripts only, the service build is untouched). **3** first real run: "encrypted for 1 recipient(s)", "link not logged", `.dump.age` 0.72 MB in Drive and on the SSD, mode 0600; the cron entry is the same command. **4 (partly)** the Pi's `.dump.age` decrypted on the laptop with the stored key; `pg_restore -l` read it (1339 entries, 50 public tables with data, `auth.users` 4); no `auth.refresh_tokens`, `sessions`, `mfa_*`, `one_time_tokens` or `flow_state` data in it. **5** plaintext dumps deleted from the Pi, `backup.log` emptied, the five plaintext dumps deleted from Drive and the Drive trash emptied (Lutan).

Not done: **4** is not a restore: the laptop's PostgreSQL has client tools only, so nothing was restored into a database and nobody signed in to a restored copy, so DB-2 and "Rehearse a restore" stay open. **6** done by Lutan: `Backups/` moved to `Admin/Backups`, shared with him only, no link; the app finds it through the new `BACKUP_DRIVE_FOLDER_ID` (laptop and Pi env files set; Worker secret and the release that reads it are still to come, and the Pi must `git pull --ff-only` this change before Sunday 03:00). **7** done by Lutan: all auth sessions and refresh tokens deleted on production; **MFA factors were not cleared** (his own TOTP secret was exposed, so re-enrolling is recommended). **8** is outstanding until the release is deployed.

A fault found on the way: appending the key to `.env.deploy.production` glued it onto the last line (no trailing newline) and briefly corrupted `SUPABASE_DB_PASSWORD`; split and de-duplicated on the Pi the same session, the run then connected.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (backup-encryption session)  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: eight items are outstanding; see the pending line below

Manual verification by: pending: the eight items in the manual table (key pair, public key on the Pi and laptop, first run, restore rehearsal, plaintext cleanup, Drive re-share, rotation, tile)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect is fixed
- [ ] Checklist pasted into the PR — n/a: the PR body links this file rather than pasting it
- [ ] Handed to the production release manager — n/a: not yet; nothing ships on a `pending:`

Result: pass

Release manager acknowledgement: n/a: not yet
