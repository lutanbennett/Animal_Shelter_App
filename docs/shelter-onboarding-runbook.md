# Onboarding a new shelter, and letting one leave

For Lutan. Plain steps, in order. This document is written to work **with no
Claude session available**: every command is given in full, with the folder you
type it in.

**It is a partial runbook on purpose.** It covers the steps that will never be a
screen, and the screen that now exists. A product administrator opens the **Product
admin** console at `/platform` (its own page on the platform's front door, not inside
any shelter's Settings) and can **create a shelter, set its names, add and remove
its web addresses, give it an Admin role, create or link its first Admin login, set
its receipt letters and add its starting content**, as well as add and remove
product administrators. **Still not a screen:** the group origins list, connecting a
shelter's Google Drive and calendar (Steps 4 and 5, scripts), and removing a shelter.
Every **NOT YET POSSIBLE** note below is a gap that is still true. The screen's
pictures are listed in `scripts/manual-screenshots.mjs` (see "Screenshots"). **Every
press on that screen needs the two-step code (aal2); see "What has been rehearsed".**

**Rehearsed on 2026-11-20 (test database), by following it: Steps 1 and 6's
console half in about five minutes. Two things stop a person finishing alone today:
Step 7 (the Who does what page fails on a shelter that has only its Admin role) and
"A shelter leaving" (the export refuses). Both are written in the steps below.**

## Who can do each step

Every step starts with one of these markers.

| Marker | Meaning |
|---|---|
| **[LUTAN ONLY]** | Only you can do it: a Cloudflare change, a repository secret, creating a Google account, the production Worker deploy (yours by standing instruction, 2026-10-02). A developer cannot finish these for you. |
| **[ADMIN SCREEN]** | Done in the app, signed in as the shelter's Admin, by pressing buttons. |
| **[TERMINAL]** | Typed into PowerShell on your computer, in the folder `C:\Development\Animal_Shelter_App` (the main checkout, on `main`). Anyone with the repository files and the environment files can do it. |

A note that says **NOT YET POSSIBLE** names the backlog item that will change it
and what the step becomes. Such a note is deleted when its item is done.

## Before you start

You need, on your computer:

- The repository at `C:\Development\Animal_Shelter_App`, on `main`, up to date.
  Open PowerShell and type:

```powershell
cd C:\Development\Animal_Shelter_App
git checkout main
git pull
node scripts/guarded-install.mjs
```

- The environment file for the place you are working: `.env.local` for **test**
  (the dev database), `.env.deploy.uat` for **uat**, `.env.deploy.production` for
  **production**. Every script below takes `--env test`, `--env uat` or
  `--env production`. **Without `--env` it means test.** Rehearse on test first.
- In that file: `SUPABASE_ACCESS_TOKEN`, and for the Google steps
  `DRIVE_CREDENTIALS_KEY`. If `DRIVE_CREDENTIALS_KEY` is missing the Google
  scripts stop before storing anything. They do no harm.

**What every script does first:** it checks, and without `--apply` it only
*reports what it would do*. **Always run it once without `--apply`, read what it
says, then run it again with `--apply`.**

**The repository is public.** Never paste a real host, address, Google account,
key or project reference into this document or any file in the repository. Real
values go in your network notes on the Desktop. This document uses placeholders
in angle brackets, like `<the shelter's host>`.

## The order

1. Create the shelter's rows (shelter and host).
2. Put the host on Cloudflare.
3. Create the shelter's Google account and its Drive folder and calendar.
4. Connect the Drive.
5. Connect the calendar.
6. Set the shelter's names, receipt series and lookup lists.
7. Set up the shelter's roles and cards.
8. Deploy.
9. Check it.

A shelter leaving is a separate section at the end.

---

## Step 1. Create the shelter and its host  **[ADMIN SCREEN]** (product administrator)

**What it is.** A shelter is one row in the `shelters` table (a short lower-case
`key` such as `<shelter-key>`, and a `name`). Its address is one or more rows in
`shelter_hosts`. Migration `0382` removed every sign-in's right to write either
table, on purpose; the screen writes through narrow database functions that check
you are a product administrator **and** have passed the two-step code.

1. Sign in as a product administrator (your own login, on the list). Open the
   console at `https://<the platform's front door>/platform`; on a development copy
   it is `/platform` on that copy's own address. It is **not** under Settings any
   more, and the old `/admin/product-admin` address does not exist. A login not on
   the list gets a page that does not exist; that is correct.
2. The page can be read without the two-step code, but no button that changes
   anything shows until you give it: follow the notice at the top and give the code.
3. Under **Create a shelter** (at the bottom of the page), fill **Short name** (the
   key: lower-case letters and digits with single hyphens, e.g. `happy-paws`; **it
   cannot be changed afterwards**) and **Shelter name**, then press **Create
   shelter**. Expected: a new card for the shelter, with a checklist: *Has a web
   address*, *Has an Admin role*, *Has an Admin login*, *Receipt numbers set up*,
   *Starting content added*. **Starting content is already ticked**: creating the
   shelter fills its default site pages, public-figure switches, bill kinds and
   frequencies (see Step 6). The first unticked line is marked **Next step** and
   carries its own control; **the checklist is the order to work in** (points 4 to 8
   below, in the same order).
4. **Names.** In the card, fill **Full name** and **Short name** (used on pages and
   PDFs, and in mail subjects) and press **Save names**. Do this before you open the
   shelter to anyone: with no names the app falls back to the original shelter's
   wording.
5. **Web address.** Type the host (for example `<the shelter's host>`) into **Web
   address** and press **Add address**; it then shows in the list. One host belongs
   to one shelter; to move one, **Remove** it from the first shelter first.
6. **Admin role.** Press **Give it an Admin role**. It gets no cards; Admin has full
   access by itself.
7. **Admin login.** Type the email address of the person who will be the shelter's
   Admin and click outside the box. If a login already has that address and no other
   shelter uses it, press **Link this login as its Admin**. If none has, the screen
   says *No login has that email address* and offers **Create a login for this
   shelter's Admin**: press it, and a login is made with a **temporary password shown
   once, in the green notice. Copy it then; it cannot be shown again.** Give it to
   that person privately, never in a file in the repository. Nobody is emailed. Only
   for a shelter's first Admin.
8. **Receipt numbers.** Fill **Receipt letters** (capitals; **they cannot be changed
   once set**, and no other shelter may use the same ones), **Name printed on
   receipts** and **Address, one line per row**, and press **Set receipt numbers**.
   One issuer block is written for both receipt countries, with no registration or
   statement lines (add those later if the shelter needs them). A shelter with no
   series cannot issue receipts.

**Facts that matter now:**

- The platform's front door (the apex) maps to *no* shelter; a host with no row is
  refused. A new host never falls through to another shelter.
- The shelter's key is used by every script below as `--shelter <key>`. Write it
  down.
- The checklist shows what is done and what is next, so you can stop and come back.
- **The card's Drive and Calendar lines say *"the shelter's own Admin does this in
  its Settings"*. That is not true yet:** Settings only *shows* the status. The
  connection is Steps 4 and 5, typed in a terminal.
- A shelter cannot be deleted from the screen (see "A shelter leaving").

## Step 2. Put the host on Cloudflare  **[LUTAN ONLY]**

A host answers only if Cloudflare is told to send it to the app.

**Why one host at a time.** A wildcard (every sub-host at once) is possible only
as a *zone route*, never as a *custom domain*, and the app is served as a custom
domain. (Answered in writing, 2026-11-17, backlog `#v0302`.) So **every host is
listed individually**, and this step is repeated for each host a shelter has
(including a `www.` form if it has one). It cannot be done once for all shelters.

The list of hosts lives in `wrangler.jsonc`, in the `routes` list for the
environment, each as `{ "pattern": "<the shelter's host>", "custom_domain": true }`.

1. A developer adds the host to the right `routes` list in `wrangler.jsonc`, in a
   pull request. **[TERMINAL]** (until then, nothing happens).
2. In Cloudflare, make sure the shelter's domain is in your account (a shelter
   with its own domain adds it; a shelter without one gets a first-level
   sub-host of the platform's domain, never a second level — the free
   certificate does not cover one).
