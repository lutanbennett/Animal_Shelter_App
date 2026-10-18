-- consumer: src/lib/permissions/catalogue.ts, src/components/PhotoGallery.tsx, src/app/memes, src/app/api/photos, scripts/check-public-views.mjs
--
-- SCHEMA half of two backlog items: "Mark a resident's photo as posted on social media" and "Meme library, stage 1".
-- NOTHING IN src/ READS THESE TABLES YET. When this merges there is no Posted badge, no filter, no /memes page, and
-- nobody can add a meme or record a share. Those are posted-on-social-app and meme-library-app.
-- See docs/decisions/2026-10-18-social-shares-schema.md, which both app halves are briefed from.
--
-- WHAT IS HERE
--   social_shares     ONE table for both items (the meme item asks for it in writing): owner_type 'attachment' (a
--                     resident's photo) or 'meme', owner_id, platform, shared_on, optional post_url, optional note,
--                     recorded_by. Several shares per owner, each kept.
--   memes             image on Drive, title, English caption, optional Thai caption, tags, archived flag.
--   meme_residents    which residents a meme features (none, one or several).
--   activity social.library   "The social media library" (level). Read to browse, Edit to add, change and record.
--
-- NEVER PUBLIC. A meme can be made from a medical or sad photo, with a joke that needs context. Row level security is
-- on for all three tables, every policy is `to authenticated`, anon holds no grant at all, and no public view selects
-- from them. scripts/check-public-views.mjs refuses anon every method on each table.
--
-- Additive and re-runnable. To undo, in a new file: drop the three tables, the two guard functions and their triggers
-- (including attachments_shares_cleanup), and the activity row.

-- ---------------------------------------------------------------------------
-- 1. The activity
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('social.library', 'level', 'management', 66)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;
-- No role_permissions row: Admin holds every cell without one, and a new activity starts at None for everyone else.

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists memes (
  id            uuid primary key default gen_random_uuid(),
  drive_file_id text not null unique check (btrim(drive_file_id) <> ''),
  file_name     text,
  title         text not null check (btrim(title) <> ''),
  caption_en    text,
  caption_th    text,
  tags          text[] not null default '{}' check (cardinality(tags) <= 30),
  archived      boolean not null default false,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists memes_created_idx on memes (created_at desc);
create index if not exists memes_tags_idx on memes using gin (tags);

comment on table memes is
  'The shelter''s memes, made elsewhere and filed here (0223). Image on Drive, never public: can use medical or sad photos. Readable with social.library at Read, written at Edit.';

create table if not exists meme_residents (
  id          uuid primary key default gen_random_uuid(),
  meme_id     uuid not null references memes (id) on delete cascade,
  resident_id uuid not null references residents (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (meme_id, resident_id)
);

create index if not exists meme_residents_resident_idx on meme_residents (resident_id);

comment on table meme_residents is
  'Which residents a meme features (0223). A join table so a resident''s page can list its memes by index and a deleted resident takes the link, not the meme.';

create table if not exists social_shares (
  id          uuid primary key default gen_random_uuid(),
  -- 'attachment' = a resident's photo (attachments.owner_type 'resident'); 'meme' = memes.id. No FK can point at two
  -- tables, so social_shares_guard checks the owner exists and attachments_shares_cleanup / memes_shares_cleanup remove
  -- a share when its owner goes.
  owner_type  text not null check (owner_type in ('attachment', 'meme')),
  owner_id    uuid not null,
  platform    text not null check (platform in ('facebook', 'instagram', 'line', 'tiktok', 'other')),
  shared_on   date not null default shelter_today(),
  post_url    text check (post_url is null or (post_url ~* '^https://[^[:space:]]+$' and length(post_url) <= 2000)),
  note        text check (note is null or length(note) <= 500),
  recorded_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists social_shares_owner_idx on social_shares (owner_type, owner_id, shared_on desc);

comment on table social_shares is
  'Where and when a resident photo or a meme was posted (0223). One row per post. Photo shares need photos.resident_manage, meme shares social.library at Edit. Never public.';
comment on column social_shares.shared_on is 'Defaults to today; the app shows it as the date posted.';

-- ---------------------------------------------------------------------------
-- 3. Guards
-- ---------------------------------------------------------------------------
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
  end if;
  if tg_op = 'INSERT' then
    -- Stamped by the database; a signed-in caller cannot name someone else. Scripts (no auth.uid()) may set it.
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

drop trigger if exists social_shares_guard on social_shares;
create trigger social_shares_guard
  before insert or update on social_shares
  for each row execute function social_shares_guard();

create or replace function memes_stamp()
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

revoke execute on function memes_stamp() from public, anon, authenticated;

drop trigger if exists memes_stamp on memes;
create trigger memes_stamp
  before insert or update on memes
  for each row execute function memes_stamp();

-- A share goes with its owner. security definer, so a photo deleted by a login that cannot touch shares still cleans up.
create or replace function shares_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from social_shares
   where owner_type = tg_argv[0] and owner_id = old.id;
  return old;
end;
$$;

revoke execute on function shares_cleanup() from public, anon, authenticated;

drop trigger if exists attachments_shares_cleanup on attachments;
create trigger attachments_shares_cleanup
  after delete on attachments
  for each row execute function shares_cleanup('attachment');

drop trigger if exists memes_shares_cleanup on memes;
create trigger memes_shares_cleanup
  after delete on memes
  for each row execute function shares_cleanup('meme');

-- ---------------------------------------------------------------------------
-- 4. Audit
-- ---------------------------------------------------------------------------
drop trigger if exists audit_memes on memes;
create trigger audit_memes
  after insert or update or delete on memes
  for each row execute function record_audit();

drop trigger if exists audit_meme_residents on meme_residents;
create trigger audit_meme_residents
  after insert or update or delete on meme_residents
  for each row execute function record_audit();

drop trigger if exists audit_social_shares on social_shares;
create trigger audit_social_shares
  after insert or update or delete on social_shares
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 5. Who may read and write. All `to authenticated`; anon has no grant.
-- ---------------------------------------------------------------------------
alter table memes enable row level security;
alter table meme_residents enable row level security;
alter table social_shares enable row level security;

drop policy if exists memes_select_perm on memes;
drop policy if exists memes_write_perm on memes;
create policy memes_select_perm on memes for select to authenticated
  using ((select has_permission('social.library', 'read')));
create policy memes_write_perm on memes for all to authenticated
  using ((select has_permission('social.library')))
  with check ((select has_permission('social.library')));

drop policy if exists meme_residents_select_perm on meme_residents;
drop policy if exists meme_residents_write_perm on meme_residents;
create policy meme_residents_select_perm on meme_residents for select to authenticated
  using ((select has_permission('social.library', 'read')));
create policy meme_residents_write_perm on meme_residents for all to authenticated
  using ((select has_permission('social.library')))
  with check ((select has_permission('social.library')));

-- A photo share is read as the photo is (resident.record at Read) and written by whoever may manage the resident's
-- photos (photos.resident_manage), the same pair attachments uses. A meme share follows the meme.
drop policy if exists social_shares_select_perm on social_shares;
drop policy if exists social_shares_insert_perm on social_shares;
drop policy if exists social_shares_update_perm on social_shares;
drop policy if exists social_shares_delete_perm on social_shares;

create policy social_shares_select_perm on social_shares for select to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('resident.record', 'read')) and (select sees_all_residents())
      when 'meme' then (select has_permission('social.library', 'read'))
      else false
    end
  );

create policy social_shares_insert_perm on social_shares for insert to authenticated
  with check (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'meme' then (select has_permission('social.library'))
      else false
    end
  );

create policy social_shares_update_perm on social_shares for update to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'meme' then (select has_permission('social.library'))
      else false
    end
  )
  with check (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'meme' then (select has_permission('social.library'))
      else false
    end
  );

create policy social_shares_delete_perm on social_shares for delete to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'meme' then (select has_permission('social.library'))
      else false
    end
  );

revoke all on memes from public, anon, authenticated;
grant select, insert, update, delete on memes to authenticated;
grant all on memes to service_role;

revoke all on meme_residents from public, anon, authenticated;
grant select, insert, update, delete on meme_residents to authenticated;
grant all on meme_residents to service_role;

revoke all on social_shares from public, anon, authenticated;
grant select, insert, update, delete on social_shares to authenticated;
grant all on social_shares to service_role;
