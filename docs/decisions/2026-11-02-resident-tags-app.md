# Resident note tags: the app half

Backlog item: Resident operations, "#tags in a resident's notes link two residents both ways". Schema half: 0299 and 0300
(`2026-11-02-resident-tags-schema.md`). This is the half a person can see. No migration.

## What was built

- `src/lib/note-tags/`: `text.ts` (pure: parse the hidden field, which picks are still in the text, split a note into
  text and links, find the `#word` at the caret; unit-tested), `sync.ts` (writes and removes the links for one note),
  `load.ts` (a resident's links, and Mentioned in), `can.ts` (`canTagNote`).
- `TagNoteField` (client): a textarea that, when `canTag` is true, opens a resident list on `#`, puts `#Name` in the text
  and the pick (`{id, name}`) in a hidden `<field>__tags` input. `canTag` defaults to false.
- `GET /api/residents/tag-search`: name or R-code prefix, needs `resident.record` at read.
- `NoteText`: shows a note with each tagged name as a link to that resident, following the stored id.
- `MentionedIn`: on the resident hub; the note, the box it came from (read from the registry), the date, who saved it,
  and a link back to the resident it was written on.

## Decisions

1. **The link stores the id; the text is never matched to a resident.** The picker is the only way a link is made. On save,
   a pick counts only while its `#name` is still in the text (deliverable 5: editing a tag out deletes its row).
2. **No tags field in the form means no change to the links.** A login whose cards do not let it tag gets a plain
   textarea and no hidden field, so its save leaves links alone (it must not wipe what another login made).
3. **Who may tag** = `can(perms, <the note's save activity>)` AND `resident.record` at read (`canTagNote`), the same two
   things the link policies ask. Hiding is the courtesy; the policies are the check (42501 comes back as "the note was
   saved but you may not link residents in it").
4. **Mentioned in reads the note text from its own table**, so the note's own policy decides whether it shows, and drops
   a link to a note that is archived (`weight`, `prescriptions`, `clinic_visits`, `immunization_records`).
5. **Archive** (deliverable 6): `archiveMedicalRecord` / `restoreMedicalRecord` set and clear `archived_at` on the links.
   The link policy asks the note's own save activity, so a login holding only `medical.archive` may match no row; the
   Mentioned in read hides the link anyway because it checks the note's own `archived_at`. Row left `archived_at null` in
   that case: harmless, and listed below.
6. **Hard delete of an adoption update** also deletes its links.
7. **Several notes, one save:** immunizations (resident x vaccine) put the same picks on each record; clinic-visit booking
   finds the visits it just made (the RPC returns no ids) by resident, clinic, time and `created_at` and links each.

## Found, not fixed (for the planner to file)

- **Public pages.** `temperament_notes` and `past_story_notes` are shown on `/adopt` and `/r/[code]` (the hub says so).
  A `#Name` typed there appears as plain text on the public site, naming another resident. The registry includes both
  (decided in #1194), so this needs a decision: strip the `#`, or keep those two off the public pages.
- **Boxes with a note but no tag support yet:** the intake form's note and the Edit resident form's "move notes" (both
  write `placement_history.notes`, activity `resident.register` / `placement.move`). Other `placement_history` paths work.
- **Immunization notes are not shown anywhere on a resident today**, only entered. Tags in them show under Mentioned in.
- **Archiving by a login holding `medical.archive` only** cannot set `archived_at` on the link (see 5). A card or policy
  change would close it; not needed for correctness of the list.
- **`blood_tests.results` and `appeals.outcome_note`** are not taggable (filed for Lutan in #1194). Not added.
- **The assistant** writes notes without the tags field, so its notes carry no links.
- Thai strings under `residents.tags` are unreviewed, as the release note says.
