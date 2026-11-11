# Planner handover — edition `738`, 2026-11-11

**This is a DELTA against `737` (and its amendment).** It says what changed, corrects its predecessor,
and reports what each of `737`'s warnings and owed items actually did. Per-stream figures, batch
composition, ports and the dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so BATCH 3's FIGURES ARE NOT IN IT.** Batch 3 is
`control-activity-check` (3001), `th-path-alternates` (3003) and `refusal-keys-group-4` (3005, `0353`).
**`737`'S NARROWED RULE WAS RUN IN THIS TURN, AND IT CAUGHT SOMETHING:** `gh pr list --state all --head
claude/<slug>` for all eleven slugs this edition names — **`th-path-alternates` already has #1478 open
and `refusal-keys-group-4` has #1479 open**, both created minutes after hand-over, and
`control-activity-check` has its first commit. **Had this edition written the obvious sentence — "batch
3 handed over, no session opened" — it would have been false before the document merged, which is
exactly the fault `737` was amended for. THE RULE WORKS. KEEP IT, AND RUN IT AGAIN BEFORE `gh pr
merge`.**

Batches 1 and 2 are complete: **six streams, six merged PRs, and only TWO usable band readings.**

---

## THE LEAD: HE STOPPED A STREAM FOR LACK OF PROGRESS, AND THE PLANNER THEN OVER-CORRECTED WITHIN THE HOUR

**Lutan, mid-plan:** *"I'm not happy with the backlog item / stream for Control Drive fixtures, we seem
to be making no progress after 4 streams"*. **He was right, and the evidence had been readable the whole
time.** On `#79sqf`: reading the code by hand — 12 sweeps, **0 faults**; driving the pane — 3 attempts,
**0 faults**; rendering under a one-card cookie — 1 attempt, **2 real faults found and fixed.**

**THE PLANNER'S FIRST RESPONSE WAS TO CONCLUDE THAT DRIVING WAS THE LOSING METHOD, WITHDRAW THE DRIVING
BRIEF, AND RETITLE THE ITEM *"stop sweeping, build the check"*. THAT WAS WRONG AND THE EVIDENCE ARRIVED
WITHIN THE HOUR.** `control-drive-fixtures` had already committed: it stood the dev fixtures up first
and **found and fixed a real fault on its first driven page** — the Enclosure hub drew *"Log repairs and
work needed on this enclosure…"* to a login with no Log button.

**THE REAL CAUSE, AND IT IS THE ONE DURABLE LESSON HERE: THREE FAILURES WERE A VERDICT ON THE
ENVIRONMENT, NOT ON THE METHOD.** None of the three had dev fixtures; the one that built them first
succeeded immediately. **`CLAUDE.md`'s own banding rule says apparatus-first is "an instrument at
instrument prices" — and four briefs in a row priced it at zero.** The fixture work is now written down
once and for all in `docs/dev-fixtures-for-control-driving.md`, including the trick for getting a file
into a `<input type=file>` from the pane, which nobody had recorded.

**AND THE FAULT IT FOUND IS A PROSE NOTICE, WHICH A STATIC CHECK PROVABLY CANNOT CATCH** —
`check-destination-activity.mjs`'s own decision file says *"F2 (a notice): not catchable; prose carries
no activity"*. **So the check and the driving are complementary and the item needs both.** `#79sqf`'s
title was corrected the same hour and now says so.

**TWO THINGS FOR THE NEXT PLANNER, AND THE SECOND IS THE HARDER ONE:** when an item has had three
passes of the same shape and found nothing, **brief the instrument** — this one had fourteen, and the
check (`control-activity-check`, building the second resolver that
`docs/decisions/2026-11-09-destination-activity-check.md` already specified) is only now being written.
**But do not read a run of failures as a verdict on the method before you have checked whether the
environment could support it at all.**

---

## THE STRUCTURAL FINDING: A STREAM THAT HANDS OVER CORRECTLY IS INVISIBLE

**This is the most useful thing in this edition, and it cost him two nudges and an hour.**

`control-drive-fixtures` did **not** freeze. It finished, wrote a full and accurate handover in its last
message, and stopped deliberately under brief block B — its own words: *"the session has grown large, so
I'd leave the gates, test plan and PR to a fresh session, as your brief says."* **When nudged it answered
at once and ran the gates clean.**

