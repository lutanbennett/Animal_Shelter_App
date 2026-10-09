# Three over-grants closed; two vet questions left with Lutan

2026-10-09, `close-the-over-grants` (`0170`, `0171`). Evidence:
`docs/security/security-assessment-2026-10-09-dynamic.md`. Proof: `scripts/probe-role-surface.mjs`
run before and after, and the check scripts named below, in
`docs/test-plans/close-the-over-grants.md`.

Each of the five was a right the database answered that no screen offered: a login could do it
only by sending a request by hand with its own token.

## 1. Contacts: staff name contacts, Management reads them

Lutan approved option (c) on 2026-10-08 ("Close it down"). Before: staff read every column of
`contacts`, phone, email, address and notes, because the carer pickers and name embeds read the
table through staff's Read on `contacts.directory`.

- **`picker_contacts`** (id, name, type, archived_at), rows for `contacts.directory` Read. Named for
  contacts, not carers as the item suggested, because the adoption-update sender list offers any
  contact, not only carers. `archived_at` is in it because the picker hides archived carers, rehome
  refuses one and the housing history marks one; it is the contact's state, not personal data.
  `archive_reason` is free text about a person and is not.
- **Why not reuse a view.** `vet_contacts` (id, name, type) is the right shape but gated on the vet's
  role name; widening it would mean a second audience behind a role-named gate. `volunteer_contacts`
  carries the phone. Neither could be pointed at staff without handing them more.
- **`contactRelation(perms)`** now takes the permissions, not the scope string: `full` with
  `contacts.browse` reads the table, `full` without it reads `picker_contacts`. Every embed and
  picker that varies by caller goes through it; the three that only ever ran for staff and
  Management (`RESIDENT_PHOTO_SELECT`, the deceased-undo page, the archive record) name
  `picker_contacts` directly.
- **The table's read policy** asks `contacts.browse` **or `contacts.directory` Edit**, with
  `sees_all_contacts()` beside both. The brief said `contacts.browse` alone, and `0170` did that;
  `0171` adds Edit because the update and delete policies and `/management/contacts` ask that
  level, and Postgres lets an UPDATE or DELETE reach only rows the SELECT policy shows. Without it a
  role given Edit and not browse would have a directory page that lists and edits nothing. No real
  role changes because of `0171`: Management holds both, and the 2IC holds both but reads name and
  phone only, through `volunteer_contacts`, because `sees_all_contacts()` is false for her.
  It is a second file because `0170` had already been applied to dev when this was found, and an
  applied file is never edited.
- **Inserting a carer on the spot** now makes the id in the app (`crypto.randomUUID()`), as `0151`
  did for medicines: staff keep `contacts.add`, but INSERT ... RETURNING needs the new row to pass
  the read policy, which staff no longer do.
- **Visible change:** the carer picker showed each carer's phone beside the name; it no longer does,
  for anyone. The item's own open question was whether staff should read the phone off the picker,
  and the brief's "nothing private" answers it. A release-notes line says so.
- **A side effect, not a widening:** the 2IC holds `placement.rehome` and `contacts.directory`, but
  her carer picker read the table she cannot read, so it was empty. It now lists names. She already
  read every contact's name and phone through `volunteer_contacts`.

## 2. `reset_*_rounds()`: execute revoked from authenticated

The three functions run as their owner and ask nothing about the caller. Their only callers are
the three `*_rounds_default_trigger` functions, owner-rights and owned by `postgres` (measured on
dev), so revoking execute from `authenticated` changes nothing in the app. `service_role` keeps it.

`check-medication-rounds.mjs` now calls each function under every login with a real id. The
probes run **before** the script replays `0137` and `0138`, because that replay re-grants execute
inside its own transaction: probed after it, the check would have passed whatever the database
held. That ordering is the lesson the item named (the script looked through the table and never
through the function), so it is written into the script's header.

## 3. Facility map tables: behind the app-access gate

`facility_maps_read` and `map_rooms_read` ask `private.has_app_access()` instead of `true`. Chosen
over `has_shelter_floor()`, which the item also offered, because `has_shelter_floor()` is true for
`public_viewer` (its role is not `volunteer`) and false for a volunteer, who opens `/enclosures`:
it would have closed the wrong door. `has_app_access()` is exactly the audience every other
internal table uses. It is not a scope function in `scripts/lib/scope-guard.mjs`'s sense and names
no role in the policy text, so `check-policy-role-names.mjs --final` stays GREEN. `rounds` is left
open, as the item says.

Dev has no `map_rooms` rows, so the probe proves `facility_maps` by rows (3 → 0 for the no-role,
archived and public-viewer logins) and `map_rooms` by its policy text only.

## 4 and 5: asked, not built

Both were marked Lutan's call in the brief and were raised with him on 2026-10-09 while this was
in review. Until he answers they stay open on the backlog with that note, unchanged:

- **4, the vet and project/maintenance photos.** The recommendation is that a clinic login should
  not see them: make the four `vet_*_attachments` policies and `vet_read_translations` allow-lists.
  This is not the 2026-10-07 "leave vets as they are" decision, which kept the vet's *clinical*
  access; project photos are the public site's pictures.
- **5, the vet listing every login with its role.** Either narrow `private.app_users` for a clinic
  login, or record that it is acceptable. `app_users` still names the role enum, so it is one of the
  views `perm-drop-enum` is waiting on; whatever is decided should be done with that stream, not
  half-converted here.
