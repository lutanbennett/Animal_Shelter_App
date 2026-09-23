# Lanna Care for Animals

Custom web app for Lanna Care for Animals, a not-for-profit animal shelter,
replacing their current AppSheet/Google Sheets system.

Full requirements: [`docs/requirements/lanna-care-rebuild-requirements.md`](docs/requirements/lanna-care-rebuild-requirements.md).
Decisions and open questions: [`docs/decisions.md`](docs/decisions.md).

## Stack

- **Next.js** (App Router) + **Tailwind CSS**
- **Supabase** (Postgres + Auth + RLS) — see `supabase/migrations/`
- **Google Drive API** for file/photo storage (not Supabase Storage — see `docs/decisions.md`)
- **@react-pdf/renderer** for resident profile / deceased summary PDFs
- Hosting: a **Cloudflare Worker** (free tier, via `@opennextjs/cloudflare`)
  fronts the site — edge cache for the public pages, then the **Raspberry
  Pi** origin through a Cloudflare Tunnel, then rendering in the Worker
  itself as the fallback. See `docs/pi-hosting.md`.

Everything is chosen to run on free tiers — see `docs/decisions.md` for the
reasoning and the trade-offs that come with that.

## Roles

Five `app_role` values, enforced by row-level security
(`supabase/migrations/0001_initial_schema.sql`, mirrored for management in
`0039`, vets in `0040`, medications in `0043`/`0044`) and assigned at `/admin/security`:

| Role | Access |
|---|---|
| **admin** | Everything, including the Settings section (the /admin pages: security, website, zones, enclosures, immunization and procedure types) and the Management section. |
| **management** | Staff's operational access plus the Management section: the reporting dashboard (`/management/dashboard`), contact, vet, medication and diet management, and the translations of public text (`/management/translations`). |
| **staff** | Read/write on residents, placements, weights, photos, maintenance, projects and contacts; read on medical records. |
| **vet** | Read/write on vet visits, procedures, blood tests, prescriptions and immunizations; read on residents. |
| **volunteer** | Read everything; write photos and enclosure moves only. |

A person who leaves is **archived** from `/admin/security` rather than deleted (`user_roles.archived_at`, 0063): `current_user_role()` returns null for them, so every policy and page treats them as having no access, while their name stays on the maintenance jobs they did. Restore reverses it.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in:
   - A Supabase project's URL/keys (create one free at supabase.com)
   - Google OAuth client credentials + refresh token for the shelter's
     Drive account (see `src/lib/google/drive.ts` for how this is used)

3. **Apply the database schema**

   ```bash
   node scripts/apply-migrations.mjs
   ```

   Applies every file in `supabase/migrations/` that the project hasn't
   seen yet, in order, and records each one in a `schema_migrations`
   table there. `--status` shows what's applied and pending; `--dry-run`
   runs pending files inside a rolled-back transaction. Needs
   `SUPABASE_ACCESS_TOKEN` (a personal access token from the Supabase
   dashboard) in `.env.local`; the target project comes from
   `NEXT_PUBLIC_SUPABASE_URL`.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

   **From a phone on the same Wi-Fi:** `next dev` listens on every
   interface, so `http://<laptop-ip>:3000` works too (`ipconfig` →
   IPv4 Address). `next.config.ts` already allows dev assets for
   `192.168.1.*`; for **Google sign-in** to come back to the phone the
   dev Supabase project's Redirect URLs (Authentication → URL
   Configuration) must also list `http://192.168.1.*:3000/auth/callback`,
   or Supabase bounces the sign-in to its Site URL (localhost).

5. **Enable the git hooks** (once per clone)

   ```bash
   git config core.hooksPath .githooks
   ```

   `.githooks/post-commit` pushes the current branch to GitHub after every
   commit, so the remote always matches the local checkout.

6. **Check out the backlog worktree** (once per clone)

   ```bash
   git worktree add ../Animal_Shelter_Backlog backlog
   ```

   `backlog` is a permanent branch that only ever changes `docs/backlog.md`.
   Having it in its own folder means an item can be added at any moment
   without touching whatever the main checkout is in the middle of; see
   `CLAUDE.md` "The backlog branch" for how it is merged back.

