# Planner handover — edition `483`, 2026-10-30

**A delta, twenty-sixth edition in this shape. Nine streams** — batches of 3, 2 and 3, plus one unplanned
PR of the planner's own that shipped and so counts. `474`'s subject was *"no output" is not evidence of a
fault*. **It held, and the class recurred twice in new disguises: a misleading exit code, and a sweep
poisoned by one argument.** But the round's real subject is different, and it is the planner's own:
**three times, work or a finding was invisible because of where it was written, not because it was wrong.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `474` → this. **The next slug is `492`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: WORK WRITTEN IN THE WRONG PLACE IS INVISIBLE, AND NO CHECK WE HAVE SEES IT

Three instances in one round, three different mechanisms, **every one passing every instrument**:

- **A folded job of a different kind got silently dropped.** #1079 was given four deliverables: an API
  route and two documentation edits. It shipped the route, filed its finding properly, reported
  `finished=yes`, and **said nothing about either doc edit** — one of which was a decision Lutan had made
  that morning. CI green, test plan passed, usage comment posted. **The planner found it by grepping
  `main` a day later.**
- **A ticked backlog item had swallowed two open items mid-sentence.** One line held three items
  concatenated; inside the ticked one's prose sat *Walkthrough seam* (invisible since 2026-10-26) and a
  **decision for Lutan** filed the same day. Its own tail had broken onto a line beginning `## Completed`.
  **`check-backlog-sections.mjs` passed throughout and was right to**: it tests the *start* of a line, so
  an item spliced mid-line is not an item to it.
- **A solved problem was filed as an unknown fault**, because the brief named the rules and not the
  instruments. See *the instruments* below.

**Two of the three are now mechanism rather than hope**: rule 8 has a *same-kind* qualifier and every brief
carries a *report every deliverable* block — **both promoted into the skill this round, and the block
already fired twice.** The third is a habit: **when an item you are about to brief ends mid-sentence, or
when a TICKED item's prose contains `- [ ]`, look harder.** No checker will ever catch that one.

## AND THE PLANNER'S HALF, WHICH IS WHERE TWO OF THE ROUND'S FAULTS STARTED

**A brief that names the rules but not the INSTRUMENTS sends a stream to re-derive what the repo already
knows.** Two instances, two days, both mine:

- The brief carried every run-safety rule and never named `scripts/lib/exit.mjs`. A stream met
  `process.exit()`-after-`fetch` dying in libuv on Windows — **a passing verdict reading as exit 127** —
  and filed it as *"a genuine fault, cause not established"*. It had been diagnosed and fixed by that
  helper a fortnight earlier, with its own decision file, and the fix is one line.
- The same brief said how to run checks and never said **most take no arguments**. A sweep passed
  `--port` to all 183; several read it as a filename, died with `ENOENT`, and **36 checks looked broken
  when none was.** The whole sweep had to be redone.

**Promoted into the skill as its own rule: for each thing the stream must do, ask whether a helper, script,
fixture or decision file already does it, and name it by path.** A grep of `scripts/lib/` and
`docs/decisions/` for the brief's subject costs a minute.

## WHAT `474` ASKED FOR, and what each warning did

- **"No output is not evidence of a fault." HELD, and it generalises further than it was written.** Both
  harness streams produced fair counts. **But the class recurred twice in shapes the block did not
  anticipate:** exit **127** read as *command not found* when it was a teardown crash after a pass, and a
  whole sweep's reds caused by one bad argument. **The general form is now: an exit code or a red is a
  CLAIM about a check, not a reading of the app.** Both disguises are in the skill.
- **"A brief the planner has to correct mid-flight must not corrupt the bands." HELD, cleanly.** I sent no
  mid-flight correction to any of the nine streams. **Zero `rescoped` figures this round**, against one in
  `474` and one in `465`. Three rounds of this warning, first round it is fully clean.
- **"The backlog-section fault needs Lutan's choice — raise it; do not decide it." CLOSED.** He chose
  rewording `CLAUDE.md` over a checker warning. Done and merged. **Do not change
  `check-backlog-sections.mjs` — that is the option he did not pick.**
- **"A skill edit has been owed for TWO editions — do it or drop it." CLOSED, finally.** The
  reconciliation rate is corrected and on `main`: a second pass costs the **first-pass** rate by default,
  and `~11k` is reserved for a pass that must **adjudicate** disputed rows. **Nothing is now owed across
  editions. Do not let one accumulate again** — it took three editions and an explicit shaming to land.
