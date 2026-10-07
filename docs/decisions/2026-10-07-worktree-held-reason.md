# 2026-10-07 — `list` says what holds a HELD folder; `done` stays opt-in

`holders()` already knew. For three weeks `list` printed a bare `HELD` while it had in hand the pid
and command line of the `next dev` server holding the folder, and threw both away. A bare `HELD` was
read as "someone is working in there", so nine merged worktrees, each with one forgotten dev server
(3.2 GB of working set), survived three cleanup rounds. Discarding it cost three rounds and 3.2 GB.

## The column

| `held` reads | Means | Safe to stop? |
|---|---|---|
| `HELD — <session name>` | a live Claude session is in the folder (unchanged; **wins** over everything else) | no, ask |
| `HELD by a dev server on port N` | every non-session holder is a `next` process under the folder's own `node_modules`; no session | yes, `done --stop-servers` |
| `HELD by a dev server (port not shown)` | same, but no holder's command line carried `--port`/`-p` | yes |
| `HELD by node.exe (pid N), …` | holders `list` cannot classify (wrangler, a stray exe, a node it cannot place) | no, look |
| bare `HELD` | the rename was refused and nothing could be found | no, look |

The port comes from `next dev --port N` (the parent). Its child, `start-server.js`, carries no port, so
the port is taken from whichever holder names one. **"Dev server" is deliberately narrow:** only a
`node.exe` whose command line runs `<folder>\node_modules\next\…` (npm's `.bin\..\next` shim form
included). Anything else is named as itself, because "cannot tell" must never read as "safe to stop".
`holders()` still matches on what a process runs *from*, never on a command line that merely names
the folder, so `--stop-servers` still cannot end a session. Only its result gained a `cmd` field.

`done` also uses the classification: when the folder is held only by a dev server it now says so and
prints the exact flag, instead of "close the Claude session / terminal / dev server".

## Should `done` stop a dev server without the flag? No.

For: by the time `done` runs it has refused a dirty tree, unpushed commits and an unmerged branch,
so a server on a merged branch's own folder is rubbish.

Against, and it carries: `--force` is the only existing precedent for `done` destroying something it
was not asked to, and it is a flag because the operator decides. A kill that happens by default is
exactly the surprise `--stop-servers` exists to avoid, and "merged" is judged against `origin/main`
by name, not by anything that proves the process is not somebody's open browser tab or a demo. What
the item was really missing was the *reason*, not a missing keystroke: with the column and the new
refusal text, the cost of the opt-in is one re-run, and `/clean-streams` can add the flag itself
for folders marked as dev-server-only. If it is ever worth revisiting, the place is a
`--stop-servers` default in the skill, not in `done`.

## `/clean-streams`

It may now propose a `HELD by a dev server` folder **if it otherwise qualifies** (nothing beyond
`main`, PR merged, clean, pushed), marked "will stop the dev server on port N", inside the same
confirm step. It still never adds `--force`, never touches a named session or an unplaced holder, and
`done`'s own check refuses if the picture changed between `list` and `done`.

## Proposed, not done: `CLAUDE.md` "Stale streams"

It says `HELD` means "someone is still in it: ask, don't tear it down". That was followed faithfully
and was wrong for nine folders. Suggested clause: *"`HELD — <name>` is a session: ask. `HELD by a dev
server` is not: `done --stop-servers` clears it."* It is Lutan's file, so it is left for the PR
review.