7. **Feature worktrees** (one per workstream)

   ```bash
   node scripts/worktree.mjs new <feature>
   ```

   Creates `../Animal_Shelter_<feature>` on branch `claude/<feature>` from
   `origin/main`, copies `.env.local` in, runs `npm ci` and picks the next
   free dev-server port (recorded in `.port`; `node scripts/worktree.mjs
   dev` uses it). The main checkout stays on `main`; each workstream gets
   its own folder, dev server and Claude session, so two or three
   features can be built at once. `list`, `sync` and `done` cover the
   rest of a stream's life — see `CLAUDE.md` "Workstreams". Google
   sign-in on a new port needs `http://localhost:<port>/auth/callback`
   in the dev Supabase project's Redirect URLs, once per port.

## Environments

Four environments, three of them deployed. **UAT exists in the code and
the tooling but not yet as a site**: until the production domain cutover,
`lannacare.org` is served by the production block and `--env uat` refuses
to deploy. The UAT column is what the cutover makes true.

| | Dev | Test | UAT | Production |
|---|---|---|---|---|
| Where | `next dev` on your machine | `test.lannacare.org` | `lannacare.org`, `www.lannacare.org` — for good | `lannacare.org` until the cutover, then `lannacareforanimals.org` |
| Worker | — | `lanna-animal-care-test` | `lanna-animal-care-uat` (no routes until the cutover) | `lanna-animal-care` |
| Database | dev Supabase project (`qxkmhwybjggxvsfxsxbd`) | **the same dev project** | `dbkodyyxxhtygxcxmfcu` — today's production project, demoted at the cutover | `dbkodyyxxhtygxcxmfcu` today; a new project from the cutover |
| Google Drive | dev account | dev account | dev account (the current tree) | dev account, until the shelter's own account exists |
| Values from | `.env.local` | `.env.local` | `.env.deploy.uat` over `.env.local` | `.env.deploy.production` over `.env.local` |
| Deploy | — | `npm run deploy:test` | `npm run deploy:uat` | `npm run deploy:prod` |
| Looks | teal, **Dev** badge in the header | teal, **Dev** badge | orange, **UAT** badge | orange |
| Generated PDFs | `DEV` watermark | `DEV` watermark | `UAT` watermark | none |
| Release mail | never | never | `[UAT]` | `[UAT]` until the cutover, then `[Production]` |

Dev and Test are recoloured (teal instead of orange, greenish surfaces, a
**Dev** badge beside the logo once signed in) so a tab on the dev database
is never mistaken for the live site. UAT is deliberately *not* recoloured —
the customer should be testing the real thing — and differs from
Production only by its **UAT** badge and the watermark on the archive PDF
(`src/lib/archive/resident-summary-pdf.tsx`), which lands in a Drive that
dev, Test and UAT share. `src/lib/app-env.ts` decides from the Supabase
project ref the build was made with — not from `NODE_ENV`, which is
`production` on Test too — and the layout sets `<html data-env>`, which
`globals.css` keys the colour tokens on. Its `UAT_PROJECT_REF` is empty
until the cutover, because the project that will be UAT is production's
today; set early, it would badge the live site.

**What the cutover changes here**, in one commit: `UAT_PROJECT_REF` in
`src/lib/app-env.ts` and production's label in `src/app/releases/page.tsx`;
the `lannacare.org` routes move from the `production` block of
`wrangler.jsonc` to `uat`, and production gets the new domain,
`RELEASE_MAIL_ENV` `Production` and a From on that domain;
`SITE_ORIGINS.production` in `scripts/deploy.mjs` and `HOST=` in
`scripts/pi/deploy-pi.sh` follow. Outside the repo: today's
`.env.deploy.production` becomes `.env.deploy.uat`, a new
`.env.deploy.production` holds the new project's values, and
`node scripts/deploy.mjs --env uat --secrets` gives the UAT Worker its
secrets. The Pi has no `lanna-care-uat` service yet; `setup.sh` installs
only `lanna-care`.

Two databases, both on Supabase's free tier (the org allows two). Test
deliberately shares the dev database: one developer, throwaway data, and
what Test is for is exercising a real Workers build of `main` on phones
before it goes to production. Production holds the shelter's real records.
Both are free-tier projects, which means **no automatic backups** beyond
the weekly `scripts/backup.mjs` dump — see "Backups" below. Free projects also pause after seven days with no
requests at all, which the public pages make impossible while the site is
up.

