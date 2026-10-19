# Medical dry-run fixes (F: diet typo, past-dated visit, medication list view)

2026-10-19, `claude/medical-dry-run-fixes`. No migration.

**Diet typo = a warning, not a hard limit.** `src/lib/diets/plausible.ts`: more than 8 meals a day, or a daily
amount over 3x the diet type's biggest size default, is held by the server action with a message and a
"Yes, this amount is right" tick box (the stocktake's big-change idea: flag, let a person confirm). A hard
limit would block a real large eater and push staff to type something false. The check runs in the server
action so a stale form cannot skip it. The 22-and-22 case from the dry run is the unit test
(`plausible.test.mjs`), written before the code.

**Past-dated Scheduled visit: the help text was right, the form was wrong.** "Overdue" is a real thing here:
`/appointments` lists scheduled visits whose time has passed as the to-write-up list. The form quietly set
the status to Completed whenever the date was in the past, which records a visit nobody confirmed as done.
It no longer changes the status; when a past time is left on Scheduled it says "choose Completed if the visit
took place, otherwise it will show as overdue". Logging a past visit now takes one deliberate choice.

**Medication list opens on By resident.** `view` defaults to `list`; `?view=pick` still opens the pick list.
