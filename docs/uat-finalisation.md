# Finishing UAT: step by step

**What this gets you:** UAT (the customer's test site) at its own address, **`uat.lannacare.org`**, set up
the same way as `test.lannacare.org`: its own database with a copy of production's data, its own copy of
the Drive files, served by the Pi. Then **`lannacare.org` forwards to the live site,
`lannacareforanimals.org`.**

**How to use it:** do the parts in order, and finish each part before starting the next. Several parts
depend on the one before. Every step is yours unless it says otherwise. If anything prints something you
did not expect, stop and ask Claude, pasting what it printed.

**WHERE IT STANDS (8 November 2026): DONE, all eight parts.** UAT answers `0.43.6` at
`uat.lannacare.org` with `x-lanna-served-by: pi`, `lannacare.org` now 301s to
`lannacareforanimals.org`, and Lutan said the same day that UAT *"is now part of the standard
release process"*.

**So this is no longer a to-do list — it is the REBUILD list.** It stays written out in full,
corrected from the real run, for the day UAT has to be built again. **What a RELEASE does to UAT
lives in `docs/release-procedure.md`** (steps 1, 5, 6 and 7, and *What UAT needed once* at its
top). **Do not follow Part 6 for a routine release:** it pushes secrets, which a release should
not, and a release deploys UAT last rather than first.

Part 8, as it stood on 8 November: steps 1, 2 and 4 passed; the failover drill (step 3) was skipped by
Lutan's choice; step 5, the next-day check for CPU-limit errors, is the last thing owed (`#uat7p`).

**Where the reasoning lives:** `docs/pi-hosting.md` ("UAT on the same Pi") and the decision files
`2026-11-06-uat-own-database.md`, `2026-11-07-uat-on-the-pi.md`, `2026-11-07-drive-buckets.md` and
`2026-11-08-uat-finalisation-runbook.md`. You do not need them to follow this list.

**Names used below**

| Name | What it is |
|---|---|
| **Main checkout** | `C:\Development\Animal_Shelter_App` on your PC |
| **UAT's database** | Supabase project `fsjagxmxjosauwmxwype`, under the **`lutan.bennett1@gmail.com`** Supabase account |
| **Production's database** | Supabase project `dbkodyyxxhtygxcxmfcu`, under the `lutan.bennett2@gmail.com` account |
| **UAT's settings file** | `.env.deploy.uat` in the main checkout. A second copy goes on the Pi in Part 5 |

**Commands on your PC:** open an ordinary **PowerShell** window (not *Run as administrator*) and go to the
main checkout first:

```
cd C:\Development\Animal_Shelter_App
```

The prompt then reads `PS C:\Development\Animal_Shelter_App>`. (An administrator window starts in
`C:\WINDOWS\system32`, where the commands below fail with *access denied* or *not found*.) Then paste this
line:

```
Remove-Item Env:SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
```

Your Windows setup has a Supabase token for the *other* account. If it is left in the window, it beats
the one in UAT's settings file and sends UAT commands to the wrong place. The line removes it from that
window only.

---

## Part 1. Fill in UAT's settings file (your PC, about 10 minutes)

1. Open a PowerShell window in the main checkout, paste the line above, then run `git pull` to get the
   latest code.
2. In File Explorer, go to `C:\Development\Animal_Shelter_App`. Open **`.env.local`** and
   **`.env.deploy.uat`** in Notepad, side by side.
3. In `.env.local`, find the three lines that start with **`GOOGLE_OAUTH_CLIENT_ID=`**,
   **`GOOGLE_OAUTH_CLIENT_SECRET=`** and **`GOOGLE_OAUTH_REFRESH_TOKEN=`**. Copy exactly those three whole
   lines to the end of `.env.deploy.uat`. They are the shelter Google account's login, which every
   environment shares.
4. **Copy no other `GOOGLE_` line.** In particular:
   - **`GOOGLE_DRIVE_ROOT_FOLDER_ID`**: UAT already has its own line. Do not copy Test's over it.
   - **`GOOGLE_CALENDAR_ID`** and **`GOOGLE_CALENDAR_REFRESH_TOKEN`**: UAT has **no** calendar. Write both
     lines with **nothing after the `=`**:

     ```
     GOOGLE_CALENDAR_ID=
     GOOGLE_CALENDAR_REFRESH_TOKEN=
     ```

     **Do not leave them out:** a line missing from `.env.deploy.uat` is filled from `.env.local` at deploy
     time, and `.env.local`'s are Test's calendar. An empty value is what switches it off: the deploy skips
     it and the app treats the calendar as not set up.
5. Open **`.env.deploy.production`**. Copy its whole **`ORIGIN_KEY=`** line to the end of
   `.env.deploy.uat`. UAT must use the same value as production.
6. Make sure `.env.deploy.uat` still has its **`SUPABASE_ACCESS_TOKEN=`** line. This PC's copy needs it. The
   Pi's copy must not have it (Part 5 removes it there).
7. Save `.env.deploy.uat` and close all three files.
8. In PowerShell, run:

   ```
   node scripts/check-uat-ready.mjs
   ```

9. Read each line. **`ok`** is fine. **`WARN`** lines are reminders, so read them once. **`FAIL`** lines name
   exactly what is wrong: fix it in `.env.deploy.uat`, save, and run step 8 again. You are done with this
   part when the last line says **`Ready: no failures.`** The check never prints a password or key.

---

## Part 2. Copy production's data into UAT's database (your PC, about 45 minutes)

Production's data goes into UAT's database. UAT's database already has every update applied but holds no
data yet.

1. Make a folder **`C:\Temp\lannacare-restore`**.
2. **Take a fresh production backup into that folder.** In PowerShell:

   ```
   node scripts/backup.mjs --env production --local C:\Temp\lannacare-restore
   ```

   It writes one file named `lannacare-production-<date and time>.dump.age`. Wait for it to finish.
3. **Get the backup key.** Take the backup private key from your Apple Keychain or the encrypted USB drive.
   Save it as **`C:\Temp\lannacare-restore\key.txt`**, with the whole file as `age-keygen` wrote it.
   Never put it anywhere else.
4. **Check the backup is good.** Replace `<file>` with the file's full name from step 2:

   ```
   node scripts/restore-rehearsal.mjs C:\Temp\lannacare-restore\<file> --identity C:\Temp\lannacare-restore\key.txt
   ```

   It must end by saying the checks passed. If it does not, stop and ask Claude.
5. **Unlock the backup:**

   ```
   node scripts/decrypt-backup.mjs C:\Temp\lannacare-restore\<file> --identity C:\Temp\lannacare-restore\key.txt --out C:\Temp\lannacare-restore\restore.dump
   ```

6. **Get UAT's database address.** In your browser, sign in to supabase.com as
   **`lutan.bennett1@gmail.com`**. Open the project **Lanna Care For Animals - UAT**, then click
   **Connect** at the top. In the **Direct** section, open the **Method** list and choose **Session pooler**,
   then copy the connection string. It starts
   `postgresql://postgres.fsjagxmxjosauwmxwype:` and contains `[YOUR-PASSWORD]`.
7. Replace `[YOUR-PASSWORD]` with UAT's **database** password: the value after `SUPABASE_DB_PASSWORD=` in
   `.env.deploy.uat`. This is not your Supabase login password. **If that password contains `@`,** reset it
   first to letters and numbers only (Supabase: Project Settings, then Database, then Reset database
   password), and put the new one in `.env.deploy.uat` too.
8. In PowerShell, store the address for this window only (keep the quotes):

   ```
   $env:DB = "<the whole connection string from step 7>"
   ```

9. **Load the user accounts.** `pg_restore` comes with PostgreSQL 17. If PowerShell says it is *not
   recognized*, add its folder for this window and try again:

   ```
   $env:Path += ";$env:LOCALAPPDATA\Programs\PostgreSQL\17\bin"
   ```

   Run these two, one after the other, `users` first:

   ```
   pg_restore --dbname="$env:DB" --schema=auth --table=users --data-only --no-owner --no-privileges C:\Temp\lannacare-restore\restore.dump
   pg_restore --dbname="$env:DB" --schema=auth --table=identities --data-only --no-owner --no-privileges C:\Temp\lannacare-restore\restore.dump
   ```

   One error about `schema_migrations` saying "permission denied" is normal.
10. **Create one schema by hand.** In the UAT project on supabase.com, open **SQL Editor**, paste this and
    click **Run**:

    ```
    create schema if not exists private;
    ```

11. **Load everything else.** This takes **several minutes**. Do not close the window. Its error messages
    go into a file:

    ```
    pg_restore --dbname="$env:DB" --schema=public --schema=private --clean --if-exists --no-owner --no-privileges C:\Temp\lannacare-restore\restore.dump 2> C:\Temp\lannacare-restore\restore-errors.txt
    ```

12. **Check the errors.** UAT's database already has its tables, so expect only a few errors (on
    8 November there were four, all about `public_stat_switches`). Every one that mentions **`DROP`** is
    harmless: it tried to remove something that was not there. Ask Claude to read
    `C:\Temp\lannacare-restore\restore-errors.txt` and confirm nothing else went wrong. A failed `CREATE`,
    `COPY`, `ALTER` or `ADD CONSTRAINT` is a real problem, so stop if Claude finds one.

    **Then put back production's permissions.** Step 11's `--no-privileges` leaves them out, and on
    Supabase that goes wrong both ways: the `private` objects get none (Residents says *permission denied
    for view resident_current_state*), and everything in `public` gets far too many. In PowerShell, with
    the backup and key still in `C:\Temp\lannacare-restore`:

    ```
    node scripts/restore-grants.mjs C:\Temp\lannacare-restore\<file>.dump.age --identity C:\Temp\lannacare-restore\key.txt --env uat --confirm fsjagxmxjosauwmxwype
    ```

    It must end **`OK: the target's privileges are exactly the backup's.`** It does everything in one
    transaction, so if it fails nothing has changed. (*Superseded 2026-11-09, `#rg7pv`:* this step used to be
    three `grant` lines typed into the SQL Editor. They fixed Residents but left about 890 permissions
    production had removed; the script replaced them, and on 9 November it put UAT exactly on production's.)
13. **Compare the resident counts.** In UAT's SQL Editor, run `select count(*) from residents;`. Sign in to
    supabase.com as `lutan.bennett2@gmail.com`, open production's project, and run the same line there.
    The two numbers must match.
14. **Apply any newer database updates.** In PowerShell:

    ```
    node scripts/apply-migrations.mjs --status --env uat
    ```

    The project it names **must be `fsjagxmxjosauwmxwype`**. If it is any other project, stop. If it says
    some files are pending, run `node scripts/apply-migrations.mjs --env uat` to apply them, then run the
    `--status` line again to see none pending.
15. **Clean up.** Delete `restore.dump`, `key.txt` and `restore-errors.txt` from
    `C:\Temp\lannacare-restore`. The first two are unprotected copies. Keep the `.dump.age` file if you
    like; it is still locked. Then **close this PowerShell window**: `$env:DB` holds UAT's database
    password until it closes.

---

## Part 3. Give UAT its own copy of the Drive files (your PC, about 30 minutes)

UAT's data now names production's photos and documents in Drive. Without this part, a tester deleting a
photo on UAT would delete the real one. This part copies the files and points UAT at the copies.
It must come after Part 2 and before Part 5.

1. Open `.env.deploy.production` in Notepad. Copy the **value** after `GOOGLE_DRIVE_ROOT_FOLDER_ID=`
   (production's Drive folder ID). Below, it replaces `<production folder id>`. It is the folder to copy
   **from**: UAT's restored data names production's files, so the copy starts there. Production's folder
   is only read; nothing in it is changed.
2. **Trial run, which copies nothing:**

   ```
   node scripts/drive-copy-tree.mjs --env uat --source <production folder id> --map .local\drive-copy-map.uat.jsonl
   ```

   It counts the files and reports **`Fits: yes`** or **`Fits: NO`**. If it says NO, stop.
3. **Do the copy.** It takes a while. If it stops part way, run the same line again and it carries on:

   ```
   node scripts/drive-copy-tree.mjs --env uat --source <production folder id> --map .local\drive-copy-map.uat.jsonl --apply
   ```

   It ends **`Copied <n> files this run; 0 failed.`** (8 November: 915 files, 342 folders, 1.11 GB.)
4. Near the start it prints **`New root "...": <an id>`**. Copy that id. If it has scrolled away, the first
   line of `.local\drive-copy-map.uat.jsonl` holds it (`"kind":"root"`): ask Claude to read it out.
   **This new folder, not the empty one made on 7 November, is now UAT's Drive folder.** The script always
   makes a new folder named `Production (UAT copy <date>)` at the top of **My Drive** of the shelter
   account (`lannaanimalfoundationbwm@gmail.com`, the account the script printed). It is not shared, so it
   is invisible from any other Google account. You may move it into **LCA Health system** and rename it
   **UAT**: Drive keeps a folder's id when it is moved or renamed, and the id is all the app uses.
5. Open `.env.deploy.uat` and change the value after `GOOGLE_DRIVE_ROOT_FOLDER_ID=` to the id from step 4.
   Save. (The old empty UAT folder can be deleted in Drive once you have checked it is empty. Nothing uses
   it. Delete it before renaming the new one, so there are never two folders called UAT.)
6. **Trial run of the database change, which changes nothing:**

   ```
   node scripts/drive-remap-ids.mjs --env uat --map .local\drive-copy-map.uat.jsonl
   ```

   It lists the columns it would change and how many rows in each.
7. **Do it:**

   ```
   node scripts/drive-remap-ids.mjs --env uat --map .local\drive-copy-map.uat.jsonl --apply
   ```

   It ends **`APPLIED: <n> values rewritten.`**, the same number the trial gave (8 November: 506). It
   refuses to touch production.
8. **Check nothing still points at production's files.** Step 7 changes only the ids it has a copy for, so a
   record naming a Drive file *outside* production's folder would be left pointing at the real file, and
   running step 7 again cannot see it. This check can. It only reads:

   ```
   node scripts/check-drive-leftovers.mjs --env uat --map .local\drive-copy-map.uat.jsonl
   ```

   It must end **`CLEAN`**. If it says **`LEFTOVERS`**, stop and ask Claude before anyone tests UAT.
9. Run `node scripts/check-uat-ready.mjs` again. It must still say **`Ready: no failures.`**

---

## Part 4. Sign-in and email for UAT's address (browser, about 15 minutes)

1. **UAT's sign-in addresses.** On supabase.com as `lutan.bennett1@gmail.com`, open the UAT project, then
   **Authentication**, then **URL Configuration**:
   - Set **Site URL** to `https://uat.lannacare.org`
   - Under **Redirect URLs**, click **Add URL** and add `https://uat.lannacare.org/auth/callback`
   - Click **Save**.
2. **Google sign-in client.** At console.cloud.google.com, signed in as the shelter account
   (`lannaanimalfoundationbwm@gmail.com`), choose project **Lanna Care - Dev** (`lanna-care-dev`), then
   **APIs & Services**, then **Credentials**. Every live Google client is in this project, whichever
   Supabase account the project it serves belongs to (`docs/google-cloud-inventory.md`). The Supabase
   accounts and the Google account are different things: Supabase only needs the client's ID and secret
   pasted in. Look under **OAuth 2.0 Client IDs** for a client whose authorised redirect URI is
   `https://fsjagxmxjosauwmxwype.supabase.co/auth/v1/callback`.
   - **If there is one**, use it. Since 8 November it exists: **Lanna Care sign-in (UAT Supabase)**.
   - **If there is none**, click **Create credentials**, then **OAuth client ID**, choose type **Web
     application**, and name it **Lanna Care sign-in (UAT Supabase)**. Under **Authorised redirect URIs**,
     add `https://fsjagxmxjosauwmxwype.supabase.co/auth/v1/callback`. Click **Create** and keep the client
     ID and secret it shows. Add it to `docs/google-cloud-inventory.md`.
   - Do not change any other client: each one serves a different project. The other two are production's
     (`Lanna Care sign-in (production Supabase)`) and Dev/Test's (`LCA Application`).
3. **Turn on Google sign-in for UAT.** Back in the UAT project on supabase.com, open **Authentication**,
   then **Sign In / Providers**, then **Google**. Switch it on, paste the client ID and secret from step 2,
   and save. Put the same secret after `GOOGLE_SIGNIN_CLIENT_SECRET=` in `.env.deploy.uat`, replacing
   whatever was there (a value copied from another environment belongs to another client). **Check the line
   you change is `GOOGLE_SIGNIN_CLIENT_SECRET` and not `GOOGLE_OAUTH_CLIENT_SECRET`:** on 8 November the
   sign-in secret landed on the Drive line and every photo failed with *invalid_client*.
   `node scripts/check-uat-ready.mjs` now catches that.
4. **A Resend key of UAT's own.** Mail goes out through Resend (`docs/email-sending.md`, section 2). At
   resend.com, open **API Keys**, then **Create API key**: name `Supabase UAT (new project)`, permission
   *Sending access*, domain `lannacare.org`. It is shown **once**: leave the page open and put it straight
   into step 5, never into a file. **Do not reuse or delete the key called `Supabase UAT`:** despite its
   name it is **production's** live key, made on 23 September when today's production database was still
   called UAT. Rename it `Supabase production` if Resend offers a rename.
5. **Email sender.** In the UAT project, open **Authentication**, then **Emails**, then **SMTP Settings**,
   switch on **Enable custom SMTP**, and fill in: sender email `noreply@lannacare.org`, sender name
   `Lanna Care UAT`, host `smtp.resend.com`, port `465`, username `resend`, password the key from step 4.
   Save. Then under **Authentication**, **Rate Limits**, raise the email limit to about 30 an hour.
6. **Test the sender.** The site is not live yet, so its *Forgot password?* page cannot be used. This sends
   the same request straight to UAT's Supabase, to an address of yours that has a login:

   ```
   node scripts/send-reset-email.mjs you@example.com --env uat
   ```

   It prints **`HTTP 200, sent`**. The mail must arrive from **Lanna Care UAT**, and Resend's **Emails**
   page shows it *Delivered*. Its link points at `uat.lannacare.org` and does nothing until Part 6.

---

## Part 5. Set up UAT on the Pi (Pi and Cloudflare, about 45 minutes)

Nothing in this part is visible to anyone until Part 6.

1. **Open a terminal on the Pi:** `ssh lutan@lanna-pi.local`
2. **Check memory before you start.** Run `free -m` and note the **available** figure. With production
   and Test running it was about 3,365 MB on 7 November and 3,047 MB on 8 November. UAT needs up to 900 MB.
3. **Get the code.** On the Pi:

   ```
   git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App_uat
   ```

4. **Copy UAT's settings file to the Pi.** This runs on your **PC**, not the Pi: switch to the PowerShell
   window whose prompt reads `PS C:\Development\Animal_Shelter_App>` (not `lutan@lanna-pi`). In the Pi
   window it fails with *No such file or directory*, because the file is on the PC:

   ```
   scp .env.deploy.uat lutan@lanna-pi.local:Animal_Shelter_App_uat/.env.deploy.uat
   ```

5. **Remove the Supabase token from the Pi's copy.** Back on the Pi:

   ```
   sed -i '/^SUPABASE_ACCESS_TOKEN=/d' ~/Animal_Shelter_App_uat/.env.deploy.uat
   grep -c SUPABASE_ACCESS_TOKEN ~/Animal_Shelter_App_uat/.env.deploy.uat
   ```

   The second line must print **`0`**. The Pi's copy must never hold that token; the setup in the next step
   refuses to run if it does. Also, the UAT folder on the Pi must never get a `.env.local` or a
   `.env.deploy.production`.
6. **Run the setup:**

   ```
   cd ~/Animal_Shelter_App_uat && ./scripts/pi/setup-uat.sh
   ```

   **No `sudo` in front:** it refuses to run as root and asks for your Pi password itself, once, at
   `== 2. systemd`. It builds UAT and starts it as its own service; the build is slow and quiet for long
   stretches. A `chgrp: … Operation not permitted` line is normal on the first run: UAT's user does not
   exist yet at that point, and the script sets the file's group again after making it. It must end with
   **`lanna-care-uat runs as lannacare-uat and answers`**. (If it says *Permission denied* before doing
   anything, the clone predates the fix of 8 November: run `bash ./scripts/pi/setup-uat.sh` instead.)
   If it stops with a message naming a missing setting, add that setting to the Pi's `.env.deploy.uat`
   (and to your PC's copy) and run it again.
   **Then close the Pi window and reconnect** (`ssh lutan@lanna-pi.local`). The setup added your Pi user to
   UAT's group, which only counts from the next login; without it, the next `deploy-pi.sh` ends with a page
   of *rm: cannot remove '.next.prev/…': Permission denied* (the deploy itself still works).
7. **Check memory after.** Run `free -m` again; there should still be plenty available. Then run
   `journalctl -u lanna-care -n 30` and check production did **not** restart during the setup.
8. **Find the tunnel's id.** Run `ls /etc/cloudflared/`. The file ending in `.json` is named after the
   tunnel id (a long string of letters, numbers and dashes). Below, it replaces `<tunnel id>`.
9. **Give UAT's Pi address to the tunnel:**

   ```
   cloudflared tunnel route dns <tunnel id> uat-pi.lannacare.org
   ```

10. **Install the new tunnel settings and restart the tunnel:**

    First keep a copy of today's settings, so they can be put straight back:

    ```
    sudo cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.bak-before-uat
    ```

    Then, one line at a time:

    ```
    cd ~/Animal_Shelter_App_uat && sed -e "s|__TUNNEL_ID__|<tunnel id>|g" scripts/pi/cloudflared-config.yml | sudo tee /etc/cloudflared/config.yml >/dev/null
    sudo systemctl restart cloudflared
    systemctl is-active cloudflared
    ```

    The last line must print **`active`**. These need your Pi password. The file installed is the whole
    tunnel configuration, so before running it Claude can compare it with the Pi's current one: on
    8 November the only change besides comments was the added `uat-pi.lannacare.org` entry.
11. **Check production is still fine:** open `https://lannacareforanimals.org` in your browser and sign in.
12. **Let the Pi address through the firewall rule.** In the Cloudflare dashboard, open the
    **lannacare.org** site, then **Security**, then **Security rules** (older dashboards called this
    **WAF**, then **Custom rules**). Edit the custom rule, action **Block**, that already lists `pi.lannacare.org` and `test-pi.lannacare.org`, and add `uat-pi.lannacare.org` to its list
    of hostnames. The list then reads:
    `{"pi.lannacare.org" "test-pi.lannacare.org" "uat-pi.lannacare.org"}`. Save.
    **Edit the existing rule. Do not create a new one:** the free plan allows only five. Change nothing
    else in it, above all the part about the key header.
13. **Check the firewall now stands in front of UAT's Pi.** In PowerShell on your PC:

    ```
    curl.exe -sI https://uat-pi.lannacare.org/login
    ```

    It must say **`403`** with **`Content-Type: text/html`**: Cloudflare's block page, the same as
    `pi.lannacare.org` gives. A 403 with `text/plain` is the app's own refusal and means the firewall
    rule does not cover the address yet.

---

## Part 6. Put UAT live at uat.lannacare.org (your PC, about 10 minutes)

Only after Parts 1 to 5. **From this point UAT moves: `lannacare.org` stops showing UAT and
`uat.lannacare.org` starts.** Do Part 7 straight after this part.

**When:** the UAT deploy only ships a released version. It refuses if the code has release notes not yet
cut into a release. So do this part **right after a release is cut** (or ask for one to be cut first).
If step 3 below says *"ships only a written-down release"*, that is the reason; wait for the release.
**To change one Worker setting between releases, do not deploy:** run
`npx.cmd wrangler secret put <NAME> --env uat` and paste the value at its prompt.

**Not `npm run deploy:uat`.** PowerShell's execution policy blocks `npm` on this machine
(`npm.ps1 cannot be loaded because running scripts is disabled on this system`), so the commands below
are the bare `node` form, and `wrangler` is run as `npx.cmd`. Do not change that setting. They are the
same thing: `deploy:uat` in `package.json` is exactly `node scripts/deploy.mjs --env uat`.

**First, in the same window: `Remove-Item Env:SUPABASE_ACCESS_TOKEN`.** This PC's shell carries the
*other* Supabase account's token, and before 8 November it beat UAT's own, so every UAT database read
died with *Missing required permission(s): database_read*. Since then the scripts use UAT's own token
from `.env.deploy.uat` whatever the shell holds, so this line is belt-and-braces.

1. In PowerShell in the main checkout (with the first line of this document pasted), run `git pull`.
   Then `node scripts/check-uat-ready.mjs`: it must say **`Ready: no failures.`**
2. **Bring UAT's database to the release:** `node scripts/apply-migrations.mjs --status --env uat`, then, if
   anything is pending, `node scripts/apply-migrations.mjs --env uat` and `--status` again.
3. Preview what will happen:

   ```
   node scripts/deploy.mjs --env uat --secrets --no-mail --plan
   ```

   It should name project `fsjagxmxjosauwmxwype` and show no `deploy: WARNING` line. In its list of
   secrets to push, **no line may say `<- .env.local`** and no `GOOGLE_CALENDAR_` line may appear. If it
   refuses with *"main and origin/main differ (N behind)"*, run `git pull` and preview again. If it
   suggests `--allow-dev-fallthrough`, do **not** use it: that flag pushes Test's values to UAT.
   **`--no-mail` matters:** UAT's database holds production's real users, so a release email from UAT
   would reach real people. (Since 8 November the script will not mail from UAT unless `--mail` is
   given, so this is belt-and-braces rather than the only thing stopping it.)
4. **Deploy:**

   ```
   node scripts/deploy.mjs --env uat --secrets --no-mail
   ```

   Read the line naming the Supabase project: it must be `fsjagxmxjosauwmxwype`. It ends naming
   `uat.lannacare.org (custom domain)`. **`--secrets` only adds and replaces settings; it never removes one.**
   So list the Worker's settings with `npx.cmd wrangler secret list --env uat`, and remove any that UAT must
   not have, such as a `GOOGLE_CALENDAR_` one, with `npx.cmd wrangler secret delete <NAME> --env uat`.
   (On 8 November two calendar settings from older deploys were found and removed this way.)
5. **Bring the Pi to the same release,** so the Pi and the Cloudflare fallback run the same code. In the
   **Pi** window (`lutan@lanna-pi`), not the PC one:

   ```
   cd ~/Animal_Shelter_App_uat && git pull && ./scripts/pi/deploy-pi.sh --env uat
   ```

   If `.env.deploy.uat` changed since the Pi's copy was made, copy it again first (Part 5, steps 4 and 5).
6. Open **`https://uat.lannacare.org`** and sign in with Google. You should see the **UAT** badge in the
   header and production's residents. (The very first visit can take a minute while Cloudflare sets up the
   new address.)
7. **Only `uat.lannacare.org` belongs to the Worker.** Claude can check this from outside: if
   `lannacare.org` and `www.lannacare.org` have no address before Part 7, no Worker holds them (on 8 November
   the deploy had already let them go). In the dashboard the list is under the Worker's **Settings**, in
   **Domains & Routes**, which newer layouts move around.

---

## Part 7. Forward lannacare.org to the live site (Cloudflare, about 10 minutes)

1. In the Cloudflare dashboard, open the **lannacare.org** site, then **DNS**, then **Records**.
2. Look for records named **`lannacare.org`** (shown as `@`) and **`www`** of type **A**, **AAAA** or
   **CNAME**.
   - **If there is none for `lannacare.org`:** click **Add record**, type **A**, name **`@`**, IPv4
     **`192.0.2.1`**, Proxy status **on** (orange cloud), and save. The address is a placeholder: Cloudflare
     answers before anything reaches it.
   - **If there is none for `www`:** click **Add record**, type **CNAME**, name **`www`**, target
     **`lannacare.org`**, Proxy status **on**, and save.
   - **Do not touch** the `MX` or `TXT` records. They carry the email for `@lannacare.org` addresses,
     which keeps working.
3. Go to **Rules**, then **Redirect Rules** (it may say **Single Redirects**), and click **Create rule**:
   - **Name:** `Forward lannacare.org to production`
   - **If incoming requests match:** choose **Custom filter expression**. Set **Field** to **Hostname**,
     **Operator** to **equals**, and **Value** to `lannacare.org`. Click **Or** and add the same with
     `www.lannacare.org`. **Check the second line is there:** on 8 November it was missing at first, and
     `www` gave a *522* error instead of forwarding. With **Edit expression** the whole condition reads
     `(http.host eq "lannacare.org") or (http.host eq "www.lannacare.org")`.
   - **Then:** **Type** Dynamic. **Expression**:
     `concat("https://lannacareforanimals.org", http.request.uri.path)`.
     **Status code** **301**. Tick **Preserve query string**.
   - Click **Deploy**.
4. **Check it.** Open `https://lannacare.org/adopt` in a private browser window (your own PC may remember
   for a few minutes that the address had no record, so a phone or Claude's check is quicker). You should land on
   `https://lannacareforanimals.org/adopt`. Try `https://www.lannacare.org` too.
5. `test.lannacare.org` and `uat.lannacare.org` are not affected: the rule names only the two addresses
   above.

---

## Part 8. Check everything works (Pi and browser, about 20 minutes, then once a day later)

1. **UAT is served by the Pi.** In PowerShell:

   ```
   curl.exe -sI https://uat.lannacare.org/login
   ```

   One line of the output must say **`x-lanna-served-by: pi`**.
2. **The Pi address is closed to strangers.** In PowerShell:

   ```
   curl.exe -sI https://uat-pi.lannacare.org/
   ```

   The first line must say **`403`**.
3. **The fallback works.** On the Pi, run `sudo systemctl stop lanna-care-uat`. Run step 1 again: it now
   says **`worker`**. Sign in to `https://uat.lannacare.org` and save something small. Then on the Pi run
   `sudo systemctl start lanna-care-uat`, and step 1 says `pi` again within a minute.
4. **Photos come from UAT's own copy.** On UAT, open a resident and look at their photos. They should load.
   Upload a test photo, then check in Drive that it went into the new UAT folder from Part 3 and not into
   production's.
5. **The next day:** in the Cloudflare dashboard, open **Workers & Pages**, then **lanna-animal-care-uat**,
   then **Metrics**. Under errors, there should be **no "Exceeded CPU Time Limits"**. There were 627 on
   5 November.
6. **Tell Claude it is live.** The UAT colour check under the four themes (backlog item `#uq4vz`) can then be
   done on the real site.

---

## Backlog items this finishes

| Item | Finished by | State on 8 November |
|---|---|---|
| `#u7d3b` UAT's own database | Parts 1, 2, 4 and 6 | **Ticked** |
| `#uat7p` UAT served by the Pi | Parts 5, 6 and 8 | **Ticked** |
| `#rqv5c` UAT's own Drive copy | Part 3 | **Still open** — its UAT half is done; what is left is production moving to the shelter's own Google account, which is not scheduled and is nothing to do with UAT |
| `#uq4vz` UAT's colour on a real UAT build | Part 8, step 6 | **Still open, and now DOABLE** — it was waiting for a build where `getAppEnv()` resolves to `uat`, and that now exists at `uat.lannacare.org` |

**Not part of this list:** anything else about production, moving production to the shelter's own Google
account, the Cloudflare hardening (`#ao0jk`) and acceptance testing (`#mc6fu`).

**Three one-time jobs this list did NOT cover, found when UAT joined the release process — ALL
THREE DONE 2026-11-09.** They are in `docs/release-procedure.md` under *What UAT needed once*,
which records what each turned out to be. In short: the Supabase token was never short of a
permission (this PC's shell held the other account's token, and `scripts/lib/env.mjs` now lets the
environment file's win); the Pi's `/etc/sudoers.d/lanna-care-restart` names `lanna-care-uat`; and
`.env.deploy.uat` holds a `CLOUDFLARE_PURGE_TOKEN` scoped to the `lannacare.org` zone alone.
**A UAT release now has no manual last mile, and a release that adds a migration ships UAT like the
other two.** *Before that date this paragraph said all three were outstanding, which is why records
written then say so.*
