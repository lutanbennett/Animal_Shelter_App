# Moving an address: the list of places outside the code

The system answers on **two addresses**, each a setting in `wrangler.jsonc`
(`vars`, per environment) and nowhere in `src/` or `worker/`:

| Setting | What it is | Today |
|---|---|---|
| `APP_HOST` | The staff app: sign-in, residents, medical, Settings | `lannacare.org` (test: `test.lannacare.org`) |
| `PUBLIC_HOST` | The public website: `/`, `/adopt`, `/our-work`, `/friends`, `/donate`, `/foster`, `/volunteer`, the `/r/…` and `/e/…` tags, the photo route | same as `APP_HOST` until the public site moves |

Equal values mean one address serves everything. Different values split them:
the app sends a visitor on the wrong address to the right one (`src/proxy.ts`,
rules in `src/lib/site-hosts.ts`). `/r/` and `/e/` are public-address pages,
decided 2026-10-20, so a card is printed once.

Changing a setting changes the code's behaviour. **This list is everything that
does not change with it.** Work through it top to bottom, once per move.

## A. Moving the public website to `lannacareforanimals.org`

1. **Cloudflare, domain.** `lannacareforanimals.org` is a zone in the same
   Cloudflare account (transfer first, if it is not). Nothing else works until it is.
2. **Worker routes.** `wrangler.jsonc`, production block: add
   `lannacareforanimals.org` and `www.lannacareforanimals.org` to `routes`
   (`custom_domain: true`). The staff routes stay.
3. **Settings.** Production block: `PUBLIC_HOST` = `lannacareforanimals.org`.
   `PUBLIC_SITE: "locked"` STAYS in the production block (Lutan, 2026-11-05);
   removing it is the public launch, a separate decision. The deploy guard that
   used to refuse a forgotten lock (`lockedPublicSiteProblem`) was deleted in the
   cutover commit, so nothing warns about it any more.
4. **cloudflared on the Pi.** `scripts/pi/cloudflared-config.yml` needs no new
   hostname (the Worker reaches the Pi on `ORIGIN_HOST` and sends the visitor's
   host in `x-lanna-public-host`), but each `httpHostHeader` must stay one of the
   addresses in `wrangler.jsonc` (`node scripts/check-site-hosts.mjs`).
5. **Cloudflare WAF rule** on the Pi hostname (the `x-origin-key` check):
   unchanged unless the Pi hostname changes.
6. **Email sender.** Any public mail sends from the public domain: SPF, DKIM and
   DMARC on `lannacareforanimals.org`, and `RELEASE_MAIL_FROM` /
   `STATUS_ALERT_FROM` in `wrangler.jsonc` if they should follow.
7. **Search Console.** Add `lannacareforanimals.org` (domain property) and
   submit `/sitemap.xml`. The staff property stays `noindex`.
8. **Cloudflare analytics.** `CLOUDFLARE_ZONE_ID` covers one zone; a second zone
   needs its own reading (the Settings → System status tile stays grey until then).
9. **Print.** Name cards and QR codes wait until both addresses are final
   (decision 2026-10-10).

## B. Moving the staff app to its Cooper `.org`

**Superseded for the 2026-11-06 cutover by section E.** In particular its Google step (JavaScript origins, consent-screen edits) is NOT to be done before the cutover; see E, P3.

1. **Cloudflare, domain and zone** for the new name; a new `routes` entry in
   `wrangler.jsonc`.
2. **Settings.** `APP_HOST` = the new hostname in every environment block that
   moves, and `STATUS_ALERT_SITE` (the base for alert and calendar links).
3. **Supabase → Authentication → URL Configuration** (each project: dev, UAT,
   production): Site URL, and the Redirect URLs allow-list gets
   `https://<new>/auth/callback`. Keep the old entry until the old address forwards.
4. **Google sign-in** (OAuth client in the `lanna-care-dev` project; see
   `docs/google-cloud-inventory.md`): Authorized JavaScript origins and
   redirect URIs for the new host. Consent screen: home page and privacy policy
   links (`/` and `/privacy` are served on the app address for exactly this),
   authorised domain, and re-verification if Google asks. Drive and Calendar use
   refresh tokens, not the host: no change.
