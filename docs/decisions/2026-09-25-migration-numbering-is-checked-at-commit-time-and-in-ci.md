# 2026-09-25 — Migration numbering is checked, at commit time and in CI

`scripts/check-migration-numbers.mjs` enforces what CLAUDE.md only said: a file
under `supabase/migrations/` that is not on `origin/main` must be numbered one
past main's highest (two such files: the next two), and no number may be used
twice. `.githooks/pre-commit` runs it on the index; CI's `migration-numbers`
job runs it on the PR's merge commit. It is one script, so they cannot drift
apart. Every refusal names the file to rename it to and gives the `git mv`,
because a rule that only says "wrong" gets fought, not obeyed.

- **The hook fails open.** `core.hooksPath` is shared by every worktree, so
  the hook runs in every live stream the moment it merges. A false positive or
  a crash would stop everyone's commits at once, and the people it hit would
  not know this change existed. So a missing `origin/main`, a crash, and a ref
  with no fetch in 24 hours all print a note and let the commit through. CI,
  which checks against a freshly fetched base, is the net. The hook never
  fetches: that would be slow on every commit and would fail offline.
- **Refusal is exit 3 under `--staged`, not 1.** Found by testing, not by
  reasoning. With the lib broken in a scratch clone, node died at import with
  exit 1, and the first version of the hook read that as a refusal and blocked.
  The hook now blocks on 3 alone.
- **Node is not started for a commit that adds no migration.** The hook's
  own `git diff --quiet --diff-filter=A` answers that case. A bare `node -e 0`
  takes about a second on this machine, and every commit in every stream would
  pay it. The script repeats the same test, so it decides speed, never verdict.
- **Only new names are judged.** A commit that only modifies an existing
  migration, renames some other file, or touches no migration passes.
  (Editing an applied file is forbidden, but that is a different rule.) A
  commit that adds only files main already has is not judged either. That is
  the shape of a conflicted `worktree.mjs sync` resolution, and blocking it
  would stop the sync. The PR still reports any clash it reveals. Renames
  count as delete plus add (`--no-renames`), so `git mv 0082_x 0083_x`, the
  fix the message suggests, is judged by its new name.
- **Boundary with `--drift` (#114).** This check compares files with files,
  before anything reaches a database. `apply-migrations.mjs --drift` compares a
  database's `schema_migrations` rows with `origin/main`'s files afterwards. They
  share `scripts/lib/migrations.mjs`: the directory, the `NNNN_*.sql` pattern,
  and the parsing of `git ls-tree origin/main`. They cannot disagree about which
  files main holds or which one is highest. A `.sql` file that does not match
  the pattern is refused here, because apply-migrations would silently never
  apply it.
- **Not covered:** a clean `sync` merge makes no commit, so the hook does not
  run. Main can land a number the branch already uses, and the branch will not
  hear about it until its PR's CI does.
