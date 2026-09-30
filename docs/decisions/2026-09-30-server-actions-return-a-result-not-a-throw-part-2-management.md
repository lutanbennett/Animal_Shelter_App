# 2026-09-30 — Server Actions return a result, not a throw (part 2: `/management`)

Part 2 of #441, the `src/app/management/**` area (the backlog item stays
unticked; projects and maintenance remain).

- **Seven action files converted:** `vets`, `vets/[id]/doctors`, `diets`,
  `medications`, `contacts`, `recurring-jobs`, `translations`. Each exported
  action runs inside `runAction()` (`<area>.<action>` in the log, the shared
  `somethingWentWrong` words with a reference) and refuses with
  `{ ok: false, error }`. Wording, check order and outcomes are unchanged.
  Callers (row tables, create forms, `MyTaskList`, `ArchiveContactControl`)
  read `.ok` instead of `try/catch` or `"error" in state`.
- **Already done, left alone:** `cashflow/fixed-outgoings` (converted with its
  feature; its remaining `throw`s are inside `runAction`) and
  `shelter-friends` (swept by the contacts stream, 2026-09-29 — untouched).
- **`TranslationActionResult` is folded now, not left for a translations
  pass.** `/management/translations` is inside this area, it has two actions
  and one caller (`TranslationPanel`), so leaving it would only have meant a
  fourth stream reopening a file for ten lines. It is now
  `ActionResult<{ row: TranslationRow }>`. The remaining near-duplicates
  are `ProjectActionResult` (projects) and `MaintenanceActionResult`
  (maintenance).
- **`assertManagementRole()` is deleted.** Its last callers were these
  actions; `hasManagementRole()` (added by the contacts sweep) replaces it.
- **`recurring-jobs` had its own `ActionResult = { error? }`.** It is gone in
  favour of the shared type. `previewRecurrence` returns
  `ActionResult<{ dates }>`, `handOverRecurringJobs`
  `ActionResult<{ changed, failed }>`, and `saveRecurringJob` a `SaveResult`
  whose refusal may carry `id`: when the job saved but its team did not, a new
  job's form still refreshes to show the row that now exists.
- **`mergeMedication` returns `{ ok: true, count }`** (was a bare number);
  nothing read it.
- **Dictionary keys such as `mergeFailed` are now unused** by these callers
  (the action supplies the real message). Left in place; removing keys means
  editing both dictionaries for no behavioural gain.
- **Helpers unchanged.** Nothing under `src/lib/placements/*` or
  `src/lib/archive/*` was touched — the assistant still uses them.
