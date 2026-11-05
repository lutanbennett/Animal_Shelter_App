# guarded-install.mjs refuses while a server is running from the checkout

Backlog `#m8x2r` and `#jzn1u` (one fault, described from both ends).

## What happened

2026-11-05: `node scripts/guarded-install.mjs` in the main checkout failed with
`EPERM, unlink ...next-swc.win32-x64-msvc.node`. A `next start` pair was running from that
checkout and held the SWC binary open. `npm ci` deletes `node_modules` *before* it installs, so the
failure left 37 entries and no `node_modules/next`: the checkout where releases are cut could not build.

## Decision: refuse before anything is deleted (candidate (a) of the item)

`scripts/lib/live-servers.mjs` reads the process table and `guarded-install.mjs` calls
`refuseIfServerRunning(root)` as its **first** act, before it takes the tree lock and long before
`npm ci` starts. Candidate (b) (backup / `npm install` semantics) was not built; (a) was possible.

### Why the tree lock was left alone

The lock is taken by things that *write* `node_modules`. A `next dev` / `next start` only *reads* it, so
it takes no lock, yet it holds the SWC binary open. Making readers take the writer lock would make every
dev server block every install. `tree-lock.mjs` is unchanged.

### What the detector reads

`Get-CimInstance Win32_Process` through PowerShell (same call `worktree.mjs` uses for `held`; `wmic` is
gone on current Windows). A process counts when its executable is under `<checkout>\node_modules\`, or it
is `node.exe` whose command line names `<checkout>\node_modules\` (this is how `next dev`, `next start`
and its `start-server.js` child, and wrangler appear). The npm shim form `node_modules\.bin\\..\next` is
folded. It matches **only the checkout being installed into**: a neighbour worktree's server on another
port does not refuse.

It is deliberately not limited to the word `next`: anything running out of that `node_modules` (workerd,
wrangler) holds files open the same way.

### When it cannot read the process table

It **refuses**, saying so. A failed probe treated as "nothing running" would silently restore the
2026-11-05 behaviour on the day the probe broke. The cost of a wrong refusal is one retry; the cost of a
wrong pass is a gutted checkout. Only Windows is checked: elsewhere an open file can be unlinked.

### The message

Names each pid, the port where the command line carries one, and the command, then the exact
`taskkill /F /PID ...` to run. Plain English; the only caller who sees it is Lutan.

`LIVE_SERVERS_TABLE_FILE` points the probe at a fixture so the unreadable case can be rehearsed.

## Measured, in this worktree (never the main checkout)

- Detector alone first: from a one-off script it found my own `next dev` pair (pids 5824 on port 3005, and
  its 38284 child) and found **nothing** for `Animal_Shelter_App`, although other worktrees had servers up.
- With my server on 3005 up: `node scripts/guarded-install.mjs` exited 1 with the refusal naming both pids
  and port 3005. `ls node_modules | wc -l`: **484 before, 484 after**; no `.tree.lock` left behind.
- With an unreadable table fixture: refused (exit 1), 484 before and after.
- Server stopped (`taskkill`): the installer ran normally (see the test plan for its result).