`scripts/lib/env.mjs` is the one place that knows which values belong to
which environment; `scripts/deploy.mjs`, `scripts/apply-migrations.mjs`,
`scripts/backup.mjs`, `scripts/check-public-views.mjs` and
`scripts/bootstrap-admin.mjs` all take `--env test|uat|production`
(default `test`) and print the environment and Supabase project ref before
doing anything. `--env uat` stops at once while `.env.deploy.uat` does
not exist, which is until the cutover.

`.env.deploy.production` (gitignored) holds the production
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_DB_PASSWORD` for backups);
anything it doesn't set — currently the whole Google Drive set — falls
through to `.env.local`. Next.js and OpenNext never
read that file on their own, which is what keeps a production build from
happening by accident: only `scripts/deploy.mjs` puts its values in the
shell.

## Deploying to Cloudflare

The app deploys to Cloudflare Workers through the `@opennextjs/cloudflare`
adapter (`wrangler.jsonc`, `open-next.config.ts`). Google Drive access is a
plain-`fetch` client (`src/lib/google/drive.ts`) specifically so it runs on
the Workers runtime — the `googleapis` SDK does not (see `docs/decisions.md`).

1. **Log in to Cloudflare** (once per machine)

   ```bash
   npx wrangler login
   ```

   Run it from a terminal you can leave open while you click **Allow** in
   the browser it opens — it gives up after about five minutes. If
   PowerShell refuses with "running scripts is disabled", use `npx.cmd`
   instead of `npx` (the `.cmd` shim skips the execution policy).

   Every build goes through `scripts/win-junction-symlinks.cjs`, which on
   Windows turns the directory symlinks OpenNext creates for Next's hoisted
   ESM packages into junctions — real symlinks need Developer Mode or an
   elevated shell, and the build dies with `EPERM … symlink` without it.
   It is a no-op elsewhere.

   Builds are safe to run while a `next dev` is up. `next build` and
   `npm run typecheck` type-check with `tsconfig.build.json`, which is
   `tsconfig.json` minus `.next/dev` — the route types the dev server
   rewrites on every compile. Before that (2026-09-22) a build that read
   them mid-write died with a wall of `TS1005` in `routes.d.ts` /
   `validator.ts`. The editor still uses `tsconfig.json`, so it sees the
   live dev types.

2. **Preview locally on the Workers runtime** — what `next dev` can't
   simulate. It reads `.env.local` directly, no extra setup:

   ```bash
   npm run preview
   ```

3. **Deploy to Test**

   ```bash
   npm run deploy:test
   ```

   Builds with the dev Supabase values, empties the env-file snapshot
   OpenNext bakes into the bundle (`scripts/strip-baked-env.mjs` — check its
   `removed N env var(s)` line appears), and uploads the
   `lanna-animal-care-test` Worker. Add `--secrets` after
   `node scripts/deploy.mjs --env test` to (re)upload the five runtime
   secrets from `.env.local` first — needed once per Worker and whenever a
   value changes; `npx wrangler secret list --env test` shows what is set.

4. **Deploy to UAT or Production**

   ```bash
   npm run deploy:uat
   ```

   ```bash
   npm run deploy:prod
   ```

   Same steps with `.env.deploy.uat` / `.env.deploy.production`, and a
   guard: it refuses unless the checkout is `main`, clean, and identical to
   `origin/main`, so what the customer tests and what is live are always
   commits GitHub has. Merge first, then deploy. Every environment,
   Test included, also refuses when its env file points at a project
   `src/lib/app-env.ts` would badge as something else — which is why
   `deploy:uat` fails today: UAT has no project of its own until the
   cutover.

   **Why the strip step matters.** The OpenNext adapter copies *everything*
   in `.env.local` into the Worker bundle as a fallback for any variable not
   set on Cloudflare — convenient for `npm run preview`, but it would ship
   dev credentials (and unrelated things like `SUPABASE_ACCESS_TOKEN`) to
   production. With the snapshot emptied, a secret you forgot to set fails
   loudly at runtime instead of silently using the dev value. To preview
   the stripped build locally the way production runs, put the five values
   in a gitignored `.dev.vars` file (wrangler's local stand-in for secrets).

   **Never interrupt an OpenNext build on Windows** (2026-09-23, which cost
   four deploy attempts). The bundling step rewrites symlinks under
   `node_modules` — that is what `scripts/win-junction-symlinks.cjs` is
   managing — so killing the build mid-way can leave a package as an empty
   directory. Here it gutted `@react-pdf/reconciler`, and the damage only
   surfaced on the *next* build as
   `Module not found: Can't resolve '@react-pdf/reconciler'` pointing at
   `src/lib/archive/resident-summary-pdf.tsx`, several minutes into a run
   that looked fine. If a build has to be stopped, treat `npm ci` as
   mandatory before the next attempt; `node -e "…"` over `package-lock.json`
   comparing each entry against a `package.json` on disk is how the two
   gutted packages were found. Prefer letting a bad build finish and rolling
   back after (`npx wrangler rollback --env production`, seconds) over
   killing it.

   **`npm ci` alone is not always enough, and neither is that audit.** Later
   the same day a worktree had every one of the 713 packages present with its
   `package.json` intact — so both the audit above and `npm ci` itself
   reported nothing to do — while files *inside* packages were missing:
   `next/server.d.ts`, `next/headers.d.ts`, `next/types.d.ts`, deleted by an
   interrupted purge. `npm ci` decides from package presence, so it no-opped,
   and `npm rebuild` restored the `.bin` shims without restoring any file.
   The only thing that caught it was running the compiler:
   `error TS7016: Could not find a declaration file for module 'next/server'`.
   So when a build fails on missing types or a missing module that the
   lockfile clearly contains, do not trust a package-level audit — purge
   `node_modules` outright and reinstall. On Windows `rm -rf` and
   `rmdir /s /q` both stall or fail on the deep `node_modules` tree (the
   Cloudflare SDK's resource folders exceed the 260-character path limit);
   what works is mirroring an empty directory over it and then removing it:

   ```bash
   robocopy %TEMP%\empty node_modules /MIR /NFL /NDL /NJH /NJS /R:1 /W:1
   rmdir /s /q node_modules
   npm ci --no-audit --no-fund
   ```

   **Capture real exit codes when running the gates.** `npm run build | tail`
   makes `$?` the exit status of `tail`, not of npm, so a failed build reports
   success — redirect to a file and read `$?`, or use `${PIPESTATUS[0]}`. A
   test plan ticked from piped output is ticking something that never passed.

   **`ERROR Failed to copy … color-string` and `… data-uri-to-buffer` are
   cosmetic.** They appear during `Building server function` on every run,
   with or without a clean `.open-next`, a dev server, or a fresh
   `node_modules`, and the packages land in the bundle anyway — verified in
   `.open-next/server-functions/default/node_modules/` after a successful
   deploy. Do not go looking for a missing dependency; three separate
   diagnoses of these lines were all wrong. Note also that a green
   `next build` proves only *build-time* resolution: Turbopack resolves the
   server-component import graph, which is why the reconciler failure above
   was fatal, but OpenNext's copy step is a **later, separate stage**, so
   build success alone does not prove the bundle is complete. And a
   `deploy:prod` failure is not necessarily a code problem — CI passed on
   `f32f2c1` three times while this machine could not build it, because CI
   runs `npm ci` on a clean runner and this checkout's tree was damaged.

   The hostnames are Workers custom domains (`routes` in `wrangler.jsonc`)
   on the zone registered in the same Cloudflare account, so Cloudflare
   manages DNS and certificates; the `*.workers.dev` URLs are disabled.
   Every origin an environment answers on must be in *its* Supabase
   project's Redirect URLs (step 6) as `https://<host>/auth/callback`,
   since sign-in and password reset redirect through the requesting origin.

5. **Database migrations.** Dev/Test first, production once the branch is
   merged (CLAUDE.md has the rules):

   ```bash
   node scripts/apply-migrations.mjs --env production --dry-run
   ```

   ```bash
   node scripts/apply-migrations.mjs --env production
   ```

   On a fresh project that applies every file from `0001` up (2026-09-21:
   all 63 ran clean on the new production project); otherwise only what is
   pending. Then confirm the public views are readable and **not writable**
   by the anonymous role — Supabase's default privileges grant `anon`
   INSERT/UPDATE/DELETE on every new object, which
   `0025_public_views_exclude_adopted.sql` revokes:

   ```bash
   node scripts/check-public-views.mjs --env production
   ```

   Afterwards, load `/`, `/adopt` and `/our-work` signed out and confirm
   residents and stories actually appear, then set the hero photo, contact
   details (email, phone, LINE, map link, visiting hours) and the wording
   of the story, how-to-adopt, Foster, Volunteer and Donate pages at
   `/admin/website` — the pages ship with placeholder copy (bank details on
   Donate are literally "(bank name)") that must be replaced before the
   site is announced. The same page picks the optional "Pet of the week"
   from the publicly listed residents; project stories are published from
   `/projects/[id]` ("Show on website"). Open Graph previews take the page's
   own host for the image URL, so nothing needs configuring — set
   `NEXT_PUBLIC_SITE_URL` only if the site ever sits behind a proxy that
   rewrites the host.

6. **Auth on a new Supabase project.** Logins are admin-provisioned, so a
   fresh database has nobody who can sign in; seed the first admin, then
   sign in with Google using that address (it links automatically) and
   create everyone else at `/admin/security`:

   ```bash
   node scripts/bootstrap-admin.mjs --env production someone@gmail.com
   ```

   In the project's Authentication settings (all done for production on
   2026-09-21 via the Management API): URL Configuration → Site URL is the
   production origin and Redirect URLs has `https://<host>/auth/callback`
   for every hostname; Providers → Google uses the same OAuth web client as
   dev, which means the client in Google Cloud Console must list the new
   project's `https://<ref>.supabase.co/auth/v1/callback` as an authorised
   redirect URI. SMTP Settings → Resend, field by field in
   [`docs/email-sending.md`](docs/email-sending.md) §2 — Supabase's built-in
   mailer is for development only and is rate-limited to a handful of
   messages an hour, so **Forgot password?** only works in production once
   this is done. The reset email template can carry the shelter's name and
   logo.

