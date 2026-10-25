---
card: do_maintenance
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending)
---

## Purpose

Lets a person run the shelter's repair and upkeep jobs from a phone: log a problem, photograph it before and after, move it along, say who does it
and what it cost, and tick off their own recurring jobs. It also lets them look up a resident or an enclosure so they know where a job is.

## Gives access to

### Pages

- **Maintenance** (the board of jobs by status, filtered by zone, enclosure and "mine / everyone").
- **Log maintenance** (four steps: what is wrong, where, who and when, review).
- **A job's page**: status buttons (Not started, In progress, Blocked, Completed), Before and After photos, estimated and actual cost.
- **Edit details** on a job.
- **My tasks**: the jobs and recurring tasks assigned to this person, each with status buttons and an Undo.
- **Enclosures** (the list and the map) and the **Operations** page.
- **The Residents list and each resident's page**, and the **Assistant**. See restrictions: this is wider than a maintenance job needs.

### Tables

- **Maintenance jobs** (read and change), their status and their photos.
- **Recurring tasks** assigned to this person (mark done or skipped).
- **Residents** (read), **enclosures and zones** (read).
- **Every login in the app**, name and email, through the "Assigned to" list.

### Forms

- **Log maintenance**: works end to end. Title, two photos, zone and enclosure, assignee and review all saved; the job (M-5754) appeared on the Maintenance board and on My tasks.
- **Change status**: works from the job page and from My tasks (In progress, then Completed, with Undo).
- **Edit details**: works. Estimated and actual cost saved and show on the job page (฿1,500 and ฿1,200).
- **Add and remove a photo on a job**: both work. Photos filed under Before showed "Before (2)" and removing one (after a confirm box) left "Before (1)".
- **Assistant**: answers. "Who is in Cat Enclosure?" listed the five residents by name and number.

## Major restrictions

- **No way to delete a job.** The job page and the edit page have no delete control, although the walkthrough says "log, change, assign, cost, delete". This is the delete fault
  already in the access fault log, driven again here. Every holder of this card is affected, and it is still live on production according to the log (not re-read today).
- **Cannot see anything medical.** A resident's Clinic Visits page is refused. The medical tiles on a resident's page still show, with "none" and "0 current" counts that
  mean "not allowed", not "nothing recorded".
- **Cannot open Stocktake** or the medication list (both refused).
- **Not driven:** marking a recurring job done (no recurring task was assigned to this login). The status buttons on My tasks were driven.

## Recommendation

- **Decrease (the most important finding): take away the resident record.** Lutan's own example was that someone doing maintenance needs enclosure information, not residents. This card reaches far more:
  the Residents list shows every resident, **Download spreadsheet** hands over a file with all 94 (name, species, breed, sex, age, microchip status, enclosure, status, intake date, ready for adoption),
  and each resident's page opens with their photos and a bio. The enclosure page already gives what a maintenance job needs (zone, enclosure, open jobs). Residents are not needed for the job.
- **Decrease:** the "Assigned to" list shows every login in the app with its email address (26 on the test system). A maintenance worker needs the people who do maintenance, not everyone's email.
- **Decrease (small):** the buttons Edit resident details, Send to hospital, Foster / adopt and Move enclosure are offered on a resident's page to a read-only holder and then refuse. If residents stay, hide them.
- **Increase (small):** give the card the delete the job page lacks, or stop promising delete.
