# The backups get their own Google client (2026-11-19, code half of #civwx)

## The incident
On 2026-11-19 two production alerts went red together: *Photo storage (Google Drive)* and *Daily backup*, both
`invalid_grant: Token has been expired or revoked`. They were one token: the Pi's cron line passes
`--shared-drive-token`, so `backup.mjs` used the app's `GOOGLE_OAUTH_*` credentials. One dead authorisation
stopped photo uploads and the off-site backup together.

## What was ruled out, and how
- A bad local secret: dev's token is dead with the same error (`scripts/check-drive-token.mjs`), so what died is shared.
- A swapped local file: `.env.local` was last written before the previous day's probe and its client id still matches the inventory.
- A deleted or rotated client: `invalid_grant` names the grant, so Google accepted the client.
- Left, and **not proven**: the authorisation was replaced. The live Desktop client's tokens for dev and test-shelter-2 were minted by hand on the same account that day (`2026-11-19-drive-file-hinge-proved.md`), and Google does not support incremental authorization for installed apps.

## Decision (Lutan, 2026-11-19: "lets setup the separate app registration")
Give the backup its own client rather than re-minting the shared token. This change is the code half:
`google-oauth-setup.mjs --backup` reads `BACKUP_GOOGLE_OAUTH_CLIENT_ID`/`_SECRET` (never the app's pair, so a
backup token cannot be pasted into the app's setting by mistake) and prints `BACKUP_GOOGLE_OAUTH_REFRESH_TOKEN`;
the three names are in `scripts/lib/runtime-config.mjs` (`where: both`, `required: false`, secret and token `scrub`).
Scope stays full `drive`: the backup uploads and prunes, so `drive.file` (#dscop, for the self-service screen) is not enough.
`backup.mjs` is unchanged: with all three set, `resolveDriveCredentials()` returns the backup's identity before it
looks at `--shared-drive-token`, so the flag cannot win. Without them the flag remains the warned escape hatch.

## The rule going forward
**One client per identity, not merely one account per identity.** Grants are per client and account, so a mint for one
identity cannot then touch another's. Creating the client, consenting, setting the Pi's values and dropping the cron flag are Lutan's; #civwx stays open until the Pi runs under it.
