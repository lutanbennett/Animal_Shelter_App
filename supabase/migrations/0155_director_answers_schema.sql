-- consumer: src/lib/permissions/routes.ts, src/app/contacts/page.tsx, src/app/contacts/[id]/page.tsx, src/app/residents/[id]/microchip/actions.ts, src/app/immunizations/new/page.tsx, src/app/immunizations/new/actions.ts, src/app/residents/[id]/page.tsx, src/app/residents/[id]/[section]/page.tsx, src/lib/archive/resident-record.ts
--
-- Four of the Director's answers to the 2026-10-07 decision brief that are schema, in one file
-- (docs/decisions/2026-10-07-director-answers-schema.md; CLAUDE.md: two streams that need schema share one PR).
-- Each section says which brief question it answers. Order matters only inside section 4, and there as in 0151: the readers
-- moved to the view first (this branch's app code), the policy narrows last.
--
--   1. q8  Management can record a microchip         role_permissions (management, resident.microchip), set_resident_microchip()
--   2. q6 + q7  carer contacts: Management and the 2IC
--                                                    new cell contacts.browse, the 2IC's scope, volunteer_contacts
--   3. q12 staff keep the Shelter Friend card, N3 goes
--                                                    new cell friends.view, shelter_friends_select_perm
--   4. q5  the 2IC records vaccinations and sees no price
--                                                    picker_immunization_types, immunization_types_select_perm
--
-- New activities start at None for every role but Admin (docs/roles-and-permissions.md §6 rule 8); the cells given below are
-- the answers themselves, not a widening. Written to be safely re-runnable. To undo: restore the 0116 / 0148 / 0147 / 0134
-- bodies named in each section, delete the cells and the two activities, drop the view.

-- ---------------------------------------------------------------------------
-- 1. (q8) Management can record a microchip
-- ---------------------------------------------------------------------------
-- The manual's Scanning a microchip topic is tagged management and the Director agreed it should be so: the handbook was
-- right and the system was wrong (finding B, question L6). The cell is the app's answer already (can(perms,
-- "resident.microchip") shows the form); the function still named admin, staff and vet, so a Management login that was
-- given the form would have been refused by the database. It now asks the cell, which also removes a role name from a
-- function body. The vet's clinic scope is not a cell and stays exactly as 0116 had it.
insert into role_permissions (role_id, activity, level)
select r.id, v.activity, v.level
  from roles r
  join (values ('management', 'resident.microchip', 2)) as v(rkey, activity, level) on v.rkey = r.key
on conflict (role_id, activity) do nothing;

