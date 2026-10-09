-- consumer: none
--
-- A correction to 0170, on the same branch, because 0170 was already applied to dev when it was found and an applied file
-- is never edited (docs/decisions/2026-10-09-close-the-over-grants.md).
--
-- 0170 let the contacts table be read only with contacts.browse. contacts.directory at EDIT is what /management/contacts asks
-- (src/lib/permissions/routes.ts) and what the update and delete policies ask (0147), and Postgres lets an UPDATE or DELETE
-- reach only rows the SELECT policy shows. So a role given Edit on the directory without the browse cell would have been
-- handed a page that lists nothing and edits nothing. No role is in that position today (Management holds both; the 2IC
-- holds both and reads name and phone through volunteer_contacts, because sees_all_contacts() is false for her), so this
-- changes nothing anyone can do now: it keeps the cell meaning what the role-permissions grid says it means.
--
-- What the levels mean after this file:
--   contacts.directory Read   names a contact: picker_contacts (id, name, type, archived_at). Staff.
--   contacts.directory Edit   reads and changes the address book. Management.
--   contacts.browse           reads the address book: the /contacts pages. Management and the 2IC.
-- sees_all_contacts() stays beside both, as in 0147.
--
-- Written to be safely re-runnable. To undo: re-create the policy as 0170 wrote it.
drop policy if exists contacts_select_perm on contacts;
create policy contacts_select_perm on contacts for select to authenticated
  using (
    ((select has_permission('contacts.browse')) or (select has_permission('contacts.directory')))
    and (select sees_all_contacts())
  );
