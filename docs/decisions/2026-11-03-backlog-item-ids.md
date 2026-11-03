# Backlog items carry a permanent id, and the page generator moves into the repo

2026-11-03, `claude/backlog-ids-in-repo`.

## What was wrong

A backlog item's identity was its **title**. `gen-backlog.mjs` built each page
anchor by slugifying the title, and the Customer priorities panel stored those
anchors as Lutan's picks. This repository rewrites titles by rule — *a title
must say what is still open, read alone* (`CLAUDE.md`, "Answering a decision on
a backlog item") — so **every grooming round detached his priorities from the
items they named**, and grooming is meant to run before every planning round.

Measured on 2026-11-03: **seven of his nine picks had come loose in one day.**
They were not completed items, which is what made it hard to see — a finished
pick and a renamed one looked identical on the page, both simply failing to
appear, and the panel's wording said *"finished, or its wording changed"*.

A second symptom of the same cause was already in the generator's comments: two
Next up items were retitled to the same opening words, collided on the same
60-character slug, and `getElementById` returned only the first, so **the second
silently lost its star and could not be picked at all.**

## What changed

Every item carries five base36 characters in an HTML comment, which GitHub and
every markdown reader render as nothing:

```
- [ ] <!--#a7f3k--> **THE TITLE** the body…
```

It sits after the checkbox and before the `**`, so everything that reads this
file keeps working: `check-backlog-sections.mjs` tests the `- [ ] ` prefix and
reads the title from `**…**`, and `check-stale-titles.mjs` does the same. Both
were run against the new shape rather than reasoned about.

Ids are **random, not sequential**, because several sessions commit to the
`backlog` branch at once and two of them picking "the next number" would
collide.

Four files moved out of the gitignored `.local/` into the repository, closing
the backlog item that asked for it:

| Now | Was |
|---|---|
| `scripts/gen-backlog.mjs` | `.local/gen-backlog.mjs` |
| `scripts/backlog-ids.mjs` | (new, written in `.local/` the same day) |
| `scripts/lib/backlog-page/head.html` | `.local/head.html` |
| `scripts/lib/backlog-page/priorities.html` | `.local/priorities.html` |

`scripts/check-backlog-ids.mjs` is new, and runs in CI's `script-integrity` job
and in `.githooks/pre-commit` alongside the existing section check, in the same
fail-open shape (exit 3 refuses, any other non-zero lets the commit through and
says so).

The panel also now **removes a pick as soon as its item is ticked**, which is
what Lutan asked for, and **re-links a pick whose item has moved section**. A
pick that matches neither keeps its row on purpose: from the page, a retitled
item and a deleted one are indistinguishable, and dropping it would lose a
priority he set.

## Two things worth not re-deriving

**The generated page is byte-identical from the new location.** Checked by
generating from `scripts/` and diffing against the last page published from
`.local/`, ignoring the timestamp. That is the evidence the move changed
nothing.

**A lone CR was sitting mid-sentence inside one completed item** (line 397 at
the time). It made that line invisible to any pattern built on `.`, which is how
it was found — the id script reported 934 items against 935 checkboxes. The
character is removed, and both scripts now use `[\s\S]` and report any
control character they meet inside a line rather than skipping it silently.

## What this does not do

**Nothing re-points a pick made before the ids existed.** The panel re-links one
whose stored title still matches an open item, which covered Lutan's list on the
day; a pick whose item was both retitled and ticked cannot be matched from the
page and keeps its row. His list was migrated by the page itself as he used it,
and nothing was written to `priorities/ranking` by hand — that document is his,
set by pressing the star.

**The id is not shown anywhere.** It is deliberately invisible: it exists for
machines, and a visible key would invite people to cite items by number in prose
that then rots differently from the titles.
