# dev-signin defaults a plain role to the DEV_SHELTER_ID shelter (#dsgnr)

`node scripts/dev-signin.mjs <role>` looked a role up by key with no shelter filter. Since 0387/0423 every shelter has its own Admin, so it matched one row per shelter and died with PGRST116.

**Default:** with no `--shelter`, the role is the one on the shelter `DEV_SHELTER_ID` (`.env.local`) names. `next dev` sends that shelter, so it is the one the browser shows whatever login is made; a login on any other shelter reads empty lists. An unset, empty or unknown `DEV_SHELTER_ID` stops with a message naming the variable and `.env.local`.

**Why not refuse and list shelters:** measured on dev, 2026-11-20, `admin` is the only role key present on more than one shelter (5), so defaulting is unambiguous and a refusal would only add friction.

`--remove` and the card-role sweep filter with `like`/equality and never use `.single()`, so they do not break the same way and are unchanged. `--shelter` is unchanged and is still how to log in on a second shelter.
