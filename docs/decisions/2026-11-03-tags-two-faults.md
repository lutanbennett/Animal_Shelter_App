# Tags: two faults left behind by tags-remaining-boxes

Backlog item: Resident operations, "TWO SMALL FAULTS THE #tags WORK LEFT BEHIND". No migration.

## (a) A failed tag link on intake is now shown

**Where it was logged:** `src/app/residents/new/actions.ts:159-161` (before this change) — `if (tagFailure) console.error("residents.recordIntake note tags", tagFailure)`,
with the comment that a redirect cannot carry a message. It was the ONLY silent path: every other box already returns `noteTagFailure`/`syncNoteTagsOrMessage`
words to the form (checked by grep over `src/`; the edit-resident move note and adoption update return them).

**Shape:** the action cannot return an error (that would invite a duplicate intake), so the redirect carries `?tags=failed` or `?tags=denied`
and `src/app/residents/[id]/page.tsx` draws a status line from the existing `residents.tags.couldntSave` / `notAllowed` strings ("The note was saved, but
its resident links could not be."). The flag also rides on the `/edit` redirect used when the microchip write fails, but the edit page does not read it: in that rare double failure the link failure is only logged (recorded as found, not fixed). No new dictionary key was needed;
both strings already exist in `en.ts` and `th.ts`. The Thai is ours and unread by a Thai speaker (said in the release note).
The message says the links could not be saved and not which `#Name`: the sync is all-or-nothing per note, so there is no per-name reason to list.

## (b) Narrowing `stripTagMarkup` is NOT possible without a migration: accepted

The recommendation was to strip only a `#` that resolves to a real tag. The three public pages read through the anon client, and `resident_note_tags`
has `select` granted to `authenticated` only (`0299_resident_note_tags.sql`, policy `resident_note_tags_select_perm`, grant line "to authenticated").
So narrowing needs either a public view/RPC (a migration; this stream carries none and another stream owns the batch's only one) or a service-role read on
a public page (forbidden by `check-hard-coded-security.mjs`). Neither is safe inside this stream, so the second option is taken: the cost stays, and
`text.test.mjs` pins it so changing it is deliberate. Still open: whether it bites. The check `public-hash-not-a-tag` (`scripts/lib/readonly-checks.mjs`)
answers that: counts per column, and the distinct digit-start fragments only; letter-start fragments are counted but never printed, since one could be a
typed name. Run on dev (`--env test`): 0 across the board (dev holds no `#` in those columns). Production count is the planner's to run.
If the count is non-zero, the follow-up is a small schema PR (a public-safe function answering "is this a tag") and then narrowing.
