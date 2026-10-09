# Google Cloud: which project holds what, and how to consolidate it

Written 2026-09-30 by the `google-cloud-one-account` stream. Scope narrowed by Lutan on 2026-09-30 to **Test and UAT** (production is separate and later). Companion to the
decision record `docs/decisions/2026-09-30-google-cloud-one-account.md` and the
backlog item "Put the Google Cloud setup under one account".

**Section 1 was rewritten on 2026-10-09 from a live stocktake** (stream
`google-stocktake`). Lutan asked for it on 2026-10-07, after a secret rotation
planned from this file's unconfirmed guesses went wrong three times. Every Google
Cloud console page below was opened on 2026-10-09 in Lutan's Chrome and **read
only**; nothing was changed. The old `[CONFIRM]` marks on Google facts are gone
because those facts have now been seen.

**Later the same day (2026-10-09) the consolidation in section 3 was carried out,
and section 1 describes the result.** Production sign-in moved from LCA App to a
new client in Lanna Care - Dev. Supabase `dbkodyyxxhtygxcxmfcu` was switched to it,
and Lutan signed in on `lannacare.org` successfully before and after the old secrets
were disabled. Both LCA App clients were then deleted, which also retired the
secret exposed on 2026-10-01. In order:

1. Lutan turned on two-step verification for `lannaanimalfoundationbwm`; the
   console had refused that account since 2026-10-03.
2. `lannaanimalfoundationbwm` was added as an **Owner** of the `lannacare.org`
   Domain property in Search Console (by `lutan.bennett2`, who stays an owner).
3. Lanna Care - Dev's branding was submitted for verification. It passed within
   a minute and was published, so the Google screen says "Lanna Care for Animals"
   for both production and dev/test sign-in.
4. New web client `1036347359893-udugtetbu312ee8301th8r0uo1jucupd` created in
   Lanna Care - Dev, redirect `https://dbkodyyxxhtygxcxmfcu.supabase.co/auth/v1/callback`.
   Lutan pressed Create and pasted its ID and secret into Supabase; no session
   saw the secret.
5. Secrets `q-4Z` and `D3vd` on the two LCA App clients were disabled, and sign-in
   was retested. Then both clients (`…bjgla5…`, `…drg7qt…`) were deleted. They are
   restorable from LCA App's deleted-credentials page until **2026-11-08**.

LCA App now holds no clients and is unused. Deleting the project itself is still
open (section 3, step 10).

**How to read the confidence marks.** **[seen 2026-10-09]** was read in the Google
Cloud console that day. **[repo]** was read from this repository. **[recorded]**
comes from a backlog or decisions entry written by someone who was looking at the
console or an API at the time. **[CONFIRM]** has still not been established.

**Identify a client by its redirect URI, never by its name.** Names are free text
and two of them are Google's defaults. The redirect URI says which Supabase
project, and so which site, the client serves.

## 1. Inventory (stocktake 2026-10-09)

### Google accounts

These are all the Google accounts signed in to Lutan's Chrome. The `authuser`
number is the one the console uses in its URLs on that machine, so it can change
if accounts are signed in or out [seen 2026-10-09].

| `authuser` | Account | Cloud projects it owns |
|---|---|---|
| 0 | `lutan.bennett2@gmail.com` | **LCA App**, and `My First Project` (empty) |
| 1 | `lutan.bennett1@gmail.com` | none |
| 2 | `lannaanimalfoundationbwm@gmail.com` | **Lanna Care - Dev** only |
| 3 | `lutan.bennett3@gmail.com` | none |

`lannacareforanimals@gmail.com`, the shelter's own account, is not signed in and
was not checked.

**`lannaanimalfoundationbwm` was locked out of the console from 2026-10-03.**
Google now refuses Cloud console access to any account without two-step
verification ("Google Cloud access blocked … enforce two-step verification"). Lutan
turned it on on 2026-10-09, and the console opened a few minutes later. Running
clients and refresh tokens were not part of the block. Only the console was. If
2-step verification is ever turned off again, the console is blocked again.

### Projects

