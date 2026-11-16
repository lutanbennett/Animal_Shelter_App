# Part 4 of the multi-tenancy programme (#v0302): the Worker sends the shelter as a header

## What was built

- `worker/shelter.mjs`: for every request, the Worker looks the host up with `resolve_shelter_host(p_host)` (0382) and sets
  **`x-shelter-id`** on the request it passes on (to the edge cache step, the Pi and the local render alike, since all three start
  from the same request). Any `x-shelter-id` the visitor sent is deleted first; a visitor never picks their shelter.
- `src/lib/supabase/shelter-header.ts` names the header and checks it is a uuid. `server.ts` and `proxy.ts` (the session-refresh
  client in `src/proxy.ts`) read it off the request and put it on every Supabase call. `admin.ts` takes an optional `shelterId`.
- The photo route (`src/app/api/photos/[fileId]/route.ts`) uses `server.ts`, so its `can_see_drive_file` / `is_known_drive_file`
  calls now carry the shelter with no change to the route itself.

## How the Worker reaches the lookup, and why

A service-role REST call at request time, remembered **per isolate for 60 seconds** (misses and "no shelter" too). Not a cached copy
of the table: `shelters` / `shelter_hosts` are readable by service role only, a one-row lookup is cheap, and a host added to the
table is live within a minute everywhere with nothing to purge. The Worker already holds `SUPABASE_URL` and the service key
(`worker/heartbeat.mjs` uses both), so no new secret or binding. **A lookup that fails is not remembered and sends no header.**

## The hazard, both directions (why this part must be DEPLOYED, not merely merged, before #ujqr5)

"No header means no rows" cuts both ways. Once Part 5's restrictive policies exist, a request that carries no shelter reads no rows.
- If Part 5 lands while the Worker still sends nothing, **anon reads nothing and the public website serves blank pages, not an
  error**, which looks like success to every check there is.
- And the reverse: this part alone, deployed, changes nothing visible (no policy reads the header yet), so it cannot be seen to work
  from the site. That is why the header is proved directly below, and why Part 5 is gated on the production Worker deploy, which is Lutan's.
- A failed lookup deliberately degrades to the same empty-site state rather than to some other shelter's data; once Part 5 is live,
  an outage of the lookup is an outage of the public site, so the 60 s memory matters.

## Not done here (named, for the planner)

- **The browser client (`client.ts`) sends nothing.** A browser talks to Supabase directly, so the Worker cannot add a header to it.
  It needs the shelter delivered to the page (a meta tag the layout renders from the request header, or the host mapped client-side)
  and that changes the root layout's rendering. Part 5 needs a decision on whether authenticated browser reads derive the shelter from
  the login instead. Not guessed at here.
- Cron-driven calls (`scheduled` in `worker/index.mjs`) call the app with the service key and no shelter; they are service-role.
- `createAdminClient` callers are unchanged (none passes `shelterId` yet); service role bypasses RLS, so the header only matters
  to functions that read it.

## What was proved

On dev, with a throwaway function `zz_probe_shelter_header()` created and then dropped (no migration):
`select current_setting('request.headers', true)::json ->> 'x-shelter-id'`, called over PostgREST as anon.
With the header: returned the uuid sent. Without: `null`. Through a supabase-js client built with
`global.headers`: returned the uuid. That is the direct read, independent of `current_shelter_id()`.
`worker/shelter.test.mjs`: inbound header replaced, unknown host or failed lookup sends none and failures are not remembered, hits are remembered.
`next dev` on 3002: `/adopt` 200 with no header, a valid header and a junk header (junk is dropped by `shelterHeaders`).
Not proved: the Worker itself against a real host (needs deploy; dev has no host mapped, `resolve_shelter_host('localhost')` is null).

## Deploy (Lutan's)

`npm run deploy:test` first, then the production Worker deploy. Expect public pages unchanged. Unproved until then: the
real lookup from inside a Worker, and the header arriving behind the Pi.
