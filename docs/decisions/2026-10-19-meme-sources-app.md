# Meme sources, app half (`meme-sources-app`)

2026-10-19. Builds on `2026-10-19-meme-sources-columns.md` (schema, #752). **No migration.**

- **Permission is checked in three places, by role.** `sourcesFor(perms)` (`src/lib/memes/sources.ts`) offers a tab only to a login that may open that page: Outreach `community.outings` Read, Maintenance jobs `maintenance.jobs` Read, Projects `projects.folders` Read, Website `website.content` (Edit, as its page). The maker page and `createMeme` both call `resolveSource` (`source-server.ts`), which asks again and reads the photo row as the caller, so RLS hides a row the login cannot open. The picker only hides; the save is the rule. The test was written first.
- **Medical is not a source, from any tab.** For every non-resident source the file's `attachments` rows are read; a Medical row, or a row belonging to any other kind of record (blood test, procedure, visit, bill, a resident's file), refuses the save. Outreach and website photos are not attachments, so any row at all refuses them. This reads rows the caller can see; a clinical file hidden from the caller by RLS would not show, which is why the source row must also be visible to them.
- **Upload is drawn in the browser** from a `blob:` URL and never sent anywhere except as the finished meme (existing image path; limits untouched). It records `source_kind = upload` and no id.
- **Links** are stored in the 0228 columns; `source_photo_ref` is the Drive file id. The meme page shows only the kind (a link to a page the viewer may not open would just be a refusal).
- **Not built:** Make a meme on project photos (the tab exists; the button does not), and the Memes list on an outreach note, job or project.
