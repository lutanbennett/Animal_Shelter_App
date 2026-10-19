# Daily backup, pruned by age, with a floor

2026-10-12. Closes two backlog items that were the same work: "Back up the database every day, and
remove backups older than two weeks" and "Back up daily, not weekly (architecture review S2)".

## Age or count: age

The two items disagreed. One said `--keep-days 14`, the other `--keep 30`. Lutan's own words are
"remove backups over 2 weeks old", so **age** is what was built, and `--keep 30` is dropped: it
described thirty daily dumps, which is a month, not the fortnight he asked for. `--keep N` still
works for anyone who uses it, but the two options are alternatives and giving both is an error.
The daily cron line is `--keep-days 14`.

## The floor: the newest five are never removed

`scripts/lib/backup-prune.mjs` decides what may go, and `scripts/check-backup-prune.mjs` tries it
against made-up file lists. These dumps are the only copy the shelter has (the free Supabase plan
keeps none), so a bug here shows up months later as nothing.

- **No confirmed upload, no deletion.** `planPrune` removes nothing unless it is told the upload
  was confirmed, and the script only reaches it after the size check passes. A run that fails
  earlier exits non-zero before any prune code runs.
- **Age mode always keeps the newest five**, whatever their age. Five rather than the three the
  backlog suggested: a working week of failed runs (a Pi that is off, an expired token) then still
  leaves a week of history, and the cost of two more small files is nothing.
- **A name with no readable timestamp is never removed**, and only `.dump.age` files are ever
  considered (plaintext leftovers are still only named, never deleted).
- Every removal is printed with the rule that caused it; a run that removes nothing says so.

## Timer and tile

- `spare-clone.timer` moved from Sunday 04:00 to **Sunday 05:00**. The backup is now daily at 03:00
  and takes minutes, so the clone starts two hours after it and cannot overlap it.
- The status tile is renamed **Daily backup** and goes amber after **2** days, red after **3**.
  Item 1 said about 2 and 3; item 2 said 2 and 4. The newer, more specific item won. A missed night
  therefore shows amber the next morning, and the existing status mail fires on a miss.

## Free-tier cost

The dump is the app's records only (photos live in Drive, not the database) and was measured at
0.69 MB when the Pi backup was first set up, and "under 1 MB" in
`2026-09-30-one-pi-hosting-and-backup.md`. Not re-measured against production here: production reads
are not allowed from a worktree. Even at ten times that, 14 dumps are about 100 MB against the
Drive quota (see the correction below), and a month of downloads from Supabase is about 300 MB against the free plan's
5 GB monthly egress. Drive's trash still counts toward quota for 30 days, so allow for about 44 dumps
at once. Still free; if a dump ever grows past roughly 100 MB this needs revisiting, not a paid plan.
The test database stays unscheduled, as before.

## The Pi step is not done by this PR

Daily running needs the crontab edit on the Pi (`scripts/pi/setup.sh` step 7 does it for a rebuilt
Pi). Until it is done the Pi still runs the Sunday job, so there is no release note
(`2026-10-11-release-note-truth-rule.md`); a backlog item tracks the step.

## Correction, 2026-10-19: the "15 GB" was wrong

The cost paragraph above originally compared the dumps with "the shelter's 15 GB". That was an
assumed free-tier figure. The shelter's account, `lannacareforanimals@gmail.com`, holds **1 TB**
(confirmed by Lutan, 2026-10-19).

**Which account the backups use was not established.** They land on the `lannaanimalfoundationbwm`
tree today, not the shelter's account, and its quota could not be read from a session, so no figure
is written for it. Either way the dumps are tiny (about 100 MB for 14 at ten times today's size), so
the free-tier conclusion stands whether the quota is 15 GB or 1 TB.

**What the corrected figure does not change:** it is no reason to keep more backups. The two-week
retention is also a privacy choice: a dump holds medical history and names carers and adopters.
Changing it is its own decision with Lutan, not a consequence of having more disk.
