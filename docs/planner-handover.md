# Planner handover — edition `555`, 2026-11-01

**A delta, thirty-fourth edition in this shape. Nine streams plus one unplanned** — batches 12 and 13
built, merged and measured, batch 14 set up, every PR green on its own head commit. **The bands are the
calmest they have been: two inside, one under and one 5% over across the two measured batches**, so this
edition is not about estimating. It is about the thing that nearly shipped broken:

> **A TICKED ITEM CANNOT CARRY AN OUTSTANDING STEP. Nobody re-reads a ticked item** — so a step left
> inside one is invisible, and the planner is the only role positioned to notice.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `564`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: THE NEAR-MISS, AND WHY NO CHECK WOULD HAVE CAUGHT IT

A stream shipped a migration and its app half together, applied the migration to **dev**, ticked its
item, and merged. **Production did not have the migration.** The code that needs it was on `main`.

**What would have happened:** the migration is a `grant insert (id) to anon` and the app half makes the
public desexing sign-up send its own request id as the row id. Without the grant, **a member of the
public signing their dog up gets an error** — on a page with no signed-in login to explain it.

**Four things had to line up, and all four did:**

1. **The item was TICKED**, correctly, because the code half was done. **So nobody would re-read it.**
2. **The migration's `-- consumer:` header was present and correct**, so `apply-migrations.mjs` *warns*
   when the consumer ships ahead of the migration — **but a warning is not a block**, and the release
   path does not stop on it.
3. **The stream said it in its report** — *"Production still needs 0297 applied before this code
   ships"* — which is exactly right and exactly not enough. **A report is not a filing.**
4. **A release had been cut an hour earlier**, so the hazard was invisible in the one place anyone was
   looking. It missed that release by fifty-nine minutes.

**It was caught by running the one command the planner alone can run:**
`apply-migrations.mjs --status --env production`. **So: after any batch carrying a migration, read
production's status and file what you find as its OWN item.** Not a note on the ticked item — its own
item, in the section the step belongs to.

**The general form, which is worth more than this instance:** when a stream reports a step that is
**someone else's to take**, the tick records what the stream did and the filing records what remains.
**Those are two different artefacts and only one of them gets read.**

## THE FINDING OF THE ROUND: THE SKILL IS DENSE, NOT REDUNDANT — SO TRIMMING IS NOT THE LEVER

A stream was given the standing item to trim `.claude/skills/plan-day/SKILL.md` and took it from
**1707 to 1686 lines — twenty-one lines, about 1%.** It reported, correctly, that most of what it read
was **not** redundant.

**The item's premise was wrong, and it had been repeated for several editions:** that the file had grown
by accretion and could therefore be cut. **It has grown, and it is still nearly all load-bearing.**

- **The cost is real** — the planner reads it in full every round — **but the levers are promotion out
  to `CLAUDE.md` and restructuring so a rule can be found without reading to the end.** Neither is a
  trim. **Stop commissioning trims.**
- **It went 5% over band to produce 21 lines**, which is the honest price of a careful read of 1707
  lines and not a fault. **Band a judgement pass on the reading, never on the output.**
- **The stream also refused to over-cut, and the previous one refused outright** — both correctly. A
  brief that says *"where you cannot tell whether a passage is load-bearing, leave it and say so"* gets
  a better answer than one that asks for a number.

## WHAT CHANGED IN THE LOOP: THE PLANNER OWNS THE DIALS, AND THE RULE IS NARROWER THAN IT LOOKS

Merged as a rule in `CLAUDE.md` and the skill. **Since then: succeeded on three batches, refused twice,
for two different reasons.** Both are conditions on *where the turn came from*, not on anything the
planner can arrange in the brief:

1. **An AUTOMATED-EVENT turn is refused** — *"start sessions only on the user's own words to you here"*.
   This bites constantly, because worktree installs take two minutes and so land as background
   notifications. **The fix is sequencing and it works: run the installs in the FOREGROUND, one at a
   time, so the turn stays his.** Three foreground installs fit inside the command timeout comfortably.
