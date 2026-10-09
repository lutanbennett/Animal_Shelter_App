-- consumer: src/lib/contacts/visibility.ts, src/lib/contacts/carers.ts, src/lib/placements/rehome.ts, src/app/residents/[id]/rehome/return/page.tsx, src/lib/adoption-updates/queries.ts, src/lib/adoption-updates/options.ts, src/lib/shelter-friends/staff-drafts.ts, src/lib/archive/resident-record.ts, src/app/residents/[id]/deceased/undo/page.tsx
--
-- Three rights the API answered that no screen showed (docs/security/security-assessment-2026-10-09-dynamic.md;
-- docs/decisions/2026-10-09-close-the-over-grants.md). Each closes something a login could do only by sending a request
-- by hand with its own token.
--
--   1. contacts         staff read every contact's phone, email, address and notes off the table (C9, C10). The pickers
--                       and name embeds move to picker_contacts (id, name, type, archived_at), and the table's read
--                       policy asks contacts.browse, which is the cell the /contacts pages already ask (0155).
--   2. reset_*_rounds() any signed-in login, with no role, could put a prescription, diet or frequency back on its
--                       default rounds. Only the owner-rights triggers call them, so execute leaves authenticated.
--   3. facility_maps,   read by every signed-in login, including public_viewer, a login with no role and an archived
--      map_rooms        person. They now ask the app-access gate, as every other internal table does.
--
-- Order inside section 1 is as in 0151: this branch's app code reads the view first, the policy narrows last.
-- Written to be safely re-runnable. To undo: restore contacts_select_perm from 0147, grant execute on the three functions
-- back to authenticated (0137, 0138), restore the two read policies from 0142 and 0157 (using true), drop picker_contacts.

-- ---------------------------------------------------------------------------
-- 1. Carer contacts: a fixed-column view, then the table narrows to contacts.browse
-- ---------------------------------------------------------------------------
-- The view is what a picker or a name needs and nothing else. archived_at is there because the carer picker leaves an
-- archived carer out, rehome refuses one, and the placement history marks one: it is the contact's state, not personal
-- data. archive_reason is not (it is free text about a person). A new contacts column is private until it is added here.
--
-- Its audience is contacts.directory Read, the cell staff, Management and the 2IC hold for "may name a contact". It does
-- not ask sees_all_contacts(): there is nothing in it that scope narrows, and the 2IC already reads name and phone
-- through volunteer_contacts. vet_contacts (id, name, type) is the same shape but gated on the vet's role name and kept
-- for the vet; volunteer_contacts carries the phone. Neither could be widened to staff without handing them more.
create or replace view picker_contacts as
select c.id, c.name, c.type, c.archived_at
  from contacts c
 where (select has_permission('contacts.directory', 'read'));

comment on view picker_contacts is
  'What a picker or a name embed reads of a contact (0170): id, name, type, archived_at. No phone, email, address, LINE, notes or archive reason. Rows for a login holding contacts.directory Read. The table itself is read only with contacts.browse. A new contacts column is private until it is added here.';

revoke all on picker_contacts from anon, authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger on picker_contacts from authenticated, anon;
grant select on picker_contacts to authenticated, service_role;

notify pgrst, 'reload schema';

-- Last, as in 0151: staff's readers are on the view now. contacts.browse is Yes/No, so the default level answers it.
-- sees_all_contacts() stays: the 2IC holds contacts.browse and reads name and phone only, through volunteer_contacts.
-- Staff keep INSERT (contacts.add, 0147's policy, unchanged); the rehome form makes the new carer's id itself, because
-- INSERT ... RETURNING would need the row to pass this policy.
drop policy if exists contacts_select_perm on contacts;
create policy contacts_select_perm on contacts for select to authenticated
  using ((select has_permission('contacts.browse')) and (select sees_all_contacts()));

-- ---------------------------------------------------------------------------
-- 2. reset_prescription_rounds(), reset_frequency_rounds(), reset_diet_rounds()
-- ---------------------------------------------------------------------------
-- Owner-rights, and they ask nothing of the caller. Their only callers are the three *_rounds_default_trigger functions,
-- which are owner-rights too (postgres), so the trigger path does not need the caller to hold execute. No app code calls
-- them. service_role keeps execute for scripts.
revoke execute on function reset_prescription_rounds(uuid), reset_frequency_rounds(uuid), reset_diet_rounds(uuid)
  from public, anon, authenticated;
grant execute on function reset_prescription_rounds(uuid), reset_frequency_rounds(uuid), reset_diet_rounds(uuid)
  to service_role;
