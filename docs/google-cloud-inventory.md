# Google Cloud: which project holds what, and how to consolidate it

Written 2026-09-30 by the `google-cloud-one-account` stream. Companion to the
decision record `docs/decisions/2026-09-30-google-cloud-one-account.md` and the
backlog item "Put the Google Cloud setup under one account".

**How to read the confidence marks.** Every fact below says where it came from.
**[repo]** was read from this repository. **[ran]** was observed by running a
script on 2026-09-30. **[recorded]** comes from a backlog or decisions entry
written by someone who was looking at the console at the time. **[CONFIRM]**
could not be established from here: nobody opened a console for this document,
so treat it as a question for Lutan, not a fact.

## 1. Inventory

Two Google Cloud projects are known. **Do not assume there are only two**
([CONFIRM]: open each Google account's project picker and count).

| | **LCA App** | **Lanna Care - Dev** |
|---|---|---|
| Project id | `endless-bonus-458210-d4` [recorded] | `lanna-care-dev` [recorded] |
| Project number | [CONFIRM] (not in the repo) | `1036347359893` [ran] (the prefix of the Drive client ID) |
| Owning Google account | `lutan.bennett2@gmail.com` [recorded] | `lannaanimalfoundationbwm@gmail.com` [recorded] |
| Previously named | `My First Project` [recorded] | [CONFIRM] |
| Consent screen | **In production**, published 2026-09-22. App name `Lanna Care for Animals`; home `https://lannacare.org`; privacy `https://lannacare.org/privacy`; authorised domains `lannacare.org` and the Supabase host; scopes `openid`, `email`, `profile` only, so no Google verification. Brand-verified via Search Console (Domain property, Lutan's account) [recorded] | **In production**, published 2026-09-25 after the 7-day Testing expiry broke every upload. Logo removed (a logo forces verification); `lannacare.org` added as an authorised domain [recorded] |
| Used for | Staff sign-in with Google, on the production Supabase project | Drive storage, and the dev Supabase sign-in |

### Clients

| Client | Project | Type | Purpose | Where its values live |
|---|---|---|---|---|
| Production sign-in client (name [CONFIRM]) | LCA App | Web | Google provider on the **production** Supabase project `dbkodyyxxhtygxcxmfcu` | `GOOGLE_SIGNIN_*` in `.env.deploy.production`, **not read by the app**, kept only to re-apply to Supabase [recorded]. The live copy is in Supabase, Authentication, Providers, Google [CONFIRM] |
| **Lanna Care Drive Access** | Lanna Care - Dev | Desktop app | Every Drive read and write: photos, attachments, archive PDFs, the `Backups` folder | `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` (below). Client ID starts `1036…` [ran] |
| **LCA Application** | Lanna Care - Dev | Web | Google provider on the **dev** Supabase project `qxkmhwybjggxvsfxsxbd`, which `test.lannacare.org` and local dev use | Supabase dev, Authentication, Providers, Google [CONFIRM]; in no repo file |

Consequences: **production sign-in and dev sign-in sit in different projects and
different accounts**, and **all three environments' Drive access is one client in
the lanna account** [repo: README "Environments" table, Google Drive row].

### Where the Drive values are consumed

The app reads exactly four variables [repo: `.env.example`, `src/lib/google/drive.ts`]:

| Variable | Is | Consumed by |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | the Drive client's ID | app runtime (`src/lib/google/drive.ts`, `src/lib/status/health.ts`), `scripts/backup.mjs`, `scripts/import-appsheet.mjs`, `scripts/google-drive-verify.mjs`, `scripts/check-drive-token.mjs`, `scripts/google-oauth-setup.mjs` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | its secret | same |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | a token **minted for one Google account** against that client | same |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | the tree's root folder in that account | same |

Places those four are set, all of which a move must touch [repo]:

- `.env.local` (dev, and Test), `.env.deploy.uat`, `.env.deploy.production`.
  `.env.deploy.<env>` overrides `.env.local` (README "Environments"). Only
  `.env.local` and `.dev.vars` were inspected; the deploy files are gitignored
  and **[CONFIRM] which exist and what they hold**.
- **Worker secrets** on `lanna-animal-care-test`, `lanna-animal-care-uat` and
  `lanna-animal-care`, pushed by `node scripts/deploy.mjs --env <env> --secrets`
  (`RUNTIME_SECRETS` in `scripts/deploy.mjs`). Secrets cannot be read back;
  Settings shows whether each deployed Worker's Drive still works.
- `.dev.vars` (local Worker preview).
- The **Pi**: `scripts/pi/write-env.mjs` copies the same four names into its env
  files. Not yet in use.
- **Weekly backups** (`scripts/backup.mjs`) use the same four to write into the
  tree's `Backups` folder; `src/lib/status/health.ts` checks it there.

Which client is where, today:

| Environment | Drive client project | Drive account (token acts as) |
|---|---|---|
| Dev / Test | Lanna Care - Dev | `lannaanimalfoundationbwm@gmail.com` [ran against `.env.local`: token minted, root folder "LCA Health System" present] |
| UAT and Production | same client and tree | same, "for now" [repo: README]; **[CONFIRM] against each deploy env file** |

Sign-in is not read from env: it is configured **inside each Supabase project**,
so the `GOOGLE_SIGNIN_*` names appear nowhere in `src/` or `scripts/` [repo,
grepped 2026-09-30].

### Things that break silently, and when

- **Consent screen left in Testing:** refresh tokens expire after 7 days.
  Happened 2026-09-25 (`scripts/check-drive-token.mjs` header). **Any new project
  starts in Testing**, so this trap is waiting in the runbook below.
- **The 90-day expiry on the backlog is still unfound** (set 2026-09-22, breakage
  expected around **2026-12-21**); it is *not* in LCA App [recorded]. Not checked
  in this pass, and worth doing while in the consoles: Lanna Care - Dev's Auth
  Platform settings; Supabase Authentication, Sessions (both projects) and
  Account, Access Tokens (the token behind `apply-migrations.mjs`); Cloudflare,
  API Tokens (behind `deploy.mjs` and the analytics token). If found, tick that
  item.
- **A new Supabase project or domain** needs its redirect URI and origin added
  to the sign-in client (README "Auth on a new Supabase project"; the cutover
  item, step 5).

### Tooling added by this stream

`node --env-file=<file> scripts/check-drive-token.mjs` now also prints the
client's **project number** and the **Drive account the token acts as**, beside
its existing checks. Half this inventory is therefore re-runnable against any env
file: compare the number with the console's project dashboard and the email with
the tables above. It cannot tell you the project *id*, the owning account or the
consent-screen state; those need the console.

## 2. Recommendation

Reasoning is in the decision record. In short:

1. **Owner: the shelter's own account, `lannacareforanimals@gmail.com`**, for the
   Cloud project and the Drive files. Nothing in the estate should depend on a
   developer's personal Google account.
2. **One new project there holding all three clients** (Drive desktop client, dev
   sign-in web client, production sign-in web client), consent screen published
   on day one. Retire `LCA App` and `Lanna Care - Dev` afterwards.
3. **Order: do this *with* "Give production its own Drive tree", not before or
   after.** The move creates a new Drive client; that item mints a new refresh
   token for the shelter account anyway. Minting once, not twice, is the saving.
4. **Sign-in moves at the domain cutover**, because the cutover already rewrites
   the client's redirect URIs (new Supabase project, new domain) and the consent
   screen's domains. Editing that client twice, on two accounts, is the other
   waste. If the cutover is far off, the Drive half can still go first (steps
   4-14) and the sign-in clients wait.
5. **The gate: the account must exist and be under the shelter's control.** It is
   called "once available" in the backlog; [CONFIRM] whether it exists. If not,
   nothing below starts. Do not substitute a personal account: moving twice is
   the cost being avoided.

## 3. Runbook (one sitting, once the gate is met)

Steps marked **Lutan** are console actions or secrets and are his alone.
Nothing here needs credentials shared with anyone.

**Before starting**
1. Confirm the gate: sign in as `lannacareforanimals@gmail.com` and open
   console.cloud.google.com.
2. Take today's numbers: run `node --env-file=<file> scripts/check-drive-token.mjs`
   for `.env.local`, `.env.deploy.uat` and `.env.deploy.production`, and write
   each project number and Drive account into the tables above. That settles
   every Drive **[CONFIRM]** in three commands.
3. **Lutan**, one look at each existing project: IAM & Admin, Settings, for the
   project number; and note anything else living there (other APIs, other
   clients, a billing account). Do not delete either project yet.

**Build the new project** (**Lutan**, signed in as the shelter account)

4. Create a project (suggested name `Lanna Care`). Enable the **Google Drive API**.
5. **Auth Platform, Branding:** app name `Lanna Care for Animals`; **no logo** (a
   logo forces verification); homepage and privacy URLs on the live domain;
   authorised domains for every domain that hosts them (`lannacareforanimals.org`
   after cutover; keep `lannacare.org` while UAT signs in with Google) and the
   Supabase hosts.
6. **Auth Platform, Data access:** `openid`, `email`, `profile` for sign-in, plus
   whichever Drive scope `scripts/google-oauth-setup.mjs` requests ([CONFIRM] by
   reading it) for the Drive client.
7. **Audience, Publish app: **In production**. Do this before minting any token,
   and check the page says *In production*, not *Testing*.** Left in Testing,
   every refresh token expires seven days after it is minted and every Drive
   upload fails; this already happened on 2026-09-25.
8. Create three clients: **Drive** (Desktop app), **dev sign-in** (Web; redirect
   URI `https://qxkmhwybjggxvsfxsxbd.supabase.co/auth/v1/callback`) and
   **production sign-in** (Web; redirect URI
   `https://<production-ref>.supabase.co/auth/v1/callback`, and origins as the
   cutover item step 5 lists). Keep the secrets where the current ones live,
   never in chat or the repo.

**Drive** (joint with "Give production its own Drive tree")

9. Mint a refresh token *for the shelter account* against the new Drive client:
   `node --env-file=<file> scripts/google-oauth-setup.mjs` (**Lutan** approves
   the consent in the browser). Immediately run `check-drive-token.mjs` on it: it
   should print the shelter's email and the new project number.
10. Copy the tree into that account and record the new
    `GOOGLE_DRIVE_ROOT_FOLDER_ID`, as that backlog item describes. Rehearse the
    import against dev first (its note about renamed resident folders applies).

**Re-point checklist** (**Lutan** for every secret)

11. `.env.deploy.production`: all four `GOOGLE_*` Drive variables.
12. `.env.deploy.uat`, `.env.local`, `.dev.vars` stay on the old client and tree by
    the 2026-09-23 decision, so they are unchanged until the old project is
    retired. **Decide first** whether UAT/dev/test also move to a client in the
    new project (their tree can stay in the lanna account; only the token is
    re-minted against the new client). If yes, update those three files; only
    then can `Lanna Care - Dev` be retired. **This is the one open design choice
    in the runbook.**
13. `node scripts/deploy.mjs --env production --secrets`, plus `--env test` and
    `--env uat` if step 12 said yes. Confirm Drive shows healthy on each site.
14. Pi env files, when the Pi exists (`scripts/pi/write-env.mjs`): the same four.
15. Supabase, Authentication, Providers, Google: paste the new sign-in client ID
    and secret into **production**, and the dev one into **dev**. Site URL and
    redirect URLs stay as they are.
16. Sign in with Google on each site to prove it end to end, and run
    `node scripts/backup.mjs --env production` once so the `Backups` folder exists
    in the new tree.

**Close-out**

17. Leave `LCA App` and `Lanna Care - Dev` alone for a week with sign-in and Drive
    working, then delete them (Google keeps a deleted project recoverable for 30
    days).
18. Update the inventory, tick the backlog item, and, if the 90-day expiry turned
    up along the way, tick that item too.

## 4. What this document does not know

- Whether `lannacareforanimals@gmail.com` exists, who holds its recovery options,
  and whether a second person should be an owner of the new project (a sole owner
  is the same single point of failure this item exists to remove).
- Whether either project holds anything beyond what is listed.
- What `.env.deploy.uat` and `.env.deploy.production` hold for the Drive client.
- The name and ID of the production sign-in client.
- Where the 90-day expiry lives.
- What the `security-review` stream's assessment (`origin/claude/security-review`,
  a PDF/DOCX) says about these clients; it was not read for this pass. Check it
  for anything that contradicts this file.
