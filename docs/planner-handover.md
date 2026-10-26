# Planner handover — edition `375`, 2026-10-26

**A delta, fourteenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `384`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE NEVER-CARRY-A-COUNT RULE JUST PROVED ITSELF ON THIS DOCUMENT

Edition `366` spent a paragraph correcting `357`'s *"28 cards"* to **29**, with the arithmetic and
the CI assertion that holds it. **That correction is already stale: the count moved again this
round**, under Lutan's own card-review decision, and `scripts/check-cards-count.mjs` moved with it.

So the right lesson is not the new number — **writing it here would repeat the mistake.** It is that
**a count in a handover has a half-life of about one round.** Read `CARD_KEYS` and read the check;
never type a card total, including the one in the sentence you are tempted to copy from here.

## WHAT `366` ASKED FOR, and what each warning actually did

- **"Check PR state with `gh`, not the session list." FIRED — sixth edition running.** The session
  row said a PR was `OPEN`; `gh pr view` said `MERGED`. Lutan's own "batch 1 merged" was right and
  the app's list was stale. **Keep it forever.** The session list is a convenience, not a record.
- **"Capture the actuals before archiving." FIRED, nine of nine** — every figure read with the
  process alive, and `context.session` checked against the id passed on every single call.
- **"Run the production check FIRST." FIRED IN A NEW WAY — the check did not exist.** See below; it
  is the most useful thing in this edition.
- **"A note from a session is its report, not proof." FIRED AGAINST ME**, which is the better test.
  See "My own failure".
- **Its band correction held, and the band discipline mostly held** — nine streams, all banded, six
  inside, three over, none under. The three overruns share one cause, now a row in the skill.

## A PRODUCTION CHECK THAT DOES NOT EXIST IS NOT A PARKED QUESTION

The skill says to run the check an item names. **This round the item named a read that nothing in
the repo could perform**, and that is a different situation with a different duty.

A stream filed an item asking whether four clinic-login functions still had callers — a
`pg_policies` / `pg_proc` read of production. Only the planner can read production, so it came to
me. `scripts/check-production.mjs` has a fixed set of named checks and **none of them covered it.**

**The temptation is to park it, and it had already been parked twice.** What I did instead: said
plainly that the instrument was missing rather than implying the question was unattended, and folded
**building the named check** into a stream in the same batch. It shipped.

**The rule to carry: when a question can only be answered by a read nobody can run, the deliverable
is the instrument, not the answer.** A question parked for want of a tool will be parked again next
round, and the third parking costs more than the script.

## MY OWN FAILURE THIS ROUND: I PASSED A WRONG ASSUMPTION INTO A BRIEF

An item said some clinic-login helpers were dead code. **I repeated that in the brief without
checking it.** The stream read the code, found one of them is called by five routes, kept it, and
said plainly what it could not establish.

**That is the correct outcome and it cost nothing — but it worked because the stream distrusted its
brief, not because the brief was sound.** The brief is the one document a stream has no reason to
doubt, and a planner's unchecked sentence inside it carries the planner's authority.

**So: a claim an item makes about what is dead, unused or uncalled gets one `grep` before it enters
a brief.** The same "confident sentence is the one to check" rule `366` wrote about items applies
to the briefs I write *from* those items.

## BAND CORRECTION — one shape, now a row in the skill

**All three overruns today were banded on the item's FRAMING rather than on a COUNT**, and the one
with a countable unit missed worst. The fix is promoted into the skill's band table as its own row
(**harness triage: ~85k + ~20k per harness, ~15k each when one cause explains them all**), with both
of today's readings as evidence.

**The genuinely new finding, and the first mitigation check to return a real answer:** a
**shared cause discounts about a quarter per harness**, because the second harness onwards is a
re-run rather than a diagnosis. That is now worth asking before banding any batch of similar work —
not just harnesses.

The permissions half of the schema-with-code row also gained a third reading and held at +3.7%.

## A RULE OF MINE THAT IS NOW UNTESTED TWO ROUNDS RUNNING — do not promote it, do not drop it

The `src/lib/releases.ts` collision rule — *name one owner; tell the others the conflict is expected
and resolved by keeping both notes* — **has still never fired.** Both rounds since it was written,
only one stream in the batch had a release note, so the rule was never exercised.

**It is not evidence yet and must not be written anywhere as settled practice.** It is also not
wrong — it has simply had no opportunity. **Carry it as untested for a third round rather than
tidying it away**, because the round it is needed is the round three streams all add a note.

## WHAT WENT RIGHT AND IS WORTH KNOWING WENT RIGHT

**No item went invisible this round — the first such round since the failure class was found.**
Both batch-3 streams hit an item that was only partly closed, and **both rewrote the item's title to
say what was left instead of ticking it.** One of them left its item open with *"Nothing left to
decide; buildable now"* and the remaining half named in the title.

That is `CLAUDE.md`'s "Answering a decision on a backlog item" rule working exactly as written, and
it is worth recording because **the three invisibility faults in the skill's step 3 all read as
warnings about streams** — this round they behaved better than the warnings imply. **Keep reading
the tails; stop assuming the tick will be wholesale.**

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage.**
- **Never write scratch output above the repo.** `git show <rev>:<path>` still lies about dotted
  paths, and still reports zero when piped.
- **`worktree.mjs done` refusing is information**, and its suggested flag is not advice.
- **The planner is the only role that can read production**, and the yield is high enough to do it
  before planning anything.

## NEXT ROUND POINTS AT

1. **A release is being cut now** — re-read its state rather than this sentence. The plan's three
   batches are complete, which is what made this the moment.
2. **His card review is still the gate**, and it now gates a named, buildable thing: the **app half**
   of Card review 1, which the item describes in full and which needs no decision. Re-read the item;
   do not reproduce its contents here.
3. **The production cron** — his, and still the oldest thing on the board. **Re-read its state
   before mentioning it.**
4. **The battery for the Pi**, and **the tunnel drill** — his hands, his timing, and the drill
   serves two items at once.
5. **Six leftover worktrees** were cleared this round; two remain, both held by their own sessions.
   `held` is the column to read before touching any of them.