- **"Verify artifacts before banding." FIRED IN A NEW WAY, and it earned itself again.** It has always
  been described as catching a stream that *never ran*; this time it caught a **partial** delivery that
  reported `finished=yes`. **A stream's `finished=yes` is its own claim; the artifact check is what tests
  it.**
- **"The restate-or-retire row costs ~6.8k." CORRECTED THE SAME DAY IT WAS PROMOTED — and the correction
  then held.** See the bands below.
- **"A measurement has a timestamp; a fact does not." HELD, and it bit two streams instead.** See below.

## THE BAND NOTE THAT MATTERS, AND IT IS A LESSON ABOUT PROMOTING

`474` promoted *"a restate-or-retire row costs ~6.8k, not ~20k"* into the skill's band table. **Within
hours, two harness streams landed at 16–19.5k a row above their own floors.** The rate was not wrong; its
**scope** was. #1074's rows were *retire-or-restate with the cause already given*; those two had to
**repair against a new data model**.

**So the split, now confirmed by a second round and safe to rely on: ~6.8k a row when someone has already
told the stream WHY the row is red; ~15–20k when it must work that out.** The skill's harness row already
asks exactly that question — I under-applied it. **The transferable lesson is the one I then followed for
the rest of the round: a figure measured once is a reading, not a rate.** Which is why the *find-little
driven pass at ~5k a step* now has **three** readings and is **still not promoted** — `.plan-day.md`
carries the instruction for the fourth.

## TWO STREAMS READ A SUPERSEDED MIGRATION AS CURRENT, which is a new shape of an old fault

The skill warns that an **item's** conclusion ages. **Twice this round a stream aged a MIGRATION FILE
instead** — and one acted on it:

- A stream read `0249`, superseded twice, concluded a dropped column *"still decides which resident rows a
  login reads"*, and **removed a harness principal on that basis.** Settled in one minute on both live
  databases, which only the planner can read: no role column grants or denies anything, on test or
  production.
- Another filed the libuv crash as unknown while the fix sat in `scripts/lib/`.

**So: a migration file is a historical record, not a statement of current schema.** The current answer
lives in the latest migration that touches the object, in the registry, or in a live read. **And the
planner's duty follows from it: when an item or a stream names a check only the main checkout can run
against production, run it.** That took a minute and reversed a finding.

## A PRODUCTION READING TURNED A DECIDED ITEM INTO A SEQUENCING QUESTION

Lutan had decided an item outright; the item noted in passing that some holders *"lose it until the card
sets are rebuilt"*. **Measured, it was not "some holders": it was both of them, and the only card that
would then carry the activity belonged to a role with no live login.** A daily-use capability would have
gone dark between the migration landing and him assigning cards. **He was shown the figure, chose to go
ahead, and will assign the cards in the same release.**

**The transferable half: an item that acknowledges a consequence in passing has not measured it.** *"They
lose it until X"* reads like a handled detail. One command turned it into a decision worth one message —
**and this is work no brief can do, because a stream in a worktree cannot read production.**

## A CORRECTION I OWE THE NEXT PLANNER, AND IT IS THE SECOND EDITION TO OWE IT

**Twice in two batches I filed a backlog item on the `backlog` branch the same morning I briefed it.** The
stream then could not tick its own work — the item was not on `main` yet — so both times **I ticked it
myself, after re-reading the stream's work to confirm it.** I recorded the lesson after the first and did
not act on it.

**File an item at least one daily merge before briefing it, or say in the brief that the planner owns the
tick.** The second works and is what I did, but it moves bookkeeping from the stream that has the context
to the planner who has to re-derive it.

## STATE, RE-READ EVERY TIME

Nothing in this section may be quoted from here. **Re-read it:** open items and their titles from
`docs/backlog.md`; batches, bands, actuals, the mitigations in flight and the band instruction for the
find-little rate from `.plan-day.md`; release and migration state from
`apply-migrations.mjs --status --env production`; what merged from `gh pr list`; live worktrees from
`worktree.mjs list`.

**What is with Lutan** changes daily and is listed in `.plan-day.md` under his decisions — read it there.
The standing ones that shape sequencing rather than appearing as tasks: **the production Worker deploy and
the Pi install are his by instruction**, so any stream whose work only runs after one of those **must write
`n/a` on its release note** and name the outstanding step; **the domain move gates two free Cloudflare
steps**; and **a release has two halves on this project** — a Worker deploy alone does not change what
users see, so read the Pi's version endpoint against the Worker's rather than trusting a 200.

**NEITHER SUPABASE PAID FEATURE MAY EVER RETURN TO ANY LIST** — session inactivity timeout and
leaked-password protection are **dropped, not deferred**:
`docs/decisions/2026-10-29-pro-only-features-are-dropped.md`.
