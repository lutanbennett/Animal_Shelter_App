# 2026-10-01 — The deploy pins `NEXT_PUBLIC_SITE_URL`; a stray env file is refused; `write-env.mjs` is Pi-only

Backlog item: "A `.env.*.local` for the wrong environment silently bakes that
environment's host into the build." Found when Google sign-in on
`test.lannacare.org` returned to `http://localhost:3000`: a production-flavoured
`.env.production.local` (left by `write-env.mjs`) was read by `next build`, which
is always a production build, and inlined `https://lannacare.org` into the test
bundle.

Three changes, all in `scripts/`:

- **`deploy.mjs` sets `NEXT_PUBLIC_SITE_URL` in the build's shell** from
  `SITE_ORIGINS[env]`, as it already did for the Supabase URL and key. The shell
  beats every env file, so there is nothing left to leak and no file precedence
  to reason about. **This moves where the Worker-versus-Pi distinction lives:**
  until now the Worker had the variable unset and read the request host, and the
  Pi had it from a generated file. Now the Worker build carries its environment's
  origin too; the Pi is unchanged (its own build still reads its generated file).
  Consequence worth knowing: on the Worker `getSiteOrigin()` no longer follows the
  request host, so a visitor on `www.lannacare.org` is sent to the apex for OAuth
  redirects and absolute links. That is the canonical host and the Pi has always
  behaved this way, but it is a change from "whatever host you came on".
- **`deploy.mjs` refuses (exit 2) when a build-loaded env file names another
  environment**, printing the filename and why (`scripts/lib/env-leak.mjs`). It
  checks `.env.production.local`, `.env.production` and `.env`, which are what a
  production build reads; `.env.development.local` and friends cannot reach the
  bundle, so refusing on them would be a false alarm. A file offends if its
  `write-env` header names another environment, its `NEXT_PUBLIC_SITE_URL`
  origin is not the target's, or its Supabase URL is another environment's
  project. **Guarded for `test` as well as `uat`/`production`**, unlike the
  migrations check: nobody ever wants a wrong-environment file on test, and test
  is where it was found. With the pin this is the belt, not the fix: it still
  matters because the file would otherwise be a surprise to whoever reads the
  build.
- **`write-env.mjs` refuses to run unless the platform is Linux**, with no flag
  past it. It writes `.env.production.local`, which every dev-machine deploy
  reads. The Pi is Linux and the dev machine is Windows.

Measured, not reasoned: with a fake production `.env.production.local` present
and the host pinned in the shell, a real `next build` contained
`https://test.lannacare.org` in 18 output files and `https://lannacare.org` in
none (outside source maps, which only quote a comment).
