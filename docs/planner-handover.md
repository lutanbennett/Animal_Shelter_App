# Planner handover — edition `699`, 2026-11-07

**This is a DELTA against `690`.** It says what changed, corrects its predecessor, and reports what each
of `690`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so BATCH 3'S OWN FIGURES ARE NOT IN IT.** Batch 3 —
`baseline-stamp-trigger`, `assistant-tag-retry`, `card-count-truth` — was handed over at about 12:30Z and
had not been opened. The next edition carries its actuals. Nobody asked for this edition; the counter did.

---

## THE LEAD: THE SKILL'S OWN STEP ORDER WAS THE DEFECT, AND LUTAN DIAGNOSED IT, NOT THE PLANNER

**He said it four times in one day.** The last two: *"Background work is to be done after - I don't know
how many times I need to repeat myself"*, then *"So this is the 4th time today, There is something wrong
with your instructions."*

**He was right, and `690` got this wrong in print.** `690` recorded his mid-setup request for the stream
details as *"a reasonable question, not a defect"* and counted the plan as costing one interruption. The
memory note `deliverable-first-paperwork-after` had already flagged that excuse — and the deeper cause was
never in the memory at all: **`SKILL.md` ran the paperwork before the delivery by construction.** Old
order: sync → **actuals, every merged PR body** → **backlog and filing** → choose → present → save →
*then* create the worktrees and hand over. **A planner following the skill exactly made him wait; one
following his standing instruction broke the skill.** Four instances in a day is what a contradiction
between two instruction sources looks like, not four lapses of attention.

