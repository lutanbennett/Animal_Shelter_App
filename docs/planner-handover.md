# Planner handover — edition `528`, 2026-10-31

**A delta, thirty-first edition in this shape. Nine streams** — batch 3 measured, batch 4 built and
measured, batch 5 set up, all in one day. **All six measured streams ran `opus` / `medium` again**, which
makes twelve running that have ignored a Sonnet/low recommendation. `519`'s subject was *does the
environment hold what the proof needs?* — **it fired three more times and belongs in the skill.** This
round's subject is the one that has now cost four overruns in two batches:

> **A judgement the stream must SETTLE costs more than a change it must MAKE.** Five readings. Band the
> shape, then **count the judgements and add roughly 15–20k each.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `519` → this. **The next slug is `537`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: YOU ARE BANDING THE WRONG NOUN

Four overruns in two batches, and when I lined up their causes they were the same sentence each time. I
priced **what the stream would change** and then asked it for **what the stream would decide.**

| stream | banded as | what it actually did | miss |
|---|---|---|---|
| `assistant-model-waits` | three specified changes | three judgements + a fake model machine | **+13%** |
| `pi-failover-schema` | one migration, four decisions | ten proofs where two were asked, a registry declaration, a check fault diagnosed | **+6%** |
| `translations-labels-schema` | one migration, three decisions | **two** migrations, fourteen proofs where three were asked, **four corrections to the item read from the database** | **+19%** |
| `pi-failover-wrapper` | settle one question by reading | **disproved the premise**, then wrote up what *would* work and handed it on | **+8%** |

**The `+25%` adjustment for a `medium` stream is not what slipped** — twelve readings now, seven inside,
one 0.6% over, four over by 6–19%. **The base bands slipped, in one direction, for one reason.**

**What I did about it, and it is the first real test:** `translations-labels-app` is banded 205–260k by
counting four judgements at ~15–20k each **on top of** the extend-a-screen shape, and `.plan-day.md` says
so in writing. **Read its actual figure against that reasoning before you reuse the rule.** If it lands
inside, the rule has its first reading; if it lands under, I have over-corrected and you should say so.

**And the planner's half, which is cheaper than the arithmetic:** a judgement is not a thing you can
accidentally include. **It is in your own brief, in a sentence you wrote.** Count them before you band.

## THE SINGLE BEST RESULT OF THE ROUND, AND IT WAS A SENTENCE SAYING "I DON'T KNOW"

`0292`'s schema paper demanded each write reach the database as **one statement or RPC**. I could see no
way a wrapper around `runAction()` — which takes an arbitrary async body — could give that, and **I had not
established that there was no way.** So the brief said the tension in those words, and added that *"a
shared wrapper cannot give the guarantee for an arbitrary body, so here is what it CAN give and here is
what (D) must do per path"* **is a passing answer.**

It came back having **disproved the requirement**: three transactions over a wrapper, no transaction handle
in supabase-js, and being already-an-RPC does not help because those bodies read first. Its decision file is
titled *"why it is NOT one transaction"*, names the two routes that **would** give it, and hands both to (D).

**An assertion either way would have been obeyed.** Had I written *"build the one-transaction wrapper"*, it
would have built something that looked right and silently was not — in the one programme where a double
write is the whole risk. **This is `519`'s positive-form clause at its highest value yet: write your open
questions as questions.** It is one clause and it buys a stream spending its turns on what you could not
work out rather than re-deriving what you could.

## WHAT `519` ASKED FOR, and what each warning did

- **"Does the environment hold what the proof needs?" FIRED THREE MORE TIMES, all small, and it is now
  four shapes deep.** `assistant-model-waits` built a fake model machine to observe a wait;
  `pi-failover-schema` had to state that a worktree cannot read production; and this round
  **`translations-labels-schema` wrote "Production: NOT ESTABLISHED" against its own D2 and left it to
  me.** **I ran both production reads this round** (migration status, and the translation counts). **Promote
  it into the skill's `Token estimates` beside *must it build the instrument*, and promote its corollary:
  the planner is the only role that can read production, so a production proof is the planner's time, not
  the stream's band.**
- **"The floor is `tokens − messages`; you never need a live process." CONFIRMED AGAIN, and now nine
  readings.** Batch 4 read **103,245 · 103,245 · 103,245** — identical to the token on all three, the second
  batch running to do that. **It is settled. Promote it into step 2 and stop re-proving it.** My own
  planner session read 107,369 from its own categories; the drift is upward and slow. Re-derive, never carry.
- **"Some of these may be correct." FIRED** — see the section above, in its strongest form yet.
- **"A stream can REPORT; only the planner can FILE." FIRED, AND THE RUN OF FILING NOTHING ENDED.** Batch 3
  left me nothing because every stream filed its own, and `.plan-day.md` called that the system working.
  **It was the exception.** Batch 4's bodies held **three** findings on no item: two *found, not fixed*
  button gates, and the `translations.propose` split that #1134 named as warranted and could not build.
  **Two rounds of nothing is not a trend. Keep the pass; it is two minutes.**
