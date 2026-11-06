-- consumer: none
--
-- SCHEMA half of backlog item #8bz78, "A reels library". NOTHING IN src/ READS THESE TABLES YET; the app half adds the
-- real consumer header. See docs/decisions/2026-11-06-reels-schema.md.
--
-- WHAT IS HERE
--   reels            a short video on Drive: a description whose #tags name residents, a date taken.
--   reel_residents   which residents a reel features, written by the app from the #tags in the description.
--   social_shares    widened so owner_type may be 'reel'; guard, cleanup trigger and the four policies extended.
--   video_uploads    its resident_id was NOT NULL; a reel's upload has no resident, so it now carries owner_kind.
--
-- NEVER PUBLIC, copied exactly from 0223: RLS on, every policy to authenticated, anon holds no grant, no public view
-- selects from either table. Nothing here gives a reel a path to the website; that would go behind the Director's
-- approval (#7j2qf). Posting to Facebook from the app is #vkswg and stays on hold.
--
-- Same activity as memes (social.library): Read browses, Edit changes. #i7qkz will split it for memes and reels together.
--
-- Additive and re-runnable. To undo, in a new file: drop reel_residents and reels, the reel branch of the guard and
-- policies, the owner_kind column, and put the owner_type check back to ('attachment', 'meme').

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists reels (
  id            uuid primary key default gen_random_uuid(),
  drive_file_id text not null unique check (btrim(drive_file_id) <> ''),
  file_name     text,
  description   text not null default '',
  -- Free-word hashtags that did NOT match a resident (same cap and meaning as memes.tags). Residents live in reel_residents.
  tags          text[] not null default '{}' check (cardinality(tags) <= 30),
  duration_ms   integer check (duration_ms is null or duration_ms > 0),
  -- Typed by a person: nothing reads a capture date out of a file. The shelter's day, not UTC's.
  date_taken    date not null default shelter_today(),
  archived      boolean not null default false,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists reels_date_taken_idx on reels (date_taken desc);
create index if not exists reels_tags_idx on reels using gin (tags);

comment on table reels is
  'The shelter''s reels: short videos filed for posting to Facebook (0322). Video on Drive, never public. Readable with social.library at Read, written at Edit.';
comment on column reels.date_taken is 'Typed by a person; defaults to the shelter''s today.';

create table if not exists reel_residents (
  id          uuid primary key default gen_random_uuid(),
  reel_id     uuid not null references reels (id) on delete cascade,
  resident_id uuid not null references residents (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (reel_id, resident_id)
);

create index if not exists reel_residents_resident_idx on reel_residents (resident_id);

comment on table reel_residents is
  'Which residents a reel features (0322), written from the #tags in its description. Source of truth for who is in the reel; a deleted resident takes the link, not the reel.';

-- ---------------------------------------------------------------------------
-- 2. video_uploads can carry a reel's upload (a reel has no resident)
-- ---------------------------------------------------------------------------
alter table video_uploads alter column resident_id drop not null;
alter table video_uploads add column if not exists owner_kind text not null default 'resident';
alter table video_uploads drop constraint if exists video_uploads_owner_kind_check;
alter table video_uploads add constraint video_uploads_owner_kind_check check (
  owner_kind in ('resident', 'reel')
  and (owner_kind <> 'resident' or resident_id is not null)
);
comment on column video_uploads.owner_kind is 'resident (a resident video, resident_id set) or reel (0322, no resident).';

-- ---------------------------------------------------------------------------
-- 3. social_shares learns 'reel'
-- ---------------------------------------------------------------------------
alter table social_shares drop constraint if exists social_shares_owner_type_check;
alter table social_shares add constraint social_shares_owner_type_check
  check (owner_type in ('attachment', 'meme', 'reel'));

create or replace function social_shares_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_type = 'attachment' then
    if not exists (select 1 from attachments where id = new.owner_id and owner_type = 'resident') then
      raise exception 'A photo share must point at a resident''s photo';
    end if;
  elsif new.owner_type = 'meme' then
    if not exists (select 1 from memes where id = new.owner_id) then
      raise exception 'A meme share must point at a meme';
    end if;
  elsif new.owner_type = 'reel' then
    if not exists (select 1 from reels where id = new.owner_id) then
      raise exception 'A reel share must point at a reel';
    end if;
  end if;
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.recorded_by := auth.uid(); end if;
  else
    new.recorded_by := old.recorded_by;
    new.owner_type := old.owner_type;
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;

revoke execute on function social_shares_guard() from public, anon, authenticated;

create or replace function reels_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.created_by := auth.uid(); end if;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function reels_stamp() from public, anon, authenticated;

drop trigger if exists reels_stamp on reels;
create trigger reels_stamp
  before insert or update on reels
  for each row execute function reels_stamp();

drop trigger if exists reels_shares_cleanup on reels;
create trigger reels_shares_cleanup
  after delete on reels
  for each row execute function shares_cleanup('reel');

-- ---------------------------------------------------------------------------
-- 4. Audit
-- ---------------------------------------------------------------------------
drop trigger if exists audit_reels on reels;
create trigger audit_reels
  after insert or update or delete on reels
  for each row execute function record_audit();

drop trigger if exists audit_reel_residents on reel_residents;
create trigger audit_reel_residents
  after insert or update or delete on reel_residents
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 5. Who may read and write. All to authenticated; anon has no grant.
-- ---------------------------------------------------------------------------
alter table reels enable row level security;
alter table reel_residents enable row level security;

drop policy if exists reels_select_perm on reels;
drop policy if exists reels_write_perm on reels;
create policy reels_select_perm on reels for select to authenticated
  using ((select has_permission('social.library', 'read')));
create policy reels_write_perm on reels for all to authenticated
  using ((select has_permission('social.library')))
  with check ((select has_permission('social.library')));

drop policy if exists reel_residents_select_perm on reel_residents;
drop policy if exists reel_residents_write_perm on reel_residents;
create policy reel_residents_select_perm on reel_residents for select to authenticated
  using ((select has_permission('social.library', 'read')));
create policy reel_residents_write_perm on reel_residents for all to authenticated
  using ((select has_permission('social.library')))
  with check ((select has_permission('social.library')));

drop policy if exists social_shares_select_perm on social_shares;
drop policy if exists social_shares_insert_perm on social_shares;
drop policy if exists social_shares_update_perm on social_shares;
drop policy if exists social_shares_delete_perm on social_shares;

create policy social_shares_select_perm on social_shares for select to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('resident.record', 'read'))
      when 'meme' then (select has_permission('social.library', 'read'))
      when 'reel' then (select has_permission('social.library', 'read'))
      else false
    end
  );

create policy social_shares_insert_perm on social_shares for insert to authenticated
  with check (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.library'))
      else false
    end
  );

create policy social_shares_update_perm on social_shares for update to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.library'))
      else false
    end
  )
  with check (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.library'))
      else false
    end
  );

create policy social_shares_delete_perm on social_shares for delete to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.library'))
      else false
    end
  );

revoke all on reels from public, anon, authenticated;
grant select, insert, update, delete on reels to authenticated;
grant all on reels to service_role;

revoke all on reel_residents from public, anon, authenticated;
grant select, insert, update, delete on reel_residents to authenticated;
grant all on reel_residents to service_role;
