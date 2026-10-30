# Planner handover — edition `492`, 2026-10-30

**A delta, twenty-seventh edition in this shape. Nine streams** — three batches of three, all in one day,
all `claude-sonnet-5-5` / `low`. `483`'s subject was *work written in the wrong place is invisible, and no
check we have sees it*. **It held where it was made mechanism, and the class recurred twice in the one
shape no mechanism covers: a stale TITLE.** But the round's real subject is the opposite of a fault —
**the thing that worked, three times, was writing down what I had NOT established.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `483` → this. **The next slug is `501`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: A BRIEF THAT SAYS WHAT THE PLANNER HAS NOT ESTABLISHED GETS CORRECTED. ONE THAT ASSERTS GETS OBEYED.

Three instances this round, and in each one the stream came back with something I could not have reached:

- **A premise I thought was conservative was wrong in the other direction.** The documents item described
  a large gap. I wrote into the brief *"a grep that finds three sites is not proof there are only three
  places a document is opened"* and named four more files to look at. **The stream found that attachments
  — blood tests, procedures, clinic reports, adoption updates — were ALREADY served through the app and
  the Pi mirror.** The real gap was three links, and the helper they used now has no callers at all. **I
  had expected the correction to widen the job; it shrank it.**
- **A question I could not answer got answered.** The same item asked for *"a link drawn only for a login
  whose cards let it read that file, asking the same activity the route asks"* — but the route asks a
  **row**, not an activity: it calls one database function as the caller and lets row-level security
  answer. I wrote that contradiction into the brief **in those words, as not established**. The stream
  settled it, recorded the order the route asks in, and said *"no link is drawn that the route would
  refuse."*
- **An "existing behaviour, not a bug" note stopped a false finding before it was written.** `0283` had
  already made a Night tick box appear on the prescription form, as a side effect. Told so, the stream
  treated it as something to finish.

**The counter-case is in `483`'s own round**, where three briefs *upgraded* an item's open question into a
finding and the stream disproved each one. **Same axis, opposite sign.** The skill's rule has always been
the negative form — *never upgrade an open question into a finding*. **Promoted this round in its positive
form, because the negative form reads as caution and this is a yield.**

## WHAT `483` ASKED FOR, and what each warning did

- **"Work written in the wrong place is invisible." HELD where it was made mechanism; RECURRED where it
  was left a habit.** The *report every deliverable* block has now fired on three batches running, and the
  best instance reported a deliverable it had deliberately **tolerated** rather than fixed. **But the
  stale-title shape appeared twice more** — two items ticked correctly, with correct tails, whose **heads**
  still read *"nothing left to decide, buildable now; schema first, then the app"*. Caught both times by
  reading the title alone, which costs about a minute a batch. **This is not a stream failing:** a stream
  writes its tick and its note and leaves the head as it found it. **It is the planner's minute.**
- **"Name the INSTRUMENTS by path, not just the rules." HELD, three rounds, cleanly.** Every brief named
  `scripts/lib/exit.mjs` and the libuv assertion, and said most check scripts take no arguments. **No
  stream re-diagnosed a solved problem and none passed a stray argument.** One stream met an unexplained
  build failure, said it passed on a re-run alone, and **declined to theorise** — which is the behaviour
  the block is for.
- **"A migration file is a historical record, not current schema." HELD.** Carried into every brief this
  round; no stream aged a migration file. Worth keeping: it costs one sentence.