| | **LCA App** | **Lanna Care - Dev** | My First Project |
|---|---|---|---|
| Owning account | `lutan.bennett2@gmail.com` | `lannaanimalfoundationbwm@gmail.com` | `lutan.bennett2@gmail.com` |
| Project id | `endless-bonus-458210-d4` | `lanna-care-dev` | `project-36366f84-5606-437c-869` |
| Project number | **`104841707674`** | **`1036347359893`** | `802572408195` |
| Organisation | none | none | `lutan-bennett2-org` (`500079492508`) |
| Consent screen | **In production**, External | **In production**, External | never configured |
| API keys | none | none | none |
| Service accounts | none | none | none |
| OAuth clients | **none** (2 deleted 2026-10-09) | **3** (below) | none |
| Branding | verified (2026-09-22) | **verified and published 2026-10-09** | — |
| Used for | **Nothing since 2026-10-09** | Drive storage everywhere; staff sign-in on **both** Supabase projects (`lannacare.org`, `test.lannacare.org`, local) | Nothing; unused |

All of the above is [seen 2026-10-09]. Older history [recorded]: LCA App was
renamed from `My First Project` and published 2026-09-22 (branding `Lanna Care for
Animals`, home `https://lannacare.org`, privacy `https://lannacare.org/privacy`,
scopes `openid`/`email`/`profile`, brand-verified via Search Console under Lutan's
account). Lanna Care - Dev was published 2026-09-25 after the 7-day Testing expiry
broke every upload. Its logo was removed, because a logo forces verification. The
second `My First Project` is a different, later project, not the renamed one.

### OAuth clients — every one that exists (after the 2026-10-09 move)

| Project | Name | Type | Client ID | Redirect URI | Created | Secrets (all enabled) | Serves |
|---|---|---|---|---|---|---|---|
| Lanna Care - Dev | Lanna Care sign-in (production Supabase) | Web | `1036347359893-udugtetbu312ee8301th8r0uo1jucupd` | `https://dbkodyyxxhtygxcxmfcu.supabase.co/auth/v1/callback` | 2026-10-09 | 1 (2026-10-09) | **Production sign-in** (`lannacare.org`). Lutan pasted it into Supabase `dbkodyyxxhtygxcxmfcu` and signed in with it on 2026-10-09 |
| Lanna Care - Dev | LCA Application | Web | `1036347359893-tk4qklicq40o496onnqan8j8mf1od331` | `https://qxkmhwybjggxvsfxsxbd.supabase.co/auth/v1/callback` | 2026-09-20 | 1 (2026-09-20) | **Dev/test sign-in.** Supabase `qxkmhwybjggxvsfxsxbd` uses this client [recorded: Management API, 2026-10-07] |
| Lanna Care - Dev | Lanna Care Drive Access | Desktop | `1036347359893-dfbupbdp60l8ukicc08dhf0jipafinb6` | none (Desktop clients use a loopback address) | 2026-09-18 | 1 (2026-09-18) | **All Drive access**: photos, attachments, archive PDFs, backups, for every environment. `GOOGLE_OAUTH_CLIENT_ID` in `.env.local` [repo] |

No client has authorised JavaScript origins. Client IDs and the last four
characters of a secret are identifiers, not secrets. The console no longer shows
full secrets.

**Deleted 2026-10-09, kept here so nobody goes looking for them** (both in LCA App,
both with redirect `https://dbkodyyxxhtygxcxmfcu.supabase.co/auth/v1/callback`):

| Name | Client ID | Created | Secrets at deletion |
|---|---|---|---|
| Lanna Care sign-in (production Supabase) | `104841707674-bjgla5kd0i4rbifi5buuekea7jqd74dp` | 2026-09-21 | `q-4Z` (2026-09-21, the one exposed 2026-10-01) disabled; `LFbV` (2026-10-07) still enabled, because Google will not disable a client's last secret |
| Web client 1 | `104841707674-drg7qtiia19jbq14rlhsljtiis4qju2n` | 2025-04-28 | `D3vd` (2025-04-28) disabled; `7Ui9` (2026-10-07) still enabled, for the same reason |

