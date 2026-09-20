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
`0039`, vets in `0040`) and assigned at `/admin/security`:

| Role | Access |
|---|---|
| **admin** | Everything, including the Admin section (security, website, zones, enclosures, immunization types) and the Management section. |
| **management** | Staff's operational access plus the Management section: the reporting dashboard (`/management/dashboard`), contact management and vet management. |
| **staff** | Read/write on residents, placements, weights, photos, maintenance, projects and contacts; read on medical records. |
| **vet** | Read/write on vet visits, procedures, blood tests, prescriptions and immunizations; read on residents. |
| **volunteer** | Read everything; write photos and enclosure moves only. |

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

5. **Enable the git hooks** (once per clone)

   ```bash
   git config core.hooksPath .githooks
   ```

   `.githooks/post-commit` pushes the current branch to GitHub after every
   commit, so the remote always matches the local checkout.

## Deploying to Cloudflare

The app deploys to Cloudflare Workers through the `@opennextjs/cloudflare`
adapter (`wrangler.jsonc`, `open-next.config.ts`). Google Drive access is a
plain-`fetch` client (`src/lib/google/drive.ts`) specifically so it runs on
the Workers runtime — the `googleapis` SDK does not (see `docs/decisions.md`).

1. **Log in to Cloudflare** (once per machine)

   ```bash
   npx wrangler login
   ```

2. **Preview locally on the Workers runtime** (recommended before a first
   deploy — this is what `next dev` can't simulate). It reads `.env.local`
   directly, no extra setup:

   ```bash
   npm run preview
   ```

3. **Apply the database migrations to the production Supabase project.**
   With `.env.local` pointing at the production `NEXT_PUBLIC_SUPABASE_*`
   values (which step 4 needs anyway) and a `SUPABASE_ACCESS_TOKEN` that
   can see that project:

   ```bash
   node scripts/apply-migrations.mjs
   ```

   On a fresh project that applies every file from `0001` up; on a
   project that's been migrated before, only what's pending — the script
   checks the target's `schema_migrations` table and prints the project
   ref before it runs anything. Then:

   ```bash
   node scripts/check-public-views.mjs
   ```

   This confirms the two views behind the public `/adopt` pages are
   readable by the anonymous role and **not writable** by it. Supabase's
   default privileges grant `anon` INSERT/UPDATE/DELETE on every new
   object, and `public_resident_profiles` is auto-updatable, so until
   `0025_public_views_exclude_adopted.sql` revoked them an anonymous
   `PATCH` was accepted (see `docs/decisions.md`). A fresh project's
   defaults may differ from dev's — don't skip the check. Afterwards, load
   `/` and `/adopt` signed out and confirm animals actually appear, and
   set the hero photo and story copy at `/admin/website` (`site_content`
   starts empty).

4. **Set production secrets** — every variable in `.env.example` except the
   `NEXT_PUBLIC_*` ones:

   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

   Repeat for `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
   `GOOGLE_OAUTH_REFRESH_TOKEN` and `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

   **All five are mandatory.** The OpenNext adapter copies *everything* in
   `.env.local` into the Worker bundle at build time as a fallback for any
   variable not set on Cloudflare — that's what makes `npm run preview`
   zero-config, but it would also ship dev credentials (and unrelated
   things like `SUPABASE_ACCESS_TOKEN`) to production. `npm run deploy`
   therefore runs `scripts/strip-baked-env.mjs` between build and deploy
   to empty that snapshot, so a secret you forgot to set fails loudly at
   runtime instead of silently using the dev value. To preview the
   stripped build locally the way production will run, put the same five
   values in a gitignored `.dev.vars` file (wrangler's local stand-in for
   Cloudflare secrets).

   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are inlined
   by `next build` (not via that snapshot) and must be the production
   values in `.env.local` or the shell when you run the deploy build
   (the same values step 3's check script reads).

5. **Deploy**

   ```bash
   npm run deploy
   ```

   Check the `strip-baked-env` line in the output lists the variables it
   removed before wrangler uploads.

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
  buckets and per-animal roll-ups over a vet's appointment rows, shared
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
  moves.
- `src/lib/archive/` — the deceased resident archive: the summary PDF, the
  offline `index.html` index page written beside it in the resident's Drive
  folder, and the step that moves that folder to `Residents/Deceased/`.
- `scripts/` — one-off tooling: `apply-migrations.mjs` (migration runner),
  `check-public-views.mjs` (go-live check), the Google OAuth setup helpers,
  and the deploy-time env stripper.
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
