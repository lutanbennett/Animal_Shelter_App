-- Contacts follow-up (2026-09-21): a notes field.
--
-- What a supplier sells, a volunteer's availability, a carer's home
-- set-up — the things worth knowing about a contact that aren't a way of
-- reaching them, and were going unrecorded or into the address. Same gap
-- 0053 closed for vets. Shown on the contact hub under the details and
-- editable with the rest of the row on Management → Contacts.
--
-- Written to be safely re-runnable.

alter table contacts add column if not exists notes text;

comment on column contacts.notes is
  'What a supplier sells, a volunteer''s availability, a carer''s home set-up. Free text; shown on the contact hub.';

notify pgrst, 'reload schema';
