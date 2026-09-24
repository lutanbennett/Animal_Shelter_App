---
name: clean-streams
description: Tidy up finished workstreams — list the worktrees, find the leftovers whose PRs have merged (and any husks), confirm with the user, then `worktree.mjs done` each one and report what remains. Use when the user asks to clean up streams, worktrees or leftovers, or "what can we get rid of".
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
node C:\Development\Animal_Shelter_App\scripts\worktree.mjs list
```

Do not paste the table back — it is wide and the `held` column carries
whole session titles. Summarise it: one line per worktree (folder,
branch, `state`, `held` with the session name if one is shown, and
anything non-zero under `dirty` / `unpushed`), then the husks section if
there is one.

## 2. Sort each worktree

- **Never a candidate:** the main checkout (`Animal_Shelter_App`, on
  `main`), `Animal_Shelter_Backlog` (`backlog` is permanent), and the
  checkout this session is running in — a session cannot remove its own
  folder (`git rev-parse --show-toplevel` tells you which that is; if it
  would otherwise qualify, say so and suggest running the skill from
  another checkout once this session is closed).
- **`HELD`** (or `?`): a session, terminal or dev server has it open.
  Never propose it. Name it, with the session name when shown, so the
  user can close that session and re-run the skill.
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
    for `C:\Development\Animal_Shelter_<slug>\.brief.md`; if there is
    one, report it as "fresh, not started (brief: <first heading>)". Flag
    it either way and let the user decide.
- **Commits beyond `main`, `free`:** not a candidate. If `gh` says its PR
  merged anyway, it was probably squash- or rebase-merged, so `done`
  will refuse it as unmerged and only `--force` gets past that — flag it
  and ask; never add `--force` on your own.
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
node C:\Development\Animal_Shelter_App\scripts\worktree.mjs done <slug>
```

It ends with `done — folder removed, …` when all of it happened, or
exits non-zero saying what is left. On a refusal, report its message
verbatim and move on to the next slug; do not retry with `--force` or
`--stop-servers` unless the user says so for that slug.

Another session may be cleaning up at the same time. If `done` reports a
folder half-deleted, a branch already gone, or "nothing called <slug>",
re-run `list` and look before doing anything else for that slug.

## 5. Report

Re-run `list`. Say what is gone (folder, local branch and `origin`
branch — `done` checks all three), what failed and why, and summarise
what remains in the same one-line-per-worktree form as step 1.
