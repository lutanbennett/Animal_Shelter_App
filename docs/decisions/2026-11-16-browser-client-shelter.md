# #bcl1t: how a browser-side read knows its shelter: it does not read

## Finding (step zero)
`src/lib/supabase/client.ts` sends no `x-shelter-id` (confirmed; the Part 4 file's gap is still open). But the browser client is
imported in exactly two places, `login/SignOutButton.tsx` (`auth.signOut`) and `ThemePicker.tsx` (`auth.updateUser`). **Both are auth
calls, which go to the auth service and read no RLS table. The app makes no browser-side data read today**, so Part 5's policies have
nothing to blank.

## Shapes weighed
- **Meta tag from the root layout:** works, but changes the root layout's rendering for every page to serve zero readers, and the
  value would be the *host's* shelter, which for a signed-in user is the wrong authority anyway.
- **Host mapped client-side:** duplicates the Worker's lookup in the browser and exposes `shelter_hosts` (service-role only today). Rejected.
- **Derive from the login:** right in principle for signed-in reads, but needs a policy design (Part 5's) and a profile column; nothing to
  serve yet. Left to Part 5 if a client read ever appears.
- **Chosen (the fourth shape): no browser-side data reads.** Reads go through `server.ts`, which already carries the header (Part 4).
  Anonymous visitors get the host's shelter via the Worker header; a signed-in user's server reads get it the same way. The two cases
  stay distinct because neither depends on the browser.

## Enforced, not just written
`src/lib/supabase/browser-client-no-data.test.mjs` (runs in `npm test`/CI) fails if any file importing `supabase/client` calls
`.from/.rpc/.storage/.channel/.realtime`. Proved by planting `createClient().from("residents")` in `src/app`: the test failed naming
the file and line; removed, it passes. `client.ts`, `server.ts`, `admin.ts`, `proxy.ts` unchanged. No migration, no policy.

## What this does NOT prove
No restrictive policy exists, so no read has been shown to return its shelter's rows (a read would pass today whatever was done).
The test guarantees there is no browser read to blank, not that one would work. **Owed at Part 5:** if a client read is ever needed,
it must first pass a signed-in read against the real policies (throwaway-policy `begin; … rollback;` harness or
`check-tenancy-canary.mjs`), and this test must be consciously relaxed with the shape chosen then (login-derived is the lead candidate).
Auth-service behaviour under Part 5 (sign-in, `updateUser`) is not an RLS read and is unaffected; not exercised here.