create or replace function set_resident_microchip(
  p_resident_id uuid,
  p_number text,
  p_implanted_on date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role := current_user_role();
begin
  if not (select has_permission('resident.microchip')) then
    raise exception 'Not authorized to set a microchip.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_role = 'vet'
     and p_resident_id not in (select current_vet_resident_ids()) then
    raise exception 'Not authorized to set a microchip for this resident.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from residents where id = p_resident_id) then
    raise exception 'Resident not found.' using errcode = 'no_data_found';
  end if;

  if resident_is_deceased(p_resident_id) then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  update residents
     set microchip_number = p_number,
         microchip_implanted_on = p_implanted_on
   where id = p_resident_id;
end;
$$;

comment on function set_resident_microchip(uuid, text, date) is
  'Sets residents.microchip_number and microchip_implanted_on for one resident, and nothing else (0116, 0155). A login holding resident.microchip (admin, management, staff, vet by default); a vet only for a resident its clinic holds (current_vet_resident_ids). Refuses a deceased resident. Strips nothing: the 0113 check and unique index apply.';

revoke all on function set_resident_microchip(uuid, text, date) from public, anon;
grant execute on function set_resident_microchip(uuid, text, date) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. (q6 + q7) Carer contacts: Management everything, the 2IC name and phone, staff and volunteers nothing
-- ---------------------------------------------------------------------------
-- The Director chose option A of the contacts item (page level) and added the 2IC. contacts.directory cannot carry this: it is
-- also what the contacts policies ask (0147), and the carer pickers on intake and rehome read the table through staff's Read
-- of it, which must keep working. So the PAGES get their own Yes/No cell, held by Management (Admin is implicit) and the 2IC,
-- and /contacts and /contacts/[id] ask that instead (src/lib/permissions/routes.ts and the two pages).
--
-- THE RLS IS LEFT ALONE, on purpose, as the item's option (a) says. Consequence, stated here so it is not read as more than it
-- is: staff and volunteers can no longer BROWSE the directory, but staff's login can still read the contacts table by hand
-- (a request sent with their own token), exactly as C9 and C10 describe. The data-level fix is the item's option (c); it is a
-- follow-up on the backlog, not built here.
insert into permission_activities (key, kind, area, sort)
values ('contacts.browse', 'yesno', 'contacts', 57)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into role_permissions (role_id, activity, level)
select r.id, v.activity, v.level
  from roles r
  join (values ('management', 'contacts.browse', 2), ('second_in_command', 'contacts.browse', 2)) as v(rkey, activity, level)
    on v.rkey = r.key
on conflict (role_id, activity) do nothing;

-- The 2IC reads name and phone and no address (q6). 0143 gave her scope name_type (a vet's id, name, type), which carries no
-- phone; name_phone is the scope the pages already honour for it (volunteer_contacts).
update roles set scope_contacts = 'name_phone' where key = 'second_in_command';

-- volunteer_contacts (0126) is the narrow view: id, name, phone. 0134 revoked it from every session when the volunteer lost the
-- address book, and kept the view "for a role given that scope later". This is that role. Its rows were "a volunteer session
-- only" by role name; they are now "a login holding contacts.browse that does not read the whole address book"
-- (sees_all_contacts(), 0147), which is the 2IC and any custom role the Director gives the cell and the name-and-phone scope.
-- A real volunteer holds no cell and so reads no row, as since 0134. Management reads the table, so the view is empty for it.
create or replace view volunteer_contacts as
select id, name, phone
  from contacts
 where (select has_permission('contacts.browse'))
   and not (select sees_all_contacts());

comment on view volunteer_contacts is
  'The name-and-phone view of the address book: id, name, phone (0126, 0155). Rows for a login holding contacts.browse that does not read the whole address book (sees_all_contacts() is false): the 2IC. A new contacts column is private until it is added here.';

revoke all on volunteer_contacts from anon, authenticated, service_role;
grant select on volunteer_contacts to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. (q12) Staff keep the Shelter Friend card; known tightening N3 goes
-- ---------------------------------------------------------------------------
-- The Director: staff can see a Friend on the public website anyway, so hiding the card from staff in the app protects nothing.
-- A Read cell says so. 0147 kept staff's read by letting the policy's second half be "the full address-book read"; that
-- half goes, and the policy asks cells only: friends.view (Management and staff) or friends.manage (Management). N3 is
-- deleted from scripts/lib/permission-probes.mjs.
-- One difference, a tightening: a CUSTOM role with scope_contacts = full and contacts.directory Read used to read friends
-- through the second half. It now needs the cell. No such role exists on dev or production.
insert into permission_activities (key, kind, area, sort)
values ('friends.view', 'yesno', 'contacts', 58)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into role_permissions (role_id, activity, level)
select r.id, v.activity, v.level
  from roles r
  join (values ('management', 'friends.view', 2), ('staff', 'friends.view', 2)) as v(rkey, activity, level) on v.rkey = r.key
on conflict (role_id, activity) do nothing;

drop policy if exists shelter_friends_select_perm on shelter_friends;
create policy shelter_friends_select_perm on shelter_friends for select to authenticated
  using ((select has_permission('friends.view')) or (select has_permission('friends.manage')));

-- ---------------------------------------------------------------------------
-- 4. (q5) The 2IC records vaccinations and must not see what a vaccine costs
-- ---------------------------------------------------------------------------
-- The same recipe as 0151 (docs/decisions/2026-10-07-price-free-pickers.md), copied rather than reinvented. 0148 gave
-- immunization_types a select policy for medical.immunizations Read OR reference.types Read, so the 2IC's Edit on
-- medical.immunizations (the Director's draft) would have let her read `cost`. The app first (this branch): the vaccine
-- picker, the recording action and every embed read the view below. Then the table policy loses the medical cell.
--
--   picker_immunization_types   id, name, is_mandatory, interval_months    for a login holding medical.immunizations Read
--                                                                          or reference.types Read
--
-- The brief called the columns "id, name and dose"; the table has no dose. interval_months is the months between doses, which
-- the recording action reads to work out when the next one is due, and is_mandatory is what the form's compliance hints use.
-- Neither is a price. The audience is the old table audience, so every screen that showed a vaccine name still does (the
-- resident page's embeds, the archive).
create or replace view picker_immunization_types as
select i.id, i.name, i.is_mandatory, i.interval_months
  from immunization_types i
 where (select has_permission('medical.immunizations', 'read'))
    or (select has_permission('reference.types', 'read'));

comment on view picker_immunization_types is
  'What a form that picks a vaccine reads of one (0155): id, name, mandatory flag, months between doses. No cost. Rows for a login holding medical.immunizations Read or reference.types Read. A new immunization_types column is private until it is added here.';

revoke all on picker_immunization_types from anon, authenticated, service_role;
grant select on picker_immunization_types to authenticated, service_role;

notify pgrst, 'reload schema';

-- Last on purpose (the readers moved first): the table is read by reference.types, the cell that is meant to see a price
-- (Settings → the immunization types list). insert / update / delete are 0148's, unchanged. The vet's vet_rw_immunization_types
-- is untouched (C10's vet half), so the vet still reads cost.
drop policy if exists immunization_types_select_perm on immunization_types;
create policy immunization_types_select_perm on immunization_types for select to authenticated
  using ((select has_permission('reference.types', 'read')));
