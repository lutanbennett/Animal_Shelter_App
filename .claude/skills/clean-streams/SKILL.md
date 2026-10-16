---
name: clean-streams
description: Tidy up finished workstreams — list the worktrees, find the leftovers whose PRs have merged (and any husks), plus the two kinds `worktree.mjs` cannot see (app-cut worktrees under `.claude/worktrees/` and `claude/*` branches with no worktree), confirm with the user, then `worktree.mjs done` each folder, remove the rest with git, and report what remains. Use when the user asks to clean up streams, worktrees or leftovers, or "what can we get rid of".
---

# Clean up finished workstreams

A merged stream leaves its folder, its local branch and its `origin`
branch behind until someone runs `done` (CLAUDE.md "Workstreams" §4–5).
This finds those leftovers, checks each one really is finished, and
removes only what the user confirms. Paths are absolute because this
skill runs from any checkout — usually the main checkout, where the
release manager and QA sessions live.

## 1. Look

```
node C:/Development/Animal_Shelter_App/scripts/worktree.mjs list
```

Do not paste the table back — it is wide and the `held` column carries
whole session titles. Summarise it: one line per worktree (folder,
branch, `state`, `held` with the session name if one is shown, and
anything non-zero under `dirty` / `unpushed`), then the husks section if
there is one.

## 1b. The two kinds of leftover `worktree.mjs` CANNOT SEE

**`worktree.mjs list` only knows about `Animal_Shelter_*` folders, and `done` can only act on
those.** Two kinds of leftover are therefore invisible to step 1, and nothing ever cleaned them up
until a user noticed by hand (2026-10-16: six merged branches and five stale worktrees had
accumulated over two days).

```
git -C C:/Development/Animal_Shelter_App worktree list
git -C C:/Development/Animal_Shelter_App fetch -q origin --prune
git -C C:/Development/Animal_Shelter_App branch -a --list 'claude/*' 'remotes/origin/claude/*'
```

**(a) App-cut worktrees under `<repo>/.claude/worktrees/<slug>-<hash>`.** The desktop app cuts its
own worktree for a session when it is configured that way, and that behaviour is **intermittent** —
on 2026-10-16 two sessions of nine got one and seven did not, so expect both at once. They are
normally on a **detached HEAD**, so they hold no branch. `worktree.mjs list` does not show them and
`done` does not know they exist.

**(b) `claude/*` branches with no worktree at all**, usually named `<slug>-<hash>`. An app-cut
worktree's branch outlives the folder, so these pile up with nothing pointing at them. `done` never
sees them because there is no folder to look up.

### Sorting these, and the test that matters

**The principle is the same as step 2's and it does not bend: the question is whether the branch's
own work is in `main`, not whether a PR says merged.** But with no `list` `state` column to read,
establish it yourself, in this order:

```
git -C C:/Development/Animal_Shelter_App merge-base --is-ancestor claude/<branch> origin/main
git -C C:/Development/Animal_Shelter_App rev-list --count origin/main..claude/<branch>
```

- **Tip is an ancestor of `main` / zero commits beyond it** → the branch adds nothing. Safe.
- **Commits beyond `main`** → **do not stop here, and do not assume either answer.** A
  **squash-merged branch stays ahead for ever**, so this is the normal state of a finished stream as
  well as the signature of unsubmitted work. Find its PR **by exact head ref**:

  ```
  gh pr list --head claude/<branch> --state all --json number,state,title,mergedAt
  ```

  - **A PR whose `headRefName` is exactly this branch and is `MERGED`** → a squash leftover. **Then
    spot-check it**: name one file or symbol the branch's commits added and confirm it is on `main`
    (`git log --oneline origin/main -- <path>`, or `git grep <symbol> origin/main`). Only with that
    confirmation is it safe.
  - **No PR, or `OPEN`, or `CLOSED` unmerged** → **never a candidate. This is how a day's build gets
    destroyed.** Report it loudly, on its own line, and say it needs a PR.
- **A branch with commits beyond `main` and no PR is unsubmitted work.** Say exactly that, and leave
  it alone.

### Removing them — and why this is the one place the skill uses raw git

Step 2 forbids improvising `git worktree remove` and `git branch -D`, and that still holds for every
`Animal_Shelter_*` folder: there `done` is the tool and its checks are the point. **These two kinds
have no `done` path at all**, so after the user confirms them in step 3:

```
git -C C:/Development/Animal_Shelter_App worktree remove <path>
git -C C:/Development/Animal_Shelter_App branch -d claude/<branch>
git -C C:/Development/Animal_Shelter_App push origin --delete claude/<branch>
```

- **`git branch -d`, never `-D`**, except for a branch established above as a **squash leftover with
  its PR merged and a spot-checked file on `main`** — `-d` refuses that one by design, and `-D` is
  what the refusal is protecting you from everywhere else. Say in the report which branches needed
  `-D` and why.
- **A branch may exist locally, on `origin`, or both.** Check before pushing a delete:
  `git rev-parse --verify -q origin/claude/<branch>`.
- **Never `git worktree remove --force`** on your own, and never remove a worktree that is not under
  `.claude/worktrees/`.
- If `git worktree remove` refuses because the tree is dirty or in use, **report it and move on** —
  a session or editor is in there.
- Afterwards, `git worktree prune` is safe and tidies git's registry.

**Include both kinds in step 3's table and step 5's report**, under their own heading so they are not
confused with folders `done` handled. Count app-cut worktrees with `git worktree list`, never with
`worktree.mjs list`.

