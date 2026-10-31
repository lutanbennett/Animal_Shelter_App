# 2026-11-01 — the assistant reads residents through `resident_who_and_where` (no migration)

Backlog item: *the assistant cannot name an animal for any card narrowed to who-and-where.*
Found yesterday by `claude/assistant-record-card` while driving `0295`.

## Deliverable 1 — how many reads had the fault: six, in four places, not one

Every read of a resident under `src/lib/assistant/`, `src/app/assistant/` and the loader they share.
The select policy on `residents` (`residents_select_perm`, `0264:155`) asks `resident.record` at read, and
`resident_list_view` is `security_invoker` over it, so a read of either relation is a read of that activity.

| Read | Relation | Asks | Was |
|---|---|---|---|
| `lib/assistant/data.ts:123`, the picker | `resident_list_view` | `resident.record` | **faulty** |
| `lib/assistant/data.ts:174`, the profile photo | `residents` | `resident.record` | **faulty** |
| `app/assistant/lookups.ts:230`, "where is …" and the summary | `resident_list_view` | `resident.record` | **faulty** |
| `app/assistant/lookups.ts:193`, photos for both lookups | `residents` | `resident.record` | **faulty** |
| `app/assistant/lookups.ts:286`, "who is in …" | `resident_list_view` | `resident.record` | **faulty** |
| `lib/enclosures/options.ts:62`, headcount for "which enclosure has space?" | `resident_list_view` | `resident.record` | **faulty** |
| `data.ts:181`, `resident_current_state` (hospital's previous enclosure) | view, gated `works_with_residents()` | any resident card | fine |
| `lookups.ts:207` `resident_current_state`, the carer read | same | same | fine |

The `options.ts` read is worse than an empty picker: it returned **no rows without an error**, so every
enclosure counted 0 residents and "which enclosure has space?" reported a full shelter as empty. It is a shared
loader (eleven call sites: move, rehome return, hospital return, new and edit resident, maintenance, pending photos), so the same
mis-count hit any of those pages for a card holding who-and-where but not the record. Changing it is a
declared crossing of the brief's file list; it serves deliverable 1 and was the same fault.

Not changed, and why. `src/lib/assistant/could-not-help.ts:130` reads `residents` for names on the **admin review
screen** of the could-not-help log. It is a different surface (a reviewer, not the assistant's lookup) and a
different card; found, not fixed. `clinic_visits`, `maintenance`, `weight`, `prescriptions` and
`immunization_records` reads are gated by their own activities and are not resident-table reads.

## Deliverable 2 — the narrow view carries everything, so no migration

`resident_who_and_where` (`0134`, widened `0192`, gated on a card by `0263:185`) has: `id`, `name`, `thai_name`,
`resident_code`, `species`, `sex`, `profile_photo_drive_file_id`, `current_status`, `enclosure_id`,
`enclosure_name`, `enclosure_name_th`, `zone_id`, `zone_name`, `zone_name_th`, `zone_colour`. The lookups need
name, Thai name, code, status, enclosure and zone names, and the photo; **all are there**, and the photo even
saves the second read. The only thing the lookup took from elsewhere was the hospital's previous enclosure,
which was already read from `resident_current_state`, whose gate (`works_with_residents()`) every resident card
passes. So: swap the relation, alias `id` to `resident_id` so the row shape is unchanged, no new column.

Widening `residents_select_perm` was not considered a candidate: it would undo `0268` for every card.

## Deliverable 3 — no migration, so no `0296`

`0296` stays free. Nothing to apply, no `-- consumer:` decision to make.

## Deliverable 5 — how we know nothing widened

`scripts/prove-assistant-reads-narrow-view.mjs`, in the shape of `prove-assistant-record-card.mjs`, in one
rolled-back transaction as throwaway roles built from cards: the assistant card alone reads all residents
through the narrow view and **zero** rows of `resident_list_view`, `residents`, `placement_history`, `weight`,
`prescriptions` and `clinic_visits`; the view's column list is exactly the fixed one; a login with no card
reads nothing; `view_residents` counts the same placed residents either way (headcount unchanged); and neither
assistant source file reads the old relations. It was made to fail once by inverting assertion 2, and failed
with *"the assistant card reads 0 rows of resident_list_view"*: which is also the fault itself, measured.
No server or database check was touched; hiding is not involved. No role key or name appears.

## Deliverable 4 — what the drive found (dev, port 3009, aal1)

- **`assistant, record_weight`** (no `view_residents`): *"Walkassistant weighs 12.6 kg on 2026-10-20"* answered
  *"Done — Walkassistant (R-8383) recorded at 12.6 kg on 20 Oct 2026."* "Where is Walkassistant?" named
  the resident; "Who is in Cat Enclosure?" listed all five; "Which enclosure has space?" answered with counts.
  (A first attempt for today answered *a weight is already recorded for that day*: yesterday's drive left one.)
- **`assistant` alone**: names residents, answers where / who / space. A weight request is offered and
  then refused by `weight`'s own policy (*new row violates row-level security policy*): the per-tool
  `medical.weight` gate, which the item says is the design. The raw database message shown to the person is
  ugly; that is the assistant's wording, which this change does not touch. **Found, not fixed.**

## Not touched

The manual: `src/lib/manual/en.ts` has no sentence saying the assistant needs the whole record to find
a resident (checked by grep), so no line is owed. What the assistant says and which tools it has are unchanged.
