-- consumer: scripts/check-public-views.mjs
-- (The app half, desexing-drives-page, reads and writes these next.)
--
-- Desexing drives: days when the public brings their own pets to be desexed, with sign-up on the site.
-- Lutan, 2026-10-20: the public SIGNS UP ON THE SITE, so this is a real public write path.
--
-- THE TABLES
--   desexing_drives         one row per drive. Staff-written (website.content), read by the public only through
--                           public_desexing_drives. Dates, prices and eligibility are DATA the shelter types in;
--                           nothing is seeded and the table starts empty.
--   desexing_drive_signups  one row per pet signed up. Holds a member of the public's own details (name, phone, email,
--                           pet). Never readable by anon.
--
-- THE PUBLIC WRITE PATH: anon has INSERT on desexing_drive_signups, on a named list of columns only, and NO SELECT.
-- A signed-out visitor can add a sign-up and can never read one back, their own included. (PostgREST must be asked
-- for `Prefer: return=minimal`, because RETURNING needs SELECT.) status, handled_* and created_at are not in anon's
-- column grant, so a visitor cannot mark themselves confirmed. Everything else is enforced by the BEFORE INSERT
-- trigger, which runs as its owner so the caller needs no read access to drives to be checked against them.
--
-- RATE LIMITING, WITH NO CAPTCHA (docs/decisions/2026-10-20-desexing-drives-schema.md): the database cannot see an
-- IP, so limits are on what it can see. For an anon insert the trigger refuses when
--   * the drive is not open, is cancelled, has passed, or its sign-ups have closed,
--   * the pet's species is not one the drive takes,
--   * the drive is full (capacity counts new + confirmed sign-ups),
--   * the same phone or email already has 3 live sign-ups for this drive,
--   * 60 sign-ups have been created across all drives in the last hour (a flood closes the form for a while
--     instead of filling the table; staff are unaffected).
-- Accepted abuse: someone patient and varied can still fill a drive with junk. Staff can cancel or delete a row, which
-- frees the place. That is judged better than turning real people away.
--
-- Additive and re-runnable. To undo: drop the view, then both tables (cascade removes triggers and policies), then
-- the three functions.

-- ---------------------------------------------------------------------------
-- 1. Drives
-- ---------------------------------------------------------------------------
create table if not exists desexing_drives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  drive_date date not null,
  starts_at time,
  ends_at time,
  venue text not null,
  venue_address text,
  species text[] not null default array['dog', 'cat'],
  capacity integer,
  signups_close_on date,
  price_note text,
  eligibility_note text,
  description text,
  status text not null default 'draft',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint desexing_drives_status_check check (status in ('draft', 'open', 'cancelled')),
  constraint desexing_drives_title_not_blank check (btrim(title) <> '' and btrim(venue) <> ''),
  constraint desexing_drives_species_check
    check (cardinality(species) >= 1 and species <@ array['dog', 'cat']),
  constraint desexing_drives_capacity_check check (capacity is null or capacity > 0),
  constraint desexing_drives_times_check check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint desexing_drives_close_check check (signups_close_on is null or signups_close_on <= drive_date)
);

create index if not exists desexing_drives_date_idx on desexing_drives (drive_date);

comment on table desexing_drives is
  'A desexing drive (0233). Staff-written with website.content; the public reads public_desexing_drives only. All dates, prices and eligibility are typed by the shelter.';
comment on column desexing_drives.status is
  'draft (hidden) | open (shown, takes sign-ups) | cancelled (shown as cancelled, takes none).';
comment on column desexing_drives.capacity is
  'Pets the drive takes; null = no limit. Counted over new + confirmed sign-ups.';
comment on column desexing_drives.price_note is 'Free text from the shelter. Never invented.';
comment on column desexing_drives.eligibility_note is 'Free text from the shelter. Never invented.';

alter table desexing_drives enable row level security;

drop policy if exists desexing_drives_select_perm on desexing_drives;
create policy desexing_drives_select_perm on desexing_drives for select to authenticated
  using ((select has_permission('website.content', 'read')));
drop policy if exists desexing_drives_insert_perm on desexing_drives;
create policy desexing_drives_insert_perm on desexing_drives for insert to authenticated
  with check ((select has_permission('website.content')));
