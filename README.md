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
- Hosting: **Cloudflare Workers** (free tier) via `@opennextjs/cloudflare`

Everything is chosen to run on free tiers — see `docs/decisions.md` for the
reasoning and the trade-offs that come with that.

## Roles

Five `app_role` values, enforced by row-level security
(`supabase/migrations/0001_initial_schema.sql`, mirrored for management in
`0039`, vets in `0040`, medications in `0043`/`0044`) and assigned at `/admin/security`:

| Role | Access |
|---|---|
| **admin** | Everything, including the Admin section (security, website, zones, enclosures, immunization and procedure types) and the Management section. |
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

## Environments

| | Dev | Test | Production |
|---|---|---|---|
| Where | `next dev` on your machine | `test.lannacare.org` | `lannacare.org`, `www.lannacare.org` |
| Worker | — | `lanna-animal-care-test` | `lanna-animal-care` |
| Database | dev Supabase project (`qxkmhwybjggxvsfxsxbd`) | **the same dev project** | production project (`dbkodyyxxhtygxcxmfcu`) |
| Google Drive | dev account | dev account | dev account, until the shelter's own account exists |
| Values from | `.env.local` | `.env.local` | `.env.deploy.production` over `.env.local` |

Two databases, both on Supabase's free tier (the org allows two). Test
deliberately shares the dev database: one developer, throwaway data, and
what Test is for is exercising a real Workers build of `main` on phones
before it goes to production. Production holds the shelter's real records.
Both are free-tier projects, which means **no automatic backups** — see
"Backups" below. Free projects also pause after seven days with no
requests at all, which the public pages make impossible while the site is
up.

`scripts/lib/env.mjs` is the one place that knows which values belong to
which environment; `scripts/deploy.mjs`, `scripts/apply-migrations.mjs`,
`scripts/check-public-views.mjs` and `scripts/bootstrap-admin.mjs` all take
`--env test|production` (default `test`) and print the environment and
Supabase project ref before doing anything.

`.env.deploy.production` (gitignored) holds the production
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`; anything it doesn't set — currently the whole
Google Drive set — falls through to `.env.local`. Next.js and OpenNext never
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

4. **Deploy to Production**

   ```bash
   npm run deploy:prod
   ```

   Same steps with `.env.deploy.production`, and a guard: it refuses unless
   the checkout is `main`, clean, and identical to `origin/main`, so what is
   live is always a commit GitHub has. Merge first, then deploy.

   **Why the strip step matters.** The OpenNext adapter copies *everything*
   in `.env.local` into the Worker bundle as a fallback for any variable not
   set on Cloudflare — convenient for `npm run preview`, but it would ship
   dev credentials (and unrelated things like `SUPABASE_ACCESS_TOKEN`) to
   production. With the snapshot emptied, a secret you forgot to set fails
   loudly at runtime instead of silently using the dev value. To preview
   the stripped build locally the way production runs, put the five values
   in a gitignored `.dev.vars` file (wrangler's local stand-in for secrets).

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
   redirect URI. SMTP Settings → configure a real provider (Resend,
   Postmark, SES…) — Supabase's built-in mailer is for development only and
   is rate-limited to a handful of messages an hour, so **Forgot password?**
   only works in production once this is done. The reset email template
   can carry the shelter's name and logo.

## Backups

Free-tier Supabase projects have no automatic backups or point-in-time
recovery. Production's safety net is a scheduled `pg_dump` of the database
into the shelter's Google Drive — not yet set up; see `docs/backlog.md`
("Deployment"). Until it is, anything destructive on production is
unrecoverable.

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
- `scripts/` — one-off tooling: `apply-migrations.mjs` (migration runner),
  `check-public-views.mjs` (go-live check), `manual-screenshots.mjs`
  (user-manual screenshots), the Google OAuth setup helpers, and the
  deploy-time env stripper.
- `docs/` — requirements, decisions log and backlog.
- `CLAUDE.md` — the working rules for this repo (branching, migrations,
  finishing a feature). Written for Claude Code sessions, but they're the
  rules for anyone committing here.

## Day-to-day workflow

The short version of `CLAUDE.md`: start on an up-to-date `main`, one
branch per feature, every commit auto-pushes (`.githooks/post-commit`), and
a feature is finished when its PR is merged and the branch deleted. New
migrations are applied with `node scripts/apply-migrations.mjs` from the
branch that's about to be merged, never from one that isn't.
