-- A vet and a volunteer read less of the shelter's address book, and no
-- longer see every login's email (backlog DB-5 and DB-8; Lutan's decision of
-- 2026-10-02):
--
--   vet         id, name, type
--   volunteer   id, name, phone
--   staff and above   unchanged, the whole row
--
-- Thai PDPA is the reason, so the smaller column set is the point.
--
-- THIS SUPERSEDES 0105 AND 0108. Both recorded that vet_read_contacts was
-- deliberately left as it was ("whether a vet should read the address book at
-- all is its own question"). That question is now answered: a vet keeps a
-- minimal view rather than none, and neither earlier file was wrong for
-- leaving it open. It also settles the backlog item "Should a vet read the
-- shelter's address book at all?".
--
-- Why views and not the base table. vet_read_contacts and
-- volunteer_read_contacts (0001) were row policies on contacts, so a vet's or
-- a volunteer's session read every column — adopters' and carers' phone,
-- email, address, LINE, WhatsApp, Messenger and notes — straight from
-- /rest/v1/contacts. A policy cannot narrow columns, and a column grant is
-- per Postgres role, which is `authenticated` for every app role alike. So
-- the two policies go and each role gets a fixed-column view, 0122's pattern:
-- a base table granted with `select *` leaks every column added later with
-- nobody making a mistake; a view lists what is readable, and a new column is
-- private until it is added here.
--
--   vet_contacts        id, name, type        rows only for a vet
--   volunteer_contacts  id, name, phone       rows only for a volunteer
--
-- The id is the key a page links and joins on; it is not personal data. The
-- views are owner-rights (they have to read contacts the caller no longer
-- can) and gate on current_user_role(), so a session of any other role gets
-- no rows, and anon gets no grant.
--
-- check_carer_type (0001) read contacts as the caller. It runs on every
-- placement write, and a volunteer inserts ChangeEnclosure placements, so it
-- must not depend on the caller being able to read contacts. It becomes
-- security definer with a pinned search_path, and still only answers
-- "is this a Carer".
--
-- DB-8. app_users (0055, 0063, 0086) listed every login's email to every
-- role. private.app_users now returns null for `email` to a vet or a
-- volunteer; the column stays so the shape, and the public gate over it
-- (0086), do not change. display_name is not hidden: it is what a picker
-- shows.
--
-- Written to be safely re-runnable.

-- ---------------------------------------------------------------------------
-- 1. The two fixed-column views
-- ---------------------------------------------------------------------------

create or replace view vet_contacts as
select id, name, type
from contacts
where current_user_role() = 'vet';

create or replace view volunteer_contacts as
select id, name, phone
from contacts
where current_user_role() = 'volunteer';

comment on view vet_contacts is
  'A vet''s whole view of the address book: id, name, type (0126, backlog DB-5). Rows for a vet session only. A new contacts column is private to vets until it is added here.';
comment on view volunteer_contacts is
  'A volunteer''s whole view of the address book: id, name, phone (0126, backlog DB-5). Rows for a volunteer session only. A new contacts column is private to volunteers until it is added here.';

revoke all on vet_contacts, volunteer_contacts from anon, authenticated, service_role;
grant select on vet_contacts, volunteer_contacts to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The base-table policies go
-- ---------------------------------------------------------------------------

drop policy if exists vet_read_contacts on contacts;
drop policy if exists volunteer_read_contacts on contacts;

create or replace function check_carer_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.carer_id is not null then
    if not exists (select 1 from contacts where id = new.carer_id and type = 'Carer') then
      raise exception 'carer_id % does not reference a contact of type Carer', new.carer_id;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. app_users: no email for a vet or a volunteer (DB-8)
-- ---------------------------------------------------------------------------

-- Edited in `private`, where 0086 put it; public.app_users is the gate over
-- it and needs no change. Same columns and types, so create or replace holds.
create or replace view private.app_users as
select
  u.id,
  case when current_user_role() in ('vet', 'volunteer') then null else u.email end::varchar(255) as email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.role,
  r.archived_at
from auth.users u
join user_roles r on r.user_id = u.id
where current_user_role() is not null;

notify pgrst, 'reload schema';
