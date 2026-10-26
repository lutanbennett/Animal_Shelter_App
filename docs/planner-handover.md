# Planner handover — edition `384`, 2026-10-26

**A delta, fifteenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `393`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## WHAT `375` ASKED FOR, and what each warning actually did

- **"A production check that does not exist is not a parked question." FIRED — then turned on its
  author.** `375` was right that writing the instrument is the high-yield move. What it did not say
  is that **an instrument which already exists can still be wrong**, and that cost more this round
  than a missing one ever has. See the next section; it is the whole of this edition.
- **"Capture the actuals before archiving." FIRED, nine of nine**, every read with the process alive
  and `context.session` checked against the id passed. **One figure was still lost** — an unplanned
  tenth stream whose process had gone — recorded `unmeasured`, never guessed.
- **"A note from a session is its report, not proof." FIRED AGAINST ME, second round running.** A
  stream distrusted my brief, re-ran the check I had quoted, and found it wrong. **Both rounds this
  rule has fired, it has fired against the planner, not the streams.**
- **"Check PR state with `gh`, not the session list." HELD, did not fire.** They agreed all day.
  Keep it: six editions of evidence outweigh one quiet round.
- **The `src/lib/releases.ts` collision rule is STILL UNTESTED — third round.** Again only one
  stream carried a release note. **Carry it untested; do not promote it and do not tidy it away.**
- **Band discipline held well** — nine streams banded, seven inside, one under, one 0.5% over, plus
  one large planner error corrected below.

## AN INSTRUMENT THAT EXISTS IS NOT AN INSTRUMENT THAT IS RIGHT — four times in one day

The one thing to take from this round. **Promoted into the skill** (step 7, the
planner-touches-production rules); repeated here only because the four together are the argument.

1. **A check whose pattern matched nothing reported "called by nothing".** I ran it, believed it,
   told Lutan, and **wrote it into a brief as settled fact.** Two of the four objects had live
   callers; dropping them would have broken a working policy. Caught only because the stream
   doubted the brief.
2. **A harness's headline count was 75% dev junk** — "118 unexplained orphans", of which **88 were
   disposable one-card dev logins** created by earlier streams on the shared dev database. The real
   figure across the live roles was 30.
3. **A production check reported a retired role as a live one.** It filtered built-in roles but not
   **archived** ones, so a role retired a fortnight earlier appeared as a seventh live role holding
   thirteen cards. **Lutan found this himself**, reading a stream's report: *"I thought that was
   removed long ago."* He was right; the instrument was wrong.
4. **And then it happened again, hours later, in a merged migration** — after I had messaged the
   running stream to warn it. It reasoned "Manage medical is held by staff only", which means
   **nobody**, and moved a capability onto a card no live role holds.

**The common shape: each was a trusted, named, committed instrument, quoted without anyone reading
what it matched on.** The cost is not a wrong number — it is a wrong number wearing the authority of
a check, which everything downstream then inherits silently: a brief, a backlog item and a merged
migration all carried one before anyone noticed.

**Before quoting any check: read its query or its pattern, and say which database it ran against.**
All four were visible in under a minute.

## RULING OUT ONE MECHANISM IS NOT RULING OUT A CAUSE

The round's other planner error, and a cleaner lesson than the first because it is purely logical.

Chasing a dead scheduled job, I established that deploys re-register the schedule and that many
deploys had happened since it died — and concluded **"so it cannot be a deploy."** That correctly
rules out a deploy *wiping* the schedule. **It says nothing about a deploy breaking the thing the
schedule invokes, and I let it rule that out too.** Half a day went to the wrong suspect.

What actually found it was **Lutan asking whether two environments conflicted.** They do not — but
checking the second environment showed **both had died, each on its last cycle before its own
deploy.** The pattern was invisible while only one environment was being looked at.

**Two habits out of this: when you eliminate a cause, name the exact mechanism you eliminated and
nothing wider; and when something fails in one environment, check the other before theorising.**

## BAND CORRECTION — count what the stream must DECIDE, not what it touches

A schema stream was banded **340–430k** and came in at **251,628 — 26% under**, having delivered
everything.

**The band came from "grants re-cut across nineteen roles". The cost was one migration whose
decisions were already written out on the item in Lutan's own words.** The skill already says a
schema PR with nothing left to discover costs barely over the floor; I had the rule and did not
apply it, because nineteen of anything reads as big.

**Nineteen rows is not nineteen decisions.** It still cost 251k rather than 140k *because* real
decisions remained — the shape of a card split, and which holders it must preserve. **Count those.**

**The walkthrough rate held again**: a driven re-pass banded at `88k + 9.8k × steps` landed within
11%, step count taken from the walkthrough file by the skill's one-liner, not from the item's prose.
**Still the most reliable estimator in the file.**

## A NEW HABIT THAT PAID, AND ITS LIMIT

**When context changes mid-batch, message the running streams rather than waiting for their PRs.**
Twice this round Lutan gave an answer that changed work already in flight — once removing a risk two
briefs told their streams to agonise over, once correcting evidence a stream was about to rely on.
Both went out within minutes.

**The limit, learned the same day: a message only helps if it arrives before the reasoning.** The
second one did not — the stream had already written the contaminated line into its migration. **So
message early, and do not treat having sent it as having fixed it.** It is the same trap as writing
a mitigation into a brief and recording the problem as solved.

## WHAT WENT RIGHT AND IS WORTH KNOWING WENT RIGHT

- **Every figure was checked against what the stream actually delivered** — diff, elapsed time and
  `Messages` — before being banked. All nine survived that test this round.
- **No item went invisible, second round running.**
- **A false block was found and closed.** A card report had been carried as "the last one awaiting
  his answer" for two rounds; its only open question was a decision filed separately **and already
  answered.** One question recorded twice becomes a false block the moment one copy is answered,
  **and nobody re-asks a question they believe is already with him.**
- **A stream fixed a cause rather than a symptom** — told four saves were broken, it found a policy
  refusing the card's own activity, and said so in the migration header.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage** — report the
  figures, forecast in one line, then work.
- **Never write scratch output above the repo.** `git show <rev>:<path>` still lies about dotted
  paths and still reports zero when piped.
- **`worktree.mjs done` refusing is information**, and its suggested flag is not advice.
- **The planner is the only role that can read production**, and the yield stays high enough to do
  it before planning anything — now with the caveat above about reading the instrument first.
- **A measurement has a timestamp; a fact does not.** Quote production readings with the clock.

## NEXT ROUND POINTS AT

1. **The dead scheduled job is the oldest thing on the board and is now diagnosed, not mysterious.**
   Both environments, each dying at its own deploy; the schedule itself is correct and re-creating
   it changed nothing. **Re-read the item: it names the one hypothesis left and the cheap test that
   kills it, and says plainly what not to try again.**
2. **His card review is no longer the gate** — every report is answered. What remains is build work
   plus one rebuild he will do himself: **he intends to reassign every role's cards from scratch**
   once the cards are finished.
3. **Almost nobody is using the system yet**, which is why the one-way-door ceremony on card splits
   is now a formality. **The one dated exposure is a volunteer expected on Wednesday 28 October.**
   Re-read that note before assuming it still applies.
4. **A capability now sits on a card no live role holds** — the tail of instrument failure 4. It
   belongs to his rebuild, not to a stream, but he should not meet it by surprise.
5. **The battery for the Pi**, and **the tunnel drill** — his hands, his timing.
6. **Leftover worktrees and a husk** wait on sessions being closed. `held` is the column to read
   before touching any of them; `/clean-streams` does the round.
