# Planner handover — edition `773`, 2026-11-23

**This is a DELTA against `772`.** It says what changed, corrects its predecessor, and reports what `772`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS NINE STREAMS, ALL WITH FIGURES, ALL FROM ONE DAY.** `#thpfx` (#1847),
`reels-batch-metadata` (#1849), `backlog-proof-and-dates` (#1850), `ci-check-coverage` (#1851),
`pi-absolute-url-guard` (#1852), `reel-picker-warning` (#1859), `admin-home-role-chips` (#1860),
`reel-clip-progress` (#1861), `shelter-website-unlock` (#1862). **PR #1853 was the planner's own
strict-check PR and does NOT count.** **Three more streams were set up after this was written
(`#pacon`, `#pfive`, `#shrun`, ports 3007-3009) and are NOT covered here** — their figures are the next
edition's. The counter resets to 0 when this PR merges.

**FIVE PLANS IN ONE DAY, which is the context for everything below.** `772` covered thirteen streams
across three plans; this one covers nine across two more. **The backlog went from a pool of one buildable
item at 10:00 to eight by 15:00**, because streams file findings faster than streams consume them.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, ~80 lines, the twenty-second plan.
2. **`gh pr list --state open` BEFORE you believe anything here.** On 2026-11-23 a batch went from set up
   to merged in under half an hour, twice. **Anything this document says about what is running was
   probably untrue before you read it.**
3. **FOURTEEN MERGED WORKTREES NEED CLEARING**, all `HELD` by idle sessions. **Every figure is already
   read and recorded, so nothing is lost by waiting. Ask Lutan; do not force.**
4. **`0.49.0` SHIPPED**, cut by the release manager. **Production runs `0.49.0` @ `9fc01bdc6`.**

## THE DAY'S LESSON, AND IT COST HIM FOUR INTERRUPTIONS: THE ITEM IS NOT THE RECORD

**Four times the planner asked Lutan for something already done or already answered.** His words, and
they are the measure of the day: ***"why is this so hard, it has happened multiple times this morning
that you already had the information and were trying to get me to do something again"***.

1. **`#u2bo6`'s deploy** — done 2026-11-06, with a stale *"Still to do"* line **below** a `SUPERSEDED`
   marker. **Two sessions read it wrong the same day.**
2. **`#shfil`'s question** — answered three times. The item said *"nothing here is waiting on him"*
   higher up than the paragraph re-asking it.
3. **`#gcprd`'s console trip** — the 19 redirect URIs have been in `docs/google-cloud-inventory.md:111`
   since 2026-11-21, and the item claimed *"nothing in this repository records which URIs that client
   has"*. **That false sentence is what sent him to look.**
4. **The connect press** — the planner said there would be no warning, **from the code on `main`, without
   checking which code production was running.** Production was `0.48.0`, which predated the fix by hours.

**ALL FOUR ARE ONE FAULT AT DIFFERENT DISTANCES: reading the item, or the repository, instead of the
thing actually running.**

**THE INSTRUMENT BUILT THAT MORNING ONLY CATCHES HALF OF IT.** `#prvln` now makes an item **say** how to
check whether a step is really his, and **13 `waiting:lutan` items carry a `**Proof:**` line** written by
the planner. **It does not make anyone run the check.** That unbuilt half is the half that would have
caught all four. **`#prvln` is PARKED — he was offered it and said "Not now" while cutting a release.
Raise it once, when he is not mid-release; do not start it unasked.**

## `#prvln`'s GUARD IS NOW STRICT, AND IT CAUGHT ITS OWN AUTHOR

`PROOF_STRICT` defaults on since PR #1853: an item tagged `waiting:lutan` with no `**Proof:**` line
**fails** (exit 3). **Done in this order on purpose — lines first, then the check run with
`BACKLOG_PROOF_STRICT=1` against `main` and seen to pass, and only then the flip** — because flipping
first would have put a blocking check red on `main` about data nobody had filled in, which is `#ckcia`'s
own fault one layer along.

**Within hours it refused the planner's own commit**, for retagging `#rlprg` to `lutan` with no proof
line. **A guard that catches its author on the day it ships is better evidence than any fixture.**
`BACKLOG_PROOF_STRICT=0` returns it to reporting.

## WHAT `772` LEFT OWED

1. **The `scheduled_writer_runs` read** — **STILL UNFILED, third edition running.** **Either file it or
   write down why not.** Carrying it forward silently for three editions is itself the finding.
2. **His Cloud console look** — **DONE.** The scope is **not sensitive**; he measured it.
3. **Production's `DRIVE_CREDENTIALS_KEY`** — **DONE**, and more besides (below).
4. **Clearing merged worktrees** — still owed, now fourteen.

## WHAT WAS DELIVERED TO PRODUCTION, AND HOW

- **The platform files folder** created on the Cooper Jaidee Drive; its id recorded, never printed.
- **The Google connect client live on the Pi — AND NO SECRET WAS REGENERATED.** Lutan said he could not
  get the secret without regenerating the client. **He did not need to: the one required was already in
  `.env.deploy.uat`** (suffix `LzIH`, matching `docs/google-cloud-inventory.md:111`), **because ONE
  client serves every environment — its 19 redirect URIs already include `lannacareforanimals.org`.**
  Copied as a **matched pair** and carried to the Pi **over ssh on stdin**, so no value touched a command
  line, a shell history or a process list.
- **`#calsc` and `#gcprd` are DONE**, every clause observed on production: no `unverified app` screen,
  the calendar created, appointments appearing in it, Drive still connected — **and the first clean
  calendar poll since 2026-11-19**, when the old token was revoked. **Read from the live database, not
  taken on report.**
- **A DEAD PERMISSION RULE FOUND:** the only Pi allow rule named `lanna-pi.local`, which stopped
  resolving when the Pi moved subnet, **so it had never matched the commands actually run.** A rule for
  `lanna-pi-mesh` was added on his go, the settings file backed up and re-parsed afterwards.

## THE BAND FINDING OF THE DAY, AND IT IS THE PLANNER'S HABIT RATHER THAN THE TABLE'S

**SEVEN UNDERS IN TWO DAYS, ONE CAUSE: a brief that hands over the cause, the decision AND the shape of
the fix lands near the floor, and the planner keeps pricing the question the brief already answered.**

`#1829` -27k · `#1845` -21k · `reels-batch-metadata` -20k · `backlog-proof-and-dates` -11k ·
`reel-picker-warning` -30k · `reel-clip-progress` -7k · `shelter-website-unlock` -24k.

**THE SHARPEST READING: `reel-picker-warning` carried TWO items and still came in 30k under.** Folding
did not make it dear, because both answers were handed over. **So folding two well-briefed items should
be priced near the quick-win row plus a little, not at the sum of two ordinary streams.**

### Figures — nine streams

| PR | slug | band | tokens | messages | floor | verdict |
|---|---|---|---|---|---|---|
| #1847 | `thai-prefix-500` | 150-190k | 188,445 | 98,428 | 90,017 | in band |
| #1849 | `reels-batch-metadata` | 175-215k | 154,880 | 62,253 | 92,627 | **UNDER 20k** |
| #1850 | `backlog-proof-and-dates` | 170-210k | 158,948 | 69,526 | 89,422 | **UNDER 11k** |
| #1851 | `ci-check-coverage` | 150-190k | 157,978 | 65,231 | 92,747 | in band |
| #1852 | `pi-absolute-url-guard` | 165-205k | 165,164 | 75,742 | 89,422 | in band |
| #1859 | `reel-picker-warning` | 175-215k | 145,541 | 55,396 | 90,145 | **UNDER 30k** |
| #1860 | `admin-home-role-chips` | 150-190k | 159,373 | 65,903 | 93,470 | in band |
| #1861 | `reel-clip-progress` | 155-195k | 147,558 | 55,750 | 91,808 | **UNDER 7k** |
| #1862 | `shelter-website-unlock` | 185-225k | 160,770 | 68,738 | 92,032 | `rescoped=yes` — **not a reading** |

**Eight usable: four in band, four under, none over.** Dials matched the brief on all nine.

### The floor — eight readings, 89.4k to 93.5k

`89,422 · 89,422 · 90,017 · 90,145 · 91,808 · 92,032 · 92,627 · 93,470`. **`89,422` appears twice for two
unrelated streams — the exact repeat recurring for a fifth day.** **Record it; offer no cause.**
Re-derive from the next complete set. **Do not shift the scale rows to match.**

## THE TWO RULES EARNED TODAY — DO NOT RE-LEARN THEM

- **ONCE A SESSION MAY HAVE OPENED, A BRIEF IS FROZEN.** Send the correction to the session or do not
  make it. **Verifying the FILE proves the wrong thing** — the planner patched `#rlbat`'s brief, verified
  it on disk, and the running session never saw it. **Lutan was then asked the same question twice and
  gave two different answers**, and the one that shipped was not the one he gave the planner.
  **Corollary, used successfully the same day:** a brief whose session has NOT opened can still be fixed,
  and was — `onboarding-runbook` was corrected minutes after setup when a stream's `rescoped=yes` showed
  the console control it described had not shipped.
- **A `SUPERSEDED` MARKER GUARDING A LOWER HALF IS READ BY WHOEVER STARTS AT THE TOP, AND THE CONVENTION
  — `plan-day/SKILL.md:251`, `tail -c 900` — IS TO START AT THE BOTTOM.** **Cut a superseded half rather
  than marking it**, or quote its first words, dated, in the head's sentence.

## PROCESS NOTES

- **`rescoped=yes` IS A SIGNAL TO ACT ON, NOT JUST A FLAG TO EXCLUDE.** `shelter-website-unlock` carried
  *"(schema half only; console control follows)"*, which is how the planner learned its sibling brief was
  wrong. **Read the comment's tail, not only its fields.**
- **Check the SCHEMA before planning a schema stream.** `#wbopn` read like a two-batch schema item;
  `shelters.public_site` already existed. **One minute of reading saved a batch.** **And the reverse bit
  the same day: `#pacon`'s card needs "the website", and `shelter_hosts` has no primary — `is_primary`
  was deliberately dropped.** **The column existing is not the same as the thing being storable.**
- **A planned stream that ships only half still counts once.** One stream, one PR, one count.

## STILL OWED

1. **The `scheduled_writer_runs` read.** Third edition. **File it or kill it.**
2. **Clearing fourteen merged worktrees**, on his word.
3. **`#rlprg`'s two drivable proofs** (phone viewport, retry lighting the right row) and its last clause,
   which is him on a real phone.
4. **`#prvln`'s second half**, parked by him.
