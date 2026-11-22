# The backlog says "built, proof owed" in the title, and a script only lists it (2026-11-22, #tg5vh)

**The gap.** An open item has two states on the page and the work has three: not built; built with a
press or proof owed by a person; done. The middle one was a sentence in a long tail, so each plan
re-derived it by reading code, and reading the title instead gave a false "buildable".

**Count (36 open items on 2026-11-22, read by title and by grepping bodies).** Verified in the middle
state: **2** (`#stpbk`, `#nxtqs`: built, only a human press remains). Seen but not verified against
code: `#plhbd`, `#cjred`, `#drvtk` (titles unread past the lead; not claimed). Two more were simply
done and unticked (`#3zr7o`; `#wwwcb` already ticked on the backlog branch). So the number is single
digits: **a convention, not an instrument.**

**The central question, answered.** Should the middle state be machine-checkable? **Only as a list for
a human, never as a verdict.** A script that decided an item is done could close unfinished work,
which costs more than the fault fixed. So the marker is a title prefix, `PROOF OWED:`, written by a
person who has read the code and found it right. `scripts/check-stale-titles.mjs` lists marked items,
and lists untagged items whose body says a press remains, as candidates. It still exits 0 and is not
in CI. Nothing ticks, closes or skips an item on the strength of the marker.

**`/plan-day`.** One sentence in `.claude/skills/plan-day/SKILL.md` (the "re-read the TITLE" bullet,
replacing "This has caught six.") now names the script. Net lines unchanged. The skill file did not in
fact name `check-stale-titles.mjs` before, although `CLAUDE.md` says `/plan-day` runs it.

**Verifiable against code?** Not attempted beyond a look: a marker names symbols, but matching a
symbol's existence proves nothing about whether the press passed. Left out on purpose.

**Applied.** `#stpbk`, `#nxtqs` carry the prefix (old titles kept under TITLE HISTORY); `#3zr7o`
ticked (its check shipped in #1814, runs in `check-planner-preflight.mjs`, the inventory is marked a
dated reading it supersedes); `#tg5vh` ticked. `#stpbk` is not ticked: its press is Lutan's.
