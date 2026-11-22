# Every open backlog item says who it waits on, and keeps a name that does not move (#bkwai)

Lutan, 2026-11-22: *"what is waiting on me"* should be one command with one answer, and an item should be nameable in conversation without reading a paragraph.

## The tag
At the end of each OPEN item's line: `<!--waiting:<state> [by:<who>] since:YYYY-MM-DD [date:YYYY-MM-DD]-->`.
States and what each means:

| state | means |
|---|---|
| `buildable` | a stream could start it now; nothing outstanding |
| `stream` | a stream owns the next step but it is in flight or queued behind another item |
| `lutan` | only Lutan can do the next step |
| `director` | only the Director can do the next step |
| `decision` + `by:lutan`/`by:director` | an answer is owed; nothing to build until it is given |
| `purchasing` | waits on something being bought |
| `person` | waits on some other named person (a Thai speaker, a non-admin tester) |
| `event` | waits on a date, a launch, or data accumulating |
| `parked` | deliberately not being done; revisit only if raised |

`since:` is when the state was last **measured**, not when the item was written. A state that is not re-read decays, which is how `#gidty` came to wait on Lutan for something he had already done. `date:` appears only where a real date exists (Lutan home 2026-11-29).

## The name lock
`docs/backlog-names.json` maps id to a three-to-six-word name. The check fails on an open item with no name, two open items sharing one, and a name that differs from `HEAD`'s unless `BACKLOG_RENAME_ALLOW=1` is set, so a rename is a deliberate act. **The prose is not locked.** The long title keeps saying what is currently true (`#ttl9h`, 320-character cap unchanged): identity moves out of the prose, it is not frozen inside it.

## What fails and what only warns
Fails (hook and CI `check-backlog-waiting.mjs`): missing tag, unknown state, `decision` without `by:`, unparseable or future `since:`/`date:`, missing/duplicate/renamed name. Warns only: `backlog-waiting.mjs --stale N` lists lutan/director items not re-measured for N days. An item can wait on a person for months; a red check for that would be learned and ignored.

## The migration, against the prior
Prior handed over: 16 lutan, 9 stream, 4 director, 5 nobody (34 items, four known wrong). Result: 35 open items tagged (the count moved while I worked), then `#bkwai` ticked, leaving 34: **lutan 8, director 3, decision 4 (all by lutan), buildable 4, stream 3, event 6, parked 4, person 2.** Everything waiting on Lutan, his own turns plus answers owed, is 12 (`--who lutan`) against the prior 16. The prior over-counted him: items it called his turned out to be an answer owed (`#plsso`, `#enqml`, `#gidty`, `#pl7aq`, counted in the 12), someone else's turn (`#y1dqu`, `#cjred`), a launch or data (`#uao7r`, `#z7d6h`, `#9b0vq`), or parked.

`since:` is 2026-11-22 for all of them: the day they were read, not live-measured; nothing was probed against production.

## Found, not fixed (item prose is the Backlog manager's)
- `#shfil`'s lead still says both halves wait on an account only Lutan can create; its own tail says that is no longer true (marked `buildable`).
- `#gidty`'s title region still reads as if Lutan must create the account; the account exists (marked `decision by:lutan`: price the re-verification).
- `#drvcl` still says shipped and switched off in "all three environments"; its own tail says production alone (marked `stream`, queued behind `#83137`).

Also folded in: `docs/google-identity-registry.json` `uat/app` is `refreshes`, citing `#drvtk` fixed. It could not be re-probed from this worktree (no `.env.deploy.uat`).

The tag is stripped from the rendered page body by `scripts/gen-backlog.mjs` (it escapes HTML, so a left-in comment prints as clutter).
