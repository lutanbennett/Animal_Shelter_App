# Push only the missing production secrets, never `--secrets` (2026-10-22)

`0.39.1` needed two new secrets on the production Worker
(`GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`;
`docs/decisions/2026-10-22-vet-calendar-on-production.md`). The obvious command
is `node scripts/deploy.mjs --env production --secrets`. **It is refused on this
machine, and it always will be.**

## Why

`--secrets` pushes **every** runtime secret, not only the new ones. Four of them
resolve only from `.env.local` — the dev values:

```
production would push 4 secret(s) that exist only in .env.local (the DEV values):
  - GOOGLE_OAUTH_CLIENT_ID
  - GOOGLE_OAUTH_CLIENT_SECRET
  - GOOGLE_OAUTH_REFRESH_TOKEN
  - GOOGLE_DRIVE_ROOT_FOLDER_ID
```

The guard (`scripts/lib/secret-sources.mjs`, `fallthroughRefusal`) is correct and
should not be weakened.

## `--allow-dev-fallthrough` is not the remedy, although the refusal suggests it

The refusal ends *"or pass `--allow-dev-fallthrough` if production really should
use the dev values"*. Production **already holds all four of those secrets,
correctly** — confirmed with `wrangler secret list --env production`, which showed
nine of the eleven present and exactly the two calendar values absent. Passing the
flag would have overwritten four working production credentials with dev ones,
including `GOOGLE_DRIVE_ROOT_FOLDER_ID`, **which decides which Drive folder
resident photos are written into.**

That is not a theoretical risk: the flag's wording invites exactly this, and it
was reached for under time pressure during a live release.

## What to do instead

1. `wrangler secret list --env production` — find what is **actually** missing. Values are write-only, so this lists names, which is all that is needed.
2. Push only those, from the production overlay: `node scripts/push-calendar-secrets.mjs` is the worked example. It refuses any value that does not come from `.env.deploy.production` and never prints one.
3. **Then deploy.** A bare `secret bulk` makes a new Worker version with no release tag, which turns the Release tile on `/admin/status` amber (`docs/decisions/2026-10-16-untagged-worker-stays-amber.md`). Running the push **before** the release deploy means the deploy re-tags and the tile never goes amber at all.

The script is named for the secrets it pushes rather than being a general tool,
deliberately: a general "push these secrets" script with a name list on the
command line is the same footgun with extra steps. **The next release that adds a
secret should copy it and change the two names**, which forces someone to decide
what is being pushed.

## The process fault underneath it

The release manager handed Lutan `--secrets` having checked that the two calendar
values were in `.env.deploy.production`. True, and the wrong check: **the change
was verified, the command was not.** The deploy was then refused a second time
because the fix script had been written into the main checkout, leaving the tree
dirty.

**Before handing over any guarded command: read the guard's source, enumerate
every condition it tests, run each against the live state, and print the
answers.** It takes under a minute and it is what the runbook's standing rule —
*do not hand Lutan a command you have not confirmed runs in his shell* — actually
requires. Two of his four interventions in `0.39.1` were this, and both were
avoidable.
