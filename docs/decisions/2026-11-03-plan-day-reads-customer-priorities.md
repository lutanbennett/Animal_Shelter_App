# `/plan-day` reads the Customer priorities list, which until now nothing read

**2026-11-03. Lutan, asked directly, chose *"Wire it up"*.**

## What was wrong, and it was worse than a broken control

The pinned **Lanna Care Backlog** artifact has a *Customer priorities* panel where Lutan
stars backlog items and drags them into the order he wants. Its own lead paragraph tells
him, in these words:

> Claude reads this list when it plans each day's work, and builds from the top down when
> the work allows it.

**That sentence was false from the day the panel was written.** `/plan-day` orders the day
by position in `docs/backlog.md` — its rule 1 read *"Backlog priority is the default order
across all nine"* — and **no script, skill or session read `priorities/ranking`.** Searched
2026-11-03 across `.claude/`, `scripts/` and `docs/`: nothing referenced it.

So the panel was a control that recorded a preference nobody consumed, while telling the
person using it the opposite.

## It had also never worked, for a reason that hid the above

The same day, Lutan reported he could not drag items into the panel. Three faults, found in
this order and only the last one explaining the symptom:

1. **There was no drag support at all** — no drag handling of any kind had ever been written.
2. **The only control that added an item was inside the collapsed item body**, so it could
   not be found without opening an item first.
3. **The decisive one: the panel's script runs before the items exist.** The generator emits
   the panel, and its `<script>`, *above* every backlog section. Its first act was to scan
   the document for items, which at parse time found **zero**. The item list stayed empty
   forever, so **no pick control was ever drawn, for anyone, in any view.** The ranked list
   still rendered "Nothing picked yet.", which is why the panel looked alive.

Fixed in the generator's `priorities.html` (the generator lives in the gitignored `.local/`,
so it is not in this PR): scan after the document is parsed, put the star on the item's own
row, reorder by dragging a handle, and listen for pointer moves **on the window** rather than
on the handle — without that, a drag silently does nothing whenever pointer capture is not
granted, which is what happened on the first live attempt.

**Two testing lessons, both earned the hard way here.** A first "fix" was verified by
re-running the panel's script after the page had loaded, which tested the code and skipped
the timing — it passed while the real page was broken. A second was verified by dispatching
pointer events directly at the handle, which is exactly the case that works without capture.
**Both passed against a page that did not work.** What finally settled it was driving the
real published artifact and then reading the database, rather than trusting the screen.

## What this change does

`/plan-day` now reads the ranking as the first act of step 3, before the backlog file:

```
ArtifactData  action "get"  collection "priorities"  doc_id "ranking"
              url https://claude.ai/artifact/9em8tWXwDHNeEjFuCrFKCN
```

- An item he has ranked is planned **before** anything unranked, in his order. Everything
  else follows in backlog order exactly as before.
- **No document, or an empty `order`, is the ordinary case** and means he has picked
  nothing. It is not a failed read, and the planner says nothing about it.
- **It is a steer, not an override of the sequencing rules.** Schema still precedes its app
  half, one migration a batch, one dictionary stream a batch. Where his order and a
  sequencing rule disagree, the rule wins **and the plan says so** — which is what the
  panel's own wording already promises him.
- **The planner never writes to the document.** It is his, set by pressing the star.

## The rename trap, and why the page now stores titles

An item's id is a **slug derived from its title**, and the backlog manager retitles items
routinely — several were retitled the same morning. So a rename silently orphans a pick, and
wiring the planner to the ranking without addressing that would have quietly dropped his
stated priorities and left nobody able to say what had been lost.

The page therefore now stores a `titles` map alongside `order`, recording each pick's wording
as it read when he picked it. The planner uses it to **name what he meant** rather than
discard it: *"your number 2 was 'X', which has since been reworded or ticked — is Y the same
thing?"*, asked in step 5 rather than planned around in silence. The panel shows the recorded
wording too, instead of only "Finished or renamed since it was picked".

## Deliberately not done

- **The ranking is not moved into the repository.** It is Lutan's live preference, not
  source, and it changes without a commit.
- **The generator is still in `.local/`** and so is untracked. That is a real fragility — if
  that folder is lost, the panel reverts to the broken version — but moving it is its own
  piece of work and is on the backlog rather than smuggled into this PR.
- **No fallback to role or name** is introduced anywhere by this change.
