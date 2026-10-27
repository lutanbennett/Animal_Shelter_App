# Planner handover — edition `411`, 2026-10-27

**A delta, eighteenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `420`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## WHAT `402` ASKED FOR, and what each warning actually did

- **"Band the harnesses that are RED, not the ones the item names." FIRED, and harder than it knew.**
  Batch 6 ran all 196 and found **76 red, 105 green, 15 timed out**. The item's "30" was not stale by
  five; it was stale by **forty-six**. **Running them IS the scope decision. Settled — stop carrying
  it as advice and treat it as the method.**
- **"Do not band a stream for a proof it cannot run." FIRED.** `calendar-loop-fix` was not charged
  for the production checks, and the planner ran them. **The same shape then fired twice more:** the
  planner ran the restore, and the **classifier blocked the planner's own production migration
  apply** — so **the planner is not the last resort either.** Add to the step-7 question: ask who can
  run the proof, and know the answer may be Lutan even when it looks like the planner.
- **"A prior pass has an expiry date." FIRED three times**, and the two cheap commands caught every
  one. No change needed.
- **"Check PR state with `gh`, not the session list." HELD, fourth round.** No false MERGED again.
- **The `src/lib/releases.ts` collision rule: tested a second time and held.** Both batch-2 notes
  survived into `0.40.8`. **Stop carrying it at all.**
- **Band discipline: twelve streams, twelve measured, all `claude-sonnet-5-5` / `low`.** Figures and
  verdicts are in `.plan-day.md`; the three corrections worth knowing are below.

## THE ROUND'S LESSON: AN ITEM'S *CONCLUSION* AGES LIKE A COUNT OR A PRIOR PASS

**Promoted into the skill** (step 3, beside "an item's head is its current statement"). Here because
it cost four days and is the most expensive thing this edition records.

The cron item said *"the fix is a Worker deploy or the Cloudflare trigger, and the repo is innocent.
Nothing to build; one thing to check."* **Every clause was wrong**, and it was written while only one
environment had been read. Four days went at a Cloudflare dashboard.

**What the planner did right, and it is the transferable part:** the brief did not assert the
opposite. It said the item's conclusions were **NOT ESTABLISHED, in those words**, listed four
mechanisms that produce the same symptom, and named what the existing instrument structurally could
not see — the row it reads is written by the Next route, not the Worker, so it cannot tell a dead
trigger from a crashing one. **The stream then built the missing instrument instead of arguing**, and
one unconditional heartbeat row settled it in a single quarter-hour cycle.

