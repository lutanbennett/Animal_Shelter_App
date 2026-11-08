# Finishing UAT: step by step

**What this gets you:** UAT (the customer's test site) at its own address, **`uat.lannacare.org`**, set up
the same way as `test.lannacare.org`: its own database with a copy of production's data, its own copy of
the Drive files, served by the Pi. Then **`lannacare.org` forwards to the live site,
`lannacareforanimals.org`.**

**How to use it:** do the parts in order, and finish each part before starting the next. Several parts
depend on the one before. Every step is yours unless it says otherwise. If anything prints something you
did not expect, stop and ask Claude, pasting what it printed.

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

**Commands on your PC:** use a **PowerShell** window opened in the main checkout. At the start of every
new window, paste this line first:

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
   - **`GOOGLE_CALENDAR_ID`** and **`GOOGLE_CALENDAR_REFRESH_TOKEN`**: these are the shelter's **real**
     calendar. They must **not** be in UAT's file at all, or a tester could put a vet visit on the real
     calendar. If either is already in `.env.deploy.uat`, delete that line.
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
   **Connect** at the top. Choose **Session pooler** and copy the connection string. It starts
   `postgresql://postgres.fsjagxmxjosauwmxwype:` and contains `[YOUR-PASSWORD]`.
7. Replace `[YOUR-PASSWORD]` with UAT's **database** password: the value after `SUPABASE_DB_PASSWORD=` in
   `.env.deploy.uat`. This is not your Supabase login password. **If that password contains `@`,** reset it
   first to letters and numbers only (Supabase: Project Settings, then Database, then Reset database
   password), and put the new one in `.env.deploy.uat` too.
8. In PowerShell, store the address for this window only (keep the quotes):

   ```
   $env:DB = "<the whole connection string from step 7>"
   ```

9. **Load the user accounts.** Run these two, one after the other, `users` first:

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

12. **Check the errors.** Hundreds of errors are normal. Every one that mentions **`DROP`** is harmless:
    it tried to remove something that was not there. Ask Claude to read
    `C:\Temp\lannacare-restore\restore-errors.txt` and confirm nothing else went wrong. A failed `CREATE`,
    `COPY`, `ALTER` or `ADD CONSTRAINT` is a real problem, so stop if Claude finds one.
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
15. **Clean up.** Delete `restore.dump` and `key.txt` from `C:\Temp\lannacare-restore`. Both are
    unprotected copies. Keep the `.dump.age` file if you like; it is still locked.

---

## Part 3. Give UAT its own copy of the Drive files (your PC, about 30 minutes)

UAT's data now names production's photos and documents in Drive. Without this part, a tester deleting a
photo on UAT would delete the real one. This part copies the files and points UAT at the copies.
It must come after Part 2 and before Part 5.

1. Open `.env.deploy.production` in Notepad. Copy the **value** after `GOOGLE_DRIVE_ROOT_FOLDER_ID=`
   (production's Drive folder ID). Below, it replaces `<production folder id>`.
2. **Trial run, which copies nothing:**

   ```
   node scripts/drive-copy-tree.mjs --env uat --source <production folder id> --map .local\drive-copy-map.uat.jsonl
   ```

   It counts the files and reports **`Fits: yes`** or **`Fits: NO`**. If it says NO, stop.
3. **Do the copy.** It takes a while. If it stops part way, run the same line again and it carries on:

   ```
   node scripts/drive-copy-tree.mjs --env uat --source <production folder id> --map .local\drive-copy-map.uat.jsonl --apply
   ```

4. Near the start it prints **`New root "...": <an id>`**. Copy that id. **This new folder, not the empty one
   made on 7 November, is now UAT's Drive folder.** The script always makes a new folder at the top of My
   Drive; it cannot fill the old empty one.
5. Open `.env.deploy.uat` and change the value after `GOOGLE_DRIVE_ROOT_FOLDER_ID=` to the id from step 4.
   Save. (The old empty UAT folder can be deleted in Drive later. Nothing uses it.)
6. **Trial run of the database change, which changes nothing:**

   ```
   node scripts/drive-remap-ids.mjs --env uat --map .local\drive-copy-map.uat.jsonl
   ```

   It lists the columns it would change and how many rows in each.
7. **Do it:**

   ```
   node scripts/drive-remap-ids.mjs --env uat --map .local\drive-copy-map.uat.jsonl --apply
   ```

   Running it again should report nothing left to change. It refuses to touch production.
8. Run `node scripts/check-uat-ready.mjs` again. It must still say **`Ready: no failures.`**

---

## Part 4. Sign-in and email for UAT's address (browser, about 15 minutes)

1. **UAT's sign-in addresses.** On supabase.com as `lutan.bennett1@gmail.com`, open the UAT project, then
   **Authentication**, then **URL Configuration**:
   - Set **Site URL** to `https://uat.lannacare.org`
   - Under **Redirect URLs**, click **Add URL** and add `https://uat.lannacare.org/auth/callback`
   - Click **Save**.
2. **Google sign-in client.** At console.cloud.google.com, signed in as the shelter account
   (`lannaanimalfoundationbwm`), choose project **lanna-care-dev**, then **APIs & Services**, then
   **Credentials**. Look under **OAuth 2.0 Client IDs** for a client whose authorised redirect URI is
   `https://fsjagxmxjosauwmxwype.supabase.co/auth/v1/callback`.
   - **If there is one** (you may have made it when filling in `GOOGLE_SIGNIN_CLIENT_SECRET`), use it.
   - **If there is none**, click **Create credentials**, then **OAuth client ID**, choose type **Web
     application**, and name it **Lanna Care sign-in (UAT Supabase)**. Under **Authorised redirect URIs**,
     add `https://fsjagxmxjosauwmxwype.supabase.co/auth/v1/callback`. Click **Create** and keep the client
     ID and secret it shows.
   - Do not change any other client: each one serves a different project.
3. **Turn on Google sign-in for UAT.** Back in the UAT project on supabase.com, open **Authentication**,
   then **Sign In / Providers**, then **Google**. Switch it on, paste the client ID and secret from step 2,
   and save. If you made a new client, also put its secret in `GOOGLE_SIGNIN_CLIENT_SECRET=` in
   `.env.deploy.uat`.
4. **Email sender.** In the UAT project, open **Authentication**, then **SMTP settings** (or **Emails**,
   then **SMTP**). Turn on custom SMTP. Copy the host, port and username from **production's** project's
   same page. Use sender address `noreply@lannacare.org` and sender name `Lanna Care UAT`. **Supabase
   never shows a saved SMTP password again**, so take the password from your email provider. Save.
5. **Test the sender.** Still in UAT's project, open **Authentication**, then **Users**, pick your own
   account, and send a password reset. Check it arrives from Lanna Care UAT.

---

## Part 5. Set up UAT on the Pi (Pi and Cloudflare, about 45 minutes)

Nothing in this part is visible to anyone until Part 6.

1. **Open a terminal on the Pi:** `ssh lutan@lanna-pi.local`
2. **Check memory before you start.** Run `free -m` and note the **available** figure. On 7 November it was
   about 3,365 MB with production and Test running. UAT needs up to 900 MB.
3. **Get the code.** On the Pi:

   ```
   git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App_uat
   ```

4. **Copy UAT's settings file to the Pi.** In a PowerShell window on your PC, in the main checkout:

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

   It builds UAT and starts it as its own service. It takes several minutes. If it stops with a message
   naming a missing setting, add that setting to the Pi's `.env.deploy.uat` (and to your PC's copy) and run
   it again.
7. **Check memory after.** Run `free -m` again; there should still be plenty available. Then run
   `journalctl -u lanna-care -n 30` and check production did **not** restart during the setup.
8. **Find the tunnel's id.** Run `ls /etc/cloudflared/`. The file ending in `.json` is named after the
   tunnel id (a long string of letters, numbers and dashes). Below, it replaces `<tunnel id>`.
9. **Give UAT's Pi address to the tunnel:**

   ```
   cloudflared tunnel route dns <tunnel id> uat-pi.lannacare.org
   ```

10. **Install the new tunnel settings and restart the tunnel:**

    ```
    cd ~/Animal_Shelter_App_uat && sed -e "s|__TUNNEL_ID__|<tunnel id>|g" scripts/pi/cloudflared-config.yml | sudo tee /etc/cloudflared/config.yml >/dev/null
    sudo systemctl restart cloudflared
    ```

    These need your Pi password.
11. **Check production is still fine:** open `https://lannacareforanimals.org` in your browser and sign in.
12. **Let the Pi address through the firewall rule.** In the Cloudflare dashboard, open the
    **lannacare.org** site, then **Security**, then **WAF**, then **Custom rules**. Edit the rule that
    already lists `pi.lannacare.org` and `test-pi.lannacare.org`, and add `uat-pi.lannacare.org` to its list
    of hostnames. The list then reads:
    `{"pi.lannacare.org" "test-pi.lannacare.org" "uat-pi.lannacare.org"}`. Save.
    **Edit the existing rule. Do not create a new one:** the free plan allows only five.

---

## Part 6. Put UAT live at uat.lannacare.org (your PC, about 10 minutes)

Only after Parts 1 to 5. **From this point UAT moves: `lannacare.org` stops showing UAT and
`uat.lannacare.org` starts.** Do Part 7 straight after this part.

**When:** the UAT deploy only ships a released version. It refuses if the code has release notes not yet
cut into a release, and on 8 November it does. So do this part **right after the next release is cut**
(or ask for one to be cut first). If step 2 below says *"ships only a written-down release"*, that is the
reason; wait for the release.

1. In PowerShell in the main checkout (with the first line of this document pasted), run `git pull`.
2. Preview what will happen:

   ```
   npm run deploy:uat -- --secrets --no-mail --plan
   ```

   It should name project `fsjagxmxjosauwmxwype`. If it names any other project, stop.
   **`--no-mail` matters:** UAT's database now holds production's real users, so a release email from UAT
   would reach real people.
3. **Deploy:**

   ```
   npm run deploy:uat -- --secrets --no-mail
   ```

   Read the line naming the Supabase project: it must be `fsjagxmxjosauwmxwype`.
4. **Bring the Pi to the same release,** so the Pi and the Cloudflare fallback run the same code. On the Pi:

   ```
   cd ~/Animal_Shelter_App_uat && git pull && ./scripts/pi/deploy-pi.sh --env uat
   ```

5. Open **`https://uat.lannacare.org`** and sign in with Google. You should see the **UAT** badge in the
   header and production's residents. (The very first visit can take a minute while Cloudflare sets up the
   new address.)
6. In the Cloudflare dashboard, go to **Workers & Pages**, then **lanna-animal-care-uat**, then
   **Settings**, then **Domains & Routes**. Only `uat.lannacare.org` should be listed. If `lannacare.org` or
   `www.lannacare.org` is still there, remove it from that list.

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
     `www.lannacare.org`.
   - **Then:** **Type** Dynamic. **Expression**:
     `concat("https://lannacareforanimals.org", http.request.uri.path)`.
     **Status code** **301**. Tick **Preserve query string**.
   - Click **Deploy**.
4. **Check it.** Open `https://lannacare.org/adopt` in a private browser window. You should land on
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

| Item | Finished by |
|---|---|
| `#u7d3b` UAT's own database | Parts 1, 2, 4 and 6 |
| `#rqv5c` UAT's own Drive copy | Part 3 |
| `#uat7p` UAT served by the Pi | Parts 5, 6 and 8 |
| `#uq4vz` UAT's colour on a real UAT build | Part 8, step 6 |

**Not part of this list:** anything else about production, moving production to the shelter's own Google
account, the Cloudflare hardening (`#ao0jk`) and acceptance testing (`#mc6fu`).
