# Resident note tags: the schema half (0299 and 0300)

Backlog item: Resident operations, "#tags in a resident's notes link two residents both ways". Lutan, 2026-11-02:
"All note boxes". This PR is the schema only. The app half is the next stream, built from the updated `main`.

## 1. The manifest: what "all note boxes" means

Read from the live dev tables on 2026-11-02 (columns of type text on tables that carry a resident), not from a grep.
Each row is registered in `resident_note_sources` with the activity that already governs it.

| Table . column | Owning resident column | Read activity | Save activities |
|---|---|---|---|
| residents . behaviour_notes | id | resident.record | resident.record |
| residents . temperament_notes | id | resident.record | resident.record |
| residents . past_story_notes | id | resident.record | resident.record |
| placement_history . notes (the move form and every placement) | resident_id | resident.record | placement.move, placement.hospital, placement.rehome, placement.death, placement.death_withdraw, resident.register, resident.record |
| clinic_visits . notes | resident_id | medical.visits | medical.visits |
| immunization_records . notes | resident_id | medical.immunizations | medical.immunizations |
| prescriptions . notes | resident_id | medical.prescriptions | medical.prescriptions |
| procedures . notes | resident_id | medical.procedures | medical.procedures |
| weight . notes | resident_id | medical.weight | medical.weight |
| resident_diets . notes | resident_id | medical.diet | medical.diet |
| adoption_updates . note | resident_id | resident.adoption_news | resident.adoption_news |

The read activities are the ones in each table's live select policy. The save activities are the table's write policy,
or for placement_history the per-type list in its insert policy.

### Ambiguous, left OUT and said aloud (add later with one insert each)

- `residents.bio`, `hook_line`, `ideal_home`, `adoption_updates.public_story`: text written for the PUBLIC website.
  A tag there would link a public page to another resident. Not a staff note box, so not registered.
- `blood_tests.results`: free text, but a lab result more than a note. Wants Lutan's word.
- `appeals.outcome_note`: belongs to a fundraising appeal that mentions a resident, not to the resident's record.
- `pending_photos.note`: a moderation note on a photo in the queue, not yet a resident's.
- `residents.other_names`, `colour`, `breed`: labels, not notes.
- Tables with a note but no resident (clinics, diets, diet_types, desexing drives, vets, contacts): not a resident's.

## 2. What identifies a note: verdict

**A triple `(source_table, source_row_id, source_column)`, with `(source_table, source_column)` a foreign key into a
small registry table `resident_note_sources`.** The registry carries the owning-resident column, the read activity and
the save activities.

- **Survives a new note box:** one insert into the registry. No alter type, no new column, no new policy.
- **A policy can express it:** the policy calls `can_read_note_source(table, column)`, which looks the pair up in the
  registry and asks `has_permission(<read activity>, 'read')`. A named enum would have needed that same mapping from
  each value to an activity as well, in a CASE inside every policy, so it is the triple plus a second thing to keep in
  step. The registry is that mapping, as data, in one place.
- **Not hard-coded security:** the registry names no role. Which login holds which activity is still decided by cards
  and nothing else. Admin passes through `is_admin()` inside `has_permission()`, untouched, given no card.
- **Cost:** no foreign key can tie `source_row_id` to a row, because it spans many tables. A trigger checks at write
  time that the row exists and is owned by `from_resident_id`. A note deleted later leaves its link behind, so the app
  half must delete or archive the link when it deletes or edits the note. `archived_at` exists for archiving.

## 3. The policies

- **Read:** the login can read the note where the tag was written (registry read activity, level read) AND holds
  `resident.record` at read. The second test is so a link never shows a login a resident it cannot already open.
- **Insert, update, delete:** the login holds any one save activity for that note (level edit) AND `resident.record` at read.
- **Registry:** readable with `resident.record` at read; no write grant at all. Changing it is a migration.
- **No new card, no new activity.** Every activity above already exists (checked against `permission_activities`).

## 4. Things the next stream must know

- Write the links in the same save as the note: one row per tagged resident,
  `(source_table, source_row_id, source_column, from_resident_id, to_resident_id)`. Unique per note and tagged resident.
- Delete the links when the tag is edited out of the note, set `archived_at` when the note is archived.
- "Mentioned in" for resident B: select where `to_resident_id = B and archived_at is null`; index
  `resident_note_tags_to_idx`. The note's own resident: `resident_note_tags_from_idx`.
- Reading the note TEXT is a separate select on the source table and is governed by its own policy, not by this one.
- A refused write comes back as 42501 (no right to that note) or 23514 (row missing or not owned by `from_resident_id`).
  A login that cannot read the registry (no `resident.record`) gets 42501 since 0300.
- The picker's list of tag-able boxes comes from `resident_note_sources`, which only a login holding `resident.record` can read.

## 5. Found and fixed along the way

0299's owner trigger gave an internal error (22004) to a login that could not read the registry. 0300 replaces the
function so it refuses with 42501. Two files rather than editing 0299 because an applied file is never edited.

## 6. Proof

`begin ... rollback` harness against dev, three disposable logins on custom roles (cards by activity, no role names):
H1 a login holding medical.visits and resident.record writes a link in a clinic note and reads it back; H2 a forged
owner is refused (23514); H3 a login holding only resident.record cannot read that link; H4 nor write it; H5 the same
login can use a resident-record note and read it; H6 a login with neither reads nothing; H7 nor writes; H8 anon is refused.
Result: `HARNESS-OK 0299 H1-H8`. The harness lives in the session scratchpad, not the repo, because `scripts/` belongs to
sibling streams this batch.
