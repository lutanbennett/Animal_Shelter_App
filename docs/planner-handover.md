# Planner handover — edition `366`, 2026-10-26

**A delta, thirteenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `375`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## `357` IS CLOSED OUT: ITS WHOLE "NEXT ROUND" LIST SHIPPED, AND ONE OF ITS NUMBERS WAS WRONG

Its five-point list is now four points done. The coded-security guarantee shipped, the patch
releases shipped, Lutan confirmed, and **every card has been written up and driven in a browser**.
Only its point 5 remains, and it is now the gate on everything: **his fault-log review as a set,
then the fixes, then Card review 2, then Management's cards, then Admin off the Director.**

**Two of `357`'s statements are now actively misleading — correct them rather than re-deriving:**

- **It says 28 cards. There are 29.** `CARD_KEYS` is `JobKey | NewCardKey`:
  **21 + 8 = 29**, and `scripts/check-cards-count.mjs` asserts it in CI. The eight job cards
  (`add_medical_photos`, `administer_medication`, `do_maintenance`, `do_purchasing`,
  `do_stocktaking`, `feed_special_diets`, `record_delivery`, `record_weight`) are easy to miss
  because they live in `jobs.ts`, not `cards.ts` — **a backlog item made exactly that error this
  round and was corrected on the item.** Never type a card list; read `CARD_KEYS`.
- **It says production is behind on migrations and the Who does what save is undeployed.** Stale.
  Re-read, do not trust either sentence.

## WHAT `357` ASKED FOR, and what each warning actually did

- **"Check PR state with `gh`, not the session list." FIRED — fifth edition running.** A PR looked
  fine by every other signal and `gh pr view` reported it `CONFLICTING` with every check `SKIPPED`.
  **Keep it forever.**
- **"A measurement has a timestamp; a fact does not." FIRED, and this time it paid.** I reported a
  count, `main` moved underneath me mid-check, and re-reading changed the answer. **Say the clock,
  and re-read before relying on it.**
- **"Capture the actuals before archiving." FIRED** — three of three read while the processes were
  alive, `session_id` echoed on every call.
- **"A note from a session is its report, not proof." FIRED HARDEST, and it was the most valuable
  minute of the round** — see the next section.
- **Its band discipline did not hold, because I set no bands at all.** See "My own failure".

## THE PLANNER IS THE ONLY ROLE THAT CAN READ PRODUCTION, AND THIS ROUND THAT PAID PROPERLY

The skill's step 2 already says to run a production check an item names. **It fired and it found a
live outage nobody knew about.**

A stream filed an item whose commit title said the production Worker cron had stopped. **I did not
take the title.** I ran the check it named, and production said the cron's last run was three days
earlier — **and that the same trigger sends the status-alert mail, so every System status alert had
been silent for three days, including the Pi-down alert built for the October outage.**

**The monitoring was down and nothing said so**, which is the exact failure the alerting exists to
prevent. The repo was innocent (`wrangler.jsonc` unchanged), so it is Lutan's: a Worker deploy or
the Cloudflare trigger.

**The lesson is not "run the check" — that was already written. It is that the yield is high enough
to do it FIRST, before planning anything.** Thirty seconds of a read-only script turned a stream's
side-note into the most important thing to tell him all day.

## MY OWN FAILURE THIS ROUND: SIX STREAMS SET UP WITH NO BANDS

Six streams were set up in conversation rather than through `/plan-day` — three card-report streams
and three more today. **Not one was given a token band.** Their actuals are therefore measurements
with nothing to compare against: `calendar-pending-tile` **224,198**, `manual-by-card` **278,853**,
`pi-origin-lever` **183,416**, all `claude-sonnet-5-5` / `low`, all sound readings.

**Banding costs one line and it is the only mechanism by which the table self-corrects.** A stream
set up outside the skill is still a stream. **Write the band even when nobody asked for a plan.**

## BAND CORRECTION — one, and it has three readings

