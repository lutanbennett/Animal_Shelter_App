# When the Pi goes down, can people still save? A paper

Written 2026-10-02. **Status: proposed. Lutan has not agreed this yet, and
nothing here has been measured on the real tunnel yet.** Where a number is
missing the paper says "unmeasured" rather than guess.

## The short version

- The Pi is the machine in the house that runs the site. When it is off, the
  Cloudflare Worker is supposed to take over.
- **Reading pages already falls back and works.** Saving things does not,
  except in one case. That case is the one we practised (stopping
  `cloudflared`), which is the least likely way for the Pi to really fail.
- The most likely real failure is a **power cut**. It begins with a window where
  signing in and saving are *refused*, and it is not known how long that window
  is. We need to measure it.
- A save is refused on purpose when we cannot tell whether the Pi already
  did it. Doing it twice (two intakes for one animal) is worse than asking the
  person to try again.
- **Only one fix removes that "cannot tell" problem for good: make saving safe
  to repeat** (option 1 below). Everything else only makes the bad window
  shorter or rarer.
- **Recommended, once measured:** shrink the window now with cheap steps
  (a battery for the Pi and the router, and teach the Worker to stop trying a
  Pi that has stopped answering), then decide whether the leftover window is
  acceptable or whether to build option 1.
- **The decision for Lutan** is on the last page: is "a save in the first few
  seconds of an outage may be refused, with a clear message" acceptable, or must
  it be zero?

## What happens today

Every request to the site goes to the Cloudflare Worker first. The Worker
passes it to the Pi through a tunnel (a connection the Pi opens *out* to
Cloudflare, so nothing needs opening on the house router). If the Pi does not
answer, the Worker builds the page itself.

The Worker decides what to do from what comes back. A few codes matter:

| code | what it means here |
|---|---|
| **530** | Cloudflare looked for the Pi's tunnel connection and found none. Nothing was passed on. **Safe to retry elsewhere.** |
| **502 / 504** | The Pi's tunnel program answered "the app did not reply" or "too slow". The app **may already have done the work**. Not safe to repeat. |
| *error with no code* | The Worker's own request failed or dropped. It cannot say whether the Pi got it. Not safe to repeat. |
| *no answer in 20 s* | The Worker gives up on a **read** and falls back. It sets no time limit on a **write**, so a write simply waits for whatever Cloudflare eventually answers. How long that is, is unmeasured. |

