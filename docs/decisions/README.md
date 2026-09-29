# Decisions

One file per decision: `docs/decisions/<date>-<slug>.md`, starting `# <date> — <title>`.
The directory listing, sorted, is the index — deliberately, because a committed
index would be a shared file every stream edits, which is the conflict this
folder exists to avoid.

**Adding one:** create a new file. Never edit another stream's file; two PRs that
each add a file touch different paths, so neither git nor GitHub has anything to
merge. Keep the date (citations are "docs/decisions.md, 2026-09-27" throughout the
code and backlog, and now resolve to the file with that date), and put the title in
the heading so `grep -r "<phrase>" docs/decisions` finds it.

Entries before 2026-09-24 are in [`../decisions.md`](../decisions.md), frozen.
Why the split, and why not one file per month: see `2026-09-29-decisions-one-file-per-decision.md`.