What the stocktake found, and what became of it:

- **Two LCA App clients had the production redirect URI**, the newer `…bjgla5…`
  (which Supabase used) and the April 2025 original `…drg7qt…`. Both deleted.
- **Both had gained a second secret on 2026-10-07** from the rotation attempt that
  went wrong. A client accepts every enabled secret. Deleting the clients was the
  only way to retire those, since a client's last secret cannot be disabled.
- **`GOOGLE_SIGNIN_CLIENT_SECRET=` in `.env.deploy.production` is malformed** [recorded
  2026-10-07]: a `GOCSPX-` secret with the `…bjgla5…` client ID run on after it. That
  client is now deleted, so the line is dead. Replace it with
  `GOOGLE_SIGNIN_CLIENT_ID=` / `GOOGLE_SIGNIN_CLIENT_SECRET=` for the new client
  (Lutan's; the file is in the main checkout, `C:\Development\Animal_Shelter_App`).
  The app does not read either.
- **Production and dev/test sign-in are now different clients in the same
  project.** Rotating one still cannot break the other.

### Where the Drive values are consumed

The app reads exactly four variables [repo: `.env.example`, `src/lib/google/drive.ts`]:

| Variable | Is | Consumed by |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | the Drive client's ID | app runtime (`src/lib/google/drive.ts`, `src/lib/status/health.ts`), `scripts/backup.mjs`, `scripts/import-appsheet.mjs`, `scripts/google-drive-verify.mjs`, `scripts/check-drive-token.mjs`, `scripts/google-oauth-setup.mjs` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | its secret | same |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | a token **minted for one Google account** against that client | same |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | the tree's root folder in that account | same |

Places those four are set, all of which a Drive secret rotation must touch [repo]:

- `.env.local` (dev, and Test), `.env.deploy.uat`, `.env.deploy.production`.
  `.env.deploy.<env>` overrides `.env.local` (README "Environments"). On
  2026-10-09 the main checkout had only `.env.deploy.production`, which sets none
  of the four Drive variables (so production falls back to `.env.local`'s), plus
  `BACKUP_DRIVE_FOLDER_ID` and `GOOGLE_SIGNIN_CLIENT_SECRET` [repo, names only].
- **Worker secrets** on `lanna-animal-care-test`, `lanna-animal-care-uat` and
  `lanna-animal-care`, pushed by `node scripts/deploy.mjs --env <env> --secrets`
  (`RUNTIME_SECRETS` in `scripts/deploy.mjs`). Secrets cannot be read back;
  Settings shows whether each deployed Worker's Drive still works.
- `.dev.vars` (local Worker preview).
- The **Pi**: `scripts/pi/write-env.mjs` copies the same four names into its env
  files.
- **Weekly backups** (`scripts/backup.mjs`) use the same four to write into the
  tree's `Backups` folder; `src/lib/status/health.ts` checks it there.

Sign-in is not read from env: it is configured **inside each Supabase project**
(Authentication, Providers, Google), so the `GOOGLE_SIGNIN_*` names appear nowhere
in `src/` or `worker/` [repo]. `scripts/deploy.mjs` never pushes
`GOOGLE_SIGNIN_CLIENT_SECRET`, so **a sign-in rotation needs no deploy**, and it signs
nobody out, because the secret is only used during the sign-in exchange [recorded
2026-10-07].

### Which client to change for which rotation

| To rotate | Sign in to the console as | Project | Client | Then put the new secret in |
|---|---|---|---|---|
| Production sign-in | `lannaanimalfoundationbwm` | Lanna Care - Dev | `…udugte…` (redirect `dbkodyyxxhtygxcxmfcu`) | Supabase `dbkodyyxxhtygxcxmfcu` → Authentication → Providers → Google; and `.env.deploy.production`. Then disable the old secret |
| Dev/test sign-in | `lannaanimalfoundationbwm` | Lanna Care - Dev | `…tk4qkl…` (redirect `qxkmhwybjggxvsfxsxbd`) | Supabase `qxkmhwybjggxvsfxsxbd` → Authentication → Providers → Google |
| Drive | `lannaanimalfoundationbwm` | Lanna Care - Dev | `…dfbupb…` (Desktop) | `GOOGLE_OAUTH_CLIENT_SECRET` in every place listed above, then `deploy.mjs --secrets` for each environment. The refresh token stays valid across a secret change, so no new token is needed |

Google lets a client hold two secrets at once for exactly this: add the new one,
switch everything over, check it works, then disable the old one. Disabling is
reversible. Deleting is not.

### Things that break silently, and when

- **Consent screen left in Testing:** refresh tokens expire after 7 days.
  Happened 2026-09-25 (`scripts/check-drive-token.mjs` header). **Any new project
  starts in Testing**, so this trap is waiting in the runbook below. Both live
  projects were In production on 2026-10-09.
- **Two-step verification turned off** on an account that owns a project: the
  console locks (2026-10-03 to 2026-10-09 for the lanna account).
- **Inactive clients are deleted by Google after six months unused.** This is a
  console notice on every client page. It only matters for a client kept as a spare.
- **The 90-day expiry on the backlog is still unfound** (set 2026-09-22, breakage
  expected around **2026-12-21**). It is *not* in LCA App [recorded]. Lanna Care -
  Dev's Auth Platform settings were not opened in this stocktake [CONFIRM]. Other
  candidates: Supabase Authentication, Sessions (both projects) and Account, Access
  Tokens (the token behind `apply-migrations.mjs`); Cloudflare, API Tokens (behind
  `deploy.mjs` and the analytics token).
- **A new Supabase project or domain** needs its redirect URI added to the sign-in
  client (README "Auth on a new Supabase project"; the cutover item, step 5).

### Tooling

`node --env-file=<file> scripts/check-drive-token.mjs` prints the Drive client's
**project number** and the **Drive account the token acts as**, beside its existing
checks. Compare them with the tables above. It cannot tell you the project *id*,
the owning account or the consent-screen state; those need the console.

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
   project number (should be `1036347359893`). The account needs two-step
   verification on, or the console refuses it (section 1).
2. Run `node --env-file=.env.local scripts/check-drive-token.mjs` (dev), and the same
   with `.env.deploy.uat` / `.env.deploy.production` if they exist, and write the
   answers into the Drive section above, which confirms which client and account
   each environment's token really uses.
3. **Consent screen check (in `lanna-care-dev`): Audience must say *In production*.**
   Published 2026-09-25 [recorded] and still In production on 2026-10-09 [seen],
   but check again, because a project left in Testing
   expires every refresh token after seven days. Confirm nothing has reverted it.
4. Consent screen, Branding: **authorised domains** need `lannacare.org` [recorded]
   **and the UAT Supabase host `dbkodyyxxhtygxcxmfcu.supabase.co`** (add it; not
   listed today [CONFIRM]). Do not add a logo: a logo forces verification.

**Move the UAT sign-in client**

5. **Lutan**, in `lanna-care-dev`, Clients, Create client: type **Web application**,
   name e.g. `LCA UAT sign-in`. Authorised redirect URI:
   `https://dbkodyyxxhtygxcxmfcu.supabase.co/auth/v1/callback`. (Origins are not
   needed for the Supabase flow, and neither existing client lists any [seen
   2026-10-09].) **This step creates a new client. The URI is not a description
   of an existing one.** LCA App already holds two clients with this same URI:
   `…bjgla5…` (live) and `…drg7qt…` (old). See section 1. Note the new client ID and secret. Do not use
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

Still open after the 2026-10-09 stocktake:

- Whether anything other than Supabase used the deleted LCA App clients. Nothing in the repo does, and sign-in worked after they were disabled. If something unexpected breaks before 2026-11-08, restoring them from LCA App's deleted-credentials page is the quick way back.
- What `.env.deploy.uat` holds. No such file existed in the main checkout on 2026-10-09.
- Where the 90-day expiry lives.
- Anything owned by `lannacareforanimals@gmail.com`, which is not signed in to Lutan's Chrome.
