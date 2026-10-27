# Planner handover — edition `402`, 2026-10-27

**A delta, seventeenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `411`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## WHAT `393` ASKED FOR, and what each warning actually did

- **"A prior pass has an expiry date." FIRED, and then was found to be HALF the lesson.** It is true,
  and the skill now carries it. What `393` did not say is that **a prior pass is only one of the
  things a brief can be over-confident about** — see the next section, which is the whole of this
  edition.
- **"Band the harnesses that are RED, not the ones the item names." FIRED once, then went untested** —
  the harness sweep was deliberately not scheduled again (it would have collided with the doctors
  stream in `scripts/`). Carry it.
- **"Do not band a stream for a proof it cannot run." FIRED, and its mirror image appeared.** The
  doctors stream could not read production and said so plainly; **the planner ran the check and
  unblocked it in one command.** That is the rule working. **But note the inversion:** the stream had
  to *build* the instrument before the planner could run it, so the sequence is **stream builds,
  planner runs** — neither half alone was enough.
- **"Check PR state with `gh`, not the session list." FIRED THREE MORE TIMES**, once per batch.
  `list_sessions` reported merged PRs as **OPEN** every single time. **Always a false OPEN, never a
  false MERGED.** Eight editions of evidence; stop re-deriving it.
- **The `src/lib/releases.ts` collision rule is TESTED AT LAST, after five rounds untested.** Four
  streams added four notes across two batches and **every line survived.** **It can stop being
  carried as a hypothesis.** One cosmetic residue for the release: three notes are bare strings and
  one uses the `{ text: … }` object shape.
- **Band discipline: eighteen streams measured, fifteen inside or under, two over, one not a
  reading.** Both overruns were planner band errors, not stream overruns.

## THE ROUND'S LESSON: THREE BRIEFS, THREE DISAGREEMENTS, AND THE STREAM WAS RIGHT EVERY TIME

**Promoted into the skill** (step 7, beside "write the planner's evidence in"); here because the
pattern across all three is the thing to carry, not the three incidents.

Every one had the same shape: **the brief was more certain than the item it came from, or than the
evidence supported.**

1. **A card re-pass** was told its three cards had "never been driven". The planner's `grep` over
   `docs/decisions/` missed the whole `card-report-*` family — seven streams, 27 of 32 cards.
2. **The manual fix** was told to remove a by-name fallback. It had been deleted the previous day,
   **and the item's own HEAD said so**; the planner had quoted the item's *tail*, a paragraph headed
   *"what the manual does today (read 2026-10-25)"*. **An item's head is its current statement; its
   tail is history, and a dated state description ages in place.**
3. **The doctors gap** is the one that should sting. **The item was careful and correct** — it said
   the app uses *"the ordinary signed-in client"* and that the fault was **"NOT ESTABLISHED ON THE
   LIVE DATABASE … so BUILD THE CHECK FIRST."** The brief rendered the client as *"the service
   role"* and **converted the open question into a verified fact**, citing a grep that could never
   have matched: the policies were created under the table's **old name**, and Postgres carries
   policy names through a rename. The stream built the check, read `pg_policies`, and proved the
   opposite — a doctor *can* be renamed and deleted, on dev and production.

**So: when an item says NOT ESTABLISHED, carry that through verbatim with the command it names. A
grep that finds nothing is not proof of absence. And state evidence AS evidence, with its source** —
all three were caught *because* the briefs said where the claim came from, which is the argument for
writing the planner's evidence in rather than against it.

**Lutan caught all three, each in one line.** That is three round trips through him that a minute of
reading would have saved, and it is the cost to drive down next round.

## WHAT THE STREAMS DID BETTER THAN THE BRIEFS ASKED

Worth recording because it is the counterweight, and because two of these are now habits to keep.

- **Both button-sweep guards were narrow and BOTH SAID SO.** *"It cannot detect a new ungated
  control; there is no render harness in the repo."* **Twice, unprompted, the honest answer instead
  of a check that matches nothing and reports success** — the fault that cost a merged migration on
  2026-10-26. Keep asking for guards; keep accepting "narrow, and here is why".
- **A residue list beat the planner's own scoping.** Slice 2 reported that the clinic-visit,
  prescription, weight and diet **row** controls live on their own pages, outside
  `src/app/residents/` — **so a brief scoped by that folder could never have reached them.** Scope
  the next slice **by control family, not by folder.**
- **A stream's instrument outlived its item.** The doctors stream's `table-policy-commands` check
  names every table where no live policy can answer for a command. Run against production it found a
  substantial list. **Filed as its own item**, with the warning that RLS denies by default, so a
  service-role-only table legitimately has no policy and **adding policies wholesale would be a
  widening.**

## BAND CORRECTIONS, both mine

- **The walkthrough rate SPLITS, and I corrected it in the wrong direction first.** Five first passes
  gave `~6.3k` a step; I wrote that into the plan, then banded a **reconciliation** pass on it and ran
  **17% over** at 11,223 a step. **A first pass is `~95k + ~6.3k x steps`; a second pass over an
  already-driven card is `~95k + ~11k x steps`**, because the work is confirming or contradicting
  every existing row. **And the floor has moved to ~95k from ~88k.** Both now in the skill.
- **A FOURTH way a figure is not a band reading: the stream was rescoped mid-session.** Two of them
  this round, in opposite directions — one grew, one shrank. **If you sent a stream a correction, its
  number is not a reading.** In the skill beside dead process, blocked stream and reset window.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage** — report, forecast
  in one line, then work. He was offered a smaller split six times today and took the full batch
  every time.
- **One item is ONE LINE in `docs/backlog.md`**, and check your own amendment script for `\n` before
  running it.
- **The planner is the only role that can read production.** A worktree cannot, correctly.
- **A measurement has a timestamp; a fact does not.**

## NEXT ROUND POINTS AT

1. **THE RELEASE IS THE OLDEST THING ON THE BOARD AND IT NOW GATES HIM.** Production is **four**
   migrations behind at the time of writing — re-read it — and **he cannot assign the translations
   card until that lands.** Two merged features sit against schema production does not have.
2. **The production cron, still dead.** His, diagnosed, one hypothesis left.
3. **The third buttons slice**, rescoped above and bigger than it looked. Scope by control family.
4. **The new policy-triage item** — bounded, one batch of tables per stream, and **not** to be
   "fixed" by adding policies.
5. **The harness sweep is still owed a batch**, deliberately deferred twice. Its red count is **not
   established**; run them as step zero.
6. **His card-assignment rebuild** is where `Manage medical` and `Assistant` being held by no live
   role belong.