3. The deploy in Step 8 creates the Cloudflare record from that list. If it
   reports the host already belongs to something else, stop and look: do not
   remove another record to make room.

Expected: after the deploy, `https://<the shelter's host>` loads the sign-in page
of that shelter, and no other shelter's.

## Step 3. The shelter's own Google account  **[LUTAN ONLY]**

Each shelter keeps its files and its calendar in **its own** Google account, not
yours and not another shelter's.

1. Create the Google account for the shelter (or use one the shelter already has).
   Creating an account is yours alone.
2. In that account's Google Drive, make a folder for the shelter's files. Open it;
   the folder's id is the last part of its address, after `/folders/`. Write it
   down as `<the shelter's Drive folder id>`.
3. In that account's Google Calendar, make (or choose) the calendar the app
   should use. In its settings, find **Integrate calendar → Calendar ID**. Write
   it down as `<the shelter's calendar id>`. **It must not be a calendar another
   shelter uses.**
4. In Google Cloud (signed in as that account), create an OAuth client of type
   **Desktop app**. Write down its client id and its client secret.
5. Mint a refresh token (type in `C:\Development\Animal_Shelter_App`):

```powershell
$env:GOOGLE_OAUTH_CLIENT_ID = "<the shelter's client id>"
$env:GOOGLE_OAUTH_CLIENT_SECRET = "<the shelter's client secret>"
node scripts/google-oauth-setup.mjs
```

   It prints a web address. Open it in your own browser while signed in to the
   shelter's Google account and approve. The script then prints a refresh token:
   this is the **Drive** token (Step 4).
