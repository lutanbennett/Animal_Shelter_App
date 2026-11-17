# The shared-tables check runs nightly against dev (#shtci)

- **What:** `.github/workflows/tenancy-shared-tables.yml` runs `scripts/check-tenancy-shared-tables.mjs` daily and by hand (`workflow_dispatch`). A separate file from `tenancy-catalogue.yml`: the two fail for unrelated reasons and one job would hide which went red.
- **Cron:** `31 7 * * *`, 07:31 UTC. Clear of `tenancy-catalogue.yml` (05:43) and `advisories.yml` (06:17), and off the hour.
- **Where a failure goes:** GitHub emails whoever last edited the cron line and shows a red run in the Actions tab. That is the whole mechanism; the workflow comment says so.
- **Production: NOT done, and not established either.** No workflow reads production. The existing `SUPABASE_ACCESS_TOKEN` is documented as dev-project, Database: Read, so it is believed unable to see production, but that is a comment, not a measurement (a probe was refused by the tool permission layer and not forced). If production is wanted, Lutan creates a new repository secret, suggested name `SUPABASE_ACCESS_TOKEN_PROD`: a Supabase access token scoped to project `dbkodyyxxhtygxcxmfcu` only, Database: Read only. A second job then runs the script with `--env production`, which also needs the script to take the token from that secret. Not requested here, not guessed.
- **Registry untouched:** `docs/tenancy-shared-tables-registry.json` is unchanged.