5. **cloudflared on the Pi.** `httpHostHeader` for the production ingress becomes
   the new `APP_HOST` (`scripts/check-site-hosts.mjs` fails until it does). Route
   DNS for the tunnel only if the Pi hostname itself changes.
6. **Cloudflare DNS and WAF** for the new name; the WAF rule on the Pi hostname
   is unchanged.
7. **The old address forwards** (decided 2026-10-10, point (c)): a Cloudflare
   redirect rule from the old staff address to the new one, path and query kept,
   so printed cards and links never break. **Do not remove the old address from
   Supabase and Google until the forward is live.** Not built in code: it is DNS.
8. **Email sender** for auth mail: SPF, DKIM, DMARC on the new domain; Supabase →
   Authentication → SMTP settings; `RELEASE_MAIL_FROM`.
9. **Search Console**: nothing; the staff app is not indexed.
10. **Existing sessions end.** Cookies belong to one address: every signed-in user
    signs in again on the new one. Say so in the release note.
11. **Anything kept by hand**: shelter bookmarks; calendar events already written
    carry the old host and keep working through the forward; the Pi's
    `.env.production.local` is regenerated by `node scripts/pi/write-env.mjs`
    (redeploy the Pi).

## C. Giving UAT its own address (owed by the cutover item)

`uat` block in `wrangler.jsonc`: `APP_HOST` and `PUBLIC_HOST` (the UAT host),
`routes`, then Supabase redirect URLs and Google redirect URIs for it, as in B. **Settled and sequenced in section E below** (UAT needs no tunnel).

## D. Outstanding by hand (Lutan)

1. ~~**Supabase, live project, Authentication → SMTP settings:** change *Sender name* from
   `Lanna Care UAT` to `Lanna Care`.~~ **DONE 2026-10-29** (`#prx2t`): Lutan sent himself a reset and it
   arrives from **"LCA System"**. This line was left open by mistake and was raised with him again on
   2026-11-08; it is not outstanding. Do not ask him about it.

## E. CUTOVER DAY, in order (Friday 6 November 2026; `#ki6cx`)

Whole system moves to `lannacareforanimals.org`; `lannacare.org` becomes UAT. Reasoning, the
UAT-tunnel answer and the exact diff: `docs/decisions/2026-11-04-cutover-preflight.md`.
**Who:** L = Lutan, RM = release manager, S = a script. **Each step's proof must pass before the next starts.**

### Before the day (Thursday)

