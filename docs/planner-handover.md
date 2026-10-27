# Planner handover — edition `393`, 2026-10-27

**A delta, sixteenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `402`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## WHAT `384` ASKED FOR, and what each warning actually did

- **"An instrument that exists is not an instrument that is right." FIRED, and it paid for itself
  four times over.** Reading what a check matched on before quoting it is now routine, and it caught
  the stale `role-cards` reporting that had already contaminated a merged migration. **Promoted
  already; do not recopy it.**
- **"Capture the actuals before archiving." FIRED, six of six**, every read with the process alive
  and `context.session` checked against the id passed. **No figure lost this round** — the first
  clean sweep since the rule was written.
- **"A note from a session is its report, not proof." FIRED AGAINST ME, third round running.** See
  the next section; this time Lutan was the one who caught it.
- **"Check PR state with `gh`, not the session list." FIRED, at last, after holding quietly for
  seven editions.** `list_sessions` reported a merged PR as **OPEN**; `gh` said `MERGED`. Had I
  trusted the session list I would have paused the next batch for a stream that had finished. **Keep
  it — and note the failure mode is a false OPEN, not a false MERGED.**
- **The `src/lib/releases.ts` collision rule is STILL UNTESTED — fourth round.** Three batches of
  nine streams and not one carried a release note; all nine were verification or documentation work.
  **Batch 3's translations card is the first told to add one.** Carry it untested; do not promote it
  and do not tidy it away.
- **Band discipline: the best round yet.** Six of six inside or under band, **none over**, worst
  error −40% and that one was mine, not a stream's. Three of the six landed within 11% of band.

## THE ROUND'S LESSON: A PRIOR PASS HAS AN EXPIRY DATE, AND BOTH OF US GOT IT WRONG

**Promoted into the skill** (beside the walkthrough rate); here only because the shape of the error
is the thing worth carrying.

I briefed a card re-pass saying *"these three cards have never been driven"*. **False.** I had listed
`docs/decisions/` with `grep -i "card-re|rerun|card-review"` and **missed the whole `card-report-*`
family** — seven streams that had driven 27 of 32 cards two days earlier and said **"driven"** in
their fault-log headings. The stream found those rows and reported **"nothing to do"**. **Also
wrong**, because the walks predated `0265`, which had **narrowed all three cards**.

**Lutan handed it back in one line:** *"please check Card rerun daily medical, it says nothing to
do"*. That message was worth more than any check I ran all day.

**Two things to take from it.** First, the question is never *"has this been driven?"* but **"has it
been driven SINCE the last thing that changed its behaviour?"** — and **two** things change it, a
migration (grants) and the app half (what a page shows and whether it can be reached). I checked only
the first, and **that nearly cancelled three quarters of a stream** whose cards no migration had
touched; one look at the app-half PR's file list reversed it. Second, **the stream pushing back was
the system working.** Step zero exists so a brief's evidence gets tested, and it tested mine.

## A MESSAGE THAT ARRIVES AFTER THE REASONING COSTS A ROUND TRIP THROUGH LUTAN

`384` recorded "message the running streams when context changes" as a habit that paid, with the
limit that *a message only helps if it arrives before the reasoning*. **This round proved the limit
rather than the habit.** The correction reached the stream only after it had concluded and reported,
so the message had to say outright that its conclusion was superseded — and the route it travelled
was Lutan noticing first. **Send early; and sending is not fixing.** Unchanged advice, now with a
price attached.

## WHAT I GOT WRONG IN A BAND, AND IT IS A NEW CLASS

A schema stream came in **40% under** a 230–290k band having delivered everything. The band had
priced *"and prove the outcome on production"* — and **a stream in a worktree cannot read
production.** I charged a stream for work it was structurally unable to do, then did that work
myself. **Promoted into the skill:** ask who can actually run a proof before charging for it. The
same applies to a Worker deploy, a Cloudflare setting, the Pi.

**Second band correction, also promoted:** a harness batch briefed as ten found **five already
green**, fixed the day before by commits the item did not know about. **Run the harnesses as step
zero — that is the scope list**, not the item's names. It still cost 228k, because **two of the five
were investigations rather than fixes.** Price a diagnosis above a repair.

