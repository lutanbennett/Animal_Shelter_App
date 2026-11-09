# A commit on the backlog branch must name every item it changes

Backlog item `#z5pk9`. Branch `claude/backlog-commit-guard`.

## The fault

The backlog worktree is the one place any session may edit at any time, so two sessions hold
uncommitted edits to the same `docs/backlog.md` at once. Whoever commits first carries both
sets under a message that describes only theirs (`afcadff7`, `d2498e87`, 2026-11-09). The other
session then sees `nothing to commit`, which looks like an edit that never reached disk.

## Measured: what git tells a pre-commit hook (scratch repo, 2026-11-09)

`GIT_INDEX_FILE` in the hook: plain `commit` → `.git/index`; `commit -a`/`-am` and `-i` →
`.git/index.lock`; `commit -- <path>`/`-o` → `.git/next-index-<pid>.lock`. So shape (i), detecting
`-a`, **is possible** without inspecting the parent process.

## Why that is not the guard

On the backlog branch only one file is ever committed, so `-a` and `git add docs/backlog.md`
sweep **the same bytes**. Refusing `-a` would catch nothing the reported fault needs, and would
refuse the single-session case `CLAUDE.md` tells people to run. Shape (ii) (nothing but
`docs/backlog.md` staged) already exists as `check_backlog_branch` and is likewise blind to it.
Shape (iii), a claim file, catches it but needs a convention every session must follow plus a
stale-claim story.

## Chosen: (iv) the message must name what the diff touches

A `commit-msg` hook (the message is not visible to `pre-commit`) runs
`scripts/check-backlog-commit-names.mjs` on the `backlog` branch only. It maps each changed line
(old side for deletions, new side for additions) to its enclosing item id, and refuses if any
changed id is absent from the message. The sweep is exactly the case where the diff touches an
item the message never mentions. No convention beyond "put the id in the message", and the refusal
says how to recover (`git add -p`, a separate commit, or `BACKLOG_COMMIT_ALLOW_UNNAMED=1`).

Properties kept from the existing hooks: bails before node unless on `backlog`; fails open on a
crash (exit other than 3 prints a note and allows the commit); also skips merges.

**Limits, stated plainly.** It catches a sweep whose extra edits touch a *different* item. Two
sessions editing the *same* item in one commit cannot be told apart. A message that names an
item the sweeper did not really author passes. It guards the message's honesty, not authorship.

## CLAUDE.md (not changed; Lutan's file)

The guard does not make `commit -am "Backlog: <what>"` wrong, only incomplete. Proposed wording
for that one command line's surrounding sentence: `git -C ../Animal_Shelter_Backlog commit -am
"Backlog: <what> (name every item id you changed, e.g. #abcde)"`; the hook refuses otherwise.
