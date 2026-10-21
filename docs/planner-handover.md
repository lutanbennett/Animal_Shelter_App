# Planner handover — edition `285`, 2026-10-21

**A delta, fourth edition in this shape.** Its rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `294`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `276` asked for, and what happened

- **"Check for an open `planner-handover-*` PR first." HELD — checked, none. Keep it.**
- **"Capture the actuals the moment a batch merges." HELD, fifth round.** Nine of nine measured;
  `get_usage` again answered for sessions with `isRunning: false`.
- **"Brief the stream to run the allow-listed read-only script." FIRED, usefully again** —
  `orphans-landing-and-my-work` ran `check-menu-coverage.mjs` before and after, and that before/after
  is what proved the hub finding below.
- **The `rm`-then-write trap: HELD for a sixth edition** (skill, step 6). No new half this time.
- **"Vary the dial again on a different shape." FIRED, AND THE PREMISE COLLAPSED** — see below.
- **"The planner is now the main source of estimate error." STILL TRUE, and improving.** All three
  misses were the planner's banding, not stream scope. **Three new band corrections went into the
  skill's token section; they are not repeated here.**

## `276` was too pessimistic — this was the best spread yet

**Nine streams: six inside band, two under, one over, worst error +7%.** Figures in `.plan-day.md`.

`267` claimed prescriptive briefs made every estimate hold; `276` walked it back to "they removed the
large overruns, not all overruns". **`285`: the ±10% noise is now the whole of it, and what is left
sits in the planner's bands.** Nothing about briefs or dials changed to achieve that — the bands are
simply corrected from measurements each round. **Keep correcting them; the brief discipline is settled
and does not need re-litigating.**

## THE DEFINING FAILURE: five items offered that were already built

**Lutan caught four of the five himself**, and said, fairly: *"You seem to be struggling a bit today
with working out the backlog."*

