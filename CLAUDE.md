@AGENTS.md

# Working on this repo

One developer, one machine, one session at a time. Every session works
locally in this checkout; nothing is started elsewhere. These rules keep
`main`, GitHub and the dev database in step — follow them without being
asked.

## Branches

1. **Start from `main`, up to date.** First thing in a session:
   `git checkout main && git pull`. Then `git branch -a`: if any
   `claude/*` branch still exists, locally or on `origin`, stop and ask the
   user whether to merge or delete it *before* creating a new one. Never
   branch from another feature branch.
2. **One feature, one branch** (`claude/<feature>`), commit as you go.
   `.githooks/post-commit` pushes every commit, so GitHub always matches
   the checkout (a fresh clone enables it with
   `git config core.hooksPath .githooks`). Prefer new commits over
   `--amend`/rebase — those need a manual `git push --force-with-lease`.
3. **A session ends merged.** When the feature is done and verified: open
   the PR (GitHub in the user's Chrome, since there is no `gh` here), and
   once the user says so, merge it, delete the branch locally and on
   `origin`, and leave the checkout on an updated `main`. A branch that
   outlives its session is how work gets stacked and lost.

## Database migrations

- Files live in `supabase/migrations/` and are numbered sequentially. The
  next number is one more than the highest file **on `main`**, so an
  unmerged branch never "owns" a number.
- Apply with `node scripts/apply-migrations.mjs` (`--dry-run` first for
  anything non-trivial, `--status` to look). It records each file in
  `schema_migrations` in the target database and applies only what is
  pending — never POST SQL by hand or paste files into the SQL editor.
- Only apply a migration from the branch you are about to merge. If a
  branch is abandoned, its migration must be reverted from the dev
  database (write a down-migration, apply it, delete both files) before
  the number is reused.
- Applied files are never edited; write a new one. Write every file to be
  re-runnable (`if not exists` / `or replace` / `drop … if exists`) as the
  existing ones are.
- To exercise a migration against real rows without keeping anything, run
  a `begin; … rollback;` block through the same API with a `do $$ … $$`
  harness whose `raise exception` assertions surface as errors.

## Finishing a feature

Tick or add the item in `docs/backlog.md`, record non-obvious design
choices in `docs/decisions.md` (dated), and keep `README.md` accurate.
Commit messages say why, not just what.
