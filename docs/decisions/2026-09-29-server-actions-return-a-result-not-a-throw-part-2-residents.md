# 2026-09-29 — Server Actions return a result, not a throw (part 2: `/residents`)

Part 2 of #441, the `src/app/residents/**` area only (the other areas keep
their own streams; the backlog item stays unticked with a note).

- **Smaller than `/admin` because residents mostly returned `{ error }`
  already.** Twelve `"use server"` files; `adoption-updates` was already
  on `runAction`. The other eleven returned `{ error }` for ordinary
  refusals, so the visible #441 came from what they did *not* catch: a
  Supabase or Drive failure thrown out of an action. Each is now wrapped in
  `runAction()` (`residents.<action>` in the log, the shared
  `somethingWentWrong` words with a reference), and refusals are
  `{ ok: false, error }`.
- **Form actions that end in `redirect()` type as `ActionRefusal | undefined`**
  (`runAction<never>`), so their forms keep reading `state?.error` — they
  can never return `ok: true`, the success path leaves the page.
  `runAction` passes the redirect through (`unstable_rethrow`).
  Photo, blood-test and procedure deletes return plain `ActionResult`; their
  callers (`PhotoGallery`, `BloodTestList`, `ProcedureList`) read `.ok`.
- **Shared helpers keep `{ error }`.** `moveResidentToEnclosure`,
  `rehomeResident`, `recordResidentDeath`, `archiveDeceasedResident`,
  `setResidentProfilePhoto` and friends are also used by the assistant
  actions, outside this area; the residents actions translate their result
  at the boundary rather than change a shared contract from inside one area.
- **No near-duplicate type to fold in residents.** The four named in the
  item belong to contacts, projects, maintenance and translations.
- **Not changed:** `BloodTestList` and `ProcedureList` still do nothing
  visible when a delete is refused (they only refresh on success). Now the
  refusal is a clean value rather than a throw, showing it is a small
  follow-up, not part of this sweep.