The alert tile (#744/#746), the NFC name cards, `/donate` (c) appeals and the vet calendar had all
shipped; the fifth was an item the planner **filed that morning** and a stream **closed that
afternoon**. The cause was already in the skill's step 3 — **trust the decision files and the commits
over an item's own status notes** — and the planner applied it selectively: right wherever it ran the
greps, wrong wherever it read the prose and believed it.

**The fix is a STEP ZERO block in every brief, now in the skill (step 7)** — nine carried it for almost
nothing, since the planner had already run those greps while choosing the item. **It also tells the
stream that finding the work already done is a success, not a failure.**

**Four backlog titles were rewritten in place.** Same shape every round — a PR ships, nobody rewrites
the title. **Budget for it.**

## Its mirror image, which cost two filed items

**Work recorded only as a sub-note inside another item is invisible and cannot be ticked.** Dropping
the dead `role_home_tiles` had **no item at all**. Folding `public_adoption_updates` into
`is_public_drive_file` was one sentence at the end of an item **whose title says a person's check is
all that is left**. Both had to be filed before they could be scheduled. **In the skill now (step 3):
read the tails for FOLLOW-UPS as well as answers, and file them as their own items.**

## The hub-and-leaf finding, the one worth carrying

*Menu-removal orphans 1 of 6* named **12 rows**. The stream closed **51**, and the gate went **66 →
15**. No over-reach: `/operations` and `/management` are **landing pages listing many pages**, so
making them reachable as tiles made everything they list reachable, and the Volunteer went to zero.

**The planner quoted the item's 12 without asking what kind of page each orphan was.** In the skill
now: **ask of any count whether these are leaves or doorways.**

**Why it matters beyond arithmetic:** the gate is far closer than anyone thought, and **the remaining
15 are job pages mapping onto the four unwritten orphan reports** — now the **critical path** to
finishing the cards programme, not one errand of six.

## The dial experiment is over: you do not control the dial

Recommended Sonnet for batch 2 — **all three ran Opus**. Recommended Fable for two report-only streams
— **both ran Sonnet**, leaving Fable at **0% all day**. Lutan sets the dials himself, as is his right.
**Recommend, never plan around it; read `get_session` and record what actually ran.** Across nine
streams (four Opus, five Sonnet, no Fable) **shape and brief quality moved the numbers far more than
the model, and there is still no model finding worth the name.** In the skill now, replacing "vary one
dial per batch" as a plan.

## A coordination lesson — about who, not how, so not in the skill

**Two sessions retitled `docs/backlog.md` at once.** A "Backlog item review" session's wholesale pass
**superseded all four of the planner's retitles in tighter wording, keeping every fact** — better than
the planner's, but duplicated, and the next `git merge backlog` **conflicted** because each side had
ticked one of the two items #815 closed. **So check whether a backlog-review session is running before
spending effort on retitles:** the planner's job is to **find** stale titles, not to rewrite them all.

## Where things stand — re-read 2026-10-21, not carried

| | |
|---|---|
| `main` | `5ce57149` |
| `backlog` | in sync |
| Next free migration | `0246` |
| Open backlog items | 77 |
| Open PRs | none, before this one |
| Menu-coverage gate | **15 unexplained orphans** — "the menu cannot go yet" |
| Release | `0.38.2` newest; **`0.39.0` NOT cut, `unreleased` now carries NINE lines.** The release manager's |
| Leftover worktrees | the round's nine, all `HELD` by their sessions — **ask, do not tear down**; `done <slug>` once he closes them |
| Workstreams since handover | **9** — three batches of three. `.plan-day.md` carries the arithmetic |

**The round's nine:** #814–#816, #817–#819, #820–#822, all merged.

## For the release manager

- **`unreleased` has gone from five lines to nine**, so `0.39.0` has substance: the Donors list, diets
  as recipes, two assistant sentences, tile groups, the My tasks tile, the Home panel's retirement.
- **The alert-mail item now reads *deployed to production*** — that job of Lutan's is done; what is
  left is a real test alert turning the tile green.
- **#807 narrowed a permission with no release note** (carried from `276`): a visiting vet who used the
  bills inbox will find it closed. **For the cut to confirm, not to overturn.**

## Rulings worth not re-deriving — cited, not summarised

- **Donors get their own supporters list, NOT a contact type** — Lutan, 2026-10-21. `Donor` is not
  returning to `contact_type`, so the old item's two-migration enum dance does not apply.
- **The dry-run and acceptance family is PARKED** until every card and function is operational — Lutan,
  2026-10-21. Recorded on the item; **do not schedule it.**
- **The menu cannot come off while the coverage script is non-zero** — he asked directly, and the
  answer is the script, not an opinion.

## Next round's candidates

The next chat plans; this is only where the board points. **`.plan-day.md` carries the reasoning.**

1. **The four remaining orphan reports (2, 3, 5, 6 of 6)** — **chats, not workstreams** (his ruling):
   read-only, to his Desktop, no branch or PR, not counted in the tally. **Now the critical path.**
   Check whether 2 and 3 were written or merely dropped — they left Next up.
2. **The orphan build that follows**, then **`menu-removal`** once the gate reaches zero.
3. **`production-rehearsal`** — **displaced THREE times**, blocks the domain cutover, **not waiting on
   Lutan** (he makes a throwaway Supabase project inside the work). **Do not displace it a fourth time
   without saying so to him.**
4. **Run the app on its own user on the Pi** — buildable, then he re-runs setup.
5. **`/donate` (d), online card payment** — only if the customer asks; #821's paper now exists for him
   and the Director to choose from.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's
counting rules before writing a number** — a batch counts once, at setup, however often it is
re-planned. Branch, worktree, test plan, PR, then **merge it yourself on green CI** — never a gate.
This one is `claude/planner-handover-285`, after #813 (`276`) and #800.

**What could go next time:** the five-already-built section shrinks to two lines citing the skill's
STEP ZERO block once it has proved itself, and the dial paragraph goes entirely — a skill rule now.
