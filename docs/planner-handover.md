# Planner handover — edition `627`, 2026-11-04

**A delta over `618`.** It covers the plan that ran **all nine streams** after `618` was written —
batches 1 (#1251–#1253), 2 (#1257–#1259) and 3 (#1260–#1262), every one merged.

> **IT WAS OWED AND LATE. `618` was written at that plan's batch-3 setup; this one should have been
> written at ITS batch-3 setup on 2026-11-04 and was not, so `docs/planner-handover.md` still read
> `618` when the next `/plan-day` opened.** Nobody asked for it, which is exactly the failure mode the
> counter rule was changed to prevent on 2026-11-02. **Write it at the setup of the plan's last batch,
> in that turn, before anything else competes for the context.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `636`, due when
the next plan's last batch is set up.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE SKILL NOW CONTRADICTS A DECISION OF HIS, AND THE STREAM THAT WOULD FIX IT HAS NEVER BEEN STARTED

**Lutan reverted the planner-starts-sessions trial on 2026-11-03** (*"you create the streams and I will
manually start each one"*), and corrected the currency the whole loop is written in:
***"My usage is not based on Tokens, it's based on turns"*** … *"it's the Maxplan"*.

**Three batches have now been handed over rather than started, and the skill still says to start them
yourself.** Its *"START THE SESSIONS YOURSELF, WITH THE DIALS SET"* section is **superseded in
practice and not yet in writing.** A fresh planner reads the skill first and will do the thing he
asked us to stop doing.

**The fix was set up as its own stream — `planner-turns-not-tokens`, worktree exists, brief written,
port 3005 — and it is STILL UNSTARTED, `free`, 0 ahead, three days on.** It is waiting on him to open
the session. **Say so plainly each round rather than treating the revert as done.** Two corrections are
owed to the skill and both belong in that stream: the revert itself, and the band correction below.

**AND THE BANDING CONSEQUENCE, which is permanent and easy to forget:** a dial the planner set is not
evidence of his choice. Under the revert he sets them again, so a `get_session` reading means something
once more — **but do not rebuild model advice on it without saying how few readings it rests on.**

## WHAT `618`'s MECHANISMS AND WARNINGS DID

- **Report-every-deliverable: 9 of 9, so 30 of 30 across four plans.** Mechanism. **And it paid in a
  new way: all three of batch 3 reported findings OUTSIDE their deliverable lists and none filed them**,
  which is exactly right — three became backlog items (`#bqs1w`, `#3cqd9`, an append to `#314hq`).
- **The finishing sequence with its own read step: 9 of 9.** No stream ended a turn waiting to be
  notified. **Four plans running — stop checking.**
- **The usage comment: 8 of 9, and the miss is the news.** #1258 posted none, its process was gone by
  the next round, and **the figure is unrecoverable.** `unmeasured`, never a guess. **The mitigation —
  a sentence in every later brief naming that loss — then fired: batch 3 came back 3 of 3.** One
  reading, not proof.
- **Re-reading the TITLE of every item a stream touched: paid again, and this time on an item a stream
  had ALREADY retitled.** #1261 retitled `#314hq` properly and left one clause of the old title
  standing, so read alone it still said a schema read was owed. **The cheapest check in the skill is
  still finding things.**
- **Step zero fired on a POSITIVE and saved most of a stream.** `#79sqf` claimed a fault the sweep
  should fix; it was already fixed by #1242, **and only comparing COMMIT TIMES settled it** — the
  decision file and the PR were the same day, 09:12 against 14:55.
- **Filing into the right SECTION: held.** Five items filed across the plan, none misfiled.
- **`591`'s one-go question stays CLOSED**, and under the revert it no longer arises: the planner starts
  nothing, so no start can be refused.

## "NOT ESTABLISHED" IN A BRIEF CAME BACK ANSWERED THREE MORE TIMES, AND ONCE IT REVERSED THE PLANNER

Fourth plan running. The one that matters most is the one where the planner was **wrong**:

- **The planner deliberately deferred the adoption-update card question** on the reading that batch 2's
  approval fix would make `photos.resident_publish` unnecessary and dissolve it. **It does not.** #1259
  read it and reported the activity is **still required to attach**, on two paths, neither depending on
  the exemption. **The deferral was conditional in writing — *"put the card question to Lutan only if
  the answer survives"* — and that is the shape to copy.** What was wrong was the underlying reading,
  not the decision to have a stream check it.
- **#1258 went FURTHER than its item asked and it was right to**: it deleted the clinic scope outright
  rather than only its dead branches, and kept `/appointments` as a card-guarded redirect — **a better
  answer than the two the brief offered.**
- **#1260's shape question came back needing HIS ruling**, he gave it (*"yes, build it"* on route (c)),
  and **the stream set `rescoped=yes` itself.** `618`'s ask-for-the-flag-in-advance mechanism, second
  firing.

## BANDS: NINE READINGS, AND ONLY FIVE OF THEM ARE READINGS AT ALL

Figures and full reasoning: **`.plan-day.md`.** Three things that matter more than the figures:

- **A BATCH OF THREE YIELDED ONE BAND READING, AND IT WENT OVER.** Batch 3: one `rescoped=yes`, one
  that delivered the schema half its own brief authorised it to stop at (predicted in writing by
  `.plan-day.md`, so not a surprise), and `website-content-label` at **157,458 against 110–150k, 5%
  over.** **Expect a third of readings to be unusable and plan the sample accordingly** — four
  consecutive plans have each lost at least one figure to rescope, a stop-at-schema or a dead process.
- **THE BAND CORRECTION THIS PLAN EARNED, AND IT BELONGS IN THE SKILL RATHER THAN HERE:** a *"wording
  only"* change that must be **seen on screen in two languages** and **chased through neighbouring
  documents** is **not a quick win at the 110–150k rate.** `website-content-label`'s code was two
  labels; what cost it was writing the Thai, proving both languages on screen, and finding four more
  places describing the card the old way. **Band that shape at 150–195k, the audit row, because the
  sweep is the work.** The quick-win band itself is right and Lutan ruled in 2026-10-11 that it must
  not be quoted higher — **this is not a case for reopening it.** **The planner had the evidence: its
  own brief asked for those two deliverables, and those two are the overrun.** `609`'s rule, third
  firing: **asking for something in a brief and not pricing it.**
- **The floor spread WIDENED to 5,001** (103,956 · 105,043 · 108,957), after two batches inside 1,500.
  **`618`'s withdrawal of the near-constant claim stands and this is why.** A ~104–110k band over
  twenty-three readings, re-derived every batch, never carried forward.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, every batch's figures and the full band
  reasoning: **`.plan-day.md`'s own blocks.**
- **HIS PRIORITIES LIST IS WORKING AND IT IS THE PLANNER'S FIRST READ.** Third plan running with no
  orphans and no renames to chase, so the `titles` map has not been needed since it was built.
  **`618`'s lead rule — that filling a leftover slot is a second decision where his list applies again
  — changed the 2026-11-04 plan twice:** two of his picks were FOLDED into one stream rather than given
  two slots, and the freed slot went elsewhere only after every remaining pick of his had been placed.
  **Never write to it.**
- **A PICK OF HIS CAN BE GENUINELY UNBUILDABLE, AND SAYING SO IS NOT SKIPPING IT.** His rank 1 (an
  adoption-update video upload failing) cannot be advanced by any stream: #1252 made the error name its
  step, dev does not reproduce the fault, and **every remaining suspect is something dev does not have**
  — his own file, his login's cards, or the production Drive client. **Tell him that in those words,
  with what he should do, rather than leaving it off the table silently.**
- **TWO DECISIONS WERE PUT TO HIM IN ONE QUESTION AND BOTH ARE ANSWERED:** the adoption-update card is
  **widened, not split**; a fundraising event is **its own thing with its own table**. Both recorded on
  their items with the superseded passages marked in place. **Do not put either again.**
- **AND ONE ANSWER NEEDED A QUALIFICATION HE WAS NOT GIVEN, WHICH IS A PLANNER FAULT TO LEARN FROM.**
  He chose to widen a card without being told what widening grants: `photos.resident_publish` is
  labelled *"Put a resident's photo on the public website"* and is read in five places, and
  `cards.ts:256` records a deliberate *"never photos.resident_publish"*. **The question asked was
  *which shape*, not *what it grants*.** It was **not** re-put to him — his intent is plain and the
  implementation that honours it without over-granting is the stream's to find — **but check what an
  option COSTS before offering it, not after he picks it.**
- **PRODUCTION: `0306`–`0308` went on with `0.42.0`. `0309` and `0310` are PENDING, and `0309` must go
  on before the next app deploy.** **THE APPLY IS LUTAN'S COMMAND — tell him the fact, do not show him
  the command.**
- **R-0323 still needs him to press *Retry archive*, and NOTHING CAN CONFIRM IT AFTERWARDS.** The named
  check is filed in `## Architecture` and has no stream and no owner. **`check-production.mjs` runs a
  fixed list and takes no SQL, which is the point of its design and must not be loosened.**
- **FOUR THINGS WERE DECLARED UNVERIFIED BY THEIR OWN STREAMS RATHER THAN LEFT SILENT**, and each is a
  pending manual row, not a gap: one-card logins on the adoption-media approval screen (#1259), the
  `/appointments` redirect in a browser (#1258), the assistant confirm card in a browser (#1260 — **dev
  has no language model, so it could not be**), and the bills screens' phone steps and Thai (#1253).
- **A release is the release manager's.** Lutan, 2026-11-01. **Do not cut one, prepare one, or put it
  to him as a decision he owes.** `0.42.0` shipped mid-plan.
- **`#3nuwy` waits for his go** — the English-only database refusal sentences are counted and a shape is
  recommended, but building it is a programme of about 34 functions. **Not raised in the 2026-11-04 plan
  because there was no slot; raise it next.**
- **The Pi-failover drill, the `cloudflared` boot race and the Worker fallback that stops covering after
  ~11 seconds all need Lutan at the Pi** with `wrangler tail`. Not streams.
- **`HELD by a dev server` IS NOT `HELD by a session`, AND THE DIFFERENCE IS A FLAG.** Six leftovers
  were cleared at the 2026-11-04 setup; two read `HELD by a dev server` and `done --stop-servers`
  handled them correctly. **Read what `worktree.mjs list` actually printed rather than reaching for
  `--force`.** And from the other side: **`Animal_Shelter_planner-turns-not-tokens` is `free` with 0
  ahead and is NOT a leftover** — it is an unstarted stream waiting for him.
- **Interruptions: THREE in that plan, all the planner's pace or unit** (*"taking a long time to start
  the sessions"*, *"using a lot more of my allocation per batch"*, *"my usage is not based on
  Tokens"*). **All three were process defects and none was a question about the work.** The pace lesson
  was acted on at the next setup: reads batched into nine multi-command calls rather than forty single
  ones, and the worktrees created before the briefs were written.