| # | Step | Who | Proof |
|---|---|---|---|
| P1 | ~~New production Supabase project~~ **Dropped 2026-11-05 (Lutan): there is no new project and no restore.** Production stays on `dbkodyyxxhtygxcxmfcu`. The free plan allows two Supabase projects, both in use, so UAT takes the **dev** project (`qxkmhwybjggxvsfxsxbd`) for now; see "UAT shares the dev database" below. `#ki6cx` step 2 is closed by this | n/a | n/a |
| P2 | **Production project** (`dbkodyyxxhtygxcxmfcu`): Authentication → URL Configuration: add Redirect URL `https://lannacareforanimals.org/auth/callback` and set Site URL to `https://lannacareforanimals.org` **at step 5, not before** (until then `lannacare.org` is the live site and sign-in must keep working: add the new Redirect URL now, change the Site URL on the day). Keep `https://lannacare.org/auth/callback` until step 10. **Dev project** (`qxkmhwybjggxvsfxsxbd`), which UAT now uses: add Redirect URL `https://lannacare.org/auth/callback`. SMTP sender: unchanged | **L** | screenshot or read-back of the fields on both projects |
| P3 | **Google sign-in: change nothing before the cutover.** Read in the console 2026-11-05 (`lanna-care-dev`, signed in as `lannaanimalfoundationbwm`): no OAuth client uses JavaScript origins, both Supabase callbacks (`dbkodyyxxhtygxcxmfcu` and `qxkmhwybjggxvsfxsxbd`) are already authorised domains, and the branding is **verified** with home page `https://lannacare.org` and privacy `https://lannacare.org/privacy`. **Do NOT edit the consent screen's branding or add `lannacareforanimals.org` to its authorised domains:** editing a verified app can put the branding back under review, and the sign-in screen would then show the Supabase address instead of the shelter's name on cutover day. (The risk is Google's documented behaviour for verified apps, not something tested here.) Moving the home page and privacy links to the new domain is a separate, planned change after the cutover, once `lannacareforanimals.org` is verified in Search Console | n/a | n/a: nothing to do |
| P4 | Zone `lannacareforanimals.org`: **delete Sav's parking A and CNAME records** (apex and www) so Worker custom domains can be created; SPF/DKIM/DMARC and send-email routing for `releases@` and `alerts@` | **L** | dashboard shows no A/CNAME at apex or www; test mail sends |
| P5 | Prepare the cutover branch from the diff in the decision file (wrangler, tunnel, releases label, `deploy-pi.sh`, `purge-cache.mjs`), **plus the UAT-on-dev code change** below. `UAT_PROJECT_REF` stays `""` and production's `SUPABASE_URL` does not change. `.env.deploy.production` gains `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` (done 2026-11-05: `323637bcac56a111938cd69f8d403634`, read from the zone's Overview page). `.env.deploy.uat` exists (done 2026-11-05) and holds only the `lannacare.org` zone id: UAT's database, Google and Drive values come from `.env.local` (dev), which is what `--allow-dev-fallthrough` is for. The purge token needs no change: backlog `#39c1c` (2026-10-19) records that Lutan already added both zones to it. Not tested from here (a production call was blocked), so step 8 is its first proof. **Do not merge yet.** | RM | `node scripts/check-site-hosts.mjs` prints `all right`; `node scripts/gates.mjs` four zeros |
| P6 | Backup of the live project. Production now takes the new host's writes on the same project, so this is also the rollback copy | S | **Run it on the Pi, not from the main checkout** (the main checkout has no backup Google token and refuses): `ssh lutan@lanna-pi.local 'cd $HOME/Animal_Shelter_App && node scripts/backup.mjs --env production --shared-drive-token --keep-days 14 --local-copy $HOME/backups/lannacare'`, which is the Pi's daily cron line. Done 2026-11-05 (`lannacare-production-2026-11-05T1317Z.dump.age`); repeat it just after the Friday freeze so the rollback copy is newer than the last write. README's cron example omits `--shared-drive-token`; the real crontab has it. Proof: `Uploaded to Drive as lannacare-production-<date>.dump.age` and a new file in `~/backups/lannacare` |
| P7 | ~~UAT's own Drive copy (`#rqv5c`)~~ **Not needed while UAT is on dev**: dev already has its own Drive tree, so UAT never holds a production Drive id. Skip P7 and step 6a; they come back when UAT gets a project of its own. (Original text kept for that day:) **UAT's own Drive copy** (`#rqv5c`). Reads production's tree, writes only a new private root in the same account. First `node scripts/drive-copy-tree.mjs --env production --map drive-copy-map.production.jsonl` (dry run: prints tree size and free space; stop if it says `Fits: NO`), then the same with `--apply`. Re-run the same line if it dies part way. Keep the map file and note the new root id | S (RM) | `Copied N files; 0 failed`, and the new root folder exists in Drive and is not shared |

### On the day

