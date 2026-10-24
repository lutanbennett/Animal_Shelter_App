# `worktree.mjs done <name>` can no longer reach a different branch's worktree

2026-10-24, `claude/worktree-tooling-fixes`.

**The fault.** `cmdDone` found the worktree by branch (`claude/<name>`) but, when none matched, fell back to the
folder `Animal_Shelter_<name>`. When a folder and its branch disagree (a release reuses a leftover folder and
rebranches it), the folder named `<name>` was a live worktree of another branch. The message then said the folder
"is not a git repo any more" (false: `git status` worked there) and offered `--force`, which turns off the
uncommitted-work check. On 2026-10-23 `done auto-tiles-out` reached the release manager's live worktree this way.

**The fix.**
- If no worktree holds `claude/<name>` but the folder by that name is a registered worktree of another branch,
  `done` refuses, names `done <that-branch-minus-claude/>`, and **`--force` does not override it** (same treatment
  as unpushed commits).
- A folder that is a git folder but unregistered now says "no worktree is registered for <name>" instead of
  "not a git repo any more", which is kept for the genuinely-not-a-repo case.
- `list`'s mismatch section now prints the command that works next to each pair.
- `scripts/check-worktree-done.mjs` builds a throwaway mismatched worktree and checks all three outcomes.

**The lesson.** A tool's suggested remedy is not advice: the refusal pointed at `--force`, the one flag that
removed the protection. Read what a flag does before taking it.