6. Mint a **separate** token for the calendar, the same way with `--calendar`
   added (it asks only for calendar permission, and is kept apart so a calendar
   fault can never stop photo uploads):

```powershell
node scripts/google-oauth-setup.mjs --calendar
```

   This is the **calendar** token (Step 5). Do not use one for the other.

**Never put these values on the command line or in a file in the repository.**
The command line is saved in your PowerShell history. Set them as environment
variables as shown (they last only in that window), and **close the window when
you have finished**. Do not type a secret as `--something value`.

## Step 4. Connect the Drive  **[TERMINAL]** (secrets are **[LUTAN ONLY]** to produce)

The script is `scripts/connect-shelter-drive.mjs`. It asks Google whether the
account really can open the folder, then writes the shelter's credentials
(encrypted) **and** its folder id **in one statement**: both are written, or
nothing is.

Set the three secrets for this window only, then run it **without** `--apply`:

```powershell
cd C:\Development\Animal_Shelter_App
$env:SHELTER_GOOGLE_CLIENT_ID = "<the shelter's client id>"
$env:SHELTER_GOOGLE_CLIENT_SECRET = "<the shelter's client secret>"
$env:SHELTER_GOOGLE_REFRESH_TOKEN = "<the shelter's refresh token>"
node scripts/connect-shelter-drive.mjs --shelter <shelter-key> --folder <the shelter's Drive folder id> --env test
```

Expected: `Google accepts it: acts as <the shelter's Google account>, folder "<name>".`
then `Would connect shelter "<shelter-key>" on test. Re-run with --apply.`
Check that the account and folder name are the ones you meant. If they are wrong,
**stop**; nothing has been stored.

Then run the same command with `--apply` added at the end. Expected:
`Connected "<shelter-key>": credentials written 1, folder written 1.`

**What it refuses, and what to do:**

| It says | Meaning | What to do |
|---|---|---|
| `Missing or malformed: …` | A value is empty or not the right shape. The names listed say which. | Re-set that environment variable. |
| `DRIVE_CREDENTIALS_KEY is not set for this environment` | The key that encrypts the secrets is missing from the environment file. | Add it to the environment's file. Nothing was stored. |
| `Google refused the refresh token` | Wrong client, expired or wrong token. | Mint a new token (Step 3). |
| `This Google account cannot open folder …` | The folder belongs to another account. | Share it or use the right account. |
| `That folder is in the trash` / `That id is a file, not a folder` | Wrong id. | Copy the id again. |
| `No shelter keyed "<key>" here` | The key does not exist in that environment (Step 1 not done). | Check the key. Nothing was stored. |

A harmless yellow *MODULE_TYPELESS_PACKAGE_JSON* warning prints first (Node
reparsing a file); ignore it. (Rehearsed 2026-11-20 with no secrets set: both this
script and Step 5's stop with *Missing or malformed: OAuth client id, OAuth client
secret, refresh token* and store nothing.)

Afterwards: **close the PowerShell window** so the secrets are gone. The app's
Drive status on the admin page then shows the shelter's own account.

**UNPROVEN — two shelters on two different Google accounts at once.** The step
above is proved on dev with tests and a live database run. What is **not** proved
is two shelters each uploading to its own, different Google account at the same
time; that needs a second Google account made by you. The proof is backlog
**`#cn7gk`**. When it is done, delete this paragraph.

## Step 5. Connect the calendar  **[TERMINAL]**

