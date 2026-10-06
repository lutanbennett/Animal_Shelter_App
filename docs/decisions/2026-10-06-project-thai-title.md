# 2026-10-06 — A project's Thai title: surface it, keep it a paired column

**Context.** On `/our-work` a project's name showed in English only. The Thai
title was never missing from the pipeline: `project_folders.name_th` (0034) is
published as `title_th` by `public_projects` (0042, 0056), and
`localized(locale, title, title_th)` in `src/lib/projects/public.ts` already
shows it to a visitor reading Thai, falling back to English when empty. The only
place to type it was the folder's Rename form, which nobody opens to add a
translation, and nothing said it was empty. A discoverability fix, not a feature
gap. No schema, no view change (`public_projects` untouched).

**Decision.**

1. **Put it where a project is described.** The create-folder form already had
   the Thai field (found on reading, nothing to add). The folder's *About this
   project* panel now shows the Thai title (or "No Thai title yet"), the
   *Edit details* form gains the field, and the page heading shows the other
   language's name under the title for English readers as it already did for
   Thai readers. `updateProjectFolderInfo` now writes `name_th`; its only caller
   is that form.
2. **Say so when it matters, only then.** A *published* folder with no Thai
   title says "Thai visitors see the English title." (a consequence, not an
   error). Unpublished folders say nothing beyond "No Thai title yet". Settings →
   Website's published list carries the same note and an *Add Thai title* link.
3. **Translations page: the note form, not rows.** The 2026-09-21 decision splits
   labels (paired `_th` columns) from prose (`translations` table). A title is a
   label, and the queue's rows, statuses, approve/stale logic and the table's
   policies all assume prose with an original and a translation of it. Putting
   titles in would either fork that contract or move a label into the prose
   table. So Management → Translations shows a "N published projects have no Thai
   title" note at the top, linking each folder, which is the item's own escape
   hatch. **For the stream that gathers every `_th` field into one place:** this
   is the precedent. It deliberately did *not* make titles rows; if that item
   wants them as rows it must first decide what "approved" means for a label
   typed in one language by the person who made it.
4. **Confirmed, unchanged.** Category chips on `/our-work` use
   `projectCategoryLabel(t, …)` over `enums.projectCategory`, which has Thai for
   every category. Photo captions are `('attachments','caption','public')` in
   `translatable_fields` (0056), so a caption already lands in the queue.

**Lutan can fix existing data today:** Projects → folder → Edit details → Thai
title (or Rename → Thai name).
