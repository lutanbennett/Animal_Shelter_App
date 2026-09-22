---
name: plan-day
description: Start-of-day routine — sync main, read the backlog, recommend today's 2–3 parallel workstreams (non-overlapping, schema-first), and create their worktrees once the user agrees. Use when the user asks to plan the day, pick workstreams, or "what should we work on".
---

# Plan the day's workstreams

You are the integrator. The user opens one Claude session per workstream;
your job is to choose streams that can be built at the same time without
colliding, and to set them up so each session can start with "go".
Paths below are absolute because this skill runs from any checkout.

## 1. Sync `main` (the daily step in CLAUDE.md "The main checkout")

In `C:\Development\Animal_Shelter_App`: it must be on `main` and clean.
If it is on a `claude/*` branch or dirty, **stop and report** what is
there — the user decides whether to commit, stash or move it into a
worktree — then continue once it is clean. Then:

```
git -C C:\Development\Animal_Shelter_App checkout main
git -C C:\Development\Animal_Shelter_App pull
git -C C:\Development\Animal_Shelter_App merge backlog
git -C C:\Development\Animal_Shelter_App push
git -C C:\Development\Animal_Shelter_Backlog merge --ff-only main
```

## 2. What is already in flight

`node C:\Development\Animal_Shelter_App\scripts\worktree.mjs list`.
Live `claude/*` worktrees count toward today's cap of three. Flag any
that show "nothing beyond main" with no PR open as leftovers to `done`.

## 3. Read the backlog

`C:\Development\Animal_Shelter_App\docs\backlog.md`, open items only
(`- [ ]` above `## Completed`). Section order and item order are the
user's priority; keep that as the default ordering. For each candidate
note:

- **Who does it** — Claude-buildable, or user-driven (physical setup like
  the Pi, dashboard clicking, a guided walkthrough, "decide with the
  user" as the main content). User-driven items are reminders, not
  streams.
- **Dated / blocked** — "from ~2026-09-28", waiting on an account, a
  prerequisite item still open.
- **Area** — the routes, directories and tables it touches, from the
  file references in the item. This is what decides overlap.
- **Schema** — does it need a migration? Then it is a schema PR first
  and a feature branch after (CLAUDE.md "Database migrations"), and only
  one stream may carry a migration at a time.
- **Size** — a quick win, a day, or more.

## 4. Choose

Fill up to three streams including what is in flight. Rules, in order:

1. Backlog priority, unless a higher item is user-driven, blocked or
   collides with an in-flight stream.
2. Disjoint areas. Two streams that both add nav entries, both rework the
   same manual topic in `src/lib/manual/en.ts`, or both touch the same
   hub tab are one stream, not two.
3. At most one migration-carrying stream. If two chosen items need
   schema, propose a single schema PR covering both, to land first.
4. Mix sizes: one quick win alongside bigger items keeps the merge train
   moving and gives the user something to review early.

## 5. Present

A short table — `#`, feature slug (`kebab-case`, becomes
`claude/<slug>` and `Animal_Shelter_<slug>`), the backlog item's bold
title, area, migration yes/no, one line on why now. Below it: **Not
today** — user-driven items that are due or close (one line each), and
anything blocked with the reason. Then ask the user to confirm or swap
(AskUserQuestion, multi-select over the proposed streams).

## 6. Set up

For each confirmed stream, in sequence (each `npm ci` takes a minute):

1. `node C:\Development\Animal_Shelter_App\scripts\worktree.mjs new <slug>`
2. Write `C:\Development\Animal_Shelter_<slug>\.brief.md` (gitignored):
   the backlog item verbatim as the task, the branch name, the port, and
   for a schema-first item which half this stream is. Keep it to what a
   fresh session needs; CLAUDE.md covers the rest.

Finish with one line per stream: folder, port, and that the session
should be opened on that folder — its first move is to read `.brief.md`.
