# A `raise notice` in a migration reaches nobody

2026-10-23. `0250` ends with a `do $report$` block that raises one NOTICE per diet ingredient line not in
1 : 1.5 : 2 proportion, "each is Lutan's call". `apply-migrations.mjs` goes through the Management API, which
does not return notice output, so applying it to production printed `applying 0250 … ok` and nothing else.

**The general rule: any migration that relies on `raise notice` to tell a person something has the same fault.**
Put what a person must read in a script they run, or make the migration `raise exception` if it must stop.

For `0250`, `scripts/check-diets-proportion.mjs` is that script. Read-only (`begin … rollback`), takes `--env`,
prints each line (diet, ingredient, the three amounts, the actual ratio, what Medium and Large would be in
proportion) and exits 1 when there are any, so it can be cited in a release record. It takes `--env` because
`check-diets-per-serving-schema.mjs` hard-refuses anything but dev.

Run 2026-10-23: dev 8 lines, production 1 (Kidney Support: 0.5 / 1 / 2). The production run needed the main
checkout, since `.env.deploy.production` lives only there; it was not refused.