**Cause `942ea49f` (2026-10-23): `next` 16.3.8 → 16.4.2 added `server/preview-props.json`, and
adapter 1.20.6 throws on it. Fix `244a1731` (#1005).** Each environment died on its last cycle before
its own deploy. **The Cloudflare trigger was never at fault — exonerated by observation at the 16:45
fire, on an unchanged configuration with only the adapter changed. Date that to the fire, not to the
reasoning.**

**So: when an item states a conclusion, ask when it was written and what had been read by then.
"Nothing to build" is a finding with a clock on it.**

## THE THREE BAND CORRECTIONS, and I got one of them wrong twice before settling

1. **A BRIEF THAT HANDS OVER THE CAUSE, THE DECISION AND THE SHAPE OF THE FIX LANDS NEAR THE FLOOR —
   four readings, 27–43% under band.** `cron-leaves-a-trace` 161,185 (banded 220–270k),
   `calendar-loop-fix` 162,041 (250–310k), `filters-say-what-they-do` 169,996 (195–245k),
   `buttons-sweep-3-medical-rows` 156,879 (190–245k). **Every one had an item naming the cause and the
   decided fix.** The skill's "nothing left to discover" row is written about schema PRs; **it
   generalises to bug fixes and sweeps.** Band by what the stream must FIND OUT, never by the size of
   the surface. **In the skill now.**
2. **A HYPOTHESIS KILLED BY READING IS NOT AN INVESTIGATION.** I added ~40k for "test the `APP_HOST`
   hypothesis" and it died to `git log` and three file reads. **Ask which kind it is before widening:
   can it be disconfirmed by reading, or must something be built?** The same axis the skill already
   has for scope. **In the skill now.**
3. **The walkthrough rate — I REVISED IT TWICE IN ONE DAY AND WAS WRONG BOTH TIMES.** `402` said a
   reconciliation pass costs ~11k a step. I argued that was wrong and banded at 6.3k;
   `card-drive-content` came in at **10,297** with no adjudication, killing my explanation. I
   re-banded at ~10k; `card-drive-contacts` came in at **7,813**. **Current best, nine readings: a
   re-pass over an already-driven card ~6k a step, a FIRST pass ~8–10k, and adjudication jobs the
   brief adds push it to ~11k.** The spread inside first passes is incidental discoveries, not the
   pass itself.
   **DELIBERATELY NOT PROMOTED INTO THE SKILL. It has moved three times in one day and its author was
   confident each time. Leave it here until a fourth reading agrees** — that restraint is the finding,
   not the number.

## WHAT I GOT WRONG, and a peer caught it

**I declared a production deploy healthy on a check that could not see the failure.** I read
`https://lannacare.org/ → 200` and concluded `0.40.8` was live. **The Worker answers that whether or
not the Pi was rebuilt**, and it had not been: `/api/version` read `0.40.7` while
`/api/releases/current` read `0.40.8`. Users were on the old build and the release's two notes were
live to nobody. The release-manager session found it and quoted `docs/release-procedure.md` §6 at me,
correctly.

**The rule, and it is the same shape as the instrument rules already in step 7: verify the thing the
USER sees, not the thing that answers.** A 200 from a fallback proves the fallback. **A deploy on this
project has two halves — the Worker and the Pi — so "deployed" is never one endpoint.**

**I caught the mirror image in the same exchange**, which is why this is not a story about one session
being careless. That peer told me the heartbeat still read `never` and the cron was unproven; **its
reading was at 16:44:43Z and 16:45:05Z, and the trigger fired at 16:45:09.** Right principle, stale
measurement. **Two errors of measurement discipline, in opposite directions, inside ten minutes.**
Re-read before relying on it, and say the clock.

**From the same exchange, and worth more than either correction: the cut-to-deploy window is now
routinely long enough for other PRs to land inside it.** The deployed Worker was built from
`429229cd`; `#1006` and `#1009` merged minutes after. **`main`'s tip is not what shipped, so a Pi
build must be pinned with `--ref` to the release commit.** The release manager pinned it; nobody had
written that down.

## THE OTHER THING THAT ONLY A PERSON COULD ANSWER

Lutan reported appointments *"showing as overdue and cancelled — it can't be both"*. Two code readings
and a **live production read** all said one row cannot be both. **All three were correct.** The fault
was a filter chip whose label promised one thing and whose behaviour did another, and he settled it in
one sentence when asked what was on his screen.

**So: when a user's report contradicts the data, ask what they are looking at before widening the
investigation.** Three reads could not find it because it was not there to find. **In the skill now,
beside the instrument rules.**

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage.**
- **One item is ONE LINE in `docs/backlog.md`**, and check your own amendment script for `\n` first.
- **A measurement has a timestamp; a fact does not.** It cost both sessions today.
- **`check-who-does-what` and `check-menu-coverage` are red ON PURPOSE.**

## NEXT ROUND POINTS AT

1. **THE PI IS NOT DEPLOYED AND IT IS LUTAN'S.** The classifier blocked both the release manager's
   `ssh` and the planner's migration apply as `[Production Deploy]`. **Until he runs it, production
   users are on the previous release.** Read `/api/version` against `/api/releases/current` before
   assuming otherwise — re-read both, never carry this line forward.
2. **`test.lannacare.org` still carries the broken adapter**, so its cron is still dead and **test is
   not a valid pre-production check for the cron fix** until it is deployed.
3. **The red harness count is a fresh reading in batch 6's decision file, with its date.** The
   remainder are mostly **investigations rather than repairs**, so price them higher and expect fewer
   per stream. The brief's "do fewer and say so" escape **fired and was correct.**
4. **`policy-triage-pi-updates` was dropped from batch 3 by Lutan's own choice** and took the board's
   only quick win with it. **The next plan has no quick win unless one is filed.**
5. **Cards remain undriven and the rate above is still unsettled** — count them from the repo.
6. **The four deleted calendar entries are deliberately not restored** (his "records only"), and the
   duplicates *fix* is unscheduled: `visit-duplicates` found no pairs on production, so its cause is
   **not established** and the next step is his word, not more code.
