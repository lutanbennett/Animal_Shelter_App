# One runtime-config manifest; `where: worker` kept (2026-10-12)

`scripts/lib/runtime-config.mjs` is the single table of run-time names
(where, secret, scrub, required, build, purpose). `deploy.mjs`, `pi/write-env.mjs`
and `src/lib/status/run.ts` derive their lists from it; `scripts/check-runtime-config.mjs`
(in `npm run lint`) fails on a literal copy in those files or a `.env.example` mismatch.
`scripts/lib/optional-secrets.mjs` is deleted.

**Count, measured:** 16 distinct names (15 across the four lists, plus
`BACKUP_AGE_RECIPIENT`, which only `.env.example` knew). The item's
"twenty-odd" was an estimate.

**`where: worker` is kept**, although `WORKER_ONLY_SECRETS` has been empty since
`origin-key-in-app`. Dropping it would leave the next Worker-only value nowhere
to go and bring back a hand-kept list. Cost: one comparison in the manifest.

**Scrub stays an explicit flag, not derived from `secret`.** Deriving it would
newly scrub `GOOGLE_OAUTH_CLIENT_ID`, `CLOUDFLARE_ZONE_ID`, the folder IDs and
the Server Actions key. That is probably right, but this is a refactor that
must not change behaviour; widening the scrub is a separate one-flag change.

**The Server Actions key is `own:`** (actions-key.mjs validates it, and
deploy/write-env treat it specially), so the generic derivations skip it.

**Not caught:** the check proves the lists agree on which names exist. It does
not prove a value is SET on a machine, and it cannot see a name read through
`process.env.X` in app code that nobody added to the manifest. The generic
"required values missing on this machine" status tile is not built; the
visitor tile keeps its own wording.