The script is `scripts/connect-shelter-calendar.mjs`. The same three secrets, in
the same way (but the refresh token is the **calendar** one from Step 3), and optionally the account's address so an Admin can see which
account is connected:

```powershell
cd C:\Development\Animal_Shelter_App
$env:SHELTER_GOOGLE_CLIENT_ID = "<the shelter's client id>"
$env:SHELTER_GOOGLE_CLIENT_SECRET = "<the shelter's client secret>"
$env:SHELTER_GOOGLE_REFRESH_TOKEN = "<the shelter's refresh token>"
$env:SHELTER_GOOGLE_ACCOUNT_EMAIL = "<the shelter's Google account>"
node scripts/connect-shelter-calendar.mjs --shelter <shelter-key> --calendar <the shelter's calendar id> --env test
```

Expected: `Google accepts it: calendar "<name>" can be read.` then
`Would connect shelter … Re-run with --apply.` Run again with `--apply`; expected:
`Connected "<shelter-key>": credentials written 1.`

**Extra refusals beyond Step 4's:** it refuses to point a shelter at the
calendar the original shelter runs on (the one in the environment's
`GOOGLE_CALENDAR_ID`); and the database refuses a calendar another shelter
already uses (`Another shelter already uses that calendar; nothing was stored.`).
Use a calendar of the shelter's own.

Close the window afterwards.

## Step 6. The shelter's names, receipt series and lookup lists **[ADMIN SCREEN]**

**What a newly created shelter already has (`0416`).** Creating it on the screen
fills, with neutral wording and no Lanna text: the eight public site pages (titles
set, **bodies empty**), the four public-figure switches (on), the 14 bill kinds and
the 10 frequencies. **You no longer add those by hand.**

**What is NOT filled, and nothing handles it:** `group_origins`,
`donation_channels`, `site_content`, and **cards** (never: Step 7 is yours). Blood
test types, immunisation types, procedure types and units are not filled either.

**Names (`0400`) and receipt series (`0395`) are set on the console, in Step 1
(points 4 and 8).** Nothing is typed against the database. If the names are empty
the app falls back to the original shelter's wording, so **do not open a new shelter
to its people until they are set.** After saving, the sign-in page's title shows the
shelter's name. **The header's small badge still reads "LCA" on every shelter** (it
is a fixed word in the app's text, not the shelter's short name); that is a known
gap, not a mistake in your steps.

**Lookup lists (`0403`).** Blood test types, immunisation types, procedure types and
units are **per shelter**; a new shelter starts with none. **[ADMIN SCREEN]** Signed
in as the shelter's Admin, open the **Admin** area and use these pages, reached by
clicking in from the Admin page (not by typing the address):

- **Blood test types**, **Immunization types**, **Procedure types**, **Units**
  each has an **Add** button and a list to edit.
  (Rehearsed 2026-11-20: the four tiles are on a new shelter's Settings page;
  the **Add** presses were not driven.)
- **Group origins** have **no screen yet**: **NOT YET POSSIBLE**; a developer adds
  them (checked 2026-11-20: Settings has no tile for them). (Bill kinds and frequencies are filled at creation and edited on their own
  pages.)

## Step 7. Roles and cards  **[ADMIN SCREEN]**

A role gets **no** permission until a card is given to it. There is no built-in
exception except Admin, who always has everything.

1. Sign in as the shelter's Admin.
2. Open **Settings → Who does what** (reach it by clicking, not by typing the
   address).
3. Make the roles the shelter wants and **give each role its cards**. A role with
   no cards can do nothing. Cards decide which pages a person sees and whether they
   can only read or also change.
4. Save. Then sign in as a test person in each role and check what they can see.

The screen lets you give and take away cards one at a time; do one, check it,
then the next.

**NOT POSSIBLE ON A BRAND-NEW SHELTER TODAY (rehearsed 2026-11-20).** The shelter's
only role is its Admin, which this page does not list, and the page then stops with
*Who does what: invalid input syntax for type uuid: ""* instead of offering **New
role**. So the first role cannot be made from the screen, and a developer must make
it or fix the page (`src/app/admin/who-does-what/page.tsx`, which queries with an
empty role id when the shelter has no listed role). Until that is fixed, this step
cannot be finished by you alone.

## Step 8. Deploy  **[LUTAN ONLY]** for production

The Worker deploy to production is yours by standing instruction. Test and uat
deploys follow `docs/release-procedure.md`. Always plan before you do:

```powershell
cd C:\Development\Animal_Shelter_App
node scripts/deploy.mjs --env test --plan
```

