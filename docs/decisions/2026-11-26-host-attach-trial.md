# Host attach trial (#hstau): a deploy REMOVES an API-attached custom domain

Measured 2026-11-26 on the **test** Worker (`lanna-animal-care-test`). Measurement only; no feature built.

## The two answers, one line each

- **Minimum permission:** account-level **`Workers Scripts Write`** (Cloudflare's dashboard label: *Account → Workers Scripts → Edit*) covers list, attach and detach of `/accounts/{account_id}/workers/domains`. Cloudflare creates the DNS record and certificate itself, so no DNS or SSL permission is listed for the call.
- **Does a deploy remove API-attached domains? YES.** `node scripts/deploy.mjs --env test` (wrangler 4.153.0) deleted `host-trial.lannacare.org`, which had been attached by API and was answering HTTP 200. The domain list is reconciled to `wrangler.jsonc` on every deploy.

## The measurement (read back from the API each time, filtered to `*.lannacare.org`)

Before attach:
```
test.lannacare.org  -> lanna-animal-care-test  id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org   -> lanna-animal-care-uat   id 978c1969e4a5c530deba4310346643ff4ac67c37
```
After `PUT /accounts/{account}/workers/domains` `{hostname:"host-trial.lannacare.org", service:"lanna-animal-care-test", zone_id}` (success, no errors):
```
test.lannacare.org        -> lanna-animal-care-test  id 1b862959…
uat.lannacare.org         -> lanna-animal-care-uat   id 978c1969…
host-trial.lannacare.org  -> lanna-animal-care-test  id ffd21f5692c934afbf4dbf68e0667521dbf4b70b
```
`https://host-trial.lannacare.org/` answered **200** seconds later: DNS and certificate were created by Cloudflare with no other call.

Deploy output listed only `test.lannacare.org (custom domain)` as a trigger. After the deploy:
```
test.lannacare.org  -> lanna-animal-care-test  id 1b862959a68950ff2b2931c814425b69abdb4011   (same id: untouched)
uat.lannacare.org   -> lanna-animal-care-uat   id 978c1969e4a5c530deba4310346643ff4ac67c37
```
`host-trial.lannacare.org` gone; the address no longer resolves (curl `000`). Clean-up therefore needed no DELETE; a detach pass found nothing to remove and the list read back as above.

## Token used, and why it was enough

The test deploy token (`CLOUDFLARE_API_TOKEN` in `.env.deploy.test`) did the attach: it already creates `test.lannacare.org` at every test deploy, so it carries Workers Scripts Write. The UAT runtime token (`CLOUDFLARE_WORKERS_DOMAIN_TOKEN`) was not needed and not read. Its scope (Workers Routes Edit + DNS Edit on the zone, plus the Edit Cloudflare Workers template) is wider than the minimum; zone DNS Edit is not needed for this endpoint.

Permission lists are from Cloudflare's API reference, fetched 2026-11-26:
- Attach (PUT): `Workers Editor`, `Workers Admin`, `Workers Scripts Write` (any one).
- Detach (DELETE): `Workers Admin`, `Workers Scripts Write`.
- List (GET): any of those, or `Workers Scripts Read`/`Workers Metadata Read-Only`.
- Body: `hostname`, `service` required; `zone_id` or `zone_name` optional (we sent `zone_id`). Fails if the hostname already has a CNAME.

## Specification for the build stream (write to be quoted)

1. **Endpoint:** `PUT https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/workers/domains` with `{ hostname, service: <this environment's Worker name>, zone_id }`; detach with `DELETE …/workers/domains/{id}` after finding the id by `GET`. Same `fetch` + Bearer shape as `src/lib/status/usage.ts`.
2. **Token:** a runtime secret per environment, `CLOUDFLARE_WORKERS_DOMAIN_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, holding **Account → Workers Scripts → Edit** only, on the one account. Register both in `scripts/lib/runtime-config.mjs` as optional secrets (see the snag below).
3. **The deploy removes them, so the API attach ALONE IS AN OUTAGE AT THE NEXT RELEASE.** Every shelter host attached by the console disappears on the next `deploy.mjs` for that environment, all at once. Before the attach ships, the deploy must carry them. Two shapes, the second preferred:
   - (a) write the host back into `wrangler.jsonc` `routes` (needs a PR per host: defeats the point), or
   - (b) **have `deploy.mjs` read the environment's `shelter_hosts` rows (the hosts that should answer) and add each as `{ pattern, custom_domain: true }` to the routes it hands wrangler**, so the deploy re-asserts them instead of deleting them. The database stays the one source; nothing goes into the repository. The build stream must re-run this trial with (b) in place and see the host survive.
   - Not measured: whether `wrangler deploy` has a flag to leave unmanaged custom domains alone. Do not rely on one without measuring it the same way.
4. **What the build stream must not assume:** a `shelter_hosts` row with no attach is what exists today; the deploy cannot tell "mapped but not meant to answer" from "should answer" unless the build adds that distinction.

## The `--secrets` snag (for the planner to file)

`CLOUDFLARE_WORKERS_DOMAIN_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are not in the registry `scripts/lib/runtime-config.mjs`, and `deploy.mjs --secrets` pushes only registry names (`RUNTIME_SECRETS` + set `OPTIONAL_SECRETS`, line ~246) via `wrangler secret bulk`. Bulk only puts, never deletes, so **a `--secrets` deploy does not remove the UAT secrets Lutan set**. But nothing in the repo knows they exist: a rebuilt Worker would never get them and no check would notice.

## Met along the way

- The attach call was first refused by this session's auto-mode permission classifier (as destructive); it ran after Lutan approved it in chat.
- No `Unable to resolve Cloudflare's API hostname` error was met (#wgdns).