**But a correct handover and a dead session look identical from outside: no PR, no notification, no row
in `gh pr list` or `worktree.mjs streams`.** The finished branch sat invisible for about an hour.
**Lutan asked twice, and the planner's first diagnosis to him — "that's a real stall" — was wrong**,
corrected only by reading the session's own transcript with `mcp__ccd_session_mgmt__list_events`.

**FIXED in #1477: block B keeps the exemption for the merge, the gates and the test plan, and now
REQUIRES one `gh pr create`, titled `[unfinished]`, with the handover as the body.** The arithmetic is
one cheap turn against an hour of invisibility. **Block B therefore no longer contradicts block A.**
**THIS IS A HYPOTHESIS: the only real test is a future large session obeying it. CHECK NEXT EDITION
WHETHER IT FIRED.**

---

## WHAT `737`'s OWED ITEMS AND WARNINGS DID

- **THE FLOOR IS ≈85k, NOW ON SEVEN FIGURES AND NOT IN DOUBT:** 85,360 · 84,412 · 85,360 · 85,360 ·
  85,425 · 87,310 · 85,538. **Batch 1 of the previous plan (107.9–111.8k) was the outlier.** `737` told
  the next planner to lower the floor-derived rows; **that was done, and it was right twice over** — see
  the bands section.
- **`737`'s drive question is answered, and then answered again differently.** Its own answer was
  render-under-a-cookie. **This plan adds: driving works too, once fixtures exist.** The per-surface
  driving cost is **still not established** — the only figures are 171,388 for two pages and 154,770 for
  one, both from streams that did not finish. **Do not price a driven walkthrough from any of them.**
- **`#etr20` IS STILL OPEN. SIXTH EDITION.** The date gate has now passed (*"not before 2026-11-08"*;
  it is the 11th), so **it is a one-line change waiting for a release cut and nothing else.**
- **`#ogvcr` IS DONE AND TICKED**, by another session. Steps 1–3 were run with him — **the Nord exit
  was the whole problem: 401 ms to the Pi became 68 ms on a local server, throughput 1.2–2.6 became
  4.2–5.0 Mbit/s** — and are in his private Desktop report, not here. **Step 4 was dropped on his
  instruction** (*"I only wanted to take my laptop to Chiang Mai"*). **Two sessions worked the same
  item in one evening and it composed well by luck, not coordination.**
- **`#f56bs`'s tail was marked superseded in place.** Its title had recorded his 2026-11-06 answer
  (*always on*) for four days while its body still read *"the availability choice is Lutan's"*.

### THE CORRECTION TO `737`: ITS OWN AMENDMENT WAS ACCURATE, AND ONE ITEM IT TRUSTED WAS NOT

**`737` said `#n5r7k`'s mirror check "DOES NOT EXIST". It does, it is blocking in CI, and it shipped on
2026-11-06.** `scripts/check-ungranted-activities.mjs` is the mirror: it asks whether an activity is
granted by **no** card, resolves grants the way the app does (`loadCards`/`bundleOfCards`, so
`maintenance.photos` via `jobs.ts` is seen), and reads a dated allow-list shared with the live-database
check. **Verified by running it: `ok   no new gap: 84 catalogue activities; 5 Admin-only on purpose, 14
UNRULED; 56 cards`.**

**THE LESSON IS ABOUT THE INSTRUMENT, NOT THE ITEM: `#n5r7k` IS TICKED, SO `check-stale-titles.mjs`
NEVER LOOKS AT IT.** A stale title on a **ticked** item is invisible to every tool we have, and only
reading catches it. **That is now the second class of stale title found by hand in two plans.**

---

## THE BANDS: TWO READINGS OUT OF SIX, AND THE INSTRUMENT IS THE PROBLEM

| stream | actual | band | verdict |
|---|---|---|---|
| `th-path-locale` (slice A) | 161,011 | 180–230k | **11% under, valid** |
| `th-path-links-and-toggle` (slice B) | 150,973 | 155–195k | **3% under, valid** |
| `control-drive-remainder` | 154,770 | 200–260k | **NOT A READING — `finished=blocked`** |
| `unit-conversions-by-row-kind` | `unmeasured` | 140–175k | **NOT A READING** |
| `photo-dropdown-why-fixed` | **no comment at all** | 110–140k | **NOT A READING** |
| `control-drive-fixtures` | `unmeasured` | 230–300k | **NOT A READING — `rescoped=yes`, `blocked`** |

