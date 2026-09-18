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
- Hosting: **Cloudflare Pages** (free tier)

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

## Project structure

- `supabase/migrations/` — database schema, RLS policies, and the core
  business-logic functions (immunization recording, bulk appointments,
  deceased-workflow cascade) described in the requirements doc.
- `src/lib/supabase/` — Supabase client helpers (browser + server).
- `src/lib/google/` — Google Drive client helper.
- `docs/` — requirements and decisions log.
