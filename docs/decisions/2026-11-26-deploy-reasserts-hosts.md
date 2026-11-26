# The deploy re-asserts flagged hosts, and the trial proved the host survives (#hstau step 2)

2026-11-26. Builds `2026-11-26-host-attach-deploy.md` §2's five steps. **The source reading held: measured live on test.**

## What was built

- `scripts/lib/attached-hosts.mjs`: `readFlaggedHosts()` (the read-only Management API query
  `select host from public.shelter_hosts where attach_to_worker`, never throws) and `domainsToReassert()` (drops hosts already
  in `routeHosts(wrangler.jsonc, env)`, dedupes, sorts). Tests: `scripts/attached-hosts.test.mjs`.
- `scripts/deploy.mjs`: reads the list after the release checks, appends `--domain <host>` per host to `deployArgs`, prints
  `deploy: attached hosts re-asserted as --domain: …` on every run **including `--plan`**, so production's list can be read
  before a deploy. **A failed read refuses the deploy (exit 2)**, with the reason in a comment beside it: deploying without
  the list deletes every console-attached domain, and a retry is the cheaper failure. Do not soften it to a warning.

## The trial (test Worker `lanna-animal-care-test`, dev database, wrangler 4.153.0), read from the API each time

Disposable host `disposable-hstau-trial.lannacare.org`.

1. Before attach (09:20:55Z):
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
```
2. After `PUT …/workers/domains` (09:21:08Z):
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
disposable-hstau-trial.lannacare.org       -> lanna-animal-care-test   id b7b588b76f102fbafb46eec3f9954bb04861454f
```
Then its `shelter_hosts` row was inserted with `attach_to_worker = true`; `--plan` printed `--domain disposable-hstau-trial.lannacare.org`.
`node scripts/deploy.mjs --env test` (built from `9f97259cb`) exited 0 and printed
`Deployed lanna-animal-care-test triggers` / `test.lannacare.org (custom domain)` / `disposable-hstau-trial.lannacare.org (custom domain)`.

3. After the deploy (09:30:40Z):
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
disposable-hstau-trial.lannacare.org       -> lanna-animal-care-test   id b7b588b76f102fbafb46eec3f9954bb04861454f
```
**Same id: the deploy kept the attached domain rather than recreating it**, and `https://disposable-hstau-trial.lannacare.org/api/version`
answered 200. #1899 measured the opposite without `--domain`.

4. Clean-up (09:30:57Z): DELETE by id, row deleted, `select … where attach_to_worker or host like 'disposable%'` returned `[]`:
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
```
The disposable address then answered 530; `test.lannacare.org` 200 with its original id.

## What the specification got wrong

- **`shelter_hosts.shelter_id` is NOT NULL on dev.** The brief said a host with `shelter_id is null` may be flagged and that
  production's front-door rows are such rows; the insert with a null shelter failed `23502`. Not established for production
  (not read: production is out of bounds here). The disposable row used the `lanna` shelter. Nothing in this build depends on it.
- Cloudflare's `DELETE …/workers/domains/{id}` answers success with an **empty body**, not the usual JSON envelope; step 3's
  console code must not `res.json()` it unconditionally.
