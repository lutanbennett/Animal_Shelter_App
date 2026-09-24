-- Archive contacts instead of deleting them (customer request 2026-09-22).
--
-- A carer who no longer fosters, a volunteer who has moved on, a supplier
-- the shelter stopped buying from: today none of them can go. deleteContact
-- refuses while placement_history.carer_id points at them — rightly, that
-- history must survive — and deleting the rest loses notes and details
-- someone may need again. Archiving keeps the row and takes it out of the
-- default lists and pickers; clearing archived_at restores it.
--
-- This file is the schema half only. The app does not read these columns
-- yet; claude/contacts-archive follows once this is on main.
--
--   archived_at     set = archived. NULL = live, which every existing row
--                   reads as, so nothing is back-filled.
--   archived_by     the login that archived it. Same shape as the other
--                   *_by columns (uuid → auth.users), with `on delete set
--                   null` as 0056's reviewed_by has, so removing a login
--                   never blocks on, or deletes, a contact it archived.
--   archive_reason  optional free text ("moved to Chiang Rai").
--
-- The check constraint keeps the three in step: who and why only exist
-- while the contact is archived, so a restore must clear all three and a
-- half-restored row cannot be written.
--
-- Additive and nullable; no RLS change — the existing row policies on
-- contacts cover the new columns. Re-runnable: every statement is guarded.

alter table contacts add column if not exists archived_at timestamptz;
alter table contacts add column if not exists archived_by uuid references auth.users (id) on delete set null;
alter table contacts add column if not exists archive_reason text;

comment on column contacts.archived_at is
  'Set when the contact is archived: kept (with its history) but left out of default lists and pickers. Clear it, with archived_by and archive_reason, to restore.';
comment on column contacts.archived_by is
  'The login that archived the contact. Null when not archived, or when that login has since been deleted.';
comment on column contacts.archive_reason is
  'Optional reason given when archiving. Null when not archived.';

alter table contacts drop constraint if exists contacts_archive_fields_consistent;
alter table contacts add constraint contacts_archive_fields_consistent
  check (archived_at is not null or (archived_by is null and archive_reason is null));

notify pgrst, 'reload schema';
