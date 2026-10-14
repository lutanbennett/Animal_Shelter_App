# /upload-blood-work: lab reports from Drive, read by Claude, written by a script

2026-10-15. Lutan asked for a skill that takes lab reports from a Drive inbox
on the BWM account, matches each to a resident, finds or creates the clinic
visit on the report's date or the day before, adds the blood test with the file
attached, and files the report as loaded or as no match. It asks him whenever
it cannot tell.

## The split

The skill (`.claude/skills/upload-blood-work/SKILL.md`) reads the report and
makes the judgement calls: which names, which date, which lab, which panels,
and what is flagged. Reports come from several labs with different layouts,
Thai and English, and Buddhist-calendar dates. That is reading, not parsing,
and no regex would survive the next lab.

`scripts/upload-blood-work.mjs` does everything that has to come out the same
every time. It looks things up, checks the plan against the database, and
writes visit, tests and attachments in one transaction. It prints JSON and
refuses rather than guesses. This is the `correct-resident.mjs` pattern
(`2026-10-09-resident-corrections-script.md`): a chat drives it, the script is
why two chats give the same answer.

## Choices Lutan made (2026-10-15)

- **Test first, then live.** The skill reads `Database: test | live` from its
  lessons file, so going live is a one-word edit there, not a code change.
- **One blood test per panel.** A Siri/IDEXX report holds a CBC page and a
  chemistry page. It becomes two `blood_tests` rows on the same visit, each
  with its own `attachments` row pointing at the same Drive file, so each
  panel can be filtered and is due on its own.
- **Results box = a short summary of flagged values,** ending "Full report
  attached". The file is the record. The box is so the tab is readable at a
  glance.
- **A created visit is `completed`, reason "Blood test",** at the clinic on
  the letterhead, timed from the collection time in shelter time.

## Non-obvious

- **Test and live share one Drive** (the app's Drive login is the BWM
  account for both, `scripts/lib/env.mjs`). So only `--env production` touches
  Drive. It copies the report into
  `Residents/<Name> (<code>)/Blood Tests/<YYYYMMDD>/`, the folder the app's
  own upload uses, and attaches the copy. After the database commits, it
  moves the original to "Loaded into system". On test, the original is
  attached where it is and nothing moves, so a trial run cannot empty the
  real inbox. A Drive file keeps its ID when moved, so test attachments still
  open later.
- **A copy, not the original, on live.** The deceased-archive move, backups
  and the photo proxy all assume a resident's files sit under the resident's
  folder.
- **The script writes `attachments` directly rather than calling
  `record_attachment()`.** Through the Management API there is no
  `auth.uid()`, and the function's permission check would refuse. The script
  sets `created_by`, `uploaded_by` and `app.actor` (0195) to the `--as`
  person, so the audit log still names who.
- **"Loaded twice" means a blood test of the same type, on the same date, for
  the same resident.** It is checked before anything is written, because a
  repeat run is the likeliest mistake.
- **No new visit when one exists on the day or the day before** unless
  `--new-visit`. Two visits on one day are almost always a duplicate.

## The lessons file is outside the repo

`C:\Users\Leidos\OneDrive\Documents\LCA blood work\lessons.md` holds the
following:

- the folder IDs and the database switch
- each lab's layout
- the lab → clinic and panel → type tables
- the name aliases Lutan has confirmed
- a run log

It is edited after every run, which must not need a PR. It also names
residents and labs, and the repo is public. OneDrive backs it up.