For **reading**, any of these falls back to the Worker, because looking at a
page twice does no harm. For **writing**, only a 530 falls back. Everything else
shows the person: *"The shelter's server did not answer in time. Check whether
your change was saved before trying again."* This is deliberate. It came from
a real case (#250) where repeating a write could have created a second intake.

## The four outages, and what each does to a save

This is the table from the backlog item, with a column added for what we
actually know.

| outage | what the Worker sees | save today | how sure are we |
|---|---|---|---|
| Stop `cloudflared` | 530 at once | **works** (falls back) | Reasoned from Cloudflare's docs. The 2026-09-30 drill watched pages fall back, but nobody has watched a *save* do it. |
| Power cut, first seconds | 502, 504, or a long wait | **refused** | The behaviour is certain from the code. **How many seconds is unmeasured.** |
| Power cut, once Cloudflare notices | 530 | works | Same as row 1. **How long until it notices is unmeasured.** |
| Pi is on but unhealthy (app stopped, crashed, or stuck) | 502 or 503 | **refused, and never falls back** | Behaviour certain from the code. **Whether a stuck app gives 502 or 504 is unmeasured.** |

Two things follow:

1. The practised case is the safe one. A power cut starts with refused saves,
   and an unhealthy-but-running Pi *never* leads to a fallback, however long
   it lasts.
2. The Pi-down alert (#308) does not change any of this. It sends an email 15
   to 30 minutes after the Pi goes. It does not move traffic.

## One thing every option depends on: the shared form key

Added 2026-10-03, from the `server-actions-encryption-key` stream's result.

The Pi and the Worker are separate builds, and a form drawn by one **fails when
posted to the other** unless both were built with the same key. This is not only
a point about option 5. It hits **today's fallback**: a page the Pi drew just
before it dropped, then saved on the Worker, fails once and works after a
reload. It would also hit options 1 and 2 for exactly the same reason: any
design that lets a form drawn by the Pi be saved by the Worker needs the shared
key first. So **the key is a precondition for all of them**, not one more option.

It is being fixed on its own, in another PR. This paper treats it as done.
That stream also noted that a rebuild on one machine reuses a cached key, which
is why redeploying never showed the problem; the Pi and the Worker are built on
different machines, so they would always have differed.

## The fact everything else is built on

**The data is not on the Pi.** The Pi and the Worker both save to the same
Supabase database. So a "did it save twice?" problem can be settled *in the
database*, not by guessing at the network. That is what separates option 1
from the others.

## The five options

Each is judged on three questions: what does it fix, what does it cost, and
does it ever risk saving twice?

### 1. Make saving safe to repeat

Every save carries a unique ticket number made by the browser. The database
records the ticket in the same step as the save. If the same ticket arrives
again, the database hands back the first result instead of saving again.

- **Fixes:** every row of the table, including a save that was in flight at the
  instant of failure. After this, *any* failure can be retried on the Worker.
  It is the only option that does.
- **Cost:** large. It touches every place the app saves (intake, placements,
  weights, deliveries, stocktake, attachments). It needs a database change
  first, then a shared wrapper, then a sweep through all the saves, like the
  sweep done in #441. Weeks, several streams.
- **Double save:** removes the risk, by design.

### 2. Route by health, not by luck

Stop learning that the Pi is down by sending a real request into it. Instead
the Worker already knows, before it sends anything, whether the Pi looks well,
and skips it when it does not.

- **Fixes:** a *new* request after a power cut no longer waits for Cloudflare
  to notice. Also fixes "on but unhealthy", **if** the health signal comes from
  the app itself and not just from the machine.
- **Does not fix:** a request already in flight when the power goes. That one
  is still unsafe to repeat.
- **What it needs.** There is no health signal today.
  - #308 is not one. It is a check every 15 minutes.
  - The Worker has no place to keep a shared "Pi looks down" note. `wrangler.jsonc`
    binds no KV store and no Durable Object.
  - Cheapest start, no new infrastructure: the Worker remembers "Pi failed just
    now" for about 30 seconds and skips the Pi in that time. It only protects
    the one Cloudflare location that saw the failure, so it is a first step, not
    the whole answer.
  - For a shared signal, the Pi can report in on a timer. Workers KV may be too
    stingy for this: I believe the free plan allows about 1,000 writes a day, and
    one every 10 seconds is 8,640. **Check that before choosing.** The database
    both sides already use is the other place to put it.
- **Double save:** no new risk. It does not retry anything a refused request
  would not have retried.

### 3. Keep the power on

A small battery (UPS) for the Pi **and the router and fibre box**, because the
tunnel needs all of them. Shut the Pi down cleanly when the battery runs low.

- **Fixes:** the power-cut rows, for as long as the battery lasts. The Suphan
  Buri outages we need to cover are not measured. Someone should write down how
  long the last few lasted before a battery is chosen.
- **Does not fix:** crashes, a bad update, or an outage longer than the battery.
- **Cost:** a one-off hardware purchase. Not priced yet.
- **Double save:** none. No code.

### 4. A second machine on the same tunnel, somewhere else

Cloudflare's tunnel lets two machines share one tunnel. If the house goes dark,
a second copy elsewhere (for example a free cloud server) keeps answering.

- **Fixes:** the house losing power or internet, with no refused window,
  because the edge simply sends traffic to the other copy.
- **Does not fix:** a request in flight on the machine that dies. It also
  means a second machine to build, update and keep the secrets on, and it
  would take a share of normal traffic, not only the failover.
- **Cost:** no hosting fee if the free tier fits. Ongoing work, not money.
- **Double save:** the in-flight case is the same as today.

### 5. Flip it: the Worker does all saving, the Pi only draws pages

The 1102 errors that put the Pi in front came from *drawing pages*. Saving may
fit the Worker's limit. If it does, a Pi outage costs nothing but speed.

- **Cannot be judged yet, because one question is still open (CPU).**
  1. **The form key (answered 2026-10-03, by the `server-actions-encryption-key`
     stream, not re-run here).** A form drawn by one build and posted to a build
     with a different key **fails** with "Failed to find Server Action", and it
     fails for *every* form, not only some. With the **same key** on both builds
     it works in both directions. That stream reproduced it locally with plain
     Node builds, and then on the Worker’s own OpenNext build too: built with a given
     key it records that key and the same 164 action IDs as the plain build the
     Pi runs (the other stream’s report, evidence in the decision file `docs/decisions/2026-10-03-server-actions-encryption-key.md`,
     which arrives with #312; not re-run here). So option 5 is possible only if both builds
     carry one shared key, and that key is being set up in its own PR (#312), **not yet deployed**.
  2. **CPU is still open.** Saving on the Worker has to fit the free CPU limit.
     Nobody has measured it. The fallback today does exactly this, and it is an
     outage mode, not the everyday path.
- **Double save:** none, as nothing is sent to the Pi.

Paid Cloudflare Load Balancing is out: it costs every month and cannot point at
a Worker.

## What the options do, side by side

"Window" means saves refused or lost during the first moments of an outage.

| | power cut (new requests) | power cut (request in flight) | Pi on but unhealthy | crash or bad deploy | cost |
|---|---|---|---|---|---|
| 1 Safe to repeat | fixed | **fixed** | fixed | fixed | high (weeks of work) |
| 2 Route by health | fixed once the signal exists | not fixed | fixed if the app reports | partly | small to medium |
| 3 Battery | fixed while it lasts | fixed while it lasts | no | no | hardware, one-off |
| 4 Second machine | fixed | not fixed | partly | partly | upkeep |
| 5 Worker saves | fixed, if it fits | fixed | fixed | fixed | unknown |

## What I recommend

**This is a proposal, to be tested against the measurements.**

1. **Do option 3 and option 2 first.** They are cheap and between them they cover
   the likeliest outages, and they stop a *new* request from walking into a dead
   Pi. Option 2 starts with the Worker remembering a recent failure, which needs
   no new service.
2. **Then look at what is left.** With 2 and 3 in place the remaining refused
   window should be small: only a save in flight at the exact moment of failure.
   The refusal message already tells the person to check before retrying.
3. **Option 1 is the only way to make that last window zero.** It is a bigger
   build, so it should be a decision, not a default.
4. **Option 5 waits** for one CPU measurement (the key question now has an
   answer: it works with a shared key). If saving fits on the Worker, it may make
   all of the above unnecessary for saving, and we should not build around a Pi
   outage we could avoid.
5. **Option 4 stays on the shelf.** It is the right step if one house is no
   longer enough, but it brings a second machine to look after.

The backlog item expected options 1 and 2 with 3 as insurance. This agrees
with 2 and 3 first and holds 1 until we see how small the window really is.
**That is a reason to measure before building 1.**

### About `ORIGIN_HOST=""`

`ORIGIN_HOST=""` is the switch that turns the Pi off for the whole site: the
Worker stops trying the Pi and draws everything itself. It has been talked about
as an emergency lever.

- If option 2 lands, it is **not needed for outages**. The Worker would route
  around a Pi that is down or sick without anyone flipping anything.
- Keep it for one case option 2 cannot see: **the Pi is up, answering
  confidently, and wrong** (for example after a bad deploy). Nothing about
  health would notice.
- Today it needs a change to `wrangler.jsonc` and a deploy. That is slow for a
  lever. If it is worth keeping, a flag that does not need a deploy would be a
  small follow-up.

### Pieces for planning

These are my judgement of batch-sized pieces, in order:

0. **The shared form key** (already in progress in its own PR). Everything below
   assumes it.
1. **Power.** Measure past outages, choose and fit a battery for the Pi and
   router, set up clean shutdown. No code.
2. **Quick Worker memory of a failed Pi.** Small, in `worker/origin.mjs`.
3. **Health signal.** The Pi reports in on a timer; the Worker reads it. One
   stream. The storage choice is made then.
4. **Only if option 1:** the database change first (its own PR, migration `0131`
   is being kept free for this), then the shared wrapper, then one stream per
   group of saves.
5. **Drill again** after each piece.

## Running the drill

The measurements are the long pole, and they need hands on the Pi, so this is
written for Lutan to run alone.

### Before you start

- **Use test, not production.** The commands below end in `-test`.
- **Heads up:** test and production share one Pi and one tunnel. Stopping
  `cloudflared` and pulling the plug both take **production's Pi away too**, and
  production will fall back to the Worker. That is fine, it is the point, but
  choose a quiet moment.
- **Run the timer from somewhere that is not the house network** (a laptop on a
  phone hotspot). Otherwise losing the router loses your measurement.
- In one window keep the Pi's terminal open. In another run the timer below.

### The timer

It sends a harmless POST once a second and logs the time, the code, how long it
took, and which side answered. It does not save anything, because it posts to
a page that does not exist.

```bash
SITE=https://test.lannacare.org
CASE=stop-cloudflared    # change this per test: stop-cloudflared, stop-app, wedge-app, pull-pi-plug, pull-router
while true; do
  line=$(curl -s -o /dev/null -m 30 -X POST -d x=1 \
    -D /tmp/drill-headers -w '%{http_code} %{time_total}s' "$SITE/drill-probe")
  served=$(grep -i '^x-lanna-served-by' /tmp/drill-headers | tr -d '\r' | cut -d' ' -f2)
  echo "$(date +%H:%M:%S) $line served-by=${served:-none}"
  sleep 1
done | tee "drill-$CASE.log"
```

**What to look for in the log:** the served-by value changing, and the time it
takes to change. `pi` is the Pi, `worker` is the fallback, `pi-timeout` is a
write being refused. The code itself does not matter, only who answered.

### The tests

For each one: start the timer, wait 10 seconds so there is a normal stretch in
the log, do the thing, and **write down the clock time** in a second window
with `date +%T`. Let the timer run until the log is back to `pi` or you have
three minutes of steady `worker`, then stop it. Put the app back as it was.

| case | what to do | put it back |
|---|---|---|
| **stop-cloudflared** | On the Pi: `sudo systemctl stop cloudflared` | `sudo systemctl start cloudflared` |
| **stop-app** | `sudo systemctl stop lanna-care-test` | `sudo systemctl start lanna-care-test` |
| **wedge-app** (running but not answering) | `sudo kill -STOP $(systemctl show -p MainPID --value lanna-care-test)` | `sudo kill -CONT <the same pid>` |
| **pull-pi-plug** | Pull the Pi's power lead. Leave the router on. | Plug in and wait for it to boot |
| **pull-router** (the Pi has power, the house has no internet) | Switch off the router and fibre box | Switch on |

The last two are the likeliest real outages. A power cut at home is a Pi *and*
a router going together, so `pull-router` and then `pull-pi-plug` with the router
also off is closest to the real thing. Try both if you can.

### Write down for each case

1. The clock time you did it (from `date +%T`).
2. The first line where `served-by` was not `pi` and its time. That gap, in
   seconds, is the length of the window.
3. Every `pi-timeout` line. Count them and note how long each took (a long one
   is a stuck wait; a quick one is an immediate 502). The timer gives up after
   30 seconds and logs `000`; note that too, it means "no answer at all".
4. The first line where it is `worker` for good.
5. The code the Worker saw, if you can tell. Unknown is a fine answer.

### Did a real save happen exactly once?

The timer cannot test that, because it saves nothing. For one or two of the
cases, do this by hand on the test site during the outage:

1. Sign in on the test site.
2. Make one save with an unmistakable name (for example a note called `drill 1`
   with today's time).
3. Note what the screen said.
4. After the Pi is back, search for `drill 1` and count the matches.

**Exactly one match is a pass.** None is a refused save (expected in the window).
**Two is the worst result there is, and it must go straight to the top of the
paper.**

### Paste the results here

Put the numbers in this table. Until each cell is filled in, it stays "unmeasured".

| case | window before fallback | refused saves | save made, how many | notes |
|---|---|---|---|---|
| stop-cloudflared | unmeasured | unmeasured | unmeasured | |
| stop-app | unmeasured | unmeasured | unmeasured | |
| wedge-app | unmeasured | unmeasured | unmeasured | |
| pull-pi-plug | unmeasured | unmeasured | unmeasured | |
| pull-router | unmeasured | unmeasured | unmeasured | |

## What is not known yet

- **Every timing above.** No drill has been run for this paper.
- **Whether the shared key is live.** A form from one build fails on another
  unless they share a key, and a shared key fixes it; that was shown on plain
  builds and on the Worker’s own build. The key is in PR #312 and has to be in
  both machines’ values files and both builds redeployed before it counts. Until
  then a Pi-drawn form saved on the Worker still fails.
- **Whether saving fits the Worker's CPU limit.** Unmeasured. This is now the
  only open question on option 5.
- **How long past power cuts in Suphan Buri lasted.** Needed to size a battery.
- **Whether Workers KV's free plan suits a heartbeat.** My recollection is that
  it does not. Check before designing around it.

## The decision for Lutan

Two questions, in order:

1. **Is a small refused window acceptable?** With a battery and health routing,
   a save made in the first few seconds of an outage might still be refused. The
   person sees "check whether your change was saved before trying again".
   If yes, we do pieces 1 to 3 and stop. If it must be zero, option 1 is the
   only way, and that is a multi-week build.
2. **Do the drills first?** I recommend yes: the answer to question 1 depends on
   how long the window is, and that is exactly what the drill measures.

Once agreed, the recommendation is recorded in `docs/decisions/` as
`2026-10-02-pi-failover.md`. It has not been written because nothing has been
agreed.