7. **Every deploy is a release.** Release notes live in
   `src/lib/releases.ts` and show at `/releases` for every signed-in role.
   A PR that changes something users notice adds a line to `unreleased`
   (the test plan asks, and `check-test-plan.mjs` flags a UI change that has
   no line and no stated reason);
   before deploying, a small release PR moves those lines into a new
   numbered entry and sets `package.json`'s version to match (the rules are
   at the top of that file). `deploy.mjs` refuses a UAT or production deploy that
   has unreleased notes or a version mismatch, tags the Worker version with
   the release (dashboard → Workers → Deployments), and after deploying
   emails a **major** release that is new to the site to that environment's
   admins, with `[UAT]` / `[Production]` in the subject; `--no-mail` skips
   the email. Test never sends. The one-off Cloudflare setup the email needs
   — verifying each admin's address under Email Routing, free —
   is [`docs/email-sending.md`](docs/email-sending.md) §1.

## Backups

Free-tier Supabase projects have no automatic backups or point-in-time
recovery, so production's safety net is `scripts/backup.mjs`: a `pg_dump`
(custom format) of the `public` and `auth` schemas — every record plus the
accounts that can sign in — uploaded to a `Backups/` folder under the Drive
root as `lannacare-<env>-<timestamp>.dump`, keeping the newest twelve per
environment (older ones go to the Drive trash, which empties itself after
30 days).

