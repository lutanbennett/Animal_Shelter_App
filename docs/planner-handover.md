# Planner handover — edition `447`, 2026-10-28

**A delta, twenty-second edition in this shape. Nine streams, and the round's subject is not the work
— it is that FIVE separate faults all had the same shape: the record was right and the thing itself
was not.** `438` covered the sixteen-stream day; this covers everything after it. **Read `438` first
for the band corrections; this does not repeat them.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `438` → this. **The next slug is `456`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.** This edition deliberately names no
> figure you could get from a command.

---

## THE ONE THING TO READ: HE RULED ON ANALYSIS, AND HAD TO SAY IT THREE TIMES

> *"Can we stop analyzing against Roles. All analysis must be against cards as Roles are just a
> transient grouping of cards."*

**It is now in `CLAUDE.md` (*All analysis is by CARD, never by role*) and in the skill's step 3. Read
it there; it is not repeated here.** What belongs in a delta is **how it failed twice before it stuck**,
because the second failure is the one you will make:

1. **First telling, mid-review.** Recorded — in the fault log's own gate-3 section, as a rule for that
   log. **Broken within the hour**, when Card review 2 was sized per role.
2. **Second telling.** The rule went into `CLAUDE.md`. Then the planner **stopped writing per role and
   went on SIZING off a per-role NUMBER** — banding a review off a figure that counts a page once per
   role. **Obeying it in the prose while sizing off a role-shaped figure is still breaking it, and it is
   harder to see because the sentence no longer names a role.** That band is withdrawn.
3. **Third telling.** He asked why we were still talking about it.

**The transferable rule, beyond roles: if a figure came out of a per-role loop it is not a measurement
of anything. Say the quantity is unknown and name what would report it.**

**And a rule recorded in the document where it was discovered governs only that document.** That is why
it took a `CLAUDE.md` edit to hold.

## THE ROUND'S REAL FINDING: FIVE FAULTS, ONE SHAPE

Each was found separately. Each cost real time. **They are one habit.**

- **A policy read without its grants.** `maintenance_delete_perm` asks an activity; the planner
  concluded work was needed **without checking whether any card held that activity.** None did, so it
  was already Admin-only and always had been. A backlog item, a brief and a worktree were built on it;
  the stream's step-zero check killed it. **A policy asking `has_permission('x')` tells you nothing
  until you know who holds `x`.**
- **A check quoted without its query.** That same subject's check listed holders of a card and **failed
  if there were any**, on a false premise — reporting the intended design as a fault on every run, for
  ever. **Rewritten to ask the card question and guard the decision.** That rewrite is the shape to copy
  and it is in the repo.
- **A release-note carrier nominated in prose, four times, and never picked up.** Three migrations
  running lost their note. **The planner's own fix — write the carrier down clearly — WAS the failed
  intervention.**
- **A decision file claiming a prefix that was never written.** One grep for the word returned zero.
- **A decision file NOTICING two contradictory release notes and leaving them live** in a shipped
  release, with *"is now superseded by the line beside it"* — true as an observation, worthless to the
  person reading the notes.

**THE GUARD, AND IT IS CHEAP: RE-READ THE ARTIFACT, NOT THE NOTE ABOUT IT.** One grep, one look at the
grants, one look at the check's SQL. **A decision file is where this hides best, because a sentence
describing an intention reads exactly like one describing a completed action.**

## WHAT `438` ASKED FOR, and what each warning did

- **"`0276` is not on production." WRONG, and he caught it** — *"I believe that this was put onto
  production a while ago."* All three had gone on minutes after the release merged. **The line's own
  *"re-read `--status --env production`; never quote this"* is what made it recoverable: one command
  settled it.** Keep writing release state with its re-read instruction attached. **Corrected on `438`'s
  own branch, not on its predecessor** — a second PR against this file is the two-streams-one-file
  conflict.
- **"A merged stream leaves its item's TITLE lying." FIRED AGAIN, three more times**, and once worse
  than a title: a stream measured the walkthrough seam, **wrote the number only into its decision file,
  ticked its own item and filed nothing** — so a finding with real work in it was invisible to anything
  that reads the backlog. `438` called this its biggest finding; this is the second round running.
  **Check the item of every stream that merges, and check whether its FINDINGS were filed, not just
  whether its box is ticked.**
