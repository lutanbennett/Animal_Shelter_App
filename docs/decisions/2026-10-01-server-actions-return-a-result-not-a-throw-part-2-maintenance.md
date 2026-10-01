# 2026-10-01 — Server Actions return a result, not a throw (part 2: `/maintenance`, and the item closes)

Part 2 of #441, the last area: `src/app/maintenance/**`. With this the backlog
item is ticked across `/admin`, `/residents`, contacts, `/management`,
`/projects` and `/maintenance`.

- **Same shape as `/projects`.** `src/app/maintenance/actions.ts` never
  `throw`s for a refusal — it returned `{ error?: string }` — so ordinary
  refusals already reached the screen. What it lacked was a net for the
  *unplanned* failure (a rejected Supabase request, a Drive call throwing
  inside `syncJobFolderAfterChange`), which in production became "Minified
  React error #441". Every exported action now runs inside
  `runAction("maintenance.<action>", t.common.somethingWentWrong, …)`.
- **`MaintenanceActionResult` and `MaintenanceFormState` are folded** into
  `ActionResult<…>`. The form actions lost their unused `_state` first
  parameter (the form calls them from a submit handler, not `useActionState`),
  so `createMaintenanceJob(formData)` / `updateMaintenanceJob(formData)`
  return `ActionResult<{ jobId, driveWarning }>`. `setMaintenanceStatus`
  returns `ActionResult<{ driveWarning }>`; `deleteMaintenanceJob` and
  `deleteMaintenanceAttachment` return `ActionResult`.
- **A fourth caller outside the tree.** `src/app/my/MyTaskList.tsx` calls
  `setMaintenanceStatus` for the "my tasks" list; `tsc` caught it. Callers now
  test `!result.ok`.
- **`redirect()` inside `runAction`.** `deleteMaintenanceJob` redirects to the
  board on success; `runAction` passes Next's control-flow throws through
  (`unstable_rethrow`), so the redirect still works and only a refusal returns.
- **The vet refusal is a page guard, not an action.** `requireRole` runs in the
  route layout and refuses a vet before any action is reachable. Inside the
  actions, "not allowed" is RLS filtering the write to zero rows, answered with
  the existing `t.maintenance.errors.notAuthorized` ("You don't have permission
  to change maintenance jobs.") — already actionable, so left unchanged.
- **The closing grep.** `grep "throw new Error"` across `"use server"` files in
  `src/app` still finds a handful (`countBloodTests`, `countFrequencies`,
  `uploadToWebsiteFolder`, the fixed-outgoings cap check, …). Every one is an
  internal helper called from inside a `runAction` body, so it becomes a
  referenced "something went wrong" rather than #441. Nothing needed filing.
- **Helpers unchanged.** Nothing under `src/lib/maintenance/*`,
  `src/lib/placements/*` or `src/lib/archive/*` was touched.
