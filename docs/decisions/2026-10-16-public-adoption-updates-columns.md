# What the public success-stories view exposes (2026-10-16, `0214`)

Strangers read `public_adoption_updates`. Rule: expose the narrowest set; if a column is ambiguous it stays out, because a name that was public for a week cannot be taken back.

**Three new columns carry everything public**, so staff-facing columns can never leak by being selected:
`share_publicly` (opt-in, `not null default false`, never backfilled, never inferred from an upload), `public_story` (the words the adopter agreed to publish) and `public_first_name` (one word, at most 40 characters, typed by hand and not read from `contacts`, so a surname cannot arrive through a join).

| Column | In view? | Why |
|---|---|---|
| `adoption_updates.id`, `resident_id` | yes | the story and the animal; the animal must itself be `is_public_visible` and not Deceased |
| `received_on` | no | ambiguous; can be added later |
| `sender_contact_id` | no | identifies a person |
| `channel` | no | internal |
| `note` | no | written to staff, not to the public |
| `created_at`, `created_by` | no | staff identity |
| `share_publicly` | filter only | the view returns only ticked rows |
| `public_story`, `public_first_name` | yes | the agreed words and at most a first name |
| `attachments.drive_file_id` | yes | the photo; Medical-folder files and non-images excluded |
| other `attachments` columns | no | file name, uploader and dates are internal |

`anon` has `select` only; PATCH and DELETE are refused (`check-public-views.mjs`). The photo proxy (`is_public_drive_file`) is not changed here, so these photos are not servable yet; that is the next batch's job.

# The widened `assistant_actions` insert policy

`assistant_actions_insert_perm` (0150) now reads: own row, and (`assistant.record` or (`assistant.ask` and `status = 'refused'`)). Select is unchanged (`assistant.record`, own row), so a volunteer can write a refusal but read nothing, not even their own. Nobody else gains anything: holders of `record` could already insert. Proof is in `scripts/check-public-stories-schema.mjs`. The client that writes the row is a later batch.