- **The declared-crossing clause. FIRED FOUR TIMES IN ONE BATCH, none silently** — three paths in one PR
  with the reason each served, and eleven `UNION` arms in another **with the reason a release manager would
  otherwise have lost the translation counts entirely.** Mechanism. Keep it in every brief.
- **An open question belongs in the NUMBERED DELIVERABLES. FIRED, four rounds, no miss**, and I used it
  deliberately this round for the one question most likely to be quietly skipped (whether to teach a
  production check about drafts). **Settled; stop re-testing it.**
- **Count interruptions as a cost of the brief. ZERO FOR FOUR CONSECUTIVE BATCHES — twelve streams.**
  Nothing a brief should have settled reached Lutan. This is the longest it has held.
- **"Ban the file, not the folder." HELD, five rounds.** `scripts/lib/exit.mjs` named by path in every
  brief; nobody re-diagnosed the libuv trap and one stream switched its harness to `await exitWith()`.
- **"Re-read the title of any item YOU changed the facts of." HELD, and it was the backlog conflict that
  caught it** rather than a title sweep — see below.
- **ONE MITIGATION WAS NEVER EXERCISED, and I am recording it as untested rather than held.** I named
  `src/lib/releases.ts` as shared between two streams with *"keep both lines"* written in. **Stream 1 chose
  to add no release note at all** (production is behind, so a note would have been false), so no conflict
  ever arose. **A mitigation nothing tested has told you nothing.** Keep it; say so again next round.

## A FINDING CAN BE TRUE IN A PR BODY AND FALSE FROM THE CHECK, AND BOTH BE RIGHT

#1134's body says `fixed_outgoings.label` is already covered in `readonly-checks.mjs`. I ran
`translations-open` on production and it reported that pair as **"not taught"**. The arm is there, on line
366. **Neither is lying.**

`uncovered` is `not exists (select 1 from arm …)`, and each arm is `select … from <table>` with **no
`where`**. So an **empty table contributes zero arm rows**, its arm is invisible to the coverage test, and a
correctly registered label reads as untaught. **Coverage is being tested against the data instead of against
the code.** It will spread the moment `0293` reaches production, where `memes` and `site_content_photos` may
legitimately be empty — and a check that cries wolf about its own coverage is the one nobody reads.

**This is the skill's "an instrument that exists is not an instrument that is right" in a shape it does not
list: the check's own SELF-DESCRIPTION was wrong, not its count.** Filed, with the fix (test the arm list)
and a note to fold it in with the string-literal item, which is the same class.

**The transferable habit:** when a PR body and a check disagree, **do not pick a side — read the query.**
One minute settled it, and the alternative was filing a correct stream's claim as a false one.

## ONE SMALL THING I GOT WRONG, NOW IN THREE BRIEFS

I wrote `node scripts/dev-signin.mjs --cards website.gallery` into a brief. **`website.gallery` is an
activity; the card key is `website_photos`.** The stream read the script's refusal, which prints the real
keys, corrected it in its PR, and drove the negative case properly. **`--cards` takes CARD KEYS.** It cost
nothing because the stream checked, which is the argument for naming the command in the brief at all.

## FOR THE SKILL'S STEP 1: THE BACKLOG MERGE NOW CONFLICTS EVERY DAY, AND ALWAYS THE SAME WAY

Two days running. A PR ticks an item on `main` the same day the `backlog` branch reworded or re-filed it,
`docs/backlog.md` is one item per long line, and git cannot merge two rewrites of one line. **Both times the
resolution was the same: keep `main`'s ticked line, drop the backlog branch's stale `[ ]` copy, keep any new
item the backlog branch added beside it.** Ninety seconds once you know; a rediscovery each morning if not.
**Worth one line in step 1** so nobody treats it as a sign something has gone wrong.

## HIS DECISIONS THIS ROUND — all in `.plan-day.md`; never re-ask

- **`assistant.record` goes on the `assistant` card**, restoring `0257`'s pairing. No new card to assign.
- **The release waits until AFTER batch 5**, asked directly with six migrations pending.
- **Batch 5 = all three streams as planned.**
- **He merged #1132 himself** after it was held for the bilingual read. **Never ask him what he read.**

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, open item count, the highest migration and how far production is behind: in `.plan-day.md`'s own
  state block, and **all four moved during this round** — the schema stream shipped two migration files, not
  one, so the next number is not what the previous plan said.
- **A release is the next step after batch 5, and nothing can deploy until it runs:** `scripts/deploy.mjs`
  refuses any commit whose migrations are not all applied. **Major versus minor is his and mails every
  admin; the production Worker deploy is his.**
- **(D) is now measured, not guessed:** `grep -rl "runAction\|runWriteAction" src/` gives the split by area,
  so it is four finishable streams. **Brief them from `docs/decisions/2026-10-31-write-request-wrapper.md`,
  not from the item**, and remember every (D) stream appends to the one path list in `worker/origin.mjs` —
  so no more than two in a batch.
- **One worktree is still HELD** by an open session whose PR has merged. Ask before tearing it down.
