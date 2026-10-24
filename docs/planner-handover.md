# Planner handover — edition `339`, 2026-10-24

**A delta, tenth edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `348`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `330` asked for, and what happened

- **"Check whether the next performance stream adopts the item's framing." UNTESTED** — no
  performance streams in these nine. Carry it.
- **"Count the actual steps before banding a run group." UNTESTED again** — the walkthrough is still
  held. Second edition running; carry it, but stop expecting it.
- **"Keep the backlog-conflict lesson." FIRED, then held.** Batch 1's merge conflicted and was
  resolved by hand; batch 2's and batch 3's were clean. **It has earned its place — keep it.**
- **Its candidate list was accurate** — `0254`, the features table and the harness sweep all shipped.
- **One thing it got wrong:** it listed *"the 47 red harnesses — a decision, not a stream"* as
  pending. **Lutan answered it on 2026-10-24 and batch 1 merged the same day.** The real population
  is **140 dev harnesses, 58 red, 48 remaining** (#900's measured table), not the 109/52 quoted for
  days beforehand.

## THE DEFINING FINDING, AND IT IS MINE: I gave Lutan an INFERENCE as a reading, and he acted on it

At batch 2 setup I told him the Doctor-cells fault was **live on production** and attached a standing
caution not to touch that row. **The whole chain was inferred:** `0230` is applied to production →
`0230` writes cells straight into `role_permissions` → therefore production carries dev's broken
state. Every step true; **the conclusion false.**

**#901 — the read-only production check Lutan had pulled forward into that same batch — disproved it
within the hour.** Production holds **13 cells, 5 cards, 9 extras**, all 13 of `0230`'s cells present,
against dev's **14 / 3 / 1**. A card save had already happened there and **nothing was stripped**;
production had diverged from dev because the roles screen was used on it.

Three things to take from it, in order of what they cost:

1. **"Verify against the field the code actually reads" binds the PLANNER HARDEST, because nobody
   checks the planner.** A stream's claim meets a reviewer, CI and a test plan. Mine went straight to
   Lutan as advice, with a behavioural instruction attached.
2. **An inference has no timestamp, so nothing will ever correct it.** The skill's rule 2 read from
   the other end: a measurement decays visibly and invites a re-read; a derived claim just sits there
   sounding true. **If you cannot name the command you ran, do not state it to him as fact** — say
   "not established", for which the backlog already has a convention.
3. **It was caught only because the capability existed**, and it existed because he swapped that
   stream in *on the strength of my wrong claim*. **The planner's unverifiable assertions are exactly
   what a read-only production check is for. Reach for it first.**

Corrected on the item and in its title (`7207d177`), with the one thing still genuinely unestablished
named: whether production's cells are **exactly** the union of cards and extras. `doctor-cells` tests
presence, `role-cells` counts, **neither tests the union**, and the harness that does refuses
production by design. **Follow-up on the item: a `cards-union` check**, one entry in
`scripts/lib/readonly-checks.mjs`.

## THE OTHER FINDING: a browser MATRIX costs ~5k per screen-state — the flat ~30k is for about SIX

**The round's only overrun, +26%, and the cause is arithmetic, not judgement.** The skill's
`assistant-immunization` reading says a brief asking for real browser verification adds ~30k whatever
the code shape — **measured on a handful of screens.** I then wrote a brief asking for four switch
combinations across six screens at two widths: **about 24 screen-states, priced at ~30k.**

Subtract the non-browser work (~15 call sites plus a small Settings surface — the 185–250k row, so
~210k) from the actual **327,032** and the matrix cost **~117k, about 5k a state.**

**So count the states and multiply.** Same shape as the walkthrough rate (`88k + 9.8k × steps`) and
**the same failure mode: the rate was never wrong, the count was.** Batch 3's #7 carries ~10 states at
this rate and is the test; promote it into the skill's band table once a second reading confirms it.

## Two band facts, recorded in `.plan-day.md` rather than repeated here

- **"Nothing left to discover" now reaches DESIGN jobs.** #901 was banded 170–220k because it had to
  design a mechanism, and came in at **141,813**: the brief had pre-decided its constraints, handed it
  the gap analysis and named its first check. **Keep the higher band only where the stream must choose
  its own constraints.**
- **A measurement trap, PROMOTED into the skill (step 2):** `get_usage`/`get_session` take
  **`session_id`, not `sessionId`**; the wrong key silently returns the planner's own context with
  `status: "ok"`. It nearly put three fabricated actuals in the plan. **The skill now says to read
  `context.session` on every call.**

## Nine measured: seven inside or under, one over, one at the edge

Figures, dials and bands are in `.plan-day.md`'s measurement table — **cited, not reproduced.** All
nine **completed and opened their own PRs**, so every figure is band evidence: batch 1 three for three
inside, batch 2 one over and two under, batch 3 live.

**Every stream ran `sonnet-5-5` / `low`, matching the recommendation for the first time in three
rounds** — and there is still **no model finding worth the name.** Brief quality moved these numbers;
the dials did not. Keep recording; keep not promising comparisons.

## File ownership broke twice — the cause is STRUCTURAL, so fix the split, not the stream

Both breaches were in `scripts/`, both declared in the PR, neither collided. #903 had to edit
`check-permission-catalogue.mjs` and `scripts/lib/acceptance-matrix-entries.mjs` because **they refuse
a new page or manual topic that is not registered, so lint fails without them.**

**That is an ownership split that ignored a hard dependency, not a discipline failure.** Written into
batch 3's #7 as files it owns. **General form: before assigning a directory to one stream, ask which
files every OTHER stream is structurally forced to touch.**

## My own mitigations — fired, held, or retired

- **"Give #901 a live first check and make it print the answers." FIRED, and it corrected me.** The
  strongest mitigation result yet recorded here. **RETIRED — nothing further to check.**
- **"Tell the schema half to note, not tick." FIRED**, third round holding. #902's item reads
  `SCHEMA HALF DONE … this item stays open: the app half`.
- **"Tell the stream to put shared dev state back." FIRED.** #903 flipped both switches back on, said
  so, and reproduced the pre-change figures.
- **"Put the settled answer where a stream will look." FIRED.** #903 did not ask about safety stock.
- **CARRIED: STEP ZERO with the planner's evidence pasted in.** Seven rounds, held every time.
- **NEW:** #7 is told `AUDITED_TABLES` is the deliverable most likely to be forgotten, because the
  feature works without it. **If a sentence is not enough, it must become a checker.** Batch 3's other
  new mitigations are in `.plan-day.md`.

## For the release manager

- **`0.40.0` is DEPLOYED and mailed, fully signed off**, and `0253` — last edition's live security fix
  — **is applied to production.** Both closed.
- **Re-read what is pending yourself; do not take a count from here.** Whatever was pending and
  whatever `unreleased` held when this was written **will have moved.**
- **A release is the natural step once batch 3 merges**, which adds the features screen's note.
- **Three things wait on Lutan from #903**, in its test plan's *Left for manual verification* table:
  the Settings → Stocktaking button at aal2, the Thai wording, the page on a real phone. **None blocks
  a release.**
- **A middle-number bump is a MAJOR release by this project's numbering**, mails every admin and cannot
  be undone. **That decision is Lutan's** — confirm he made it rather than inferring it.

## Rulings worth not re-deriving — cited, not summarised

- **The card and role walkthroughs are both HELD** behind the security rebuild — Lutan, 2026-10-23.
  Still the most consequential ruling on the board.
- **Build the features table on today's 13 names** — Lutan, 2026-10-24: *"Yes build it now as it will
  help me in completing the PDF."* **Closed; do not re-ask it.**
- **Sweep the red harnesses in a bounded batch, permissions first** — Lutan, 2026-10-24. **Closed, and
  `330` was wrong to list it as pending.**
- **Kidney Support: 1 can per serving, servings 0.5 / 1 / 1.5**; **a serving is ONE DAY's food** —
  Lutan, 2026-10-22/23.
- **`test-plan` is ADVISORY permanently.** Do not raise it; do not list it as a decision he owes.

## Next round's candidates

The next chat plans; this is only where the board points. **Batch 3 is live as you read this** — check
whether it merged before planning anything.

1. **Batch 4 is already priced in `.plan-day.md`:** #9 `diets-columns-drop` (slot `0257`, a
   view-and-function rewrite *before* the drop, **not** a single-file schema PR) and #11
   `website-page-visibility-app`, which is **large** — a new surface that also retires four
   hand-maintained link lists. **Do not let it be priced as "the app half of a small schema PR".**
2. **The feature-list mark-up → steps 2 and 3 of the rebuild** — his, still the biggest lever, unmoved
   in twelve streams. **The features table and screen were built so that acting on it is a few clicks.**
3. **Add a named check per held security fault** to `check-production.mjs`. Seven items are held behind
   the rebuild, three of them real faults, each carrying *"if it blocks a live role on production,
   raise it with Lutan"* — **now answerable, and a planning question, not his.**
4. **48 red harnesses remain**, in bounded batches, permissions first. Approved; just schedule it.
5. **Raise HSTS to a year** — one line, **not before 2026-11-08**.

**The buildable pool is thin and it is not a backlog fault:** 24 Public website and Fundraising items
wait on the Director and contain no code. **#10/#11 are the exception** — the one pair needing nothing
from her, and he marked it *wanted before go-live*.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup, however often it is
re-planned. Branch, worktree, test plan, PR, then **merge it yourself on green CI** — never a gate.
This one is `claude/planner-handover-339`, after #895 (`330`) and #876.

**What could go next time:** the performance-framing and run-group warnings have sat untested for two
editions — **drop them if a third round does not exercise them.** **Keep** the inference lesson and the
browser-matrix rate until each has a second reading; the backlog-conflict lesson has fired and stays.
