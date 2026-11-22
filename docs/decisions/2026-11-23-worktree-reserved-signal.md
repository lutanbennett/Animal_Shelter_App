# 2026-11-23: a folder with a brief and no session is `reserved`, not `free` (#wtres)

**What happened (2026-11-22).** The planner created `Animal_Shelter_backlog-waiting-state` with its `.brief.md`, branch and port, and
handed it back. Since 2026-11-03 Lutan, not the planner, opens each session, so for a while the folder had a brief and no session.
`worktree.mjs list` printed its `held` column as `free`, whose legend said "nothing has it open right now". That was true and was read
as "available": the release manager checked out `claude/record-0-48-0-overtaken` inside it and left three uncommitted files. The stream
that then opened found itself on the wrong branch and cost Lutan two messages. Nothing was lost, through that stream's care.

**The fix is a signal, not a lock.** `list` now prints `reserved` when no process holds the folder but a `.brief.md` is in it, and
`free` only when there is no brief either. The legend says in terms that reserved is not available. `.claude/skills/clean-streams/SKILL.md`
reads the same signal: a reserved folder also reads `nothing beyond main`, so it looked like a leftover; it is now proposed only when its
PR is `MERGED`.

**Why not a lock, registry file or timeout.** A lock would strand a folder whose session never opens, and hand-made worktrees (`#1817`)
must stay possible. A signal costs nothing when wrong: someone is told "reserved" and asks.

**Reuse points checked.** `new` already refuses an existing folder (`already exists`), so it never reuses one. `done` is unchanged on
purpose: a finished stream's folder keeps its `.brief.md`, and refusing `done` for reserved would block ordinary cleanup; `done` already
refuses a held folder and unpushed commits. `clean-streams` changed as above.

**Known edge.** A folder whose stream is finished still shows `reserved` while its brief stays and no session is in it, until `done`.
That errs toward caution. No fixture test: a one-column change in a script that probes live processes needs more apparatus than the fix.
