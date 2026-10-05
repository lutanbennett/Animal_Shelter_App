# 2026-10-05 — `worktree.mjs new` answers the folder-trust prompt for the folder it creates

**Context.** Opening a Claude session on a folder for the first time asks whether
you trust the files in it. With two or three new workstreams a day, that is a
click per stream, every day, for folders this repo's own script just created
from `origin/main`.

The answer is stored per folder path in `~/.claude.json`, under `projects`, as
`hasTrustDialogAccepted: true`. Per *path* — which is why a new worktree always
asks, even though 231 `Animal_Shelter_*` folders are already answered `true`.

**Decision.** `cmdNew` writes that entry for the folder it has just created,
right after `.port` and `.claude/launch.json`. There is nothing to decide at
that prompt that was not already decided for the main checkout: same commit,
same files, and a folder name this script chose.

**How it is written, and why so timidly.** The file belongs to the app, and
other sessions write it concurrently. So:

- it only **adds** a missing key, and never edits an existing entry;
- it writes the same seven fields, in the same shape and 2-space formatting the
  app itself writes, so the app sees nothing unusual and the diff is one block;
- it goes through a temp file and a `rename`, so the file is never observed
  half-written;
- any error is a printed note and the stream still succeeds. A worktree that is
  otherwise ready must not fail because a convenience did not work.

**Limitation.** If the app rewrites `~/.claude.json` from its own in-memory copy
between this write and the session opening, the prompt comes back once. That is
the thing being avoided, not a new failure, and there is no way to rule it out
from outside the app. Verified by creating and removing a throwaway stream: one
entry added, 236 existing entries byte-identical, file still valid JSON, no temp
file left behind.

**Not done:** removing the entry in `worktree.mjs done`. Leaving a stale entry
for a deleted folder is harmless, the file grows by about 200 bytes a stream,
and a second write to an app-owned file on teardown buys nothing.