```bash
node scripts/backup.mjs --env production
```

`--keep N` changes the retention; `--local <dir>` writes the dump there
instead of uploading (for a restore rehearsal). It prints the environment
and project ref first, like every other script, and exits non-zero if any
step fails.

One-time setup on the machine that runs it:

1. **PostgreSQL 17 command-line tools** — the projects run Postgres 17 and
   `pg_dump` must not be older than the server. No local server is needed.
   The dev machine has the "binaries" zip from
   <https://www.enterprisedb.com/download-postgresql-binaries> (the
   `winget` installer kept failing with a 403 from EDB's CDN) unpacked so
   that `pg_dump.exe` sits at
   `%LOCALAPPDATA%\Programs\PostgreSQL\17\bin\pg_dump.exe` — only the
   zip's `bin` and `lib` folders are needed. The script looks there and
   under `C:\Program Files\PostgreSQL\` (where the installer would put it)
   itself; nothing needs adding to `PATH` (set `PG_DUMP` to point it
   elsewhere).
2. **The database password** — `SUPABASE_DB_PASSWORD` in
   `.env.deploy.production` (and in `.env.local` for the dev project). It
   is the password chosen when the Supabase project was created; Project
   Settings → Database resets it if it was never written down. The dump
   goes over Supabase's session pooler on port 5432 (the direct
   `db.<ref>.supabase.co` host is IPv6-only), whose host and user the
   script reads from the Management API with `SUPABASE_ACCESS_TOKEN`.
3. **The weekly schedule** — `scripts/backup-schedule.ps1` registers a
   Task Scheduler job, "Lanna Care production backup", for Sundays at
   03:00 (run as soon as the machine is next awake if it missed the time),
   appending to `backup.log` in the repo:

   ```bash
   powershell -ExecutionPolicy Bypass -File scripts\backup-schedule.ps1
   ```

   `Get-ScheduledTaskInfo -TaskName "Lanna Care production backup"` shows
   the last run and its result (0 is success); `-Remove` unregisters it.
   The task runs only while Lutan is logged on, so a laptop that stays
   shut for a fortnight simply has no backup that fortnight.

**Restoring** into a Supabase project (a scratch one, or production after a
disaster) — untested until the backlog's restore rehearsal is done:

```bash
pg_restore --dbname="postgresql://postgres.<ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" --schema=public --clean --if-exists --no-owner --no-privileges lannacare-production-<timestamp>.dump
```

then the same with `--schema=auth --data-only` for the accounts (the `auth`
tables already exist in every project, so only their rows are restored),
then `node scripts/apply-migrations.mjs --status --env …` to confirm the
`schema_migrations` table came across.

## Project structure

- `supabase/migrations/` — database schema, RLS policies, and the core
  business-logic functions (immunization recording, bulk appointments,
  deceased-workflow cascade) described in the requirements doc.
- `src/lib/supabase/` — Supabase client helpers (browser + server).
- `src/lib/google/` — Google Drive client helper, including the per-record
  folder helpers (resident photos / blood tests / procedures, and the
  maintenance job folder that follows a job between status folders, and
  the project folder path that mirrors the project tree).
- `src/lib/vets/` — the vet hub's statistics: period filtering, monthly
  buckets and per-resident roll-ups over a vet's appointment rows, shared
  by the `/vets` list and `/vets/[id]`.
- `src/lib/contacts/` — the contacts vocabulary (`contact_type`), the
  one-tap link builders (`tel:`, LINE, Messenger, WhatsApp, `mailto:`, maps) used by the
  `/contacts` list and hub, and the Carer-only loader behind the resident
  hub's foster / adopt picker.
- `src/lib/maintenance/` — the enclosure maintenance feature's shared
  pieces: status vocabulary and colours, the job loader, and the
  after-change Drive folder sync used by the server actions.
- `src/lib/projects/` — the project folder browser's shared pieces: the
  category list, folder/photo loaders, and the Drive sync that keeps
  `Projects/<Category>/<folder>/…` matching the tree after renames and
  moves; `public.ts` is the read-only slice behind the public `/our-work`
  pages (the `public_projects` views and the locale/English-fallback
  helpers).
- `src/lib/site/` — the public site's editable content: the
  `site_content` singleton (contact details, paired Thai labels), the
  `site_pages` rows behind the story and the Foster / Volunteer / Donate /
  how-to-adopt pages, and the three-rule body format they are written in.
  `/privacy` is the exception: its text is in the dictionaries, because
  Google's sign-in consent screen links to it and it must never be blank.
- `src/lib/tags/` — the addresses programmed into enclosure QR codes and
  resident RFID cards (`/e/<id>`, `/r/<R-code>`, short redirects — see
  `docs/decisions.md`, 2026-09-22) and the origin they are prefixed with;
  `src/components/CopyTagLink.tsx` is the copy control on the hubs and
  lists, and `src/app/e/` / `src/app/r/` the redirects.
- `src/lib/residents/` — the public slice of a resident
  (`public_resident_profiles`, similar residents) and the adoption
  recommendation fields the intake and edit forms share.
- `src/lib/translations/` — free text across languages (0056): the row
  types, the loader for a record's `translations` rows, the manager
  queue query, and `localizedField()` / `localizedFromRow()` that pick
  the approved other-language text by locale with the original as the
  fallback. `src/components/TranslationPanel.tsx` is the one editor,
  used by `/management/translations` and under the fields themselves;
  the server actions are in `src/app/management/translations/actions.ts`.
  Which fields are translatable is the `translatable_fields` table, not
  code (today: resident bio / temperament / past story, project story,
  photo caption, maintenance job title / description).
- `src/lib/archive/` — the deceased resident archive: the summary PDF, the
  offline `index.html` index page written beside it in the resident's Drive
  folder, the step that moves that folder to `Residents/Deceased/`, and
  its reverse for a death withdrawn as recorded in error.
- `src/lib/manual/` — the in-app user manual's content (`en.ts`, English
  only so far), rendered by `src/app/manual/page.tsx` at `/manual` for
  every signed-in role. Its screenshots live in `public/manual/` and are
  regenerated, not edited: `node scripts/manual-screenshots.mjs` opens the
  machine's Edge/Chrome on the running dev server, waits for you to sign
  in as an admin, and captures every screen the manual references.
- `src/lib/assistant/` — the assistant's brain: one small parser per
  intent under `intents/`, tried in the order `parse.ts` lists (the order
  is load-bearing — see `docs/decisions.md`, 2026-09-23). Each one turns a
  typed sentence into a `Draft` with nulls for whatever the sentence
  didn't say, matching resident, enclosure and vet names against real rows
  and a small date/time vocabulary in English and Thai. `data.ts` loads
  those rows and the caller's role; `audit.ts` writes the
  `assistant_actions` row (0070) every turn leaves behind, confirmed,
  cancelled or unrecognised. Version 2 (an LLM — see the "Assistant"
  section of `docs/backlog.md`) replaces this directory and keeps the rest.
- `src/components/assistant/` — the conversation: the message list and
  input, one preview card per writing intent, and the answers to the
  read-only questions. Rendered both by `/assistant` and by the header's
  slide-over. Nothing is written until a card is confirmed, and Confirm
  calls `src/app/assistant/actions.ts`, which runs the same server helper
  the matching page or form runs — the assistant has no write path of its
  own. Admin, management and staff can confirm writes; volunteers get the
  lookups ("where is …", "who is in …", "what is due this week").
- `worker/index.mjs` — the Worker entry: edge cache → Pi through its tunnel
  → OpenNext render (`docs/pi-hosting.md`).
- `scripts/pi/` — the Pi origin: one-time `setup.sh`, `deploy-pi.sh`, the
  systemd unit and cloudflared config.
- `scripts/` — one-off tooling: `apply-migrations.mjs` (migration runner),
  `check-public-views.mjs` (go-live check), `manual-screenshots.mjs`
  (user-manual screenshots), `appsheet-export.mjs` + `import-appsheet.mjs`
  (the legacy data migration — see `docs/data-migration.md`), the Google
  OAuth setup helpers, the deploy-time env stripper, and
  `extract-yoga-wasm.mjs` (refreshes `src/lib/archive/yoga/yoga.wasm` after
  a yoga-layout upgrade — see `docs/decisions.md`, 2026-09-22).
- `docs/` — requirements, decisions log, backlog and the data-migration
  mapping/runbook.
- `CLAUDE.md` — the working rules for this repo (branching, migrations,
  finishing a feature). Written for Claude Code sessions, but they're the
  rules for anyone committing here.

## Day-to-day workflow

The short version of `CLAUDE.md`. Once a day, in the main checkout,
`main` is pulled and the `backlog` branch folded in; `/plan-day` does
this, reads the backlog and proposes two or three workstreams that touch
different parts of the app. Each becomes a worktree
(`scripts/worktree.mjs new`) with its own branch, port and Claude session,
and every commit auto-pushes (`.githooks/post-commit`). A feature is
finished by merging `main` in, passing `typecheck`/`lint`/`build` (CI runs
the same three on the PR), merging the PR, and `scripts/worktree.mjs
done` — merges are serial, and the other streams `sync` after each one.
Schema changes go first as their own small PR, applied to dev with
`node scripts/apply-migrations.mjs` at merge time, so only one branch ever
carries a migration.
