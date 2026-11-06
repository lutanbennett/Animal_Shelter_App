# Planner handover — edition `672`, 2026-11-06

**A delta over `663`.** It covers one plan of **nine streams in three batches** — batch 1 (#1325,
#1326, #1327), batch 2 (#1328, #1329, #1330), batch 3 set up — all of it inside one day, because
`663`'s plan finished overnight and this one was re-planned from scratch the same morning.

> **Written at the last batch's SETUP, as the rule requires, so ITS figures are NOT in it.** They
> land in `681`.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `681`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE LEAD: THE PLANNER PUT A QUESTION TO LUTAN ON A GREP THAT PROVED NOTHING — AND THE BRIEF'S OWN HEDGE CAUGHT IT

**The round's one interruption, and it is the planner's.** `maintenance.photos` appeared nowhere in
`src/lib/permissions/cards.ts`, so the planner wrote *"no card grants it"* into a brief **and into the
`AskUserQuestion`**. He ruled *give it a card*. **The grant was there all along** — `do_maintenance`
holds it via `src/lib/permissions/jobs.ts:108` and migration `0257:295` — so the stream established
the card already existed and **he had to be asked a second time to unwind his own ruling.**

**What stopped a wrong card shipping was one sentence in the brief:** *"THESE ARE GREPS OF `cards.ts`
ONLY. They are NOT a reading of the live database."* The stream read it, checked, and corrected the
planner inside the same batch. **The rule that a brief saying what the planner has not established
gets corrected, while one that asserts gets obeyed, has now paid for itself in the most direct way
available.**

**THREE THINGS FOLLOW, AND THE THIRD IS THE EXPENSIVE ONE.**

- **A grep of one file is not a reading of a permission system.** A grant can be assembled somewhere
  else — here, in `jobs.ts`. **Resolve grants the way the app does** (`scripts/lib/load-cards.mjs`,
  which `check-cards-count.mjs` and `check-card-walkthrough.mjs` both already use).
- **The hedge is not a formality. Write it even where you feel certain** — this is the case where the
  planner felt certain enough to spend Lutan's attention on it.
- **THE SAME FALSE LINE HAD ALREADY COST TWO PLANNING ROUNDS SOMEWHERE ELSE.** `#79sqf` carried *"none
  does"* about `maintenance.photos` as the reason its browser drive could not be done, and **it was
  deferred twice as blocked. It was never blocked.** Struck in place on the item, with how it got
  there, and stream 9's brief carries the correction, because a correction on an item is invisible to
  a stream that reads its brief first.

**And the mirror check this exposed is now `#n5r7k`:** `role-cards-coverage` asks whether a card does
nothing; **nothing asks whether an activity is granted by nothing.** Its first trap is the one above.

---

## THE BAND OVERRUN, AND THE ROW IT PROMOTES

`reels-app` came in at **345,126 against 200–255k — 35% over**, `compacted=no rescoped=no
finished=yes`, with `Messages` of 248,301. **A clean reading and a real overrun, and it is the
planner's.**

The band said *"a new surface people submit data through, modelled on an existing memes screen"* and
took the lower edge **because of the modelling**. **Two of the three expensive halves had no model in
memes at all:** memes are **images** and a reel is a **video**, so the stream had to lift the resumable
Drive upload loop and the video streamer out of the resident-video path into shared helpers, plus two
upload routes, a playback route and a player; and **the memes screen has a separate picker, not a `#`
parser**, so the tag field came from elsewhere. Its own PR lists **ten things reused and seven written
fresh**, and the fresh ones are the dear ones.

**The tell the planner already had and did not read: `0322` added `duration_ms` and reused
`video_uploads` from `0229`.** A schema half reaching for a *different* feature's machinery is saying,
in the only place it can, that the new thing is not a variant of the old one.

**Promoted into the skill's band table** rather than left here: *"modelled on an existing screen" is
not a discount until you write down what that screen does NOT do, and band those parts separately.*

---

## `663`'s OWED LIST: WHAT EACH ONE ACTUALLY DID

1. **Production four migrations behind → now SIX (`0318`–`0323`), and stream 8 will make `0324`. HELD
   AND WORSE.** Still his deploy. Every brief in batches 2 and 3 writes `n/a` on the release-note line
   because of it. **The one exception is batch 3's stream 7**, which needs no migration and may tick
   its note — worth knowing, because three editions running have said *nobody may tick a note*, and
   that is a per-stream fact rather than a standing one.
2. **`#8bz78` (reels) first in the next plan → CLOSED.** Both halves shipped in batches 1 and 2, and
   its remainder is batch 3's stream 8. Displaced twice, built once.
3. **`#dklvq` owed TWICE → CLOSED.** Shipped in batch 1's folded `scripts/` stream.
4. **`#79sqf` kept out, goes in the next plan → SET UP as stream 9**, and the reason it had been held
   turned out to be false (the lead).
5. **`#prr9h` is his number 3 and NOT buildable → WRONG BY THE NEXT MORNING, and this is a correction
   rather than a change of mind.** Its head now reads *CAUSE FOUND*, names the line, names the fix and
   says **"Own stream"**. It is his number two and batch 3's stream 7. **An item's buildability has a
   clock on it exactly like a count or a conclusion; a handover must not be read as settling it.**
6. **`#7aev4`'s three remaining things each need a number from him → HELD, unchanged.**
7. **The role-shaped instruments → HELD, fifth edition. Unchanged, unpretended.**
8. **Leftovers → PARTLY DONE.** Batch 1's three were cleared; `assistant-tag-retry-and-proof`'s
   `done --stop-servers` was **refused by the auto-mode classifier** (*Interfere With Workloads*) and
   left for Lutan rather than retried. PR #1314 is still the release manager's.

---

## MITIGATIONS WRITTEN INTO THIS PLAN'S BRIEFS: SIX FIRED, NONE FAILED

Checked rather than assumed, because a mitigation is a hypothesis until it fires.

1. **"Greps of `cards.ts` only, not the database"** → **fired** (the lead). The round's best line.
2. **Naming `check-card-walkthrough.mjs` as an instrument** → **fired**: #1329 regenerated the
   generated file and wrote a real read-back step. It would have gone red otherwise, on a change its
   item never mentioned.
3. **Strengthening the usage block after #1325 posted none** → **fired**: all three of batch 2 posted
   one. #1325's figure is `unmeasured` for good; the comment is the only durable record.
4. **Option (c) framed as a judgement rather than a ban** → **fired**: #1328 declined to put an
   author-keyed skip in `check-test-plan.mjs` **on stated grounds** and recorded the reasoning. The
   planner's first note had said "forbid it", which was a prohibition asserted without reading what it
   protects; the brief corrected itself before the stream saw it.
5. **The `video_uploads` regression as a numbered deliverable** → **fired**: #1330 proved a resident
   video still records its owner through the refactored path.
6. **"No migration — write the SQL into your decision file instead"** → **fired**: #1330 put the
   `can_see_drive_file()` fold-in SQL in its decision file, and it is now stream 8's deliverable 1.

**One NEW collision shape, caught at setup and recorded in `.plan-day.md`: a MEASUREMENT deliverable
collides with its own batch through the MACHINE, not through files.** Stream 7 must measure, and two
siblings each run a fifteen-minute `gates.mjs` beside it. It was kept in the batch on a stated ground —
the payload difference is two orders of magnitude, which dwarfs the 12–17 points of load noise
`docs/decisions/2026-11-02-public-site-speed-bisect.md` measured, **and its brief asks for bytes and
request counts rather than a stopwatch.** **A stream that must report a TIMING does not belong in a
busy batch.**

---

## WHAT IS SET UP AND WHAT IS OWED

**Batch 3, set up and handed over 2026-11-06** — composition, ports, the swap and the collision
reasoning are in `.plan-day.md`, which this does not reproduce. **Two of its three streams were swapped
on his own panel, which moved at 04:22 while batch 2 ran**: read the panel on a RESUME, not only on a
fresh plan, or his number two waits a whole plan.

**Owed to the next planner:**

1. **`#p3k9w` and `#c7zjk` go to the front of the next plan.** Displaced by his ranking, not dropped,
   unstarted. `#p3k9w` lost the migration slot; `#c7zjk` would have collided on the dictionaries.
2. **`#i7qkz` (the `social.library` split) is next after those**, and stream 8's brief forbids
   pre-empting it. It is his number seven and the right home for *"should Reels have their own card"*.
3. **`#v9t4m` is starred on his panel AND already ticked** — an orphaned pick, named to him rather than
   silently dropped. He can take the star off.
4. **Three of his seven picks are not streams at all**, third plan running: `#314hq` (the production
   apply and the `/bills` press), `#7aev4` (needs a number from him), `#svs6c` (Pi stage 2, his
   decision after the measurements). **Say so when his order is reported.**
5. **Thai is unreviewed across the board**, and every stream this plan said so unprompted. **Do not let
   one tick it as reviewed.**
6. **A release is the natural next step**, and it is the thing standing between six merged migrations
   and any of them being live.
