# No scratch output above the repo

Lutan found `clean.log`, `gates-appeals.out`, `gates-pds.out` and `gates-wdw.txt`
loose in `C:\Development\` (written 18–20 Oct). Nothing in the repo, its hooks or
its skills names them: sessions had redirected `gates.mjs` and `/clean-streams`
output to `../`, which is outside every repo because worktrees are siblings.

**Decision:** a one-line rule in `CLAUDE.md` (Workstreams §4) — send scratch logs to
the session's scratchpad directory, never above the repo. No script change: there
was no writer to fix. The four files were deleted by hand.