- **"When an item names a check only the main checkout can run against production, run it." FIRED, and it
  paid for itself twice.** The prescriptions schema stream correctly left its fix list **not established**
  on production. I ran it: **empty** — so the condition gating the whole rebuild (*"the forecast is not
  switched over until that list is empty"*) was **already met**, and the one row on dev was test data that
  would have read as a person's fix. **An unrun check was holding a gate open that was not shut.**
- **"File an item at least one daily merge before briefing it." CLOSED — and it was owed for two
  editions.** All three streams this round ticked their own items; I ticked nothing on their behalf. The
  new item I filed (below) went onto the board **a full merge before anyone will be briefed from it.**
- **"Nothing is now owed across editions. Do not let one accumulate again." HELD.** Two skill edits are in
  this PR, not deferred.
- **"A figure measured once is a reading, not a rate." HELD, and I applied it against my own interest** —
  see the bands.

## THE GAP NOBODY COULD HAVE TICKED, and why it is a filing fault rather than a security one

`can_see_drive_file()` is the **single** access decision the file routes ask, as the caller, so row-level
security answers it. **Three kinds of file are not in it** and are checked in app code beside it instead:
memes, donation receipts, and the resident deceased summary and offline index. **Each was deferred to "the
next schema PR", and that PR has since come and gone twice.**

**It is not a hard-coded-security breach and the check agrees** — each app-code check is still asked as
the caller, and no role name is read. **The fault is that one access decision now lives in four places**,
so a change to who may read a receipt is made in app code while the same question about an attachment is
answered in SQL, and only one of the two is visible to a policy review.

**Why it had no item:** every instance existed only in a route comment, a decision file, or **the tail of a
ticked backlog item.** Nobody re-reads a ticked item, so there was nothing to schedule and nothing to tick.
**This is `483`'s subject in its purest form, and the only thing that finds it is a planner reading the
tails of items the streams touched.**

## DISJOINTNESS HAS A SECOND AXIS, AND IT IS NOT THE FILES

I had moved a small, decided card retirement into this batch on backlog priority. **Right about priority,
wrong about collision — and I caught it at setup rather than mid-flight.** Dropping that card would have
changed the card counts and grants that three check scripts read, **on the dev database all three streams
share**, while one stream's entire job was to take the first accurate count of which checks are red.

**Files are not the only way two streams collide: the shared dev database and the check suite are the
other.** And the distinction that makes it a swap rather than a brief note: **ignoring a known red is cheap
— batch 7 did exactly that and it held — but taking a census while someone edits the register is not.**

**Promoted into the skill's disjointness rule.** The retirement waits a batch and loses nothing.

## THE BANDS: ONE CORRECTION, AND ONE READING I AM REFUSING TO PROMOTE

**Six clean readings across two batches, five inside their bands.** The sixth went **+1.3% over**, and
`.plan-day.md` had recorded the day before, under *the band risk I am watching*, that its hardest
deliverable had no settled answer and that **an overrun there would be the band's fault and not the
stream's.** It was. **A risk written down in advance and then realised is the system working**, and it
should be recorded that way rather than as a miss.

**The correction: "re-prove" is far cheaper than "edit", and briefs should say which they mean.** One
stream re-proved nine readers and **edited none**, saying so per reader, and landed mid-band on a function
rewrite. **Name the readers and ask for a re-proof; do not imply a sweep.**

**The reading I am NOT promoting: a documentation-only stream is not a quick win.** One came in near the
top of a quick-win band, because it read `git log` on two files to establish *when* a claim went false,
chased it into a second document, and produced the better finding — *"went stale, not wrong when written"*
rather than *"was wrong"*. **That is one reading, so it is an instruction in `.plan-day.md` for the next
one, not a band.** `483` taught me this by having a rate corrected within hours of promoting it; the
*find-little driven pass at ~5k a step* still has three readings and is **still not promoted** for the
same reason.

## STATE, RE-READ EVERY TIME

Nothing in this section may be quoted from here. **Re-read it:** open items and their titles from
`docs/backlog.md`; batches, bands, actuals, the mitigations in flight, the batch-10 candidates and the
band instructions for the find-little and documentation rates from `.plan-day.md`; release and migration
state from `apply-migrations.mjs --status --env production`; what merged from `gh pr list`; live worktrees
from `worktree.mjs list`.

**What is with Lutan** changes daily and is listed in `.plan-day.md` under his decisions — read it there.
The standing ones that shape sequencing rather than appearing as tasks: **the production Worker deploy and
the Pi install are his by instruction**, so any stream whose work only runs after one of those **must write
`n/a` on its release note** and name the outstanding step; **the domain move gates two free Cloudflare
steps**; and **a release has two halves on this project** — a Worker deploy alone does not change what
users see, so read the Pi's version endpoint against the Worker's rather than trusting a 200.

**One piece of housekeeping that will bite the next planner if it is not read:** a merged batch's worktrees
stay **HELD** while their Claude sessions are open, so the next batch's ports step forward instead of being
reused, and `worktree.mjs done` must not be forced on them. **Ask Lutan to close those sessions; never tear
down a HELD folder.**

**NEITHER SUPABASE PAID FEATURE MAY EVER RETURN TO ANY LIST** — session inactivity timeout and
leaked-password protection are **dropped, not deferred**:
`docs/decisions/2026-10-29-pro-only-features-are-dropped.md`.
