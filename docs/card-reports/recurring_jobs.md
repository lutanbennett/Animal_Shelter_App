---
card: recurring_jobs
walked: 2026-10-25 to 2026-10-26, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending)
---

## Purpose

Lets a person set up the shelter's repeating jobs (the weekly stocktake, a Saturday clean), choose who does each one and which page it opens, and cover for someone who is off or has left. It also lets the holder tick off their own jobs, which is the part the other job cards lean on. It is the card that feeds My tasks.

## Gives access to

### Pages

- **Recurring jobs** (from Management): every job with its days, time of day, who is assigned, the next three dates and how many missed dates are still open. Three panels: the list, **Hand over** (cover someone for some dates, or move their jobs for good), and **Recently done** (the latest dates marked done or skipped, with who and any note). A red banner counts the jobs nobody can do.
- **My tasks**: this login's own jobs for today and any overdue, with Done, Skip and Add a note.
- **Management** opens with one tile, Recurring jobs.
- The Residents entry appears in the menu and opens an empty list.

### Tables

- **Recurring jobs** (add, edit, pause and resume, delete).
- **Who is assigned to each job** and **who covers which date** (add and change).
- **The record of dates done or skipped** (read; this login can also add its own).
- **The list of logins** (names and email addresses) that the "Assigned to" and Hand over pickers show.

### Forms

- **New recurring job**: works. Created "walk-recurring_jobs own job" (every Sunday, morning, no page), assigned it to this same login, and it saved with "Saved." The assignee list narrows to logins that can open the job's page once a page is named ("Only roles that can do the work on the linked page are listed").
- **Done on My tasks**: works, and this is the point. The job showed under "Due today" on My tasks, Done was pressed, it moved to "Done today" and stayed done after a reload.
- **Hand over**: works. Handing this login's dates to another login for 25 Oct to 2 Nov answered "Handed over 1 date." and the date was moved (the 25 Oct one was already done and was left alone).
- **Pause**: works (the job went grey with a Paused tag). Edit, Resume, Delete, Give back and the "from now on" kind of Hand over are offered and were not pressed.

## Major restrictions

- **Cannot mark someone else's date done or skipped.** There is no Done or Skip on the Recurring jobs page for another person; the only way to cover is Hand over (Lutan answered this 2026-10-23).
- **A job that opens no page can be given to any login**, whatever cards it holds. This login's own job had no page and nothing warned. This is the item already filed in the backlog; it is confirmed here by driving, not new.
- **Every login's name and email shows** in the "Assigned to" and Hand over lists (dozens on dev), including logins that belong to other people.
- **Delete is permanent and one press away** on every job in the list (not pressed).
- **Cannot open** the medication list (refused: "You don't have access to this page"). **Menu dead end:** Residents opens as "0 residents".

## Recommendation

- **Keep as is.** The card sets jobs up, hands them over and ticks off its own, and every part driven worked.
- **Decrease (for Lutan):** the pickers show every login's email address to anyone holding the card; a list of names only would do.
- **Decrease (small):** hide the Residents menu entry, which leads to an empty list.
- **Note for Card review 2:** this card's "mark my own done" piece is what makes a job visible to its holder, and the three medical job cards do not carry it (see Record Weight and Feed Special Diets).