- **"Ten card re-passes owing." / "Buttons slices 5 and 6." / "Policy triage 2." / "The pane entry."
  ALL HELD.** Nothing reopened.
- **"Sixteen-plus worktrees. Stop asking." HELD.** Not raised. Leftovers were reported once as a fact,
  never as a question.

## GATE 3 IS CLOSED — AND IT RELEASED LESS THAN EVERY PLAN PREDICTED

He reviewed the fault log as a set and closed it. **Recorded in the log itself, with his signature at
his explicit request**, because a gate that happened only in a chat is one nobody can find.

**Every plan said it would release four items plus Card review 2. It released one fix.** Two of the four
were **already closed and nobody had noticed**; a third was the **same fault filed twice**; the fourth
turned out to be **a fix his button rule already governs**, not a decision. **And Card review 2 was not
unblocked by the gate** — closing it cleared one of three, and the last fell only when the fault it was
waiting on turned out never to have existed.

**For the next gate you describe: count what it releases by opening each item, not by counting the items
that cite it.**

## HIS DECISIONS THIS ROUND, so nobody re-asks

- **Read-only cards (View contacts, View medical) for whoever only needs to look: *"Leave it as it is."***
- **Login pickers listing every login; delete buttons on rows another login recorded: *"Neither for
  now."*** Untidy rather than harmful — **not work to file.**
- **Deleting a maintenance job: *"Only admin can delete maintenance, keep it that way."***
- **Add medical photos may view medical photos: *"Yes."*** One `card_grants` row, no app code.
- **Still open, and the only card question outstanding:** should downloading the whole resident list be
  its own card? Several cards carry it, because the route asks only the resident-record read.

## TWO PROCESS FAULTS NOW FIXED IN THE BRIEFS, each of which cost a real thing

- **A STEP-ZERO STOP APPLIES TO THE WHOLE STREAM UNLESS THE BRIEF SAYS OTHERWISE.** A stream was given a
  second, independent job, hit its step-zero stop on the first, reported *"nothing to do"*, and was
  archived **having never read job 2 — which was one of his decisions.** Lost for a day. **Every brief
  now says which parts its stop covers.**
- **ACTUALS DIE AT MERGE, NOT AT THE NEXT `/plan-day`.** Six figures were lost to auto-archive in one
  round; the skill's *"capture at the first `/plan-day` after the batch merges"* is too late when
  sessions archive on merge. **Capture before merging, or accept `unmeasured`.** The dials survive
  (`get_session` never expires) and every stream measured this round ran the same pair, so there is
  still no model finding worth the name. **Auto-archive is a setting and it is his** — raised, not
  decided.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage** — and convert before
  forecasting.
- **A measurement has a timestamp; a fact does not.**
- **`check-who-does-what` and `check-menu-coverage` are red ON PURPOSE.** Making menu-coverage
  card-shaped did not change that, and **if a rewrite of it ever goes green, suspect the rewrite.**
- **`doctor-cells` red is EXPECTED** and is the proof the card save works. Never restore Doctor's cards.

## NEXT ROUND POINTS AT

1. **Card review 2 — all three gates clear, no decision of his owed, and a card-shaped scope list now
   exists.** Band it as a **report**: it ends in a list of proposed cards for him to approve, and the
   migration is a separate PR after. **Read the count from the instrument, never from here.**
2. **The pages no walkthrough step opens** — its own item, triage already done. **Ask him first whether
   to add walkthrough steps rather than audit once by hand;** that is in the item as a question, not an
   assumption.
3. **The release-note mechanism.** Three in a row lost, and prose nomination is the proven-failed fix.
   **Read `docs/release-procedure.md` before proposing anything** — it is not established whether a step
   is missing or was skipped.
4. **The rest of the instruments item.** Two superseded role checks are labelled rather than deleted, on
   purpose and reversibly: **if a role figure from either turns up in a brief or a band again, delete
   them.**
