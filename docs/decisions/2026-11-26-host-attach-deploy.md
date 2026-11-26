# Host attach, deploy half (#hstau): the mechanism is `--domain`; the "should answer" flag needs schema first

2026-11-26. Builds on `2026-11-26-host-attach-trial.md`, which measured that a deploy deletes every custom domain
absent from `wrangler.jsonc`. This stream was to make `deploy.mjs` re-assert the shelter hosts. **It stopped at the
schema question, as its brief allowed: no existing value says which host should answer, and guessing would attach
production's addresses to the test Worker.** The mechanism is settled and written down here; the build waits on a
small schema PR.

## 1. How the extra hosts reach wrangler: `wrangler deploy --domain <host>`, one per host

Read from wrangler 4.153.0's own source (`node_modules/wrangler/wrangler-dist/cli.js`, `mergeDeployConfigArgs`):

```js
const domainRoutes = (args.domains || []).map((domain3) => ({ pattern: domain3, custom_domain: true }));
const routes = args.routes ? applyZoneArgsToRoutes(args.routes, args) : config2.routes ?? (...);
...
routes: [...routes, ...domainRoutes],
```

So `--domain` (alias `--domains`, repeatable; `wrangler deploy --help`: *"Custom domains to deploy to"*) produces
exactly `{ pattern, custom_domain: true }` and **adds** it to the environment's `wrangler.jsonc` routes; it does not
replace them. That is shape (b) of the trial's specification with no file written and nothing in the repository.

Rejected:
- **`--route`**: it *replaces* the config's routes (`args.routes ? … : config2.routes`), and a `--route` string cannot
  carry `custom_domain: true` (it is a plain pattern; the zone flags are experimental). Using it would mean restating
  every `wrangler.jsonc` route on the command line, a second source for them.
- **A generated config handed over with `--config`**: works, but wrangler resolves `main`, `assets` and the project
  root relative to the config file, so the copy must sit beside `wrangler.jsonc` and be kept out of git; more moving
  parts than a flag that already does it.
- **Attach by API after the deploy**: leaves every shelter host down from the moment the deploy reconciles the domain
  list until the re-attach finishes, and a failed re-attach leaves them down until someone notices. Rejected because
  `--domain` has no window at all.

**Not yet measured live**: a test deploy with `--domain` keeping an API-attached host. The source reading is
unambiguous, but the trial's rule stands: the build stream re-runs the trial (attach a disposable host, deploy
`--env test` with it passed, read the list back three times, detach, read back) before it is relied on.

## 2. "Mapped" versus "should answer": no existing value carries it, so a column is needed

Read from the **dev** project (what `--env test` deploys against), 2026-11-26. `shelter_hosts` has `host`,
`shelter_id`, `created_at`, `is_primary` and nothing else. Its rows:

```
cooperjaidee.org                       lanna                 is_primary=false
flogn-proof-b.example.invalid          proof-b               is_primary=true
flogn-proof.example.invalid            pcf-proof2            is_primary=true
lannacareforanimals.org                lanna                 is_primary=false
pcf-proof.example.org                  pcf-proof             is_primary=true
rehearsal-2026-11-20.example.invalid   rehearsal-2026-11-20  is_primary=true
test.lannacare.org                     lanna                 is_primary=true
www.cooperjaidee.org                   lanna                 is_primary=false
www.test.lannacare.org                 lanna                 is_primary=false
```

**Feeding every row to `--domain` on a test deploy would try to attach `lannacareforanimals.org` and
`cooperjaidee.org` (production's addresses) to the test Worker**, and the `.example.*` proof rows name zones the
account does not hold (what wrangler then does was not measured). So "every row" is wrong, and so is every existing value:

- `is_primary` means "the shelter's website address" (#9l7xf), not "attach this"; `test.lannacare.org` and the proof
  rows are all primary.
- `shelters.public_site` is per shelter, not per host, and the `lanna` shelter owns both test's and production's hosts
  in this database.
- `wrangler.jsonc` routes already carry the hosts the deploy itself owns; a host there must not be passed again.

### The column, as a specification (a separate schema PR that must land first)

```
shelter_hosts.attach_to_worker  boolean not null default false
```

Meaning: **this host is attached to THIS environment's Worker as a Cloudflare custom domain by the console, and every
deploy of this environment must re-assert it.** Per database, so per environment: the dev project's rows speak only
for test, UAT's for UAT, production's for production. Default `false`, so every row that exists today, including the
production addresses copied into dev, keeps its present meaning and nothing is attached by the migration. The console
sets it `true` in the same action that makes the attach call, and `false` on detach. A host also in that environment's
`wrangler.jsonc` routes never needs it (the deploy filters those out anyway).

Writes go through whatever card the console's add-host action asks; the column itself grants nothing. No backfill.

### What the build (after the schema) does in `deploy.mjs`

1. Read `select host from public.shelter_hosts where attach_to_worker` from the environment's own database, the same
   read-only Management API call `scripts/check-deployed-hosts.mjs` makes.
2. Drop any host already in `routeHosts(readWranglerConfig(), envName)`.
3. Append `--domain <host>` for each to `deployArgs`, and print the list (and show it under `--plan`).
4. **A failed read refuses the deploy.** Deploying without the list is exactly the outage this exists to prevent; a
   Supabase blip costing a retry is the cheaper failure.
5. Re-run the trial on `--env test` and paste the three API reads.

## 3. Also in this PR

- **`scripts/deploy.mjs` called `fileURLToPath` without importing it** (since #1898's net-trace preload). `--plan`
  stops before the wrangler call, so nothing noticed, but every real deploy would have thrown there. Imported.
- **`CLOUDFLARE_WORKERS_DOMAIN_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` registered** in `scripts/lib/runtime-config.mjs` as
  optional secrets, `where: "both"` because the Pi serves the pages whose actions would make the attach call. The
  account id was already a deploy-time name in `deploy.mjs` (wrangler's own); it now reads the spelling from the
  manifest (`CLOUDFLARE_ACCOUNT_VAR`), as `check-runtime-config.mjs` requires. Same account, so `--secrets` pushing the
  deploy file's value is correct.
- **The `check-wrangler-var-steps.mjs` hook (#1897's request) was not made.** It needs the previous release's
  *deployed SHA* (`--base`), which `deploy.mjs` does not know (it can read the live release *version* only), and its
  answer matters *before the Pi build*, which precedes `deploy.mjs` in a release. A hook here would run too late with
  the wrong input.
