# Print the command, not the number — and decay is not only in one direction

**2026-11-09, the same day as `2026-11-09-handover-stale-undone-lines.md`, which this extends.** Lutan
asked *"Is the handover up to date"* for the second time in one day. Three things were stale, and
**only one of them was the kind of line yesterday's pass was looking for.**

| What it said | What was measured, 2026-11-09 |
|---|---|
| *"Next free migration number: `0343`"* | `0346` is the highest on `main`, so `0347` |
| *"Both databases hold **339** migrations and neither drifts"* | production **344 applied, 4 pending**; dev **348, 0 pending** — and they differ |
| *"one `nslookup` says it has not [moved]"*, of UAT | UAT has moved; `uat.lannacare.org/api/version` answers `0.43.6`, as the file's own opening page says |

## 1. A number in prose cannot be kept correct, so do not print one

Yesterday's rule 3 already said *"a number is a measurement with a date on it, never a line to copy"*,
and the correction it made **still printed a number** — `0343` — with advice to run `git ls-tree`
beside it. Four migrations landed the same day and the line was wrong again within hours. **Twice in
two days, under a rule written specifically to stop it.**

So the rule was right and its application was too timid. The handover now prints **no next-migration
number at all**: it prints the command and says to add one. A line that cannot be correct for a day
should not exist, and a reader who has to run a command is in exactly the state the rule wanted.

The same applies to the migration **counts** in the opening. They are now given as a dated
measurement with the command beside them, and **UAT's is marked "not re-measured"** rather than
carried from the previous edition, because reading UAT needs a window without the other account's
shell `SUPABASE_ACCESS_TOKEN` and that was not done. *Not measured* is a fact; a copied figure is not.

## 2. Decay is NOT only in the "a job is outstanding" direction

Yesterday's file put real weight on this: *"every one of the four was stale in the same direction: it
said a job was outstanding when the job was done"*, and explained why that direction is the dangerous
one. That reasoning holds for those four and is not withdrawn.

**But it is too narrow as a rule, and relying on it is what let today's three through.** Of them:

- The **migration number** was not a "still outstanding" line at all. It was a plain fact.
- The **339/339 count** was a plain fact too, and a *reassuring* one — it said two databases agreed
  when they now differ by four. That is the opposite direction: a line claiming things are fine.
- The **UAT `nslookup` sentence** was a closing flourish, written as a lesson about reading the live
  state, and it is the only one of the three in yesterday's direction.

**The general rule: anything in a handover that a command could check is re-measured at each edition,
whatever direction it points in and whatever rhetorical job it is doing.** Searching for "still never"
and "has not yet" finds one class of stale line and misses facts, counts and examples.

## 3. A closing flourish is a claim

The UAT sentence survived yesterday's pass because it reads as a moral rather than a measurement — it
is the paragraph that *tells you* to read the live state. It was carrying a specific, checkable,
false assertion (`nslookup` shows UAT has not moved) inside the lesson. **The passages a reader trusts
most are the ones nobody re-checks.** It is corrected in place, keeping what happened, and its moral
is widened to *never accept "it's done" — or "it's not done"*.

## What was checked and found true, so nobody re-does it

All three hosts on `0.43.6`; production at `9b07b038` as stated; `/api/status/health` answers **401**;
the public site locked (`robots.txt` is `Disallow: /`); the test and UAT cache-purge lines current;
the restore line correct, having been fixed hours earlier by `2026-11-09-restore-risk-settled.md`.

**Not re-measured, and left as the file has them:** the Pi's `guard-release` warning (needs the Pi)
and the `audit:prod` figures (needs an install and a run). Both are named here so the next edition
knows they are inherited rather than confirmed.

## The ceiling, still not fixed

`docs/release-procedure.md` rule 4 treats 150 lines as the limit. The file arrived at **163** and
leaves this change at **165**, even after the number line and the restore bullet were tightened to
pay for the corrections. **Trimming the dated FIXED/SUPERSEDED paragraphs is the next edition
writer's job at the next cut**, not a side effect of a correction pass, for the reason rule 2 of
yesterday's file gives: deleting a wrong line loses the reason somebody believed it.
