# `next dev` and the anon scripts send the shelter header (#ujqr5, the "localhost has no Worker" blocker)

## Why

Part 5's restrictive policies read the shelter from the `x-shelter-id` request header, which only the production Worker sets
(`worker/shelter.mjs`). Applied to dev as it stood, every signed-in `next dev` session and CI's anon `public-views` run would
have read no rows. This change lets both send the header. **It applies no policy to dev.**

## What was built

- **`next dev`:** `src/lib/supabase/shelter-header.ts` gains `devShelterId()` and `requestShelterHeaders()`. `server.ts` and the session
  client in `proxy.ts` now use the latter: a header that arrived from the Worker always wins; otherwise, on `next dev` only, the value
  of **`DEV_SHELTER_ID`** is sent. `worktree.mjs` copies the key into new worktrees (`ENV_KEEP`); it is a uuid in `.env.local`
  (dev's Lanna shelter), not a secret.
- **Scripts and CI:** `scripts/lib/shelter-env.mjs` gives `scriptShelterHeaders(env, envName)`; `check-public-views.mjs` spreads it
  into every anon call, and `dev-signin.mjs` into its sign-in client. The test env reads `DEV_SHELTER_ID`; uat/production read
  `SHELTER_ID` from their own file, so the dev value never rides into another environment.
- **The other anon-key scripts (about 25 `check-*`)** drive the browser against `next dev`, so they go through the dev server and
  need nothing. Only `check-public-views` calls Supabase as anon directly, and it is the only such job in CI.

## The guard, and why it cannot switch on in production

No fallback to any shelter anywhere: unset or junk sends nothing, and the database then returns no rows, as in production.
`devShelterId()` returns a value only when **`NODE_ENV === "development"`** (Next sets that for `next dev` alone, and inlines
"production" into any build, Worker and Pi alike) **and** `DEV_SHELTER_ID` is a uuid. Proved by `shelter-header.test.mjs`:
production with the variable set sends nothing; `test`/unset NODE_ENV sends nothing; an arriving header wins in both modes.
The variable is not `NEXT_PUBLIC_`, so it is never in browser code. Service-role clients (`admin.ts`) are unchanged: trusted callers
need no shelter.

## Proof

1. `node scripts/prove-dev-shelter-header.mjs` (rolled back, nothing applied): a restrictive policy on `residents`
   (`is_trusted_caller() or shelter_id = current_shelter_id()`) over a permissive `using (true)` returned **17 of 17 rows with the dev
   shelter header, 0 without, 0 with another shelter's**.
2. `next dev --port 3790` pointed at a logging proxy in front of the dev project, `DEV_SHELTER_ID` set: `/adopt` signed out and
   `/residents` signed in (via `dev-signin.mjs admin`) sent the dev uuid on **every** anon-key Supabase call (`/rest/v1/*`,
   `rpc/my_permissions`, `/auth/v1/user`). The only calls without it were two service-role ones (`auth/admin/users`, `user_roles`), which bypass RLS.

## What Lutan must do, and only this

**Done 2026-11-17: the repository variable `TEST_SHELTER_ID` was set, and `check-public-views.mjs` then passed with the header in place.** What follows is the original request, kept as written.

**Add a GitHub repository variable `TEST_SHELTER_ID`** (Settings → Secrets and variables → Actions → Variables) with the dev shelter's
uuid, `ab3ecaac-1cf3-4570-ae79-d32f5ed2d13a`. Until it exists CI sends no header and `public-views` still passes (no policy is on), so
nothing is red now; **it must exist before any Part 5 policy is applied to dev**, or `public-views` goes red. A repository *variable*,
not a secret: it is an identifier, and a secret is masked in logs for no benefit.

## Still not done (stays on #ujqr5)

The policies, `NOT NULL`, the browser client (`client.ts`, still sends nothing, by the 2026-11-16 browser-client decision), and the
real Worker lookup behind a deployed host.
