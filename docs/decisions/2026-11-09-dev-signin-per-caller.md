# dev-signin --cards: one login per card set per port (#w2hs8)

Reported by diets-one-card (#1408): the disposable login was keyed by the card set alone, so a second stream asking for the same
cards reset the first one's password and sent it to /login, which looks like the 50-minute cookie expiring.

**Ruling (planner, 2026-11-09): key by card set plus the PORT**, not refuse. Key is now `dev_signin_cards_<hash>_<port>` (or `_<label>`
with `--label`). The port is already each stream's identity (`.port`, `--port`), so no new argument is needed.

**The condition on the ruling was NOT settled by measurement.** Whether two Claude sessions' built-in browser panes share a cookie
jar on localhost cannot be observed from inside one session, which sees only its own pane. The suffix is harmless if jars are shared
(the second snippet then replaces the first's cookies in that jar, as it always did) and necessary if they are not, so it was built
either way. If someone establishes that jars ARE shared, per-port logins stop helping and refuse-and-name is the next step.

**Proof (dev, card record_weight, ports 3008 and 3099):** two calls gave two different users
(dev-signin-8e866d7e-3008 / -3099@example.invalid); after the second call both access tokens still passed /auth/v1/user.

**Rejected: refuse-and-name.** It moves the loss to the second stream instead of removing it.

Unchanged: `--remove <exact key>`, the role+--cards refusal, the unknown-card refusal. Old unsuffixed `dev_signin_cards_<hash>` rows
are untouched and removable by exact key. No schema; role keys stay about 31 characters.
