# 2026-10-12 — Paths in skill files are forward-slash, because the Bash tool eats backslashes

`skill-command-paths`. Skill files only (`.claude/skills/clean-streams`, `.claude/skills/plan-day`);
`scripts/worktree.mjs` is unchanged.

## The rule

**Every path in a skill file is written `C:/Development/...`.** The Bash tool is Git Bash, where `\`
is the escape character, so `node C:\Development\Animal_Shelter_App\scripts\worktree.mjs done x`
reaches node as `C:DevelopmentAnimal_Shelter_Appscriptsworktree.mjs` and dies with
`MODULE_NOT_FOUND` without doing anything. The `C:/` form keeps the drive letter (so it stays
absolute) and works unchanged in Git Bash, PowerShell and node. Prose paths in backticks are
converted too: a session reads one and builds a command from it, which walks back into the trap.

## How it presented, so nobody re-derives it

`/clean-streams` "kept coming up as blocked". It was not blocked. The first instinct, a missing
permission rule, was wrong: a transcript search of every session found no refusal, and the
forward-slash form of the same `done` command runs with no prompt. It looked intermittent because
sessions usually improvised around the bad paths in `plan-day` and `clean-streams` step 1 (`cd`
first, then a short relative path). Step 4 of `clean-streams` is the one a session follows
literally, so that is where it always failed.

## Measured

`worktree.mjs done no-such-slug-xyz` bails at the "nothing called" guard before touching anything,
so it probes the path form for free. Old form: `Cannot find module '...DevelopmentAnimal_Shelter_Appscriptsworktree.mjs'`.
New form: `worktree: nothing called no-such-slug-xyz: no worktree, no branch, no folder`.

Windows-style paths elsewhere in `docs/` are prose a human reads (test-plan headers, release
records) and were left alone.