1. **Freeze.** Tell the shelter staff not to save anything until told, **then repeat the P6 backup on the Pi** so the rollback copy is newer than the last write. *Proof:* message sent; a new `lannacare-production-<date>.dump.age` in `~/backups/lannacare`.
2. ~~**Final copy.**~~ **Dropped with P1:** production stays on its own project, so there is no copy and nothing can be lost between a copy and the switch. The freeze in step 1 is kept only because the Pi refuses `lannacare.org` Server Actions between steps 4 and 5.
3. **Merge the cutover PR** once green on its head commit (`gh run view <id> --json headSha`). Merging deploys nothing. **Then, in the main checkout (`C:\Development\Animal_Shelter_App`), switch to `main`, pull, and confirm `git status` is clean:** `scripts/deploy.mjs` refuses unless local `main` equals `origin/main` with a clean tree.
4. **Pi first.** `./scripts/pi/deploy-pi.sh --env production` (builds with the new `APP_HOST`; same project), then edit `/etc/cloudflared/config.yml` so `pi.lannacare.org` presents `lannacareforanimals.org` and `sudo systemctl restart cloudflared`. From here `lannacare.org` Server Actions are refused until step 5; that is why step 1 happened. RM. **Expect `deploy-pi.sh` to finish with a failed asset check:** that check fetches `https://lannacareforanimals.org/`, which no Worker serves until step 5 (how it fails against the parked page was not run, so it is not established). Judge step 4 by `serving <version> as expected` and the service being active, then re-run the check after step 5: `ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && node scripts/pi/check-assets.mjs --url https://lannacareforanimals.org/ --dir .next'` must say ok. The script also **deletes `.next.prev` once the new build is healthy**, so there is no instant Pi rollback after this step. *Proof:* `systemctl is-active` for both; `curl` to the Pi with the origin key returns `/api/version` with the new release.
5. **Production Worker.** `node scripts/deploy.mjs --env production --no-mail` (Lutan wants no release email for this cutover; `--no-mail` also protects against a major release merging first). RM. *Proof:* `curl -sI https://lannacareforanimals.org/` returns 200 with an `x-lanna-served-by` header; `https://lannacareforanimals.org/api/version` shows the release; signed out, the home page is the sign-in landing page: the public site stays locked (`PUBLIC_SITE`), by Lutan's decision of 2026-11-05.
5a. **Supabase Site URL.** Production project (`dbkodyyxxhtygxcxmfcu`) → Authentication → URL Configuration → **Site URL** → `https://lannacareforanimals.org`. Keep both `lannacare.org` Redirect URLs until step 10. L. *Proof:* signing in on the new host returns to the new host. (The dev project's Site URL, which UAT now uses, is `http://localhost:3000`: unchanged, and not established whether UAT's auth emails need it changed.)
6. **Check `lannacare.org` was released.** Dashboard → Workers → `lanna-animal-care` → Domains & Routes should no longer list it. If it still does, remove it by hand (L or RM). *Not established whether wrangler does this on deploy.* *Proof:* the domain is not on the production Worker.
6a. **Skip while UAT is on dev (see P7).** **Point UAT at its Drive copy** (after step 2, so the old project takes no more writes; before step 7). `node scripts/drive-remap-ids.mjs --env uat --map drive-copy-map.production.jsonl` (dry run: lists the columns and a count each), then the same with `--apply`, then once more: it must print zeros. It refuses production and any project `src/lib/app-env.ts` does not call dev or uat. Then set UAT's `GOOGLE_DRIVE_ROOT_FOLDER_ID` secret to the new root id; production's Drive settings do not change. RM. *Proof:* the re-run prints zeros; open one resident on UAT and see its photo.
7. **UAT Worker.** `node scripts/deploy.mjs --env uat --secrets --allow-dev-fallthrough --no-mail` (the first UAT deploy has no secrets on the new Worker, and its secrets are dev's on purpose). RM. *Proof:* `https://lannacare.org/` shows the sign-in landing page (locked) and the UAT badge after sign-in (the badge needs the code change below, because the dev project would otherwise label it "dev"); `/api/version` answers. UAT's data is dev's, not production's: sign in with a dev login (`scripts/dev-signin.mjs` style), not a shelter account. UAT has no tunnel and needs none (`ORIGIN_HOST` is empty).
8. **Purge** both zones: `node scripts/purge-cache.mjs --env production` (`CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` is in `.env.deploy.production` since 2026-11-05; backlog `#39c1c` records that the purge token already covers both zones, so this is its first real use on the new zone: if Cloudflare refuses it, purge that zone by hand in the dashboard instead) and the UAT zone, either `node scripts/purge-cache.mjs --env uat` (needs `CLOUDFLARE_PURGE_TOKEN` added to `.env.deploy.uat`, which is not there) or by hand: Cloudflare → `lannacare.org` → Caching → Configuration → Purge Everything. S. *Proof:* the script's own check.
9. **Smoke test on the new name, in this order** (RM, then L signs in with Google): sign in **and read the Google screen: it must say "Lanna Care for Animals", not the Supabase address** (if it shows the address, brand verification did not carry over: stop and read `docs/google-cloud-inventory.md` step 8); **save a setting** (a Server Action: this is the 2026-10-01 failure); **upload a photo** (the upload route, the other half); open one `/r/` and one `/e/` link; `robots.txt` and `sitemap.xml` say the new host. *Proof:* each works; any "A server error occurred" means stop and read the Pi's journal for `x-forwarded-host`.
10. **Unfreeze.** Tell the staff. Run the release smoke test (`docs/release-smoke-test.md`).
11. **Search steps** (from `#ki6cx`, after the unlock): (a) robots/sitemap say the new host; (b) Search Console Domain property (TXT in Cloudflare DNS), submit the sitemap, request indexing on the home page and one animal; (c) Rich Results Test on the home page and a story; (d) PageSpeed on the home page and an animal page; (e) share a page into LINE and Facebook and check the preview; (f) Director sets the new website on the Google Business Profile and Settings → Website → Map link. L, except where stated.
12. **Record PR**: release record, backlog tick, README environments table.
13. **After the cutover, not on the day's critical path.** (a) The visitor count on Settings → System status reads `CLOUDFLARE_ZONE_ID` with `CLOUDFLARE_ANALYTICS_TOKEN`; production's value is still the `lannacare.org` zone. Set it to the new zone id in `.env.deploy.production` and push it with `--secrets` once the analytics token is confirmed to cover the new zone (not established). (b) `scripts/pi/setup.sh` line 122 and `docs/pi-hosting.md` still name `lannacare.org` as production: update on the next Pi rebuild or doc pass.

### If it goes wrong

**Not rehearsed.** Production's database is the same project throughout, so a rollback loses no data at any point, and the backups are the safety net. To go back: (1) the Pi: `.next.prev` no longer exists after step 4, so redeploy the previous release commit with `deploy-pi.sh --env production --ref <previous release sha>` (a rebuild, which also restores the old `APP_HOST`), put the tunnel header back to `lannacare.org` and restart cloudflared; (2) the Worker: Cloudflare dashboard → Workers → `lanna-animal-care` → Deployments → roll back to the previous version, or revert the cutover commit and redeploy; (3) after step 6 the production Worker no longer holds `lannacare.org` and after step 7 UAT does, so a rollback after those also means moving `lannacare.org` back by hand; (4) put the Supabase Site URL back to `https://lannacare.org`.

### UAT shares the dev database (decided 2026-11-05, Lutan)

The free Supabase plan allows two projects (dev and production), and a third would be a paid plan. So until a project slot exists, **UAT (`lannacare.org` after the cutover) and the test site use the dev project**, and **production keeps `dbkodyyxxhtygxcxmfcu`**. What this means, so nobody is surprised:

- UAT holds dev's disposable data, not a copy of production's. Every dev stream's writes show on UAT. Migrations reach dev before `main`, so UAT's released code can run against a newer schema.
- **Code change in the cutover commit (RM).** `appEnvForSupabaseUrl` in `src/lib/app-env.ts` returns `"dev"` for the dev ref before it looks at anything else, so UAT would never wear a UAT badge, and `scripts/deploy.mjs` and `scripts/lib/env.mjs` refuse `--env uat` while `UAT_PROJECT_REF` is empty. The UAT Worker needs its own signal for "I am UAT" (a `vars` entry in the `uat` block of `wrangler.jsonc`) that those three places read, and the Drive remap script's allow-list (dev and uat) is already fine. Prove it with a test in the same commit. Do not set `UAT_PROJECT_REF` to the dev ref: that would make the test site read as UAT too.
- `RELEASE_MAIL_ENV` and `STATUS_ALERT_*` in the `uat` block: not established whether UAT should send them against dev's data; leave them as they are in the `uat` block today.
- **When a third project is possible:** create it, restore production into it, set `UAT_PROJECT_REF`, run P7 and step 6a, and delete the stopgap signal. Until then this section stands.
