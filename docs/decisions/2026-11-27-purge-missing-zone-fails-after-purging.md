# A purge with a zone it could not reach ends exit 1, but only after purging every zone it could

2026-11-27, `#cjpzn`, branch `claude/cooperjaidee-purge-zone`.

## What changed

Production answers on four hosts in two Cloudflare zones: `lannacareforanimals.org` + `www.` and
`cooperjaidee.org` + `www.` (`www.cooperjaidee.org` is a record in the `cooperjaidee.org` zone, not a zone
of its own: the zone lookup for it returned nothing, measured 2026-11-27). `scripts/purge-cache.mjs` knew
one production zone, so the product site was never purged and nothing said so.

The zones and their hosts are now listed in `scripts/lib/purge-zones.mjs`, the new zone reads
`CLOUDFLARE_ZONE_ID_COOPERJAIDEE`, and `scripts/purge-zones.test.mjs` fails if `wrangler.jsonc` binds a
host that no zone covers, so a fifth host cannot be missed the same way. The script also checks this at
run time and names any such host as NOT PURGED.

## The question: should a missing zone variable fail the purge, or warn?

**Decided: it purges every zone it can, names the skipped one as `NOT PURGED`, and ends exit 1.**
A missing token, or no zone at all, still refuses with exit 2 as before.

- **Warn-and-exit-0 was rejected** because that is exactly how this fault hid: a purge that reports
  success while a zone stood. An exit 0 reads as "done" to anyone skimming a release.
- **Stop-before-purging was rejected** because a release must not be stopped by a cache purge, and
  refusing to purge production's main zone because the product site's id is missing would make the
  commoner case worse to protect the rarer one.
- **Exit 1 does not stop a release.** `docs/release-procedure.md` already treats a purge failure as
  "purge by hand and carry on", and the script says the same in its last line. It only makes sure the
  release manager sees it.

## What is NOT done, and is Lutan's

Production's `CLOUDFLARE_PURGE_TOKEN` was read 2026-11-27 (`GET /zones` with that token, nothing
purged): it lists `lannacareforanimals.org` and `lannacare.org`, **not `cooperjaidee.org`**. So the token
must be widened to Zone → Cache Purge on that zone, and `CLOUDFLARE_ZONE_ID_COOPERJAIDEE` added to
`.env.deploy.production`. Until then every production purge ends exit 1 naming the product site, which
is the intended loud state.
