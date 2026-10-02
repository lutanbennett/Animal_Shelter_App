# 2026-10-02 — Soft delete for medical records: partial keys first, attachments left out

Backlog DB-6, soft-delete half (`0124_medical_soft_delete.sql`). `0121` kept the
before-image of a hard delete; this lets the app archive instead. Nothing
archives a row yet — the delete buttons are unchanged and follow in their own
PR — but every reader already skips archived rows, so the day something does,
no total changes by surprise.

## What it is

`archived_at`, `archived_by`, `archive_reason` on `weight`, `prescriptions`,
`vet_appointments` and `immunization_records`: the same names, nullability,
`on delete set null` and three-column consistency check as `contacts` (`0075`).
One flavour of archive, not two. Existing rows read as live; nothing is
back-filled.

## The unique keys went partial, and the `on conflict` clauses with them

This is the part a later reader will be tempted to undo, so the reason:

- `weight_one_per_visit` and `weight_one_per_day` (`0106`) are now
  `… where archived_at is null`. Left as they were, an archived weight still
  holds its day and its visit, so staff who "deleted" a reading could not
  enter its replacement — and it would look like the archive feature was
  broken rather than an index. The index names are unchanged because
  `src/lib/weight/record.ts` matches on them.
- `immunization_records`' key was a `unique` **constraint** (`0001`), which
  cannot be partial, so it is replaced by the partial unique index
  `immunization_records_one_per_type_day`.
- `record_immunization`, `record_immunizations_bulk` and
  `record_immunizations_fanout` (`0002`, `0007`) say `on conflict (resident_id,
  immunization_type_id, date_administered)`. Postgres infers the arbiter index
  from columns **and** predicate, so against a partial index that clause no
  longer matches anything and every insert fails with `42P10`. Each now ends
  `where archived_at is null`. Consequence worth knowing: re-recording a dose
  whose key is held only by an archived row inserts a **new** live row (the
  archived one stays archived); recording over a live one updates it, as before.
- Restoring an archived row while a live one holds its slot is refused by the
  index (`unique_violation`). That is the right answer — the undo page will have
  to say "there is already a reading for that day" — not something to paper over.

## Readers: found by reading, not from the item's list

Every function and view in the live database whose definition mentions one of
the four tables was read (the item's list was a sample; the full set was larger):

| Reader | What changed |
|---|---|
| `cashflow_forecast` (`0072`) | vet visits skip archived. Medication and immunization reach the tables only through the two rows below |
| `medication_forecast` (`0044`) | skips archived prescriptions (also feeds stock usage and the forecast page) |
| `immunization_next_due` | latest dose per resident and type is the latest **live** one, so archiving the newest dose falls back to the one before it (also feeds cashflow) |
| `private.immunization_compliance`, `private.immunization_duplicate_check` | skip archived |
| `public_resident_profiles.is_vaccinated` | **public site** — an archived dose does not make a profile "vaccinated" |
| `public_shelter_stats.in_treatment` | **public site** — an archived prescription is not a course in progress |
| `current_vet_resident_ids`, `vet_owns_visit` (`0108`/`0110`) | an archived visit, or a prescription on one, no longer gives a vet sight of the resident or the right to link to the visit — as if deleted |
| `handle_deceased_placement` | does not cancel or end archived rows, and so does not record them in the cascade snapshot |

Deliberately **not** changed: `merge_medication`, `merge_frequency` and
`merge_vet_doctors` re-point foreign keys and must move archived rows too or the
delete after them fails; `vet_appointments_linked_rx_not_future` and
`prescriptions_visit_not_in_future` guard a link, and restoring an archived row
must not be able to break an invariant. The reference counts that gate deleting
a frequency, medication, vet or doctor (`/admin/frequencies`,
`/management/medications`, `/management/vets`) also still count archived rows,
because the foreign keys do.

The same sweep in the app (`.is("archived_at", null)`) covers the resident hub
and every section page, the weight form's one-per-visit and same-day logic,
the visit pickers, vets' schedules, the dashboard, cashflow, stock usage, the
assistant's visit lookup and the deceased-resident record export. It is inert
until a row is archived.

`public_shelter_stats` was rebuilt from its latest definition (it reads
`private.resident_current_state` since `0108`), not from `0073`'s text — the
first cut of this migration used `0073` and the grants checker and the harness
caught it. Anyone editing that view again should copy the live definition.

## Attachments are not included, on purpose

`attachments` has the audit log but no `archived_at`. #252's delete moves the
Drive file to trash — its own story — and an archived photo row could stay
public: `public_resident_profiles` and the public photo views read attachments
for what is public, and a "hidden" row that still satisfied them would keep a
deleted photo on the website. If attachments ever get archive, those views and
the Drive side change in the same PR.

## RLS is unchanged — and what that means for who can "delete"

Archiving is an `UPDATE`. Staff and management can already update these tables
but have no `DELETE` policy on prescriptions or visits (only admin and vets
do), so archive is a power staff did not have as delete. The migration does not
decide that; the follow-up that swaps the delete buttons must choose, per role,
who is offered Archive. Archived rows stay readable to the roles that could read
them, because the recent-changes page and undo (the remaining DB-6 halves) need
them; the app's readers filter.

## Audit

`0121`'s triggers already cover all four tables. An archive is one `UPDATE`, so
one audit row, whose `old_row`/`new_row` carry the new columns — checked by
`scripts/check-medical-soft-delete.mjs`.

## Verification

`scripts/check-medical-soft-delete.mjs` (dev, `begin … rollback`) runs the file
a second time and asserts: archiving a weight frees its day and its visit;
the immunization functions upsert against the partial key and an archived key
is free; an archived dose leaves `is_vaccinated`, `immunization_next_due` and
the duplicate check; an archived prescription leaves `medication_forecast` and
`in_treatment`; an archived visit leaves the cashflow forecast and a vet's
scope (and returns on restore); archiving writes exactly one audit row; the
consistency check holds; and no existing row has `archived_at`.
`scripts/check-shelter-today.mjs` still fails on dev, but not because of this:
it replays `0073` and so restores the pre-`0108` `public_shelter_stats`, which
anon cannot read; that is a stale harness (filed on the backlog).
