# The maintenance board on a phone (§13 of the roles paper)

2026-10-03, `claude/maintenance-phone-board`. No migration, no change to who may
do what (`canWriteMaintenance` and the policies are untouched).

## Why

Nobody on site has a computer (`2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`).
The board's only way to change a status was a drag between columns, which is why
the staff dry run (#314) left R050, "Change a job's status on the board", as the
one staff activity the acceptance matrix marked desktop-only. `phone-width-fixes`
confirmed it and left it, because the fix is a feature rather than a width.

## The tap model

On a phone each job in the list has a **Move job on** button. It opens the other
three statuses as full-width buttons ("Move to In progress"), each with an arrow,
a status colour and a word. Choosing one asks, in words, what will happen ("Move
'Gate latch' from Not started to In progress? It will show in the In progress
list."), and only on confirm does it call the same `moveJob` the drag calls.
Finishing a job has its own wording, because it stamps today's date.

- **Every status is reachable by tap, including back a column and Completed.**
  The choices are "every status but the current one", not "the next one", so
  a mistaken move is one more tap, not a trip to a desktop. The Completed chip
  lists finished jobs, and a job there can be moved back the same way.
- **Confirmation instead of Undo.** The brief's standard is a confirmation that
  says in words what will happen. A move is also reversible by the same button,
  so no separate Undo state is kept.
- **The desktop drag is unchanged.** The Kanban columns, `draggable` cards and
  drop targets render at `md` and up exactly as before; the phone controls are
  inside the `md:hidden` branch. Both paths call `moveJob`, so the optimistic
  move, the Drive folder follow-up and the error line are shared.

## Three phone paths to a status, reconciled

There were already two other ways, and this adds a third. They do not diverge in
effect: all three end in `setMaintenanceStatus(jobId, status)`, the one server
action that updates the row (the trigger stamps or clears `date_completed`) and
then moves the Drive folder.

| Path | Where | Role |
|---|---|---|
| Move job on | the board (list on a phone, drag on a desktop) | **The primary one**: the board is where a person decides what to move, so it is where the tap lives |
| Status buttons | the job page | Kept: a person who opened a job to read or photograph it can move it without going back |
| My tasks | `/my` | Kept: it is the volunteer's and staff's own list, and the Undo there is its own affordance |

Only the board's tap asks for a confirmation in words. The job page's buttons
and My tasks are left as they are in this PR (not swept); unifying their
wording, or putting the job page's buttons behind the same confirmation, is a
follow-up if the 2IC finds them unclear when watched.

## Log a job as steps

`MaintenanceForm` in create mode now uses the wizard chrome that intake and the
Shelter Friend wizard share (`WizardProgress`, `WizardNav`, `ReviewSummary`),
passed its own labels the way the Shelter Friend wizard does, and ends in its own
Save job button through `finalActions`:

1. **What is wrong**: title, description, photos.
2. **Where**: zone and enclosure, or zone-wide.
3. **Who and when**: status, due date, the team, estimated cost.
4. **Review**: every answer with an Edit link back to its step; nothing is saved
   until Save job.

**Nothing is lost on Back**: all steps stay mounted and are only hidden, so
uncontrolled inputs keep their values (the F-10 failure was a refused save
emptying pickers; a refused save here leaves the form as it is, with the
message). Next checks only the steps being left (a title; a location) and Back
never checks. Enter in a text box does not save a half-filled job. `required` is
off in create mode because the steps validate themselves and a hidden required
field would make the browser refuse silently; the server's checks are unchanged.

Edit mode keeps the single form: it is changing one thing in something that
exists, which the wizard does not help with. The job page already has before and
after photo sections whose upload control takes the phone's camera through the
file picker.

"Assign" and "complete" as steps are therefore covered by step 3 and by the
board's tap; there is no separate "assign" screen for an existing job (it is in
the edit form), and none was invented.

## What changes when R3 (the Head of Maintenance) lands

Nothing here needs rework: the board is built for the roles that can use it
today (staff, management, admin). When R3 exists the Head of Maintenance becomes
a role that holds the same activities; the board then reads the permission, not
the role name, as everything else will after F2. Setting up recurring tasks stays
Management's, and `recurring-jobs-phone` is untouched.

## Acceptance matrix

R050's device is now `both`, and its "do" says both ways. The log-a-job entry
now describes the steps. `npm run lint` runs the matrix check and passed.
