# Planner handover — edition `681`, 2026-11-06

**A delta over `672`.** One plan of **nine streams in three batches** — batch 1 (#1341, #1342, #1343),
batch 2 (#1344, #1345, #1346), batch 3 set up — all inside one day, the second such day running.

> **Written at the last batch's SETUP, as the rule requires, so ITS figures are NOT in it.** Batch 3's
> three land in `690`.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `690`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE LEAD: `672` SAID PRODUCTION WAS "HELD AND WORSE". IT IS LEVEL, AND THREE EDITIONS OF STANDING INSTRUCTION ARE WITHDRAWN

`672` recorded production as *"four migrations behind → now SIX (`0318`–`0323`). HELD AND WORSE"*, and
on the strength of that **every brief in its batches 2 and 3 wrote `n/a` on its release-note line.**

**Measured 2026-11-06, first command of the round:** `apply-migrations.mjs --status --env production`
reads **326 applied, 0 pending**. Release `0.43.4` was cut and recorded the same day (#1337, #1339).
So **the ban is lifted**, and all nine of this plan's briefs say so in a block of their own.

**What that block actually produced is worth knowing, because it is not what it looks like.** Four of
the five streams that could have ticked a note wrote `n/a` anyway — *"no screen offers the refused
write"*, *"no `src/` change"* — and **every one of those was correct.** Only #1344 and #1346 ticked.
**So the instruction removed a false constraint without inviting a false note**, which is the outcome
to want. **Do not read four `n/a`s as the block having failed.**

**The one thing still unverified, and a brief must not assume it:** whether `0.43.4`'s **deploy**
reached both halves. `docs/release-procedure.md` §6 is explicit that a Worker deploy alone does not
change what users see, and **the two version endpoints were not read against each other this round.**
Migrations being level is not the same as the build being live.

---

## THE ROUND'S THEME, AND IT IS NEW: FOUR COUNTS ON THE BOARD WERE STALE, AND EVERY ONE WAS FOUND BY A BRIEF THAT REFUSED TO ASSERT

| what the item said | what it is | found by |
|---|---|---|
| 161 English strings in `.tsx` | **20, in 7 files** — and the old figure **not reproducible** | #1343 |
| 261 English strings in `.ts` | **204** | #1343 |
| 64 `page.tsx` taking the default level | **70** | the planner, re-measuring |
| 2 future-dated decision files | **6** | the planner, re-measuring |

**#1343 is the one to learn from.** Its brief said, in these words: *"I did NOT re-measure the 161
`.tsx` strings… Re-measure them as your first deliverable and report what you get; if the number has
moved, that is a finding, not an error."* It came back eightfold smaller, with a **new script**
(`scripts/measure-english-in-tsx.mjs`) so the next person can repeat it — the old reading used a
prose-shaped regex, the stream used an AST walk. **A job banded as a wide classification pass turned
out to be mostly already correct, and none of the 20 needed converting.**

**The planner expected that correction to WIDEN the job; it shrank it.** Second time in a fortnight the
not-established rule has paid in the unexpected direction.

**THE DURABLE FACT, PROMOTED INTO THE SKILL RATHER THAN LEFT HERE** (step 3, beside the
count-without-its-database rule): **a count quoted without its METHOD ages exactly like one quoted
without its database.** Both of #1343's figures had been carried on the item since 2026-11-01 and read
as current; neither was wrong when written. **Ask of any count on an item: what counted it, and would
that method still agree?**

---

## EVERY BAND HELD. FIVE CLEAN READINGS, ALL INSIDE — the first plan where that is true across two batches

Figures and floors are in `.plan-day.md`; this says what they mean.

- **Five of six measured streams landed inside band**, none under, none over. #1346 reported
  `tokens=unmeasured` and is **not a reading** — kept out. **The floor sat at 97.4k–98.5k and is
  FLAT** after editions of slow upward drift; re-derive it anyway, never carry it.
- **`blood-test-result-text` is the one to watch**: banded 140–180k as the batch's quick win and landed
  **179,085, the top edge.** The code was one button. The cost was the brief's own deliverable 4 —
  drive it on a dead resident **that actually has a blood test result**, which meant making the test
  data first. **That is the browser allowance doing exactly what the skill says it does**, and the band
  only just contained it. **A one-control fix with a mandated drive is not a quick win; band it at the
  ordinary row.**
- **No model finding, and there cannot be one.** All six ran `sonnet`/`low` because that is what the
  dials were set to; the planner recommends and does not control them.

---

## `672`'s OWED LIST: WHAT EACH ONE ACTUALLY DID

1. **`#p3k9w` and `#c7zjk` to the front of the next plan → BOTH BUILT**, as batch 1's streams 1 and 2.
   Owed once, delivered once.
2. **`#i7qkz` next after those → BUILT as batch 2's stream 4** (#1346). It split `social.library` into
   add-and-change plus a new `social.library_manage`, added `meme_add` and **`meme_view`, the first
   Read-only library card** — which closes a gap `#8bz78` hit twice. **Annotated, not ticked: the Reels
   half remains.**
3. **`#v9t4m` starred and already ticked → he took the star off.** The panel now holds six.
4. **Three of his seven picks are not streams → still true, fourth plan running**, but two have
   shrunk to one step of his own: `#314hq` part (C) is **DONE and measured** (production level), so
   only the `/bills` press remains; `#prr9h` was built by #1331, so only his phone re-time remains.
   **`#7aev4` still needs numbers from him.** **Say so when his order is reported.**
5. **Thai unreviewed across the board → HELD, and every stream said so unprompted again.** #1343 wrote
   no new Thai at all (nothing needed converting), #1346's card labels are unreviewed. **Do not let one
   tick it as reviewed.**
6. **A release is the natural next step → IT HAPPENED** (`0.43.4`), and it is what made the lead true.

---

## A NEW FAULT WITH A PLANNING LESSON THE SKILL DID NOT HAVE: `#m2q8c`

**Two migrations both shipped numbered `0324`** — `0324_can_see_drive_file_lists_reels.sql` (#1333) and
`0324_database_health.sql` (#1334). Both applied, unrelated objects, nothing pending, **no harm done.**

**The instrument is the fault, not the files.** `check-migration-numbers.mjs` compares a branch's added
files against `origin/main`, and **each branch was cut before the other merged**, so neither could see
the other's number. It is green on both PRs and the collision is invisible to it even on `main` today.

**THE PLANNING HALF, AND IT IS THE PART TO CARRY:** it happened because the second migration came from
an **unplanned stream — a fork another session started — and no batch plan accounts for forks.**
`CLAUDE.md` allows one in-flight migration-carrying branch at a time; a plan can only enforce that over
streams it created. **When a fork or an unplanned stream is running, ask whether it carries schema
before giving a planned stream the migration slot.**

**Acted on the same day:** batch 3's migration number was **pinned in the brief as `0327`**, with the
command to confirm `0326` had landed, because #1346 still held `0326` at setup. **That is the mitigation
to check in `690`.**

---

## MITIGATIONS: SEVEN FIRED, ONE HELD, NONE FAILED

Checked rather than assumed. The full list is in `.plan-day.md`; the three that earned their place:

1. **"Re-measure; a moved number is a finding, not an error"** → the lead above. **The round's best
   line, for the second plan running.**
2. **The batch-1-to-batch-2 dependency** → **fired, visibly.** Batch 1's stream 3 built
   `check-ungranted-activities.mjs`; batch 2's stream 4 had to leave `social.library` granted by
   something or fail it. **It passes on #1346, and the stream reported `social.library` *"no longer
   listed"*.** An instrument built in one batch and depended on by the next, in one day.
3. **The declared-crossing clause** → **fired twice and saved an interruption both times.** #1346
   edited two check scripts and a unit-test count, all forced by its new cards, all named in its PR
   body under *"Declared crossings"* — **none of them a question to Lutan.** Working as designed
   rather than as a loophole.

**And one the planner should not get credit for:** #1346 asked for a `check-production.mjs` reading
on whether any card holder loses access. **The planner had already taken it that round** — nothing is
lost. **The stream was right to ask rather than assert; a brief naming the reading would have saved
the asking.**

---

## WHAT IS SET UP AND WHAT IS OWED

**Batch 3, set up and handed over 2026-11-06** — composition, ports, the carve-out and the pinned
migration number are in `.plan-day.md`, which this does not reproduce. Its three are
`bill-cards-to-one` (`#ywn5r`, migration `0327`), `page-level-classification` (`#q0wc0`, 70 files) and
`events-card-reads` (`#yacd2`, two recorded answers).

**Owed to the next planner:**

1. **`#e7v1q` goes to the front of the next plan.** Displaced, not dropped: it carries a migration and
   all three slots this plan were taken. Small, nothing to decide.
2. **`#k3q7w` is new and cheap, and its history is the interesting part.** The closed-record banner
   still says nothing can be edited; #1344 reported it having just drawn a Correct-result button on that
   same page. **It is NOT a duplicate of `#f6p2d`, which was ticked earlier the same day** — that fix
   was correct and was **overtaken when `0320` widened the same surface again hours later.** Several
   closed-record sentences exist and **not all are wrong**, so the item says to establish which first.
3. **`#bqs1w` is probably closable and nobody has checked.** #1345 saw the tag-failure notice on a
   screen for the first time and **said plainly it had not read the item to close it.** Read it against
   `docs/decisions/2026-11-06-dev-assistant-model.md` before scheduling any build.
4. **The Reels half of `#i7qkz`**, including the reel tag-search that still asks `resident.record`
   where a `who_and_where` search would do. #1346 left it deliberately and said so.
5. **`#52y56` must stay unscheduled** until why it failed is established. Lutan corrected its title
   himself: *"THIS ITEM IS NOT PROVEN, IT FAILED AND HAD TO BE REVERTED."* Two written explanations are
   known to be wrong and **the past state cannot be re-measured.**
6. **Ollama is NOT installed on this laptop** (#1345 established it). The documented dev-model route
   is a scripted stand-in: **good for a save path and a failure notice, NOT for judging whether the
   assistant understands a sentence.** A real model is his install.
7. **His, and blocking nothing else:** `#mzu7v` needs `STATUS_READ_TOKEN` on production, and
   `#u7d3b`'s data half waits on his keys.

---

## THE PLANNER'S OWN COST: TWO INTERRUPTIONS, BOTH ITS OWN FAULT

`CLAUDE.md` counts a third touch on a release as a fault to write down. **The same arithmetic applies to
a plan, and this one cost two.**

1. **He asked *"Why so slow"*** during the first round's reading pass. Fourteen items were read end to
   end, one `grep` at a time, before anything was presented. **The reading was not wasted** — it
   produced two of the four stale counts and the `#m2q8c` filing — **but it was not batched.**
2. **He had to tell the planner that `card-grant-checks` was still merging**, because the resume read
   the worktree list and the open PRs but had not yet established which of batch 1's three were done.

**Mitigation applied at the next resume and it FIRED:** take the merged list and the `stream-usage:`
comments **in the first batched call of the turn**, before anything is said. The third resume knew
batch 2's state — two merged, #1346 open with all fourteen checks green — before writing a word.
**Carry that habit; it is the cheapest thing in this edition.**