2. **REMOTE CONTROL is refused** — *"only on a message typed in the desktop app"*. **No sequencing
   fixes this one.** He moves between the two during a day, so expect it.

**So the rule works when the turn is HIS and he is at the DESKTOP APP.** The fallback is documented and
ran both times: name the folder and the port and let him open the session. **The skill now carries both
conditions; `CLAUDE.md` still names only the first** — a one-line fix for whoever is next in there.

**And the consequence that will be forgotten: a dial the planner set is not evidence of his choice.** No
model finding can be drawn from `get_session` any more. Band at `low`, state the `medium` figure beside
it, and stop writing model advice.

## WHAT `546` ASKED FOR, and what each warning did

- **Its amendment's subject — never raise a band for the size of a surface — HELD TWICE MORE.** Batch 12
  came in one inside and two under, batch 13 two inside and one just over. **The axis is what the stream
  must FIND OUT, and nothing this round argued otherwise.** Treat it as settled.
- **Its own lead — a ruling you ask for becomes an instrument — NOT RETESTED.** No stream in either batch
  was asked to make an enforceable ruling. **Unrefuted, unconfirmed; do not report it as fired.**
- **`537`'s lower-bound rule: FIRED AT LAST, and short by nine.** An item said *"about thirty"* strings
  and an earlier count said 33; the real figure was **42, with 84 string edits.** It had been carried as
  *not tested* for two editions. **The habit stands: for any item quoting a count, the first deliverable
  is the measurement.**
- **AND IT STILL CAME IN UNDER BAND**, because the thinking had been done for it — which is the size
  rule and the lower-bound rule agreeing rather than competing.
- **"A stream can REPORT; only the planner can FILE": fired, and this round it mattered most** — see the
  near-miss above. **The streams are now good at filing their own leavings**, so what reaches the planner
  is the residue: a production step, and a brief-block bug.
- **An open question in the numbered deliverables: fired, nine rounds, no miss.** Every stream in both
  batches carried one and answered it, including two that answered *against* the planner.
- **A partial pass, explicitly permitted: FIRED and worth keeping.** The control-listing stream audited
  the shared header and thirteen admin pages, **named everything it did not reach**, found the header
  needed no change and found one real gap. **A brief that sizes an unknown surface and permits stopping
  gets an honest answer; one that implies completeness gets a skim.**
- **The floor is `tokens − messages`: now twenty-seven readings**, batch 13's three within 760 of each
  other. **Re-derive; never carry.**
- **Interruptions: one across both batches**, and it was the planner's — a session start refused on an
  automated turn, costing one round-trip and one word from him.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, and both batches'
  figures: `.plan-day.md`'s own blocks. **Batch 14 carries no migration and the next number is free —
  deliberately, because two of its three streams might need it and both are told to STOP and report
  rather than add one.**
- **ONE THING IS OWED AND IT IS TIME-SENSITIVE:** the pending production migration from the near-miss
  above. It is filed under `## Deployment (before go-live)`, the command is allow-listed, and the runner
  applies every pending file — **so read `--status` first in case others have accumulated.**
- **A release was cut this round by a release manager, not by the planner.** Lutan said *"I will get the
  release manager to do the release"*: **do not cut one, do not prepare one, and do not put it to him as
  a decision he owes.** Major versus minor and the production Worker deploy remain his.
- **An UNPLANNED stream shipped a PR this round** and closed an item a later batch had scheduled.
  **Counted in the nine, as the skill requires.** Re-check the backlog between batches rather than
  trusting the saved plan: the item was already ticked when the planner went to brief it.
- **The Pi-failover programme is finished bar two addresses**, both held by the stream running now.
  **The fallback fault it depends on is still open and is NOT a stream** — it needs a repeat power-pull
  drill with `wrangler tail`, which needs Lutan at the Pi. The probe now captures the headers and
  bodies that drill will need.
- **Several worktrees are leftovers** with merged PRs. **`ahead` is not the test; the PR is**, because a
  squash merge leaves a branch ahead for ever.