Read the plan. If it is what you expect, run it without `--plan`. For production,
use `--env production` and **only** after a release has been cut as
`docs/release-procedure.md` describes. If the deploy refuses, read what it says; it
refuses to deploy a commit that is not a released `main`, and it refuses a
project that is not that environment's own.

## Step 9. Check it  **[ADMIN SCREEN]**

1. Open `https://<the shelter's host>`. Expected: the shelter's own sign-in page
   (rehearsed: the page title is the shelter's full name).
2. Sign in as its Admin. Expected: the signed-in header shows the Admin's email and
   *Admin*. **The small badge on the left still reads "LCA"** (known gap, see Step
   6); the shelter's name is in the page title, not that badge.
3. Open the Settings page. Expected: the Drive and calendar statuses name the
   **shelter's own** Google account. Before Steps 4 and 5 it says *This shelter has
   not connected a Google Drive account yet* (rehearsed 2026-11-20).
4. Upload a test photo to a resident. Expected: it appears in the shelter's own
   Drive folder.
5. Sign in on another shelter's host. Expected: **nothing** of the new shelter is
   visible, and the reverse.
6. **As a product administrator** (someone on that list, not just a shelter
   Admin): open the console (`/platform`, Step 1). Expected: the new shelter is
   listed with its key, its names, its host and a fully ticked checklist (the
   receipt letters themselves are not shown once set). A login not on the list gets
   a page that does not exist; that is correct.

Anything you add while testing is real data in that shelter. Use a test shelter
on test, not a live one.

---

## Settings stored as repository secrets  **[LUTAN ONLY]**

A **repository secret** is a value GitHub keeps for the nightly checks. Only you
can add one: GitHub → the repository → **Settings → Secrets and variables →
Actions → New repository secret**. Type the name, paste the value into the
**Secret** box, press **Add secret**.

**The value must never go through a terminal command**: a command typed in
PowerShell is saved in its history and can be read later. Paste it into the
GitHub page only. Do not use `gh secret set` with the value on the line.

Onboarding a shelter does not usually need a new repository secret: the shelter's
Google secrets go to the database in Steps 4 and 5, not to GitHub. A new secret is
needed only when a new nightly check needs one; each such item names the secret
and what it must be able to do.

---

## A shelter leaving  **[TERMINAL]**

The script is `scripts/shelter-export.mjs`. It reads one shelter's rows, and only
that shelter's, and writes **one encrypted file**. It never writes anything
readable.

**What you need first:** the administrator's **public** key (`age1…`) as
`BACKUP_AGE_RECIPIENT` in the environment's file (or pass `--age-recipient`). The
**private** key (the `AGE-SECRET-KEY-1…` line) is on your encrypted USB drive and
in the Keychain; you need it only to open the file. If the public key is missing
the script stops: *exports are always encrypted*.

1. Make a folder **outside the repository** and outside OneDrive, for example
   `C:\Temp\<shelter-key>-export`. The script refuses a folder inside the repository.
2. Run it:

```powershell
cd C:\Development\Animal_Shelter_App
node scripts/shelter-export.mjs --shelter <shelter-key> --out C:\Temp\<shelter-key>-export --env production
```

   Expected: it names the environment and the shelter, says how many tables it will
   export, prints a count for each table that has rows, then
   `Wrote …\lannacare-production-shelter-<shelter-key>-<time>.sql.age (… KB, encrypted; no plaintext file exists).`
3. **What it refuses:**
   - `No shelter with key "<key>"` — wrong key or wrong `--env`.
   - `REFUSED: N row(s) carry no shelter_id` and a list of tables — some rows belong
     to nobody. Dropping them loses data; including them leaks. Have a developer
     give those rows their shelter (or delete them), then run it again.
   - `Not exporting; the registry does not cover every table` — a table was added
     that the export does not know about. Have a developer record it first. Do not
     force it.
   - `the table changed while it was being read; run it again` — somebody wrote to
     it during the export. Run it again.
4. **The proof (a dry run).** To check the export works without keeping anything:

```powershell
node scripts/shelter-export.mjs --shelter <shelter-key> --prove --env test
```

   It exports, loads the result into an empty throwaway database on your own
   computer, and prints `ok` or `FAIL` for: every row arrived; no other shelter's
   row did; every link between tables resolves. It ends `PROOF PASSED.` It needs
   PostgreSQL 17's server programs on your computer (set `PG_BIN` to their folder
   if it cannot find them) and **at least two shelters** in the source, or the
   second check proves nothing and says so. The throwaway database is deleted when
   it finishes. A failure prints `PROOF FAILED`; do not rely on that export.
