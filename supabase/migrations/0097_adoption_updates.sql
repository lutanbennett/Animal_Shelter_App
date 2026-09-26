-- Updates from adopters (backlog, "Record updates from adopters on an adopted
-- resident", Lutan 2026-09-26; schema half — the feature half adds the
-- Adoption updates section to an adopted resident's hub).
--
-- Adopters send news — a message, a few photos — and it belongs on the
-- animal's record. One adoption_updates row per piece of news, many per
-- resident, rather than notes on the Adopt placement: a placement has one
-- notes field and there can be years of updates.
--
-- The table.
--   resident_id       the animal. Not constrained to "currently adopted": a
--                     resident adopted, returned and adopted again keeps
--                     every update, and one returned to the shelter keeps the
--                     news from its time away. The hub decides where the
--                     section shows.
--   received_on       the date the news arrived — a date, not a timestamp,
--                     as nothing is summed across it.
--   sender_contact_id who sent it. The feature PRESELECTS the Adopt
--                     placement's carer_id (placement_history.carer_id, a
--                     contacts row, 0001) but it is stored here, not read
--                     through the placement, because the two can differ: a
--                     partner or a grown child sends the photos, and a
--                     placement's carer can be corrected later without
--                     rewriting who sent last year's news. Optional — an
--                     Adopt placement may have no carer (0009), and a visit
--                     may be reported by staff. ON DELETE SET NULL: contacts
--                     are archived, not deleted (0075).
--   channel           how it came in: 'line' | 'facebook' | 'email' | 'visit'.
--                     A text column with a CHECK, not an enum, deliberately.
--                     The list is short, will grow (a phone call, WhatsApp
--                     since 0092) and is shown through the dictionaries, not
--                     from the database. Growing an enum takes two migration
--                     files, because `alter type … add value` cannot share
--                     the runner's per-file transaction with anything that
--                     uses the value (PR #50); growing a CHECK is one
--                     drop-and-add in one file. The codes are lower-case
--                     keys, never display text; the dictionaries label them.
--   note              what they said. Optional: an update can be photos only.
--   created_at,       stamped by the trigger, like stock_receipts (0096).
--   created_by
--
-- The photo link — the point of the item. Lutan, 2026-09-26: a photo sent
-- by an adopter must say so wherever it appears (the update itself, the
-- resident's Photos tab, a future public "Happy endings" card): sent by the
-- adopter, on which date, via which channel. So the link lives ON THE PHOTO
-- RECORD, attachments.adoption_update_id, not in a join table one page
-- reads. Any query that has an attachment can reach its provenance in one
-- join, and "photos taken at the shelter" is simply
-- `adoption_update_id is null` — the two can be told apart and filtered.
--
-- Two guarantees on that column:
--   - a composite foreign key (adoption_update_id, owner_id) →
--     adoption_updates (id, resident_id), so a photo can only be tagged with
--     an update about the SAME resident it belongs to. MATCH SIMPLE: an
--     untagged photo (null adoption_update_id) is not checked at all, so
--     every existing row, and every project / maintenance attachment, is
--     unaffected.
--   - a CHECK that only 'resident' attachments are tagged.
--   ON DELETE NO ACTION: an update that still has photos cannot be deleted.
--   SET NULL would quietly turn the adopter's photos into what looks like
--   shelter photos — exactly the confusion the tag exists to prevent (and
--   on a composite key it would null owner_id too). The feature deletes or
--   untags the photos first, and says so.
--
-- record_attachment() gains p_adoption_update_id (default null), so a photo
-- is tagged in the same insert that records it: never an untagged adopter
-- photo, even for a moment. Body otherwise exactly 0082's — same roles,
-- same null-safe guard, same profile-photo rule. The old six-argument
-- function is dropped rather than left as an overload: every caller passes
-- named arguments, and PostgREST cannot choose between two functions that
-- both accept the same six names. The existing route keeps working
-- unchanged against the new one.
--
-- Who. Read by every signed-in role that reads residents (admin, management,
-- staff, vet, volunteer) — it is part of the animal's record. Written by
-- admin, management and staff: an update is a record entry about an
-- adopter, like a placement, which volunteers do not write (0001).
-- Volunteers may still add a photo to an existing update through
-- record_attachment, as they may add any resident photo. Nothing for anon:
-- a public "Happy endings" card is a follow-on that needs the adopter's
-- permission recorded first, and is not granted here.
--
-- Adopted residents are not locked (only the deceased are, 0026/0052), so
-- no lock trigger changes. Additive: a new table, a nullable column, and a
-- function re-created with one extra defaulted argument. Re-runnable
-- throughout. To undo, re-create 0082's record_attachment, drop the column
-- and the table in a new file.

create table if not exists adoption_updates (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id),
  received_on date not null,
  sender_contact_id uuid references contacts (id) on delete set null,
  channel text not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint adoption_updates_id_resident unique (id, resident_id)
);

alter table adoption_updates drop constraint if exists adoption_updates_channel;
alter table adoption_updates add constraint adoption_updates_channel
  check (channel in ('line', 'facebook', 'email', 'visit'));

create index if not exists adoption_updates_resident_idx
  on adoption_updates (resident_id, received_on);

comment on table adoption_updates is
  'News from an adopter about a resident: when, who sent it, how it came in, a note. Photos point here through attachments.adoption_update_id (0097).';
comment on column adoption_updates.sender_contact_id is
  'Who sent it. Preselected from the Adopt placement''s carer_id, stored here because the sender can differ and the placement can be corrected (0097).';
comment on column adoption_updates.channel is
  'How it came in: line, facebook, email or visit. Codes, labelled by the dictionaries; a CHECK rather than an enum so a new channel is one migration file (0097).';

create or replace function adoption_updates_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists adoption_updates_stamp on adoption_updates;
create trigger adoption_updates_stamp
  before insert or update on adoption_updates
  for each row execute function adoption_updates_stamp();

alter table adoption_updates enable row level security;

drop policy if exists resident_roles_read_adoption_updates on adoption_updates;
create policy resident_roles_read_adoption_updates on adoption_updates for select
  using (current_user_role() in ('admin', 'management', 'staff', 'vet', 'volunteer'));

drop policy if exists record_keepers_write_adoption_updates on adoption_updates;
create policy record_keepers_write_adoption_updates on adoption_updates for all
  using (current_user_role() in ('admin', 'management', 'staff'))
  with check (current_user_role() in ('admin', 'management', 'staff'));

revoke all on adoption_updates from public, anon, authenticated;
grant select, insert, update, delete on adoption_updates to authenticated;
grant all on adoption_updates to service_role;

-- The photo's provenance.
alter table attachments add column if not exists adoption_update_id uuid;

alter table attachments drop constraint if exists attachments_adoption_update_fk;
alter table attachments add constraint attachments_adoption_update_fk
  foreign key (adoption_update_id, owner_id)
  references adoption_updates (id, resident_id);

alter table attachments drop constraint if exists attachments_adoption_update_resident_only;
alter table attachments add constraint attachments_adoption_update_resident_only
  check (adoption_update_id is null or owner_type = 'resident');

create index if not exists attachments_adoption_update_idx
  on attachments (adoption_update_id) where adoption_update_id is not null;

comment on column attachments.adoption_update_id is
  'Set when the photo was sent by an adopter: the adoption_updates row it came with (same resident, enforced). Null = taken by the shelter (0097).';

-- record_attachment: 0082's body, plus the tag.
drop function if exists record_attachment(attachment_owner_type, uuid, text, text, text, date);

create or replace function record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null
)
returns table (attachment attachments, is_profile boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'vet', 'volunteer') then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- The foreign key would refuse this too; this says it in a sentence.
  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
  returning * into v_attachment;

  if p_owner_type = 'resident' then
    update residents
    set profile_photo_drive_file_id = p_drive_file_id
    where id = p_owner_id
      and profile_photo_drive_file_id is null;

    if found then
      v_is_profile := true;
    end if;
  end if;

  return query select v_attachment, v_is_profile;
end;
$$;

comment on function record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid) is
  'Records a Drive file as an attachment; a resident''s first photo becomes its profile photo. p_adoption_update_id tags a resident photo as sent by an adopter with that update (0097). Security definer; admin, management, staff, vet, volunteer.';

revoke all on function record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid) from public, anon;
grant execute on function record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
