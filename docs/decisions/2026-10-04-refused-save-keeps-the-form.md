# 2026-10-04 — A refused save keeps the form (`useKeptForm`)

Backlog F-10, from the staff acceptance run (`docs/uat/dry-run-2026-10-03-staff.md`).
Move enclosure emptied its Zone and Enclosure pickers after a refusal and left a stale
"0 / 4 · Space available"; Log immunizations cleared every vaccine tick. Two pages were
found because two were tried. It was one cause, and every form that submits a Server
Action had it.

## The cause

React 19 resets a `<form action={fn}>` when the action finishes, whatever it returned.
Two things follow, and they are the two symptoms:

- **Uncontrolled fields** (`defaultValue`) go back to their default: a typed note or a
  changed date is gone.
- **Controlled fields** (`value={state}`, `checked={state}`) have their DOM reset while
  React state still holds the old value. A select falls back to its first option under a
  state that still says "enclosure 4", which is how "Space available" stayed on screen
  for a place the picker no longer showed, and how ticks vanished from the screen while
  `selectedTypeIds` still held them.

`ChangePasswordForm` had already hit it and worked around it locally (a comment there
names F-10). Nothing shared existed, so each new form re-created the bug.

## The fix, once

`src/lib/use-kept-form.ts` — `useKeptForm(action, initialState)`, a drop-in for
`useActionState` that returns `[state, onSubmit, pending]`. The form is submitted from
`onSubmit` (default prevented, `new FormData(form, submitter)`, dispatched in a
transition), which React does not reset. The reset the form would have had is done by
the hook, and **only when the action did not come back refused** (an object with a
truthy `error`), so a successful create-form still clears for the next entry and a
refused one keeps everything.

Applied to all 36 forms in 34 files that used `useActionState` with `<form action>`.
The six that guard their submit behind a dialog (capacity warning, "this cannot be
undone") call the hook's `onSubmit` from their own handler where they used to fall
through to the action.

**For the next form built: use `useKeptForm`, never `action={…}` on a form that talks to a
Server Action.** `2ic-delivery-steps` builds a multi-step form with "Back loses nothing"
in its brief; this is the piece that keeps a refusal from losing it.

## Trade-offs

- A form submitted from `onSubmit` has no no-JavaScript fallback. None of these had one
  that worked (they are all `"use client"` forms driven by `useActionState`).
- "Refused" is `state.error` truthy. A success state that carried an `error` field would
  be mistaken for a refusal; none do (they use `ok`/`success`).
- `ImmunizationForm` still has a related, older quirk this does not touch: after a
  *successful* save its controlled ticks and chosen residents stay in state while the
  DOM reset clears the ticks. Left alone: it is not what F-10 reported, and clearing the
  state is a product decision (does the nurse want the same vaccine selected for the next
  batch?).

## F-21: "Waiting for …" advises, it does not block

On My tasks, Done on a job that waits for another one now asks once ("… is still open.
Mark it done anyway?"). It does not refuse. The label was never enforced and the
shelter may legitimately do the second job first (the stocktake is not done, the restock
is); making it a lock without asking them would have taken that away. If they say it
should block, it is a one-line change in `record()` in `MyTaskList.tsx`. Skip does not ask
(it is already a deliberate choice) and neither does Undo.

The "Done today" strip reads what is already stamped
(`recurring_job_occurrences.done_by/done_at`; `maintenance.date_completed`), so there is
no migration. A maintenance job taken back from the strip goes to In progress: its earlier
status is not kept anywhere once the page has reloaded.