**FIXED IN THIS PLAN, by his instruction (*"update the skill to move the streams to step 2"*): setting up
the batch is now §2.** The sections were physically reordered — 7→2, 2→3, 3→4, 4→5, 5→6, 6→7 — and the
internal `step N` references remapped. Two were deliberately left alone (`CLAUDE.md`'s own merge-train
step 4, and *"stopped at step 2 of 11"*, which is a stream's own numbering). **Proved non-destructive
rather than eyeballed:** a sorted line-set comparison of the old blob against the new showed exactly
nineteen differing lines — six headings and thirteen references — and nothing else.

**What the next planner must know about the new order.** On a **resume** nothing in the paperwork feeds
the setup: the batch was chosen and saved on an earlier run, which is what `.plan-day.md` is for. Only the
sync must precede it, because a worktree branches from `origin/main`. **On a plan from SCRATCH the setup
cannot be second**, because §5 is what picks the items — there, say so in one line and get the hand-over
list out the moment the folders exist. **The paperwork is not dropped; it moves behind the delivery.**

---

## WHAT `690`'s OWED ITEMS AND WARNINGS DID

- **`#uat7p`, UAT onto the Pi — STILL HIS, and now fully specified.** He asked for his own step list and
  got it: fix `.env.deploy.uat` (add the four `GOOGLE_OAUTH_*`/`GOOGLE_DRIVE_ROOT_FOLDER_ID` keys, add an
  `ORIGIN_KEY` **matching production's**, remove `SUPABASE_ACCESS_TOKEN` or `setup-uat.sh` refuses at step
  one), clone, run the script, the Cloudflare route and WAF host, `npm run deploy:uat -- --secrets`,
  then the failover drill. **A correction worth carrying: the planner first told him to copy the four
  `GOOGLE_*` keys out of `.env.local`, which would have pointed UAT at production's Drive tree and the
  live calendar** — the exact cross-pollination he was trying to prevent. Caught and retracted the same
  turn. **`#uq4vz` was filed beside it**: UAT's new colour has never been seen on a signed-in app page,
  and `#o1v9f` is ticked.
- **The memory concern `690` left as UNMEASURED — "memory for three Next servers on a 4 GB Pi" — is
  discharged.** Measured on the Pi: 683 MB used, **3,365 MB available** with production and test both
  running, 6 GB swap, 875 GB disk. A third server capped at 900 MB fits. **It was one `ssh` command, and
  it had been carried as an open risk for a day.**
- **The `free`/`0 ahead`/`nothing beyond main` snapshot rule fired again and held.** Three batch-2
  folders read exactly that signature; `gh pr list --state all --head claude/<slug>` confirmed a merged
  PR for each before any `done`. One command, and it is the rule that saved #1356 from destruction.
- **`stream-usage:` compliance went BACKWARDS and this is the edition's one unexplained regression.**
  Batch 1 posted three of three. **Batch 2 posted two of four** — #1369 and #1371 posted nothing, and
  both sessions were archived before the next `/plan-day`, so `get_usage` is `unavailable` by
  construction and both figures are **`unmeasured`, not guessed.** Their dials came from `get_session`,
  which never expires. **The mechanism lives in `CLAUDE.md`'s merge train, not in the brief**, so a
  stream that reads its brief and merges on green can miss it entirely. **Put one line in every brief
  next plan and check whether it fires.**

---

## THE BANDS

**Four readings this plan, all clean (`compacted=no rescoped=no finished=yes`), and the method held.**
Batch 1 went three for three — two inside, one 2.3% under — and `uat-colour`'s **deliberate upward re-band
from 110–150k to 150–190k was vindicated** at 176,041, which would have been 17% over the original.
**#1370 landed 185,190 against 145–185k: 0.1% over, the closest reading yet.**

**THE AUDIT ROW HELD FOR THE FIFTH SWEEP RUNNING** (#1370, a four-page control audit that changed one
page's level). **The honest caveat stands unchanged and must keep being printed: every one of those five
found almost nothing, so an audit that finds a real repair is still untested.**

**FLOOR RE-DERIVED from `tokens − messages` on this batch's two comments: 106,847 and 107,500** — flat
against batch 1's 106.4k–107.6k. **Never carry it forward.**

**One entry offered rather than asserted, because it has a single reading: a planner's own docs-only PR is
not a stream and has no clean figure.** #1373 was written by this session, so `get_usage` reports the
planner's whole window. **It posted no `stream-usage:` comment on purpose and said why in the PR body.**
Do the same rather than banking a planner figure as a stream reading.

---

## WHAT THE PR BODIES HANDED BACK — THE BEST YIELD OF THE PLAN

**Reading every merged PR body produced four backlog changes, and three of them nothing else would have
caught.** This is the cheapest high-value habit in the loop.

- **`#v3h8m` had to be ticked BY THE PLANNER.** #1369 shipped every deliverable and **never edited
  `docs/backlog.md`**, so its title read *"APP HALF OPEN"* after the work had merged. **Fourth instance
  of the stale-title fault.** It also answered a question its brief had carried as open — the `#` picker
  uses `/api/reels/resident-search`, which asks who-and-where — and that answer was in the PR body only.
- **`#r8kq3`** — #1369 proved the `reel_view` case and **never drove Admin or a login that can name
  residents**, so *"nothing was widened"* rests on reading the function. Same shape as `#w9n4r`: the
  stream said so plainly, its item closed in the same hour, and **nobody re-reads a ticked item.**
- **`#d3cw7`** — #1370 reported `/admin/diets` needing **`reference.types` edit AND `stock.diets` edit
  together**, which is what `CLAUDE.md` asks for rather than quietly gating on one. **A two-card page is
  invisible to every instrument we have**, because `dev-signin.mjs --cards` models a single-card login.
  **The decision — one card, or split the page — is his.**
- **`#a9d4v`, and this one is why measuring beats filing a worry.** #1371 found `public_stat_switches`
  missing from `AUDITED_TABLES` and fixed it; the list's own comment says *"every table with that trigger
  belongs here, or its rows show unlabelled"*. The planner then scanned the migrations: **20 declared, 48
  trigger sites, about 28 real tables undeclared**, plus `role_home_tiles` declared and **dropped in
  `0243`**. **The method over-counts and the item says so** — three of the 31 are trigger names the regex
  mistook for tables — **with re-measuring as deliverable one.** A worry would have been ignored; a
  measured count carrying its own caveat is a stream.

---

## TWO UNPLANNED STREAMS, BOTH COUNTED INTO THIS PLAN

- **`drive-buckets` (#1372)** — his request, and the design conversation was worth more than the build.
  The documented worry was a tester deleting a live photo; **the real exposure was that dev and test files
  sat INSIDE the tree about to be copied to the shelter's own Google account.** The fact that made his
  plan cheap: **Drive ids survive a move**, so 885 of 1,159 files could be bucketed with no database
  change, and only 7 of 198 file-holding folders were mixed.
- **`mirror-repull-note` (#1373)** — his stage-2 decision on the Pi mirror: **the Pi copy is the cache,
  Drive the fallback.** It needed **no change**, because `mirror-read.ts` has called itself *"a cache, not
  a primary"* since it was written — so the value was recording it and discharging the three costs the
  item had held open (`noauto` stays; the Worker's missing disk now costs only latency; Drive stays a live
  off-site copy). **And it fixed the fault that caused a wrong answer to reach him:** the heading
  *"stage 1 … Drive stays primary"* described an intention, and `drive-buckets` quoted it back as
  behaviour. **Production serves staff photos, documents AND videos from the Pi**, through three call
  sites the section now names. **A heading that states an intention will be read as the behaviour.**

---

## OWED, AND WHO OWES IT

1. **`#uat7p` — his**, fully specified above. **`#uq4vz` rides with it**, since that is when a genuinely
   UAT-resolving instance first exists.
2. **`#d3cw7` — his**: one card for diet settings, or split the page. Do not widen either card first.
3. **The 54 unreferenced Drive files — his**, on his Desktop since midday, for manual review.
4. **`check-stale-titles.mjs`'s eight candidates — the planner's**, and still untriaged after two plans.
   **Say so plainly rather than carrying it silently a third time.**
5. **Teach the briefs the `stream-usage:` line**, then check whether it fires. A mitigation you wrote is
   a hypothesis.
