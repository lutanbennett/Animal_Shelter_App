# 2026-11-09: test's cache purge reads the lannacare.org zone's credentials from UAT's file

`#pz3tk`: since production moved to its own Cloudflare zone on 2026-11-06, nothing purged
`test.lannacare.org`'s edge cache. `purge-cache.mjs --env test` looked for `CLOUDFLARE_ZONE_ID` and
`CLOUDFLARE_PURGE_TOKEN` in `.env.local` and refused.

## What was chosen

`--env test` now reads those two values from `.env.deploy.uat`, and any test or UAT purge re-checks
both `test.lannacare.org` and `uat.lannacare.org` afterwards.

**Why UAT's file:** test and UAT are one zone (`lannacare.org`), and a purge is zone-wide, so they need
the same zone ID and the same token. `#prg4z` (earlier the same day) put exactly that token in
`.env.deploy.uat`: Cache Purge only, limited to `lannacare.org`, measured unable to see production's
zone. Reusing it adds no new credential and no new place a credential lives.

**Why not `.env.local`, which the item offered as the smaller change:** `.env.local` is copied into every
worktree and read by `next dev`, and it is the base layer under production's and UAT's files, so a token
there would sit in a dozen folders and fall through to any environment whose file lacked one. A purge
token belongs with the deploy files.

**Why re-check both sites:** purging either clears both. Checking only the named one would leave the
other's result unproven while the output implied it was untouched.

**The refusal stays:** without `.env.deploy.uat`, `loadEnv` stops and names the file; without the two
values, the script names what to create. Nothing was made to "just work" by guessing a zone.

## Measured

- main's script: `--env test --dry-run` refused, *missing from .env.local*.
- changed script: `--env test` purged zone `c596f1fe…`, then `test.` and `uat.` stylesheets each
  `HTTP 200, 99839 bytes (CF MISS)`; on the Pi, `check-assets.mjs` for both clones: *identical to the build*.
- `--env production --dry-run`: unchanged, zone `323637bc…`.