5. **Not in the export:** the people's sign-in accounts. They are not part of it.
   The file is *data only*: it loads into a database that already has the
   structure from the migrations.
6. To open the file later, use `scripts/decrypt-backup.mjs` with the private key
   file (never as a command-line value):

```powershell
node scripts/decrypt-backup.mjs C:\Temp\<shelter-key>-export\<the file>.sql.age --identity C:\path\to\your-key.txt
```

   Delete the decrypted file when you are done.

**THE EXPORT REFUSES TODAY (rehearsed 2026-11-20).** On a test database with a
rehearsal shelter, it stopped with *Not exporting; the registry does not cover every
table* naming `product_admin_login_grants`, `product_admin_lookups` and
`product_admins` (tables added by the product-admin work, never recorded in the
export's registry). That is the refusal in item 3 above, and it needs a developer to
record those three tables; do not force it. (The shelter's own `--bogus` flags are
also refused by name, which is correct.) Until then the shelter-leaving export
cannot be done by you alone. The encrypted-file step itself was not reached, and the
public key was not available on the rehearsal machine, so item 2 stopped first with
*Exports are always encrypted, and no age recipient given*.

Giving the file to the shelter, and removing the shelter's rows and host from the
live database afterwards, are **NOT YET POSSIBLE** as steps you can follow: there
is no script that removes a shelter. `#shmgt` is where that belongs, and the
console does not remove one. **A rehearsal shelter therefore stays on the database
for good**: a shelter that owns any row cannot be deleted, by design. Name test
shelters so nobody mistakes them for real ones.

---

## Screenshots

**There are no pictures in this document, on purpose**: a pasted picture of a
screen goes out of date. The pictures are declared in `scripts/manual-screenshots.mjs`,
the script that re-captures the user manual's images from a running copy of the
app, and are produced by its next full re-run, which is done once when a batch of
features is finished, not per change:

- `runbook-product-admin`: the console at `/platform` (Step 1), captured signed in
  as someone on the product-administrator list. On a development copy a sign-in
  can be given the two-step code (`node scripts/dev-signin.mjs <role> --shelter
  <key> --aal2`), so the buttons can be photographed too.
- `runbook-settings-lookups`: a shelter's Settings page, with the Drive and
  calendar status and the lookup-list tiles (Steps 6 and 9).
- `runbook-who-does-what`: the roles and cards page (Step 7).

Where this document says "NOT YET POSSIBLE", trust that over any old picture.

## Keeping this document true

A runbook nobody updates is worse than none. When you change a script's flags,
or a step becomes a screen, change the matching step **in the same pull
request**, and delete any "NOT YET POSSIBLE" note whose backlog item you have
just closed. Any note that names an item (`#shmgt`, `#cn7gk`) stops being true
the day that item is done.

## What has been rehearsed

Rehearsal of **2026-11-20** on the test database, by following this document; the
full log is `docs/decisions/2026-11-20-onboarding-rehearsal.md`. (An earlier,
partial pass on 2026-11-19 could not press the console: it is superseded.)

- **Driven by pressing: Step 1 in full** (create, names, address, Admin role,
  create-a-login, receipts) on a rehearsal shelter; **Step 6's console half;
  Step 9 items 1 to 3 and 6**; Step 4 and Step 5 as far as their refusals.
- **Time: about five minutes** of clock for everything on the console (Steps 1
  and 6), measured from timestamps. The parts anyone can do are the console and the
  scripts; the parts only you can do are Step 2 (Cloudflare), Step 3 (the Google
  account and its tokens) and Step 8 (the production deploy). Those were not
  timed: a Google account and a Cloudflare change are your own time, not ours.
- **Stopped by a fault, not by a missing step: Step 7** (Who does what fails on a
  shelter with only its Admin role) **and the shelter-leaving export** (the
  registry misses three tables). Both are written in their steps above.
- **Not rehearsed, and who must do it:** Step 2 (Cloudflare) and Step 8
  (production deploy) are yours; Step 3 and the secrets of Steps 4 and 5 need a
  Google account you create; Step 9 items 4 and 5 (a photo reaching the shelter's
  own Drive; nothing leaking between two hosts) need Steps 4 and 8 first; the
  temporary password sign-in of the created Admin was not pressed.
