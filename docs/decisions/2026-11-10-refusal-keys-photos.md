# Refusal keys, second group: the profile-photo pair (2026-11-10)

Stream `refusal-keys-photos`, backlog `#3nuwy` (programme; stays open). Migration `0349` redefines
`set_resident_profile_photo` (5 messages) and `delete_resident_photo` (2) from 0319 to raise `photo.*` keys, bodies unchanged.
Same mechanism as `2026-11-08-db-refusal-keys-mechanism.md`; nothing new designed.

- Keys: `photo.profile_not_allowed`, `photo.not_this_residents`, `photo.profile_is_medical`, `photo.profile_not_a_photo`,
  `photo.profile_not_approved`, `photo.remove_not_allowed`, `photo.not_found`. SQLSTATE 42501 for the two permission refusals, 22023 for the rest.
- Callers: `src/lib/residents/profile-photo.ts` and `src/app/residents/[id]/photos/actions.ts` (deletePhoto) now use `dbRefusal`.
- **Masked callers, deliberately not touched:** `src/app/photos/approve/actions.ts` replaces the error with `removeFailed`;
  `src/app/residents/[id]/adoption-updates/actions.ts` throws it (generic failure). Neither shows the sentence.
- Thai for all seven is unread by a human (`#y1dqu`).
- Finding: the `0339` floor in `check-sql-refusal-keys.mjs` is left alone. Not moved.
- Meter after: 7 functions / 16 messages keyed; 73 person-read English remain.
