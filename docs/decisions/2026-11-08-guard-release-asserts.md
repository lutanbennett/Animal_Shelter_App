# The schema-before-code check moves off the Pi (#g4rd1)

**Fault.** `deploy-pi.sh` ran `guard-release.mjs`, which asked production which migrations were applied
using `SUPABASE_ACCESS_TOKEN`. The Pi has no such token, so it printed `WARNING: could not ask` and
carried on. A guard that always passes is read as a pass. `0.43.5` was saved by the human order, not the guard.

**Choice: (b), assert on the deploy machine. Not (a), a read-only token on the Pi.** The Pi is the
internet-facing box, which is why `purge-cache.mjs` left it
(`2026-10-18-purge-from-the-deploy-machine.md`); a production database credential there, even
read-scoped, is a consequence beyond this item. Nothing in the four files made (b) unworkable: the Pi
deploy is always started by an `ssh` typed on the deploy machine, so a check run first loses nothing.

**Where the assertion lives (deliverable 2).**
- Rules: `scripts/lib/release-guards.mjs`, which already holds the shared rules. New `assertSchema()` is
  the STRICT verdict: unlike `schemaVerdict()` it **refuses** when it cannot ask, and its refusal names
  each missing migration with the app files its `-- consumer:` header declares (`declaredConsumers`,
  read from the shipped commit), so it reads the headers rather than only counting files.
- Entry point: new `scripts/assert-schema.mjs --env <env> [--ref <sha>]`, run on the deploy machine
  before the Pi build. Not `deploy.mjs`: that is the Worker deploy and Lutan's own command; the Pi build
  is a separate step with no script on the deploy machine to hang the check on.
- `deploy.mjs` is unchanged: it has the token and runs `schemaVerdict`, where "could not ask" stays a
  warning (a Supabase blip must not block an emergency Worker release). That asymmetry is deliberate.
- `scripts/pi/guard-release.mjs` stays (release-record rules, `--force`, override log) but no longer
  imports the schema query, needs no env file, and says in its header and its success line that the
  schema is asserted elsewhere. Same file name, so `scripts/pi/check-self-update.mjs:35`'s stub list
  (deliverable 4) is already correct.

**`check-release-guards.mjs` (deliverable 3).** The two spawns of `guard-release.mjs` still prove
something (test unguarded; `--force` needs a reason) and stay. Added: `assertSchema` cases (refusal
names migration and consumer files; `none` / no header reported; could-not-ask refuses; a level
database passes); the Pi guard runs for production with no token and no env file; it no longer imports
the schema query; `deploy-pi.sh` points at `assert-schema.mjs`.

**Known limit, said plainly.** Nothing mechanical forces a release manager to run `assert-schema.mjs`
before the `ssh`; the Pi cannot verify that it was run. It is a named step in `release-procedure.md`
section 5 and the Pi's own comment points at it. An attestation flag (`deploy-pi.sh --schema-ok <sha>`)
was considered and left out: typed without running, it would be the same decoration again.