**1. THE `#t48xh` BANDS WERE ALL ABOUT 23k TOO HIGH, AND LOWERING THEM WAS RIGHT TWICE RUNNING.** Slice
A came in 11% under its lowered band, slice B 3% under its further-lowered one. **Slice C is banded
130–170k against the item's 150–195k on that evidence. Check it.**

**2. THE `stream-usage` MECHANISM IS DECAYING, AND IT IS NOW THE MAIN OBSTACLE TO BANDING ANYTHING.**
`brief-blocks.md` records it going **3 of 3** when it was first made a numbered deliverable. **Four of
the last six streams produced no usable figure, one posting nothing at all.** The wording was
strengthened twice — including an explicit note that `self` cannot be `unavailable` because the process
is alive — **and it did not help. DO NOT REWORD IT A THIRD TIME.** The two real options: **the planner
reads each session's usage with `get_usage` before the session is archived**, or the figure is accepted
as lost. **An archived session reports unavailable, so after the fact there is no recovery** — that is
measured, not assumed.

**3. A BAND RAISED AGAINST THE FLOOR TREND, STATED SO IT CAN BE TESTED.** `refusal-keys-group-4` is
banded **165–200k**, above group 3's 160–195k, even though the floor fell. Group 3 was 5 messages and
landed within **1%** of its band — the best-calibrated row in the programme — and group 4 has **12
sentences**, each needing a key, a DETAIL object and two dictionary entries. **The hypothesis is that
per-message work outweighs the cheaper floor. Next edition has the answer.**

---

## WHAT THE STREAMS AND THE BACKLOG HANDED BACK

1. **`#q7dn3`'s FIX IS CORRECT AND INERT, AND THAT GIVES `#c4vn7` A CONCRETE COST IT DID NOT HAVE.**
   `0352` correctly split `item_unit_conversions`' write policies so a medicine row asks
   `stock.medications` — **but no card grants either stock activity at EDIT** (only `food_forecast` and
   `medicine_forecast`, both `read`; `cards.ts:405-406`, verified rather than taken from the stream).
   **So the writes stay Admin-only until someone rules on them, and those two are among `#c4vn7`'s 14
   UNRULED activities.** It may well be deliberate — he chose Admin-only for those screens on
   2026-10-08. **The point is that a ruling now switches a merged fix on or confirms it. Put those two
   early in that walkthrough.**
2. **AN ITEM NAMED THE WRONG MIGRATION AND THE OBVIOUS FILE WAS NOT THE FAULT.** `#q7dn3` read as
   though `0340` was to blame; `0340` was already row-scoped and **says so in its own comment**. The
   fault was three unscoped policies in `0145`. **Reading the code rather than the prose is what found
   it — the third time in two plans.** The stream also settled a stale comment: `item-settings.ts`
   credits those policies to `0148`; they are `0145`'s.
3. **`#m8kq4` FILED, AND IT IS WHAT ACTUALLY BLOCKS THE `/memes/make` CANVAS.** A `meme_add`-only login
   can pick a resident but cannot read its photo list: `attachments`' select policy asks
   `resident.record`, the card grants `resident.who_and_where`. **Same shape as `#t3n9r`, one layer
   deeper. Carries a migration (a new view).** So that half of `#79sqf` was never a fixtures problem.
4. **TWO MERGED STREAMS IN TWO PLANS THAT NO PLAN ACCOUNTS FOR** — `receipt-drop-draft-link` (#1461,
   whose floor figure is one of the seven) and `pi-persistent-journal`. **Next planner: read
   `gh pr list --state merged` across the plan's window, not just the slugs you created.**
5. **A RELEASE CUT (`0.44.2`) RAN ALONGSIDE BATCH 2 AND COLLIDED WITH NOTHING** — the second time.

---

## OWED, AND WHO OWES IT

1. **`0348` TO PRODUCTION — HIS, AND DESTRUCTIVE.** Drops columns and a view; #1444 says take a fresh
   backup first. **`0350`, `0351`, `0352` and now `0353` all queue behind it, so pin any apply with
   `--upto`.** The bare runner applies every pending file.
