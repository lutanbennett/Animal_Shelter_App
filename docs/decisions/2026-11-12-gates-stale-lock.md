# 2026-11-12 — `gates.mjs` and a held tree lock (#9975c)

**Correction to the item.** It offered two candidate fixes, neither chosen: name the holder, and take over a dead
owner's lock. Both already existed in `scripts/lib/tree-lock.mjs` (`describe()`, `alive()` and the stale takeover).
#1498's holder was a LIVE process, so the refusal was correct. The real gap: a stream has no sanctioned way to end a
leftover of its own interrupted gates run, because a session may not kill processes (confirmed: `pkill` was refused
by the permission classifier while building this).

**A second finding, not fixed here.** The lock records the pid of `gates.mjs`, which runs its gates with `spawnSync`.
If `gates.mjs` is killed but its `next build` child lives on, the lock reads as stale and is taken over while that
orphan still reads `node_modules`. The orphan case was not reproduced. Closing it needs the lock to track the child.

**Chosen: (b) bounded wait, plus (d) the exact command in the refusal.**
- (a) cannot survive a hard kill. (c) needs the permission that is refused, so it would not run where it is needed.
- `gates.mjs` now polls a live holder every 5 s for `TREE_LOCK_WAIT_SECONDS` (default 600), then refuses as before.
  A build that hangs still refuses at the timeout, so the wait cannot hang forever.
- Every refusal now ends with `taskkill /PID <pid> /T /F` (or `kill <pid>`), for the person to run.
- `guarded-install.mjs` still refuses at once. Nothing takes a lock from a live process.

**Not ticked.** A leftover can still lock a stream out after the timeout until a person ends it, so `#9975c` stays open.
