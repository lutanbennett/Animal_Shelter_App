# The emergency lever for a sick Pi is documented, and is one flag (2026-10-26)

Closes the "ORIGIN_HOST lever" half of the backlog item *The Pi is a single point of failure for every write*.
Only the tunnel drill is left, and it is Lutan's to run.

## Should it be a documented lever at all? Yes.

It already exists (`worker/origin.mjs:88`: an empty `ORIGIN_HOST` means the Worker serves everything, writes
included) and is already tested (`scripts/check-worker-origin.mjs`). It ran that way until 2026-09-30. Left
unwritten it is folklore, which is the worst case: someone reaches for it on the night with no idea of its cost.

The worry that a documented lever invites misuse is answered by the runbook's own first section, "Do you need
it?": it is for a Pi that is sick, not for a power cut seconds old, because part (a)
(`2026-10-02-origin-write-fallback.md`) already takes over saves by itself when the edge returns 530.
**What the lever covers that (a) cannot:** a Pi up but unhealthy, `lanna-care` stopped (502/503), and the first
seconds of a power cut (502/504, 20 s timeouts). There saves are refused by design, because replaying a write
after a 502/504 could record a second intake (#250).

**It is not the fix.** The failover programme (idempotent writes, `docs/pi-failover.md`) is, and Lutan chose
it. The runbook says so in its first lines.

## One command instead of an edit: yes, `--no-pi`

Wrangler 4.145 takes `--var NAME:value` on `deploy`; the command line beats `wrangler.jsonc`, and `NAME:` with
nothing after the colon is an empty string (its `collectKeyValues` joins what follows the first colon). So
`node scripts/deploy.mjs --env production --no-pi` appends `--var ORIGIN_HOST:` and nothing in the committed file
changes. The undo is any ordinary deploy, because the committed value is still `pi.lannacare.org`; the next
release puts the Pi back by itself.

Checked: `wrangler deploy --dry-run` accepts the flag and replaces the config's value (it prints the value as
`(hidden)`, so the dry run cannot show it is empty; that rests on wrangler's parsing code and on `uat`, which
already deploys `""` from config). **Not yet seen on production**; the runbook says so.

Also added `--plan`: prints the exact `wrangler deploy` line and stops before any build or upload, so the flag
can be proved without deploying.

The runbook does not use `--skip-build`. `ORIGIN_HOST` is a runtime variable, not baked into the build, so it
would work, but a leftover `.open-next` from an older release would put old code live under the new version's
tag, and nothing checks that. Four minutes of build is the cheaper mistake.

## The app while the lever is pulled

An empty host makes the Pi tile grey "Not in use" (`checkOrigin`, `off`). `alerts.ts` treats only `fail` and the
Pi's `warn` as red, so a grey tile sends no mail: no false "Pi is down" alert during a deliberate pull. Two
copy fixes: the tile said "Not in use yet … as before the Pi", wrong during an incident, and the Pi-down alert
mail now points at the runbook.

## The drill serves two items

`stop-cloudflared` in `docs/pi-failover.md` is both the drill that proves part (a) on the real tunnel and one of
the four measurements the Pi failover item needs. Run it once; it counts for both. Its section now says what to
expect since (a) shipped.
