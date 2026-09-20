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

   Run the SQL files in `supabase/migrations/` (in order) against your
   Supabase project, either via the Supabase SQL editor or the Supabase CLI.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

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

3. **Set production secrets** — every variable in `.env.example` except the
   `NEXT_PUBLIC_*` ones:

   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

   Repeat for `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
   `GOOGLE_OAUTH_REFRESH_TOKEN` and `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

   Note that the adapter also bakes whatever is in `.env.local` into the
   Worker bundle at build time as a *fallback* for any variable not set as
   a Cloudflare secret. That's what makes `npm run preview` zero-config,
   but it also means a deploy from a machine with dev credentials in
   `.env.local` will quietly use them in production for any secret you
   forgot to set — so set all five. `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` are inlined at build time and must be
   the production values in `.env.local` (or the shell) when you run the
   deploy build.

4. **Deploy**

   ```bash
   npm run deploy
   ```

## Project structure

- `supabase/migrations/` — database schema, RLS policies, and the core
  business-logic functions (immunization recording, bulk appointments,
  deceased-workflow cascade) described in the requirements doc.
- `src/lib/supabase/` — Supabase client helpers (browser + server).
- `src/lib/google/` — Google Drive client helper.
- `docs/` — requirements and decisions log.
