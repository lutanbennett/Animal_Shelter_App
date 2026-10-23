# Planner handover — edition `312`, 2026-10-23

**A delta, seventh edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `321`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `303` asked for, and what happened

- **"Check for an open `planner-handover-*` PR first." HELD** — checked, none.
- **"Capture the actuals the moment a batch merges." HELD, and nine of nine measured.**
- **The STEP ZERO block: HELD, third round.** Nothing already-built was offered.
- **The `rm`-then-write trap: HELD for a ninth edition.** `cat <scratch> > .plan-day.md` worked three
  times.
- **The sign-in gap and the +30k browser allowance: CLOSED. Two confirming rounds, stop testing it**
  and simply add the 30k whenever a brief asks for browser work. The paragraph can go next edition.
- **The `audit` block: CLOSED.** Lutan was not asked once in nine streams, second round running.
  Delete the paragraph.
- **"The board is thin, and the next round should say so." TRUE, AND IT STOPPED MATTERING.** The
  buildable pool was **four items**, batch 1 consumed all four, and batches 2 and 3 were filled
  entirely by the card walkthrough — which then **filed six new items of its own.** A walkthrough is
  not only verification; it is the cheapest backlog generator we have.
- **"You do not control the dial." CLOSED — AND THE PREVIOUS DIAGNOSIS WAS WRONG.** See below.

## THE DIAL: two editions prescribed a fix for a problem that did not exist

`294` and `303` both recorded that the dial could not be read because every session was
`isRunning: false` by the time `/plan-day` ran, and both prescribed *"read the dial while the session
is still live."*

**`get_session` returns `model` and `effort` from session metadata, and `get_usage` returns
`context.tokensUsed`, for an IDLE session exactly as well as a live one.** All nine readings this
round were taken with every session idle. **There is no race.** What was lost on those two rounds was
lost to not calling the tool.

**Promoted into the skill (step 2), so no future edition carries it.** Nine of nine dials read:
**all `claude-sonnet-5-5` / `low`**, the first full round where recommendation and setting matched
throughout. That still yields **no model finding** — one dial setting is not a comparison — but it
does mean the figures below all belong to the same configuration.

---

## THE DEFINING FINDING: a blocked stream's token figure is not a band reading

The most important number this round is one I **threw away**.

The three card-walkthrough run streams came in at **177,977 · 137,783 · 209,385** against a
190–250k band — two under, one inside. Written up as *"the band held"*, which is what the shape
invites, it would have been **false**. Two of the three were **blocked**: `medical_records` stopped
at step 2 of 11 and `residents` lost steps 2 and 4–12. They were cheap because they could not
proceed, not because the work was small.

**Only `cards-run-medical-daily` completed** — four cards, all passing, two TODOs answered — and
**209,385 against weight 22 is the single honest run-stream reading we have.**

**Promoted into the skill's token-estimates section**, because the failure generalises beyond runs:
**a stream that stopped early is not evidence about estimating.** Record the figure, mark it
`blocked`, and leave it out of the bands. The temptation is strongest exactly when the numbers look
good.

## The mitigation rule fired for a third time, and one of the two was mine

The skill's *a mitigation you wrote into a brief is a hypothesis* caught both inside one round:

1. **The card-scoped login was structurally wrong.** `dev-signin.mjs` stamped every card role
   `scope_residents: "who_and_where"`, so no card login could open a full resident record whatever
   the card granted. I had written it into `303`'s successor plan as the thing that made the
   walkthrough possible, having exercised it on two cards that never touched a resident page.
2. **`--remove` deletes every stream's login, not its own** — and **I put "run `--remove` when you
   finish" into all three briefs.** One stream was signed out twice mid-card. The cross-stream
   collision I asked streams to watch for was one I had created.

**The lesson that is new, and worth the space:** both were in *tooling I wrote into the briefs*,
not in the items. **A brief is code you are shipping to three sessions at once**, and its faults
arrive three times simultaneously. Exercise a tool on the hardest case before briefing it, not the
easiest.

## Two things I refused to guess, and both refusals were right