drop policy if exists desexing_drives_update_perm on desexing_drives;
create policy desexing_drives_update_perm on desexing_drives for update to authenticated
  using ((select has_permission('website.content')))
  with check ((select has_permission('website.content')));
drop policy if exists desexing_drives_delete_perm on desexing_drives;
create policy desexing_drives_delete_perm on desexing_drives for delete to authenticated
  using ((select has_permission('website.content')));

revoke all on desexing_drives from anon, authenticated, service_role;
grant select, insert, update, delete on desexing_drives to authenticated, service_role;

create or replace function desexing_drives_stamp()
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
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function desexing_drives_stamp() from public, anon, authenticated;

drop trigger if exists desexing_drives_stamp on desexing_drives;
create trigger desexing_drives_stamp
  before insert or update on desexing_drives
  for each row execute function desexing_drives_stamp();

drop trigger if exists audit_desexing_drives on desexing_drives;
create trigger audit_desexing_drives
  after insert or update or delete on desexing_drives
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 2. Sign-ups (personal data of the public: never readable by anon)
-- ---------------------------------------------------------------------------
create table if not exists desexing_drive_signups (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references desexing_drives (id) on delete cascade,
  owner_name text not null,
  owner_phone text,
  owner_email text,
  pet_name text not null,
  pet_species text not null,
  pet_sex text not null default 'unknown',
  pet_age_note text,
  notes text,
  status text not null default 'new',
  handled_by uuid references auth.users (id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint desexing_signups_species_check check (pet_species in ('dog', 'cat')),
  constraint desexing_signups_sex_check check (pet_sex in ('male', 'female', 'unknown')),
  constraint desexing_signups_status_check check (status in ('new', 'confirmed', 'cancelled', 'attended', 'no_show')),
  constraint desexing_signups_contact_check
    check (nullif(btrim(coalesce(owner_phone, '')), '') is not null
        or nullif(btrim(coalesce(owner_email, '')), '') is not null),
  constraint desexing_signups_lengths_check
    check (char_length(btrim(owner_name)) between 1 and 120
       and char_length(btrim(pet_name)) between 1 and 80
       and char_length(coalesce(owner_phone, '')) <= 40
       and char_length(coalesce(owner_email, '')) <= 200
       and char_length(coalesce(pet_age_note, '')) <= 80
       and char_length(coalesce(notes, '')) <= 1000)
);

create index if not exists desexing_signups_drive_idx on desexing_drive_signups (drive_id, created_at);
create index if not exists desexing_signups_created_idx on desexing_drive_signups (created_at);

comment on table desexing_drive_signups is
  'A pet signed up to a desexing drive (0233). Holds a member of the public''s own name and contact. anon may INSERT (named columns) and may never SELECT; staff read with website.content.';

alter table desexing_drive_signups enable row level security;

drop policy if exists desexing_signups_anon_insert on desexing_drive_signups;
create policy desexing_signups_anon_insert on desexing_drive_signups for insert to anon
  with check (status = 'new');
drop policy if exists desexing_signups_select_perm on desexing_drive_signups;
create policy desexing_signups_select_perm on desexing_drive_signups for select to authenticated
  using ((select has_permission('website.content', 'read')));
drop policy if exists desexing_signups_insert_perm on desexing_drive_signups;
create policy desexing_signups_insert_perm on desexing_drive_signups for insert to authenticated
  with check ((select has_permission('website.content')));
drop policy if exists desexing_signups_update_perm on desexing_drive_signups;
create policy desexing_signups_update_perm on desexing_drive_signups for update to authenticated
  using ((select has_permission('website.content')))
  with check ((select has_permission('website.content')));
drop policy if exists desexing_signups_delete_perm on desexing_drive_signups;
create policy desexing_signups_delete_perm on desexing_drive_signups for delete to authenticated
  using ((select has_permission('website.content')));

revoke all on desexing_drive_signups from anon, authenticated, service_role;
grant select, insert, update, delete on desexing_drive_signups to authenticated, service_role;
-- The visitor chooses only these. status, handled_* and created_at are not theirs to set.
grant insert (drive_id, owner_name, owner_phone, owner_email, pet_name, pet_species, pet_sex, pet_age_note, notes)
  on desexing_drive_signups to anon;

-- ---------------------------------------------------------------------------
-- 3. The gate on every sign-up
-- ---------------------------------------------------------------------------
create or replace function desexing_signups_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d desexing_drives%rowtype;
  contact_n integer;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.drive_id := old.drive_id;
    new.created_at := old.created_at;
    if new.status is distinct from old.status then
      new.handled_by := auth.uid();
      new.handled_at := now();
    end if;
  end if;

  -- Limits apply to the public only; staff entering a sign-up by hand may go over capacity.
  if tg_op = 'INSERT' and auth.role() = 'anon' then
    new.status := 'new';
    new.handled_by := null;
    new.handled_at := null;

    -- Lock the drive so two simultaneous sign-ups cannot both take the last place.
    select * into d from desexing_drives where id = new.drive_id for update;
    if not found or d.status <> 'open' or d.drive_date < shelter_today()
       or (d.signups_close_on is not null and d.signups_close_on < shelter_today()) then
      raise exception 'desexing_drive_not_open' using errcode = 'P0001';
    end if;
    if not (new.pet_species = any (d.species)) then
      raise exception 'desexing_drive_species_not_taken' using errcode = 'P0001';
    end if;
    if d.capacity is not null and
       (select count(*) from desexing_drive_signups s
         where s.drive_id = d.id and s.status in ('new', 'confirmed')) >= d.capacity then
      raise exception 'desexing_drive_full' using errcode = 'P0001';
    end if;

    select count(*) into contact_n from desexing_drive_signups s
     where s.drive_id = d.id and s.status in ('new', 'confirmed')
       and ((nullif(btrim(new.owner_phone), '') is not null
             and regexp_replace(s.owner_phone, '[^0-9+]', '', 'g') = regexp_replace(new.owner_phone, '[^0-9+]', '', 'g'))
         or (nullif(btrim(new.owner_email), '') is not null
             and lower(btrim(s.owner_email)) = lower(btrim(new.owner_email))));
    if contact_n >= 3 then
      raise exception 'desexing_signup_too_many_for_contact' using errcode = 'P0001';
    end if;

    if (select count(*) from desexing_drive_signups s
         where s.created_at > now() - interval '1 hour') >= 60 then
      raise exception 'desexing_signup_rate_limited' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function desexing_signups_gate() from public, anon, authenticated;

drop trigger if exists desexing_signups_gate on desexing_drive_signups;
create trigger desexing_signups_gate
  before insert or update on desexing_drive_signups
  for each row execute function desexing_signups_gate();

drop trigger if exists audit_desexing_drive_signups on desexing_drive_signups;
create trigger audit_desexing_drive_signups
  after insert or update or delete on desexing_drive_signups
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 4. What anon reads: the drives, never the people
-- ---------------------------------------------------------------------------
-- Owner-run, so the WHERE clause is the only thing keeping a draft from anon. A past drive drops off the day after.
-- spots_left and accepting_signups are counts only; no sign-up column is selected.
create or replace view public_desexing_drives as
select d.id,
       d.title,
       d.drive_date,
       d.starts_at,
       d.ends_at,
       d.venue,
       d.venue_address,
       d.species,
       d.capacity,
       d.signups_close_on,
       d.price_note,
       d.eligibility_note,
       d.description,
       d.status = 'cancelled' as is_cancelled,
       case when d.capacity is null then null
            else greatest(d.capacity - (select count(*) from desexing_drive_signups s
                                         where s.drive_id = d.id and s.status in ('new', 'confirmed')), 0)
       end as spots_left,
       (d.status = 'open'
        and (d.signups_close_on is null or d.signups_close_on >= shelter_today())
        and (d.capacity is null or d.capacity > (select count(*) from desexing_drive_signups s
                                                  where s.drive_id = d.id and s.status in ('new', 'confirmed')))
       ) as accepting_signups
  from desexing_drives d
 where d.status in ('open', 'cancelled')
   and d.drive_date >= shelter_today()
 order by d.drive_date, d.starts_at;

comment on view public_desexing_drives is
  'Open and cancelled upcoming desexing drives for the public page (0233): the drive and a count of places left, never a sign-up.';

grant select on public_desexing_drives to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_desexing_drives from anon, authenticated;

notify pgrst, 'reload schema';
