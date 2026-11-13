# Planner handover — edition `746`, 2026-11-14

**This is a DELTA against `745`.** It says what changed, corrects its predecessor, and reports what each
of `745`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS: THE SECOND 2026-11-13 PLAN'S** — eleven streams, seven measured,
read on 2026-11-13 and recorded in `.plan-day.md`. **This edition's own plan is the THIRD 2026-11-13 one,
which ran to eight streams in three batches, and its seven figures ARE in here** — unusually, because its
last batch was set up on 2026-11-14, a day after the rest, so a complete set was already readable at this
edition's own setup. **Do not take that as the new pattern.** The normal case is a missing set, and a
missing set is not a lost one.

---

## THE LEAD: THE DATE GUARD `745` ASKED FOR WORKED, AND THEN THE DAY TURNED OVER MID-PLAN

**`745`'s lead was every brief dated a day into the future, and its fix was one line: read the date from
the system and compare it with the date on the handover you just read.** It was done this plan, twice, and
it mattered both times.

- At setup of batches 1 and 2 the system said **2026-11-13** and `745` was dated **2026-11-13**, so this
  was the **third plan of the same day** — not a new one. Every date written was 2026-11-13, and
  `decision-dates` stayed green on all seven streams.
- At setup of batch 3 the system said **2026-11-14**. **So one plan now spans two dates**, and the batch-3
  brief prescribes `docs/decisions/2026-11-14-tenancy-reown.md` while its six predecessors are `2026-11-13-`.
  **That is correct, not an inconsistency to tidy.** `decision-dates` blocks on a file dated after today,
  so a batch-3 stream obeying a 2026-11-13 instruction would have been fine and a batch-1 stream obeying a
  2026-11-14 one would have gone red — which is why the check is asymmetric and why the date is re-read at
  **every** batch's setup, not once per plan.

**THE GENERALISATION WORTH CARRYING: a plan is not a day.** `SKILL.md` ties measurement to the day and
batches to the plan, and those two clocks come apart the moment a plan straddles midnight. **Re-read the
system date at every setup, and write the date you read — not the date at the top of `.plan-day.md`.**

---

## WHAT IN `745` IS SUPERSEDED

- **`745`'s owed item 2, "brief length may move the floor", is NOT SUPPORTED, and this is the first
  evidence that actually tests it.** The previous plan wrote batch 1's three briefs within **134
  characters** of each other on purpose, as a control. Their floors came out **86,893 / 86,672 /
  89,214** — a spread of **2,542 tokens, about 70% of the entire 85,880–89,570 range across all six
  sound figures.** Three near-identical briefs spread as widely as six different ones. **Brief length is
  not what moves the floor. Stop pricing briefs by length, and stop treating a long brief as a cost.**
  The monotonic reading from `744` now stands at three points for, one against (`report-animal`) and one
  control against. **`745` called it "SUPPORTED and still not closed"; that was too strong, and the
  control it set up is what disproves it.**
- **`745`'s residue is CLOSED.** The two merged PR bodies citing non-existent `2026-11-14-` decision files
  (#1557, #1560) were corrected by comment on 2026-11-13, after Lutan added `Bash(gh pr comment *)` to
  user settings. **Nothing is owed on it.**
- **`745`'s owed item 4 is spent:** `#m3kpq` was built as one stream, `merch-shop-deferred` (#1571,
  migration `0373`), exactly as it said — one stream, not three.