## A TICK IS A CLAIM ABOUT AN ENVIRONMENT, AND "DELETED" NEEDS TO SAY WHICH ONE

A stream's DONE note read *"staff row, 13 cards, 31 cells … deleted"*. **True of dev, false of
production**, where the migration was still pending — so the rows were physically present, archived
and correctly unreported. Nothing was broken, and the half that mattered (the reporting fix, a script
change) **was** live everywhere. But the sentence read as finished everywhere, which is the
invisible-work fault wearing a tick. **Corrected in place on `backlog`.** The habit: when a tick
describes a deletion, name the environment and say what is still pending.

## WHAT WENT RIGHT AND IS WORTH KNOWING WENT RIGHT

- **Four mitigations moved from hypothesis to proven**, which is the most in one round so far:
  the dev sign-in line (three streams drove real browsers on card-only logins, **no
  `pending: no signed-in session` anywhere** — treat it as settled); the shared append-only fault
  log (**three dated headings coexist**, each stream keeping the others'); **"assert card-derived
  wiring, never a role's assignment"** (a stream *removed* a doctor pin rather than asserting it,
  left two harnesses deliberately red with written reasons, and **added no `ACCEPTED` entries** to
  paper over them); and **pairing a harness stream with a driving stream in one batch** (the driving
  stream wrote a section addressed to the harness stream, reporting **no** contradiction rather than
  inventing one, plus two faults only driving finds).
- **Step zero fired three times** — two phantoms caught at planning, my own wrong evidence caught by
  a stream, five already-green harnesses caught by another.
- **Two phantoms were ticked rather than scheduled**, both shipped by the *previous* batch's own
  streams and never ticked by them. **The "tick what else your work closed" rule is not being applied
  to a stream's own item either** — worth watching, not yet worth a rule.
- **A backlog item was invisible in a new way and is now repaired.** Its tail had broken onto its own
  line beginning `` `## Completed` ``, so everything scanning for headings stopped dead there — it
  truncated my own first listing at 17 of 96 items, and `check-backlog-sections` passed throughout,
  because it tests an item's *position* and an orphan is not an item to it. **When a listing looks
  short, suspect the file before the backlog.**
- **A stale duplicate question cost Lutan a second answer**, and he was right to be short about it:
  *"We went through this already all questions were answered previously"*. One copy had been answered
  the day before; the other still read "still unanswered", reached `.plan-day.md`, and I asked him
  again. **Marked superseded in place.** This is the fault `CLAUDE.md` already documents, and knowing
  the rule did not stop me repeating it.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage** — report the
  figures, forecast in one line, then work. He was offered a smaller split three times this round and
  chose the full batch every time.
- **Never write scratch output above the repo.** `git show <rev>:<path>` still lies about dotted
  paths and still reports zero when piped.
- **One item is ONE LINE in `docs/backlog.md`.** I nearly wrote a newline into the middle of an item
  while recording notes — the same fault I had repaired that morning. **Check your own amendment
  script for `\n` before running it.**
- **The planner is the only role that can read production**, and the yield stays high.
- **A measurement has a timestamp; a fact does not.** Quote production readings with the clock.

## NEXT ROUND POINTS AT

1. **The production cron is five days dead and is the oldest thing on the board.** His. Diagnosed,
   not mysterious — both environments died at their own deploy. **Re-read the item: it names the one
   hypothesis left and the cheap test that kills it.**
2. **Batch 3 finishes the first-14 card re-pass bar `residents`.** After it merges, **a release is
   the natural next step**, and it will carry the pending staff-deletion migration.
3. **His card-assignment rebuild is where the real residue sits** — *"Send to hospital is held by no
   one"*, and `Manage medical` and `Assistant` held by no live role. **He should not meet those by
   surprise**, and no stream may fix them by naming a role.
4. **Two harnesses are red ON PURPOSE** until the cards cover those pages. **Not unfinished work, and
   not to be made green.**
5. **The remaining red-harness count is NOT ESTABLISHED** and the old "30" is stale. Whoever needs a
   number runs them and quotes the date; 17 need a dev server.
6. **Eight free leftover worktrees** and a mis-named one. `held` is the column to read; `/clean-streams`
   does the round.
