# A stream that adds a public view turns every other live stream's `public-views` red

**2026-10-16.** Found three times on one morning: on #666 (`book-clinic-card-tile-fix`), on #665
(`script-fixes-fold`), and — independently, and traced further — by the `0.33.0` release on #668,
whose record PR went red having touched nothing but three Markdown files. **None of those reds was a
fault in the branch that carried it.** Written because it cost four commands to work out and was
relayed to the planner as *"a red flag on appeals schema, some views are not built"*, which is the
opposite of what had happened.

## What the check reports, and why it is right to

`scripts/check-public-views.mjs` asks the **shared dev database** what anonymous visitors can read,
and compares the answer against `PUBLIC_VIEWS`, the list **in the branch it is running from**. So it
fails in two directions, and only one of them is a bug in your branch:

```
FAIL  public_appeals: anon SELECT is refused — HTTP 200 (a new public view? add it to PUBLIC_VIEWS)
FAIL  public_appeal_photos: anon SELECT is refused — HTTP 200 (a new public view? add it to PUBLIC_VIEWS)
```

That is **not** "the view is missing". It is "the database has a public view this branch has never
heard of" — the safe direction for the check to fail in, because an undeclared public view is
exactly how something private reaches the open internet.

## The mechanism

1. `appeals-schema` wrote `0210_appeals.sql`, creating `public_appeals` and `public_appeal_photos`,
   and **applied it to dev** — correctly: `CLAUDE.md`'s schema-first rule requires a migration to be
   applied to dev before its PR merges.
2. It added both views to `PUBLIC_VIEWS` **on its own branch** — also correctly, and required by
   `docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md`, which puts the public view in
   the schema half.
3. Every other live branch was cut from a `main` that has the dev database's new views but not the
   declarations. Their checker queries that same database, sees two views it cannot account for, and
   fails.

**Every ingredient is a rule being followed.** There is no misbehaving stream here. The collision is
structural: one shared dev database, several branches, and a check that compares the live database
against a list that is per-branch.

## What to do when you meet it — and there are TWO windows, with different answers

**First establish whether the schema PR that created the view has merged.** `gh pr list --state
open` and `git log --oneline -5 -- supabase/migrations/` settle it in seconds, and the answer decides
everything.

**If the schema PR has MERGED: sync, and do not edit the checker.**

```
node scripts/worktree.mjs sync
```

That merges `origin/main` in, brings the correct `PUBLIC_VIEWS` with it, and the next run is green.
This is the case #665 was in. **Do not add the view names by hand** — you would be re-adding what has
already merged, and the sync then conflicts with you.

**If the schema PR has NOT merged yet: there is no fix on your branch, and that is the important
half.** The view exists in dev and the declaration exists only on a branch you cannot reach, so
syncing `main` brings you nothing. This is the case #668 was in, about a minute after #667's own CI
had passed — which is why #667 was green while everything branched from `main` was red. **Wait for
the schema PR to merge, then sync.** Do not edit `PUBLIC_VIEWS` locally to go green; you would be
asserting something your branch has no business asserting, and it collides on merge.

**In neither window do you soften the check.** That assertion is the one thing standing between a
private column and an anonymous visitor.

## How to tell this red from a real one, in one read

- **The failing lines name views your branch never touched** → this collision.
- **The failing line names a view your branch added** → your bug. The view exposes something, or it
  is missing from `PUBLIC_VIEWS`, or both.
- **`git grep <view name> <your branch> -- scripts/check-public-views.mjs` comes back empty** while
  the view answers HTTP 200 on dev → confirms the collision. (Use `git grep`, never
  `git show <rev>:<path>`, which lies silently on dotted paths in this shell.)

## The part that is a genuine process failure

**#666 was merged with `public-views` red.** The red was harmless, but that was established *after*
the merge, by the planner, four commands later. The rule exists precisely because a red check cannot
be sorted into harmless and harmful by looking at it — and a schema-adjacent red on the public tier
is the last place to guess. `CLAUDE.md` is unchanged and unambiguous: **a red check is never merged
past on any PR, release or not.**

**And the reason it matters more than the nuisance**, in the words of the item filed from the
release: a red that nobody can act on is the kind people learn to wave through, which is how a real
one eventually gets missed.

The cheap habit that would have cost nothing: when a check goes red on a branch that cannot
plausibly have caused it, **read the failing lines before deciding anything**. They name the objects,
and the objects say whose work introduced them.

## What was NOT done, deliberately

No change to `check-public-views.mjs`, `ci.yml` or any branch protection. The check behaved correctly
in every run described here, and softening it is the one move that would turn a nuisance into an
exposure.

**The fix for the structural problem is already on the backlog**, filed from the `0.33.0` release
(commit `ed394e48`, *"A schema branch that adds a public view turns CI red on every OTHER stream"*).
This record is the account of what happened; that item is the work. **Do not file a second one.**
