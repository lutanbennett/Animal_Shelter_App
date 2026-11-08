# Finalising UAT: the one list

**This is the index and the order.** It replaces nothing: `docs/pi-hosting.md` keeps the Pi runbook, the
decision files keep the reasoning. Written 2026-11-08 (stream `uat-finalise`) because the work was spread
over four backlog items, four decision files and two runbooks, and nobody could see all of it at once.

**UAT is `lannacare.org`.** Its own Supabase project is `fsjagxmxjosauwmxwype`, under the *second*
Supabase account (`lutan.bennett1@gmail.com`). Production is `lannacareforanimals.org`; Test is
`test.lannacare.org`. Nothing below touches production.

**Where things stand.** Code merged: UAT's own database wiring (#1338), the Pi service and scripts (#1356),
the Drive copy/remap scripts. **Nothing is live.** UAT still renders in its Worker, over the free CPU limit.
Every step below is **Lutan's hands**, because each needs a value, a dashboard or the Pi that only he has.

Backlog items this list closes, and when each closes:

| Item | Closes at |
|---|---|
| `#u7d3b` UAT's own database | steps 2, 3 and 5 |
| `#uat7p` UAT served by the Pi | steps 4, 5 and 7 |
| `#rqv5c` UAT's own Drive copy | step 6 |
| `#uq4vz` signed-in colour on a real UAT build | step 7 |

---

## Step 1. Configuration preflight (dev machine, Lutan)

**Nothing else works until this is right, and three later steps fail in confusing ways if it is not.**

Run in the **main checkout**, `C:\Development\Animal_Shelter_App` (a worktree has no `.env.deploy.uat`):

```
node scripts/check-uat-ready.mjs
```

It prints key names and verdicts, never a value. Fix every `FAIL`, then run it again. What it needs from
`.env.deploy.uat` that is **not there today** (the file holds nine keys, names only were checked):

| Key | What to put | Why it is missing |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | **Copy** the same three values the other environments use: they are the shelter account's Drive credentials (`lannaanimalfoundationbwm`), shared by every environment | Production's file gets by without them because `loadEnv()` layers it over `.env.local`. **The UAT clone on the Pi has no `.env.local`, so nothing falls through.** |
| `ORIGIN_KEY` | The **same value as production's** (the Worker sends it, the Pi's app checks it) | UAT was not served by the Pi until now |

**Two traps. Both have already bitten once.**

1. **Do not copy "the `GOOGLE_*` keys" out of `.env.local`.** That is wrong, and was said wrongly on
   2026-11-07 and retracted the same turn. It would point UAT at **production's Drive tree and the live
   calendar**, which is the cross-pollination UAT exists to prevent. The correct split:
   - `GOOGLE_OAUTH_CLIENT_ID` / `_CLIENT_SECRET` / `_REFRESH_TOKEN`: copy (above).
   - `GOOGLE_DRIVE_ROOT_FOLDER_ID`: **UAT's own root, already set; never copy this one.**
   - `GOOGLE_CALENDAR_REFRESH_TOKEN` / `GOOGLE_CALENDAR_ID`: **leave both out of UAT's file entirely.**
     They are the live shared calendar. Unset just means visits are not sent to a calendar; set, a tester
     could write a vet visit onto the shelter's real one. The check fails if either is present.