## 2. Sort each worktree

- **Never a candidate:** the main checkout (`Animal_Shelter_App`, on
  `main`), `Animal_Shelter_Backlog` (`backlog` is permanent), and the
  checkout this session is running in — a session cannot remove its own
  folder (`git rev-parse --show-toplevel` tells you which that is; if it
  would otherwise qualify, say so and suggest running the skill from
  another checkout once this session is closed).
- **`HELD — <session name>`**: a Claude session is in it. Never propose
  it. Name it so the user can close that session and re-run the skill.
- **`HELD by a dev server on port N`** (or `a dev server (port not shown)`):
  `list` found a `next dev` server and **nothing else** — no session, no
  terminal, no other process. This is the common leftover (a server a
  session started and nobody stopped). If the folder otherwise qualifies
  (nothing beyond `main`, PR `MERGED`, nothing dirty or unpushed), propose
  it as a candidate **marked "will stop the dev server on port N"**, and let
  the user's yes cover that. Never use `--stop-servers` on a folder whose
  PR is not merged. It still goes through the multi-select in step 3.
- **Any other `HELD`** (`HELD by node.exe (pid …)`, bare `HELD`) or `?`: a
  terminal, editor or process `list` cannot place. Never propose it. Name
  it, with what `list` printed, so the user can look.
- **`nothing beyond main` and `free`:** a candidate. Check its PR:

  ```
  gh pr list --head claude/<slug> --state all --json number,state,title
  ```

  - `MERGED` → safe leftover; propose it.
  - `OPEN` → not finished, whatever `ahead` says; leave it and say so.
    If a slug was reused, the list holds several PRs; any `OPEN` one wins.
  - `CLOSED` (not merged) or **no PR at all** → do not propose. With no
    PR it may be a fresh stream that has not started yet — `/plan-day`
    creates worktrees that sit at `main` until their session begins. Look
    for `C:/Development/Animal_Shelter_<slug>/.brief.md`; if there is
    one, report it as "fresh, not started (brief: <first heading>)". Flag
    it either way and let the user decide.
- **Commits beyond `main`, `free`:** read the `state` column. `list` has already
  checked the branch's own commits against `main`:
  - `squash-merged (PR #n)` or `merged` → a leftover; propose it. `done` clears it
    without `--force`.
  - `UNMERGED WORK: PR … merged but N commit(s) are not in main` → **never a
    candidate, and never "probably squash-merged".** The PR merged, then more was
    built on the branch. Report it on its own line, loudly, apart from the safe
    ones, and say it needs a PR. `done` refuses it even with `--force`.
  - blank → no proof it is in `main`; do not propose it, whatever `gh` says
    about a PR. A merged PR is **not** evidence a branch is disposable; the test
    is whether the branch's own commits are in `main`.
  Never add `--force` on your own.
- **`unpushed` > 0 or `dirty` > 0** on anything: call it out by name.
  `done` refuses unpushed commits outright (no flag overrides it) and
  refuses dirty trees without `--force`.
- **`STALE (…)`** in the `state` column: git's registry points at a
  folder that is missing or broken. Propose `done <slug>` for it only if
  its PR merged; otherwise report it.
- **Husks** (folders git no longer tracks, listed under the table):
  propose them unless the list says `HELD`. `done <name>` clears a husk.

Before proposing anything, check that the folder name matches the
branch: folder `Animal_Shelter_<slug>` must be on `claude/<slug>`. `done`
looks the branch up as `claude/<name>` and falls back to the folder
`Animal_Shelter_<name>`, so a mismatch (seen: folder
`Animal_Shelter_deploy-message-quoting` on branch
`claude/ci-test-plan-advisory`) makes it mistake a live worktree for a
husk and refuse. Report the mismatch and let the user decide what to do;
do not improvise `git worktree remove` or `git branch -D` (auto mode
blocks them anyway, and `done`'s checks are the point).

## 3. Ask

Present the proposals as a short table — slug, PR number and title, why
it is safe — followed by the flagged ones (held, fresh, unmerged,
mismatched, unpushed/dirty) with one line each. Then AskUserQuestion,
multi-select, over the proposed slugs only. Nothing proposed → say the
streams are clean, list what is held or flagged, and stop.

## 4. Remove

For each confirmed slug, one at a time (they share git's registry, and
each deletes a `node_modules`, which can take a minute or two — use a
timeout of 600000 ms):

```
node C:/Development/Animal_Shelter_App/scripts/worktree.mjs done <slug>
```

It ends with `done — folder removed, …` when all of it happened, or
exits non-zero saying what is left. On a refusal, report its message
verbatim and move on to the next slug; do not retry with `--force`. Add
`--stop-servers` only to a slug proposed as held by a dev server alone and
confirmed in step 3, or one the user names for it. If `done` refuses with
"held only by a dev server" for a slug that was not marked that way, `list`
and `done` disagree — report it rather than adding the flag.

Another session may be cleaning up at the same time. If `done` reports a
folder half-deleted, a branch already gone, or "nothing called <slug>",
re-run `list` and look before doing anything else for that slug.

## 5. Report

Re-run `list` **and** `git worktree list` and the `claude/*` branch sweep from
step 1b — all three, because each sees leftovers the others cannot. Say what is
gone (for a folder: folder, local branch and `origin` branch, which `done`
checks; for the step-1b kinds: which of the three you removed, and name any
branch that needed `-D` and why), what failed and why, and summarise what
remains in the same one-line-per-worktree form as step 1, with app-cut
worktrees and worktree-less branches under their own heading.