**An app-only stream that also drives a browser across several roles lands at 180–280k on
sonnet/low**, not the 120–145k ordinary default. The three figures above are the evidence, and the
spread tracks how wide the edit was rather than how hard the thinking was — the widest refactor was
the dearest, the runbook-plus-flag was the cheapest.

This is consistent with the skill's existing +30k browser allowance; what is new is that **it
compounds with edit width rather than adding to a fixed base.**

## TWO THINGS PROMOTED OUT OF THIS DOCUMENT IN THIS PR

Per the delta rule: a fact that will still be true in three rounds does not live here.

1. **"No fallback to a named role" is now in `CLAUDE.md`.** Lutan, 2026-10-26: *"I want the system to
   enable full flexibility of roles to be named whatever a shelter wants them to be named as so
   having any fallback to a named role will break longer term."* It is a **cousin of the
   hard-coded-security rule, not the same rule**, and the difference matters: the security check
   will never catch it, because the offending files are correctly recorded as *content marking, not
   access*. Being shown the wrong manual page grants nobody anything — it just breaks the moment a
   shelter renames a role. **A rule no check can enforce has to be written down.**
2. **"A split backlog item is invisible, and nothing tests for it" is now in the skill's step 3.**
   New failure class, found this round: an item had split across two lines, ending mid-code-span,
   with its remaining 1,577 characters orphaned on the next line. **`check-backlog-sections` passed
   throughout**, because the orphan carried no list marker. It is the same invisibility as a
   mis-filed item and it has no checker. The irony is instructive: the item was *about* a
   newline-handling fault.

## TWO WAYS AN ITEM CAN BE WRONG ABOUT ITSELF — both met this round

Neither is a reason to distrust items generally; both are reasons to read the code before briefing.

- **An item can prescribe a method that a standing rule forbids.** The resident-hub item says to
  test with the Doctor role. **The Doctor is the card test role Lutan holds one card at a time on**,
  so following the item would have destroyed work in progress. The brief overrides the item and says
  why. **When an item and a standing rule disagree, the brief says which wins — do not leave the
  stream to notice.**
- **An item can under-describe its hard half.** The same item says the non-medical tiles take their
  activity "from the same source the section page uses". **That source covers the seven medical
  sections only**; for the rest it does not exist. One `sed -n` found it. **The confident sentence
  is the one to check.**

## WHAT LUTAN DECIDED THIS ROUND, and none of it is to be re-opened

- **No fallback to a named role, anywhere** (promoted above).
- **The card report's format is approved** — *"The report format is good"* — and all 29 cards are
  written up. **He is reading it now.** Do not schedule the fault-log fixes, the manual's last 14
  topics or Card review 2 until he has.
- **Outages at the shelter: once every six months, never more than two hours.** Asked and answered
  in one line, after sitting unknown long enough to block the battery item. **Ask.**
- **The PoE switch need not be protected** — *"I could bypass the switch if need be"* — which is
  what made that purchase cheap.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage.**
- **Never write scratch output above the repo.** `git show <rev>:<path>` still lies about dotted
  paths, and still reports zero when piped.
- **`worktree.mjs done` refusing is information.**
- **A note from a session is its report, not proof.** This round that rule found a three-day outage.

## NEXT ROUND POINTS AT

1. **The production cron — his, and the oldest thing on the board.** Three days of silent alerting.
   **Re-read its state before mentioning it; do not quote this sentence.**
2. **Batch 1 merging** — `resident-hub-card-tiles`, `who-does-what-features-page`,
   `release-tooling-fixes`. Composition, bands and set-up notes are in `.plan-day.md`; do not
   reproduce them here.
3. **His card review, which gates batch 3** — the fault log fixed as a set, the manual's 14
   `awaitingCard` topics, then Card review 2.
4. **The battery for the Pi** — one question outstanding with the seller: does it switch over
   automatically on AC? The decision rule is written on the item.
5. **The tunnel drill** — his hands on the Pi, and it takes production and test down together, so
   he picks the moment. When he runs it, **it serves two items at once.**