2. **THE WORKER'S REAL CACHE API IS UNPROVEN FOR `/th/` PAGES, AND IT IS THE PLANNER'S.** Slices A and B
   unit-tested the key and cacheability; **the first real HIT/MISS needs a deploy to
   `test.lannacare.org`.** Slice C inherits it. Filed onto `#t48xh`.
3. **`#etr20`** — one line, now unblocked, ships with a release cut. **Sixth edition.**
4. **`#c4vn7`** — the 14 UNRULED activities, a session with him, one at a time. **Newly worth more; see
   above.**
5. **The `worktree.mjs streams` printer still prints a markdown TABLE and still has no `batch`
   column.** He is on Remote Control where a table may not render, so **the planner retypes it as plain
   lines every single hand-over.** Two columns of work removes the last manual step. **Third edition.**
6. **`#m8kq4`** — needs a migration; blocks the rest of `#79sqf` on that page.

---

## STANDING CHECKS — what held, and one trap worth knowing

- **`gh pr list --state all --head claude/<slug>` BEFORE `worktree.mjs new` and IN THE WRITING TURN:
  run for every slug, both times. It caught two PRs opened minutes after hand-over** (lead section).
  **This is `737`'s amendment earning its place on its first outing.**
- **`worktree.mjs list` read for `held` and `ahead` before creating anything**, every batch.
- **`worktree.mjs sync` CANNOT BE RUN BY THE PLANNER FROM THE MAIN CHECKOUT, AND IT LOOKS LIKE A BROKEN
  SCRIPT.** It takes no slug and syncs *this* worktree; the Bash tool resets the working directory
  outside the main checkout, so it runs there and correctly refuses with *"run 'git pull' in the main
  checkout instead"*. **Use `git -C <folder> merge --ff-only origin/main`; the post-merge hook pushes.**
  Needed when PR #1467 landed mid-brief-writing and left three new worktrees 3 behind.
- **`worktree.mjs done` is REFUSED by the auto-mode classifier as irreversible deletion**, bare or
  looped, so the planner cannot tidy up; another session cleared the leftovers. Nothing is blocked.
- **`check-stale-titles.mjs` run at step 4:** 9 candidates, **all 9 false positives**, **one real find
  underneath (`#f56bs`)**. Keep running it early, and see the `#n5r7k` lesson for its blind spot.

---

## INTERRUPTIONS — a cost of the BRIEF, not the stream

**TWO, both the planner's, and both on the same item.** He stopped `#79sqf` for lack of progress after
four streams, and he asked twice what had happened to a stream that had handed over invisibly. **Neither
was a stream's fault: the first was four briefs pricing the fixtures at zero, the second was brief block
B.** Both are fixed in this plan — the fixtures are documented, block B is #1477.

**And a cost that was NOT an interruption: he asked for `#ogvcr` ahead of batch 1**, which was right —
it was due that day and he was travelling — and cost the plan nothing.

**The "print the hand-over list before the briefs" fix held for all three batches. No eighth "where is
my list".** That is `737`'s structural fix, now tested three times.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` before anything. **It stands at 9 of 9 and this edition resets the counter, so you
are planning FROM SCRATCH, not resuming.**

**Batch 3 is in flight with two PRs already open — #1478 (`th-path-alternates`, slice C) and #1479
(`refusal-keys-group-4`) — and `control-activity-check` has started. Read all three PR bodies when they
land; this planner has not.** `control-activity-check` is the one to read first: it is building the
second resolver for `#79sqf` and its result decides whether that item can finally close.

**Three things to do before you present anything:** run `node scripts/check-stale-titles.mjs` **at step
4**; **read the code behind any item whose prose claims a gap**, because an item named the wrong
migration this week and the obvious file was innocent; and **print the hand-over list straight after
the last `worktree.mjs new`**, before the briefs.

**The natural first batch:** **slice D of `#t48xh`** (the proof pass, and the last slice);
**`#m8kq4`** (small, carries a migration, and it unblocks the rest of `#79sqf`); and **whatever batch
3's three PR bodies hand back** — on two plans' evidence that is where the best stream comes from.
**`#f1wp1` is his #3 priority and is still unplanned**, and `#rv4qk` and `#52y56`'s worktree-env
narrowing are both small and waiting.

**And one thing to settle rather than inherit: decide how you will capture `stream-usage` figures**, or
accept that you are banding on a third of your streams. **Do not reword the brief block again.**
