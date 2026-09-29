# 2026-09-29 — Decisions are one file each, not one appended log

**The problem.** `docs/decisions.md` was marked `merge=union` in `.gitattributes`
so parallel branches could each append at the end. Locally that works. GitHub's
mergeability check does not run merge drivers, sees two sides adding text at the
same place, and reports the PR CONFLICTING/DIRTY — with a clean local merge and
green checks, and, because the PR reads as conflicting, no CI run at all. It
punished whichever stream opened its PR second (PRs #46 and #48, 2026-09-22),
and was a good part of why sessions are told to check `mergeable` rather than
wait for CI. The workaround (sync and push before opening the PR) cost a round
trip per PR.

**The choice.** Lutan chose one file per decision over one file per month. A
month file would still be one path that every stream in that month appends to,
so it would halve the problem rather than remove it. With one file per decision
two streams touch different paths, and neither git nor GitHub has anything to
merge.

**What moved.** The 88 entries dated 2026-09-24 onward (everything that was
under a `## <date> — <title>` heading) became `docs/decisions/<date>-<slug>.md`,
text unchanged apart from the heading becoming `#`. The earlier record (the
"Confirmed" bullets and "Still open" list, 3,410 lines) stays in
`docs/decisions.md` as a frozen baseline with a note at the top: its entries
were bullets with the date inside the title rather than headings, and cutting
them up would have been a lot of judgement for no conflict benefit, since
nothing new is appended there.

**No index file.** A committed index is a shared file every stream edits, the
same collision again. The sorted directory listing is the index.

**Citations.** The code, migrations, README and test plans cite "docs/decisions.md,
2026-09-25" about 150 times. Those were left alone: applied migrations are never
edited, test plans and the backlog are history, and rewriting comments in other
streams' source files would itself conflict. The date names the file, and a
title cited in quotes is found with `grep -r "<title>" docs/decisions`.

**`.gitattributes`.** The `merge=union` line is removed. A stream that still
appends to the frozen file now gets a real conflict and is told to move its
entry into a new file, rather than having it merged quietly into the wrong place.

**Not verified.** That two parallel PRs adding decision files both read
MERGEABLE on GitHub follows from the diagnosis but was not run; the next
parallel pair will confirm it.
