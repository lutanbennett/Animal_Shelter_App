# Testing items leave the backlog (2026-11-10)

Lutan, 2026-11-10: *"Can you go through the backlog and remove any testing items, these should be added to the test plan. The only exception is if they are blocking another backlog item."* He chose the release smoke test as the home, and to keep `#79sqf`.

## What moved

- **`#t3n9r`** (one save left to prove, on `/memes/make`; the rest proved 2026-11-10) became one line in `docs/release-smoke-test.md`, looked at once and then known.
- **`#mc6fu`** (acceptance testing) became `docs/acceptance-testing.md`, verbatim. **Why not a smoke-test line:** the smoke test is a short per-release pass; this is a parked programme with five STATUS blocks, a reading order (three blocks share 2026-10-21, so top-to-bottom reads wrong) and a working list of findings. Squeezing it into a line would lose findings. It stays parked until the cards work finishes.

Both lines were deleted from `docs/backlog.md`; their ids are gone for good. Earlier decision files, test plans and the planner handover still cite them, as history.

## What stayed, and why

- **`#79sqf`** looks like testing, but it is the standing cards work that enforces the buttons-follow-cards rule; `#p3q7m` calls itself the second shape it exists to catch, and two completed items cite it. That is Lutan's named exception: blocking another item.
- **`#7bd5u`**: its testing half is already in `CLAUDE.md`; what remains is build work.
- **`#ogvcr`, `#c4vn7`, `#f1wp1`, `#dxjz2`, `#rv4qk`**: infrastructure faults, decisions or checks to build, not testing.
