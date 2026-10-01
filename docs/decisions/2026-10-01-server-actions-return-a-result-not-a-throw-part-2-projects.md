# 2026-10-01 — Server Actions return a result, not a throw (part 2: `/projects`)

Part 2 of #441, the `src/app/projects/**` area (the backlog item stays
unticked; only maintenance remains).

- **One action file, nine actions.** `src/app/projects/actions.ts` was already
  the odd one out: it never `throw`s for a refusal (it returned
  `{ error?: string }`), so the ordinary refusals already reached the screen.
  What it lacked was a net for the *unplanned* failure — a Supabase request
  that rejects, a Drive call that throws inside `syncProjectFolderRename` /
  `…Move` / `deleteProjectDriveFolder` — which in production became
  "Minified React error #441". Every exported action now runs inside
  `runAction("projects.<action>", t.common.somethingWentWrong, …)` and returns
  `ActionResult`; refusals are `{ ok: false, error }`.
- **`ProjectActionResult` is folded.** It was `{ error?, driveWarning?,
  folderId? }`. It is now the module-private `ProjectOutcome`
  (`{ driveWarning?, folderId? }`) carried as `ActionResult<ProjectOutcome>`.
  Success is `{ ok: true, … }`; callers (`FolderGrid`, `FolderView`,
  `MoveFolderDialog`, `PhotoSection`) test `!result.ok` instead of
  `result.error`. `MaintenanceActionResult` is the last near-duplicate.
- **Wording, check order and outcomes are unchanged.** A Drive failure after a
  successful database write is still a `driveWarning`, not a refusal, and
  `deleteProjectPhoto` still swallows a failed Drive delete (the row is gone;
  an orphaned file is cleanup). Nothing about what is stored or served by the
  public story gallery (`public_project_photos`, #201) changed.
- **Still pass raw messages through** in `updateProjectPhotoCaption` and
  `deleteProjectPhoto` (`error.message`), as before. Those are database errors
  with no translated wording today; changing them is a separate, wording-only
  decision.
- **Helpers unchanged.** Nothing under `src/lib/placements/*`,
  `src/lib/archive/*` or `src/lib/projects/*` was touched.