- **Whether the real vet login hits the resident-page redirect.** It cannot be answered from the
  migrations: `0179` set `who_and_where` `where legacy_role = 'volunteer'`, and **`roles.legacy_role`
  was dropped on 2026-10-11**. A plausible-sounding answer was available and would have been
  worthless. The live `roles` table is the only source, and `card-login-fix` reads it.
- **Whether the Pi lacked the calendar values this morning.** All four names are present and the
  service restarted after the file was written — but the write destroyed the evidence of the earlier
  state, so *"today's release supplied them"* is a **consistent explanation, not a measurement.**
  That distinction is written onto the item.

## The planner error this round: a release state carried out of `.plan-day.md`

I told Lutan `0.40.0` was uncut with six notes waiting, and asked him to choose major or minor.
**`0.39.2` had been cut and recorded hours earlier and `unreleased` was empty.** He corrected me:
*"everything has already been released"*.

This is step 7's rule 2 — *a measurement has a timestamp; a fact does not* — **in a third costume**
(a calendar id, then a release state). The "never carried forward" block at the top of this document
lists release state explicitly **and I read past it.** The block is not the fix; reading the repo is.

---

## Where things stand — re-read 2026-10-23, not carried

| | |
|---|---|
| `main` | past #854–#859 |
| Round | **nine streams in three batches**, all merged |
| Card walkthrough | 26 cards; **9 walked — 6 pass, 1 fail, 2 blocked**; 17 not yet walked |
| Batch 3 | set up and running: `card-login-fix`, `residents-card-intake`, `medical-card-resident-page` |
| Open PRs at writing | none but this one |
| Release | `0.39.2` shipped; `unreleased` has #856's line and will gain two more |
| CI | **eight** jobs since #855 (`card-walkthrough`) |

## For the release manager

- **Nothing is waiting to be cut right now.** `0.39.2` went out on 2026-10-22 and batch 3's notes
  are not in yet. **Re-read `unreleased`; do not take a count from here.**
- **Two of batch 3's three are user-visible fixes** — registering a resident failing for some
  logins, and the medical card not opening a resident page. They read as fixes, not features.
- **One production confirmation is outstanding and is Lutan's:** a real vet booking reaching the
  calendar without waiting for the sweep.

## Rulings worth not re-deriving — cited, not summarised

- **The Medical records card opens the FULL resident page with the rest READ-ONLY** — Lutan,
  2026-10-22. Medical sections editable; name, location, intake, history visible but not editable.
  His reasoning: judging a medical record needs the history around it. On the item, with the
  superseded question marked in place.
- **A card walkthrough comes before the role walkthrough** — Lutan, 2026-10-22, unchanged.
- **`test-plan` is ADVISORY permanently.** Do not raise it; do not list it as a decision he owes.

## Next round's candidates

The next chat plans; this is only where the board points. **`.plan-day.md` carries the reasoning and
the card groupings.**

1. **The four remaining card groups** — facility, stock-and-money, contacts-and-comms, content —
   now that the login can reach a resident page. `.plan-day.md` has them weighted.
2. **A re-run of the three cards batch 2 could not walk** (`residents` 9 TODOs, `medical_records`
   8 TODOs, `book_clinic_visits`). **Not free: most of a stream on its own.**
3. **`check-medical-role.mjs` is red and wired into neither CI nor gates** — filed this round, not
   diagnosed. Two of its three failures touch the same scope mechanism; a stale harness from the
   `legacy_role` drop is plausible. It carries a broader question: **which other `check-*.mjs`
   scripts report to nobody?**
4. **Whatever batch 3 files.** All three are in the permission model, so expect findings.
5. **Raise HSTS to a year** — one line, **not before 2026-11-08**.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup. Branch, worktree, test
plan, PR, then **merge it yourself on green CI** — never a gate. This one is
`claude/planner-handover-312`, after #848 (`303`) and #838.

**What could go next time:** the sign-in and `audit` paragraphs are both closed and should simply be
deleted. The dial paragraph is now closed too — it survives here only to retire the wrong
prescription two editions left behind, and **the next edition should drop it entirely.**