2. **`SUPABASE_ACCESS_TOKEN` is in the dev machine's `.env.deploy.uat` and must NOT be in the Pi's copy.**
   The two copies of the same filename deliberately differ. UAT's project is in the second account, so
   migrations cannot reach it without that account's token in the dev-machine file; but it is
   `neverOnPi`, and `setup-uat.sh` refuses to run if any env file on the Pi holds it.
   **Related:** if your shell exports a `SUPABASE_ACCESS_TOKEN` (the other account's), it beats both files.
   Run every UAT command as `env -u SUPABASE_ACCESS_TOKEN node ...` and read the project ref the runner
   prints; it must say `fsjagxmxjosauwmxwype`.

---

## Step 2. Restore production's data into UAT's database (dev machine, Lutan)

**Read first:** README "Backups" (the restore recipe, steps 1 to 4) and
`docs/decisions/2026-10-19-restore-drill-real-supabase.md`.

- `auth.users` and `auth.identities` go in as **separate data-only calls, `users` first** (the Supabase
  `postgres` user cannot relax the link between them).
- It is **slow over the internet: several minutes**. Anything with a 120 second timeout cuts it off partway.
- About 490 errors on a fresh project are normal; a failed `DROP` is noise, a failed `CREATE`, `COPY`,
  `ALTER` or `ADD CONSTRAINT` is real. The counts in recipe step 4 are the proof.
- **Not covered by the drill, so check rather than assume:** (a) UAT is *not* a fresh project: all 326
  migrations are already applied (`--all-history`, 0 pending). The recipe's `--clean --if-exists` rebuilds
  `public` and `private` from the dump, and the dump's `schema_migrations` then replaces that table's rows.
  Afterwards run `env -u SUPABASE_ACCESS_TOKEN node scripts/apply-migrations.mjs --status --env uat` and
  read the project ref and the pending count. If production is behind the repo, UAT will show the newer
  files as pending: apply them (bare, no pipes). (b) The restore itself needs only UAT's own database
  connection string (its database password), so the two Supabase accounts should not matter here; they
  matter for the token and the dashboard. That is reasoned, not measured.
- Restored password hashes are real people's, MFA is not restored by design, and nobody knows what UAT's
  sign-in will do until step 3. Testers sign in with Google.

This step must come before step 6: the Drive remap rewrites ids *inside UAT's database*, so the data has
to be there first.

---

## Step 3. Sign-in and email (dashboards, Lutan)

1. **UAT's Supabase project** (`fsjagxmxjosauwmxwype`) → Authentication → URL Configuration: Site URL
   `https://lannacare.org`, and `https://lannacare.org/auth/callback` in the Redirect URLs.
2. **Google console**, project `lanna-care-dev` (the `lanna` account): add
   `https://fsjagxmxjosauwmxwype.supabase.co/auth/v1/callback` as a **new** authorised redirect URI on a
   Google sign-in client. **Add, do not replace**: the existing URIs serve the other projects.
   `GOOGLE_SIGNIN_CLIENT_SECRET` in `.env.deploy.uat` is the secret for the client this is set on.
3. **Email sender**, the project's Authentication → SMTP settings, set as `docs/domain-checklist.md`
   (SMTP and `RELEASE_MAIL_FROM` lines) describes for production, so UAT mail does not come from
   Supabase's shared default. *The UAT-specific values are not written down anywhere I could find; if the
   checklist does not settle it, say so and it becomes a small decision file.*

---

## Step 4. The Pi (Lutan, on the Pi, Cloudflare dashboard)

This is `docs/pi-hosting.md` → "UAT on the same Pi", steps 1 to 3. Not copied here.
**Nothing is reachable until step 5, so a half-done step 4 changes nothing for anyone.**

- Clone `~/Animal_Shelter_App_uat`. Its `.env.deploy.uat` is a copy of the dev machine's **minus
  `SUPABASE_ACCESS_TOKEN`** (trap 2 above). There must be no `.env.local` and no `.env.deploy.production`.
- `./scripts/pi/setup-uat.sh`.
- `free -m` before and after, and `journalctl -u lanna-care -n 30` for production restarts. **The memory
  question is answered, so this is a confirm, not a risk:** measured on the Pi 2026-11-07 with production and
  Test both running, 683 MB used and 3,365 MB available, 6 GB swap, a 900 MB cap for the third server fits.
- Tunnel DNS: `cloudflared tunnel route dns <tunnel> uat-pi.lannacare.org`; install the new cloudflared
  config; restart cloudflared (these two are outside the Pi's passwordless sudo, so Lutan's).
- **WAF host set: extend, never add** (free plan, five custom rules):
  `{"pi.lannacare.org" "test-pi.lannacare.org" "uat-pi.lannacare.org"}`.

---

## Step 5. Deploy UAT (dev machine, Lutan)

**Only after steps 1 to 4**, and it is what makes any of it reachable:

```
env -u SUPABASE_ACCESS_TOKEN npm run deploy:uat -- --secrets
```

The `env -u` only removes a stale shell export of the other account's token (trap 2); the right token is
already in `.env.deploy.uat`. If step 6 changes UAT's Drive root (below), you redeploy once more.

---

## Step 6. UAT's own Drive copy and the id remap (dev machine, Lutan)

`#rqv5c`, runbook P7 and 6a. **After step 2**: the remap rewrites ids in UAT's restored database.
Dry-run each first (the default); `--apply` only when the numbers look right.

1. Copy. The source is **production's Drive root** (its `GOOGLE_DRIVE_ROOT_FOLDER_ID`); pass it explicitly,
   because without `--source` the script copies UAT's own (empty) root:

   ```
   node scripts/drive-copy-tree.mjs --env uat --source <production root id> --map drive-copy-map.uat.jsonl
   node scripts/drive-copy-tree.mjs --env uat --source <production root id> --map drive-copy-map.uat.jsonl --apply
   ```

   The dry run measures the tree and the account's free space ("Fits: yes"; the previous measure was 1.79 GB
   against 13.17 GB free). It is re-runnable and resumable with the same `--map`.
2. Remap UAT's database onto the copies:

   ```
   node scripts/drive-remap-ids.mjs --env uat --map drive-copy-map.uat.jsonl
   node scripts/drive-remap-ids.mjs --env uat --map drive-copy-map.uat.jsonl --apply
   ```

   It refuses production outright, and a second run changes nothing.

**FOUND WHILE WRITING THIS, NOT SETTLED: the copy script makes a NEW root folder at the top of the
account's My Drive, named "... (UAT copy <date>)" (`scripts/drive-copy-tree.mjs`, about line 160). It does
not fill UAT's existing empty root.** So after the copy, the new root's id, which the script prints, has to
become UAT's `GOOGLE_DRIVE_ROOT_FOLDER_ID` (in both copies of `.env.deploy.uat`, then redeploy), or the app
keeps writing into the empty one. The simple answer is to adopt the new root and leave the empty one unused.
`check-uat-ready` must pass again afterwards. Either way it is Lutan's call and a small one; the item
`#rqv5c` carries it.

---

## Step 7. Verify (Lutan; the colour pass is Claude's once a real build exists)

- `curl -sI https://lannacare.org/login | grep x-lanna` says `pi`, and a **signed-in** page says `pi`.
- `curl -sI https://uat-pi.lannacare.org/` from outside is **403**.
- **Failover drill:** `sudo systemctl stop lanna-care-uat`; the header flips to `worker`; sign in and submit
  something while it is stopped; then `start` it.
- After one real day: the UAT Worker's Metrics, Errors by invocation status, shows **no "Exceeded CPU Time
  Limits"** (there were 627 on 2026-11-05).
- **Colour (`#uq4vz`):** the same signed-in pass under the four themes, on a build where `getAppEnv()`
  genuinely resolves to `uat`. The 2026-11-08 pass on a hand-set attribute is in
  `docs/test-plans/uat-finalise.md`; it proves the CSS and **not** that resolution.

---

## What this does not cover (on purpose)

Production anything (`#w4k9n`), the later move of production to the shelter's own Google account (`#rqv5c`'s
second half), the Cloudflare hardening (`#ao0jk`), and acceptance testing (`#mc6fu`, parked).