- **`745`'s owed item 5 is spent:** `src/lib/merch/shop.ts:81`'s dated rate constant is gone.
  `shop-staff` did **not** build the screen its own comment promised; the planner read the PR rather than
  assuming, filed `#r4ktv` from the tree, and `merch-exchange-rate` (#1575) built it with migration
  `0374`.
- **`745`'s owed item 6 held:** this plan was three batches, and it grew to eight streams only because he
  added two mid-plan. **Plan three; let him add.**

---

## BOTH OF `745`'s HYPOTHESES FIRED, AND THE BUTTON-RULE ONE IS THE IMPORTANT RESULT

`745` asked for two mitigations to be checked rather than assumed. **This is the check, and both went the
right way:**

- **The button rule as a NUMBERED DELIVERABLE, not a block.** `745` wrote it into `adopter-portal-app`'s
  brief as deliverable 6 after `control-activity` went red on `shop-staff` for a Save button a read-only
  login could see. **#1567 reported it in terms — *"Controls: Send and file chooser, drawn only for
  animals in `adopter_residents()` scope; action asks `adopter_may_submit`. Nothing ungated found"* — and
  `control-activity` stayed green.** #1568 did the same for its staff screen. **A block is read once; a
  numbered deliverable is reported on. Keep writing the button rule as a deliverable on any page whose
  read level is lower than its write level.**
- **`report-animal`'s two open questions were both answered, with reasoning, not avoided.** One form, not
  two; `/services/report-animal` under the existing prefix, so nothing in `PUBLIC_PAGE_PREFIXES`, the
  Worker cache lists or the sitemap changed; and `neverHidden` on purpose, because a way to report an
  injured animal should not be switchable off by accident. **Its own line is the shape to want from a
  brief's open question: *"Not a question I think Lutan needs to answer now."***
- **`adopter-portal-app` answered the fostered question and correctly did NOT act on it:**
  `public_adoption_updates` **does** show an approved update on a fostered resident, because `0343` never
  reads the placement type. **No migration, nothing built, and whether it SHOULD show is `#k2vrj`, which
  is Lutan's.** That is the right division: the stream established the fact, the planner filed the
  decision.

---

## THE COST FINDING OF THIS PLAN: THE SHOP'S SCHEMA WORK IS UNDER-BANDED, THREE TIMES RUNNING

| plan | stream | over its band by |
|---|---|---|
| second 2026-11-13 | `bills-chips` | 19,435 |
| second 2026-11-13 | `shop-schema` | 10,698 |
| third 2026-11-13 | `merch-shop-deferred` | **50,981** |

**Three overruns in two plans, every one of them shop or shop-adjacent schema work, and almost nothing
else has gone over at all.** The reading is not "those streams ran long" — it is that **this area is
systematically priced too low.** `merch-shop-deferred` was banded 165–200k for three additive migrations
on the same tables and came in at 250,981.

**Band the next shop schema stream at 200–250k.** And the general form, which is the part to carry:
**when the same AREA goes over repeatedly while everything else lands, revise the area's band, not the
brief.** `SKILL.md` already forbids raising effort to fix an overrun; this is the other half of that rule.

**One thing this plan's set did NOT have to discard, for the first time in three plans:** every one of the
seven ran on the dials its band was measured at, so **nothing was thrown out as "band does not apply"**.
One figure was excluded and only one — #1570, `compacted=yes`, whose `messages=46,172` is far below what
an uncompacted session of its length would show. **That tell is reliable; use it.**

---

## THE INCIDENT OF THIS PLAN, AND IT IS A DELIVERY INCIDENT RATHER THAN A WORK ONE

**Lutan: *"Documents are no good for me, they are unformatted and too difficult to read. I need a guided
stream to work through it together"*, and then *"Those documents were already reviewed"*.**

The planner had answered three of his four asks by putting **markdown files on his Desktop** — a 71 KB
file of 417 Thai strings among them. **None of it was a delivery.** What he wanted was a session that puts
the work in front of him a few items at a time and asks him about them.

**IT WORKED, AND THE FIGURES SAY SO.** `thai-read-guided` (#1572) read **all 417 strings in 76 minutes**,
in chat, with a bilingual reader beside him, at a floor of 85,880 — the bottom of its band.
`thai-read-finish` (#1574) then read the 34 `uploads` strings that no list would ever have served him and
closed two items. **Two streams, both guided, both cheap, both finished.**

**AND IT KILLED A STREAM THAT WAS ABOUT TO BE BRIEFED.** `waiting-on-lutan-report` was going to build a
**generator** for his waiting-on-you list — a better document, produced weekly. He had already read that
list and did not want it in that form at all. **The generator was the right answer to "how do we stop this
going stale" and the wrong answer to "how does Lutan use it".**

**THE STANDING RULE, and it belongs in every future planner's first turn: a long reference document is not
a delivery to this user.** For anything he must work **through** rather than read once — strings, jobs,
decisions, a review — **brief a guided session, not a file.** Files are right only for something he
forwards to somebody else.

---

## MULTI-TENANCY HAS STARTED, WITHOUT THE PRODUCT NAME, AND A PLANNER NEEDS TO KNOW HOW

**Lutan, 2026-11-13: *"If there is nothing more we should also start the work on multi tenant"*.**
`#ykefa` says in terms *"Needs the product name first"*, and **that is still true of the BUILD.** What was
started is the **hardening** the spike says must ship with it, which needs neither tenancy nor the name:

- **`tenancy-catalogue-lint` (#1573, merged):** `scripts/check-tenancy-catalogue.mjs`, report-only, with a
  `--strict` mode built for the next stream. **It cannot run in CI and that is deliberate** — ownership
  lives in `pg_catalog`, CI holds no `SUPABASE_ACCESS_TOKEN`, and a job without it would check nothing.
- **`tenancy-reown` (batch 3, briefed 2026-11-14):** create a role without `BYPASSRLS` and re-own the
  objects, with the lint as its instrument.
- **The permanent canary diff cannot start.** It plants a second shelter; there is no shelter concept to
  plant one in.

**TWO FACTS A FUTURE PLANNER MUST NOT RE-DERIVE:**

1. **The spike's counts are wrong now.** Measured on dev 2026-11-13: **53** owner-run views (spike: 38)
   and **92** `security definer` functions (spike: 58), 107 API-reachable objects flagged. **The re-owning
   is about 40% bigger than the ≈50-hour estimate assumed.**
2. **`create role` is in dispute on the same database.** The spike's harness created
   `spike_definer nologin inherit nobypassrls` on 2026-10-09 (readable at
   `3761a29d:scripts/spike-multi-tenancy.mjs:217`; that commit is still in the object store). The lint
   stream was refused **42501** on 2026-11-13. **`tenancy-reown`'s step zero settles it, and if the answer
   is no, the whole ≈50-hour approach turns on it.** Read its PR before briefing anything downstream.

**And the risk its brief leads with, because it is counter-intuitive:** re-owning **alone** may blank the
public website. The spike's fix is re-own **plus one permissive `using (true)` policy per table**; without
those, a view owned by a role lacking `BYPASSRLS` is subject to RLS as that role, which has no policies,
so it reads **0 rows**. **The md5 regression proof is not paperwork; it is the only thing standing between
that change and a blank site.**

---

## STANDING CHECKS — one new, two reaffirmed

- **NEW: when a stream reports a finding and says *"for the planner to file"*, FILE IT THAT SETUP.** Four
  were filed this plan (`#v3qlt`, `#p8fwd`, `#n2bkc`, `#d6xhs`), each from a PR body, each in its subject's
  section. **A finding that lives only in a merged PR body is invisible to every future plan** — nothing
  greps PR bodies. The streams were right not to file them; the planner is the only one who can.
- **THE STALE TITLE HAS NOW BEEN CAUGHT NINE TIMES.** `#z1qn7` was ticked with its title still reading
  *"(later; not started)"*. **Every batch, re-read the title of every item a stream touched, alone.**
- **A STREAM'S REPORT IS A REPORT, NOT PROOF.** It paid again: reading #1565 rather than trusting its
  comment is what produced `#r4ktv`, and reading #1567 and #1568 is what confirmed both of `745`'s
  hypotheses. **Both checks were cheap.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 8 of 8 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** Same date means you are the
next plan of the same day, which is normal; a later date means the clock has turned over. **Never derive
today's date from a document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Four editions have recorded that as the fix for an interruption and it still holds.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S EIGHT.** Seven are already measured and recorded in `.plan-day.md` (#1569–#1575),
   because batch 3 was set up a day later. **What is NOT measured is `tenancy-reown`** (batch 3), which was
   in flight when this was written. **Read its `stream-usage:` comment, and read its PR body for the
   `create role` answer**, which is the single most consequential fact the next plan can hold.
2. **RE-DERIVE THE FLOOR AND NEVER CARRY IT FORWARD.** This plan: **85,880–89,570, mean 87,363 from six**.
   Its predecessor: **84,842–88,574, mean 86,833 from seven**. The mean has moved 530 up. **And do not
   re-test brief length** — the control above settled it.
3. **CHECK BATCH 3's HYPOTHESIS.** `tenancy-reown`'s brief says re-owning without the per-table permissive
   policies blanks the site, and makes the md5 regression proof a deliverable it may not merge without.
   **Did it run that proof, and was the difference empty?** If it merged without it, that is a briefing
   failure to write down, not a stream's.
4. **`#r4ktv` IS CLOSED BUT `#p8fwd` IS ITS TAIL.** Staff can edit the five rates; adding a **sixth
   currency** still needs a migration. Decide whether that matters before the shop opens to buyers outside
   those five.
5. **`#v3qlt` IS CARD WORK AND CANNOT BE SPLIT.** A levelled donations-read activity replacing the yes/no
   `donation.receipt` means a changed activity, so it is one stream carrying its own migration —
   `check-cards-count` asserts an exact count from `cards.ts`.
6. **TWO SMALL ITEMS TO FOLD, NOT TO BRIEF:** `#n2bkc` (placeholder "one"/"7" text in
   `list-thai-added.mjs`) and `#d6xhs` (one English refusal still says *"Your role cannot…"*). **Each is
   minutes. Fold them into the next stream in their area; neither earns a floor of its own.**
7. **NOTHING WAS CLEARED THIS PLAN, ON PURPOSE.** Batch 2's three folders are **HELD by their own
   sessions** — clear them once those close. **`cut-release-0-46-0` (3001) is free with PR #1576 merged,
   but 0.46.0 is a release this chat did not run**: the record PR and the production deploy may still be
   ahead of it, and the deploy is Lutan's. **A release worktree is not a leftover to clear on sight. Ask.**

**Do NOT re-ask him about:** the product name (it is with him, and asking again is a status question he has
already been given); the adopter-portal exception (settled in writing, `745` has the scope); `test-plan`
being advisory; merging a green PR; or anything on `745`'s and `744`'s do-not-re-ask lists, all of which
still holds.
