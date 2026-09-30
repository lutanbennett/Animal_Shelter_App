# Google Cloud: which project holds what, and how to consolidate it

Written 2026-09-30 by the `google-cloud-one-account` stream. Scope narrowed by Lutan on 2026-09-30 to **Test and UAT** (production is separate and later). Companion to the
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

## 2. Decision (Lutan, 2026-09-30)

**Scope: Test and UAT only. Production is out of scope** and is dealt with
separately when `lannacareforanimals.org` is available (the cutover and "Give
production its own Drive tree" items). Test and UAT both stay on `lannacare.org`
hosts (`test.lannacare.org`, `lannacare.org`).

**Target: every API token and client for Test and UAT lives in the existing
project `Lanna Care - Dev` (`lanna-care-dev`), owned by
`lannaanimalfoundationbwm@gmail.com`.** No new project is needed. The Drive client
already lives there; the only thing to move is the one sign-in client that sits in
`LCA App` in Lutan's account. After the move, `LCA App` holds nothing the shelter
uses and can be retired.

What moves, and what does not:

| Item | Today | After |
|---|---|---|
| Drive client (`Lanna Care Drive Access`) | lanna-care-dev | unchanged |
| Dev/Test sign-in client (`LCA Application`) | lanna-care-dev | unchanged |
| **UAT sign-in client** (Supabase `dbkodyyxxhtygxcxmfcu`, today's production DB, which the cutover demotes to UAT) | **LCA App, Lutan's account** | **lanna-care-dev, new web client** |
| Consent screen | two, one per project | lanna-care-dev's only, already published |
| `LCA App` project | live | idle, then deleted |

Consequence to be aware of: **until the cutover, `lannacare.org` is served by the
production block against `dbkodyyxxhtygxcxmfcu`**, so moving that database's sign-in
client moves what the live site's staff use to sign in. Production's *later*
sign-in client (new Supabase project, `lannacareforanimals.org`) is not part of
this; when that time comes the shelter account can hold it in a project of its own.

## 3. Runbook (one sitting)

Steps marked **Lutan** are console actions or secrets and are his alone. Nothing
here needs credentials shared with anyone. Do it when staff are not signing in:
between steps 5 and 6 nobody can sign in with Google on `lannacare.org`.

**Before starting**
1. Sign in to the console as `lannaanimalfoundationbwm@gmail.com`, open
   `lanna-care-dev`, and confirm it is the project in the tables above. Note the
   project number (should be `1036347359893`).
2. Run `node --env-file=.env.local scripts/check-drive-token.mjs` (dev), and the same
   with `.env.deploy.uat` / `.env.deploy.production` if they exist, and write the
   answers into the Drive table above. This settles the Drive [CONFIRM]s.
3. **Consent screen check (in `lanna-care-dev`): Audience must say *In production*.**
   Published 2026-09-25 [recorded], but check, because a project left in Testing
   expires every refresh token after seven days. Confirm nothing has reverted it.
4. Consent screen, Branding: **authorised domains** need `lannacare.org` [recorded]
   **and the UAT Supabase host `dbkodyyxxhtygxcxmfcu.supabase.co`** (add it; not
   listed today [CONFIRM]). Do not add a logo: a logo forces verification.

**Move the UAT sign-in client**

5. **Lutan**, in `lanna-care-dev`, Clients, Create client: type **Web application**,
   name e.g. `LCA UAT sign-in`. Authorised redirect URI:
   `https://dbkodyyxxhtygxcxmfcu.supabase.co/auth/v1/callback`. (Origins are not
   needed for the Supabase flow. Copy any that the old client in `LCA App` lists,
   which you can read side by side.) Note the new client ID and secret. Do not use
   the existing `LCA Application` client: it is dev's, and sharing one secret
   between dev and UAT means rotating it breaks both. [Option, not recommended:
   reuse it by adding the UAT redirect URI.]
6. **Lutan**, Supabase project `dbkodyyxxhtygxcxmfcu`, Authentication, Providers,
   Google: replace the client ID and secret with the new ones. Save.
7. Put the new ID and secret in `.env.deploy.production` as `GOOGLE_SIGNIN_*`
   (kept there only for re-applying to Supabase; the app does not read them).
8. Sign in with Google on `https://lannacare.org` as an admin, in a private window
   so an old session does not hide a failure. Check the consent screen says
   "Lanna Care for Animals" rather than the Supabase host. **If it shows the host,
   brand verification did not carry over:** it depended on `lannacare.org` being
   verified in Search Console under Lutan's account. Add the lanna account as a
   verified owner of that Domain property (the TXT record on the apex in
   Cloudflare DNS stays; **do not delete it**) or re-verify from the lanna account.
9. Repeat on `https://test.lannacare.org` to prove dev sign-in still works (it
   should be unchanged; this catches a consent-screen mistake from step 4).

**Drive: nothing to move.** UAT, dev and test already use the Lanna Care Drive
Access client under the lanna account [repo: README]. Step 2 confirms it, and
`Settings` shows Drive healthy on both sites.

**Close-out**

10. Leave `LCA App` alone for a week with sign-in working on both sites, then delete
    it (Google keeps a deleted project recoverable for 30 days). Also remove
    `lannacare.org`'s Search Console ownership from Lutan's account only after the
    lanna account is added there (step 8).
11. **Look for the 90-day expiry while in `lanna-care-dev`** (Auth Platform settings)
    and, if convenient, Supabase Authentication, Sessions and Account, Access Tokens,
    and Cloudflare, API Tokens. If found, tick that backlog item.
12. Update the inventory tables, and tick the backlog item.

**Later, separately (production).** New Supabase project and
`lannacareforanimals.org`: a sign-in client and a Drive client on
`lannacareforanimals@gmail.com`, per the cutover and Drive-tree items. Nothing above
blocks or is undone by that.

## 4. What this document does not know

- Whether the UAT Supabase host is already an authorised domain on `lanna-care-dev`'s consent screen, and whether brand verification (Search Console) covers that project.
- Whether either project holds anything beyond what is listed.
- What `.env.deploy.uat` and `.env.deploy.production` hold for the Drive client.
- The name and ID of the production sign-in client.
- Where the 90-day expiry lives.
- What the `security-review` stream's assessment (`origin/claude/security-review`,
  a PDF/DOCX) says about these clients; it was not read for this pass. Check it
  for anything that contradicts this file.
