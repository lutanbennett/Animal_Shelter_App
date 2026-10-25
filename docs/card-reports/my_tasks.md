---
card: my_tasks
walked: 2026-10-25 to 2026-10-26, driven in a browser on the test system as a login holding only this card (1 card, 1 permission) (dev: 265 applied, 0 pending)
---

## Purpose

The one page where a person sees the recurring jobs assigned to them and ticks each one off as done or skipped. It gives nothing else: no other person's tasks and no way to set tasks up. Every other job card depends on this page to put a task in front of someone.

## Gives access to

### Pages

- **My tasks**: the person's jobs for today and anything overdue, then "Done today". Each job has Add a note, Skip and Done, and a finished one has Undo. The Home screen shows a single **My tasks** tile.
- The Residents entry appears in the menu and opens an empty list.

### Tables

- **Recurring job dates**: this login's own dates only (read, and mark done or skipped).

### Forms

- **Mark a job done**: works. A job assigned to this login by the Recurring jobs card showed under "Due today (1)". A note was typed, Done was pressed, and it moved to "Done today" and stayed done after a reload. The note was stored (read from the database) but is not shown on My tasks afterwards.
- **Skip** and **Undo** are offered and were not pressed.

## Major restrictions

- **Cannot set up, change or hand over a job.** The Recurring jobs page is refused ("You don't have access to this page") and there is no Management in the menu.
- **Sees only its own tasks.** Nothing shows about anyone else's.
- **Cannot open** the medication list (refused). **Menu dead end:** Residents opens as "0 residents".
- **Does not stop a task reaching a login that should not get it.** A job that opens no page can be assigned to this login as freely as to anyone (the item already in the backlog; seen by driving, not new).

## Recommendation

- **Keep as is.** It does what its name says and nothing more.
- **Decrease (small):** hide the Residents menu entry, which leads to an empty list.
- **Note for Card review 2:** this is the card the medical job cards are missing. A login holding only Record Weight or Feed Special Diets can be given a job and never sees it.
