-- consumer: none (schema half: nothing reads these tables yet; the screens and the website are the next stream)
--
-- FUNDRAISING EVENTS (item #2zi2j, schema half). An event is ITS OWN THING with its own table (Lutan, 2026-11-04, asked
-- directly: its own table, a kind of campaign, or a kind of project). docs/decisions/2026-11-04-fundraising-events-schema.md
-- is the paper for this file.
--
-- WHAT IS HERE: fundraising_events, fundraising_event_photos, the activity events.run and its card run_fundraising_events
-- (given to NO role), the 'event' attachment owner type, and the approval stamp taught that an event photo waits.
--
-- WHAT IS DELIBERATELY NOT HERE, and each is the next stream's:
--   * record_attachment() still refuses owner type 'event' (its CASE falls to "else false"), so no event photo can be saved
--     until the app half teaches it events.run. Enum values added in a file cannot be USED in that file's transaction, which
--     is why the value is added here and used there.
--   * no public view. The website stream adds public_fundraising_events / public_fundraising_event_photos, and they must
--     filter on attachments.approved_at, as every public photo path does.
--
-- ENUM CAVEAT. 'event' is added below and not used in this file's transaction. attachments_approval_stamp() compares
-- owner_type::text = 'event' inside a plpgsql body, which is not parsed against the enum until it runs.

alter type attachment_owner_type add value if not exists 'event';

create table if not exists fundraising_events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (btrim(title) <> ''),
  summary           text,
  description       text,
  event_date        date not null,
  -- A multi-day event; null for a single day.
  end_date          date,
  location          text,
  status            text not null default 'planned' check (status in ('planned', 'held', 'cancelled')),
  -- Optional links, never ownership. An event may raise money for an appeal, or have a project folder of the day's photos,
  -- or be neither; deleting either leaves the event standing.
  appeal_id         uuid references appeals (id) on delete set null,
  project_folder_id uuid references project_folders (id) on delete set null,
  social_links      text[] not null default '{}' check (appeal_links_ok(social_links)),
  published         boolean not null default false,
  published_at      timestamptz,
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  constraint fundraising_events_dates check (end_date is null or end_date >= event_date),
  -- A cancelled event is never public, and the two columns cannot disagree.
  constraint fundraising_events_cancelled_not_published check (not (published and status = 'cancelled'))
);

create index if not exists fundraising_events_date_idx on fundraising_events (event_date desc);
create index if not exists fundraising_events_public_idx on fundraising_events (event_date desc) where published;
create index if not exists fundraising_events_appeal_idx on fundraising_events (appeal_id) where appeal_id is not null;
create index if not exists fundraising_events_project_idx on fundraising_events (project_folder_id) where project_folder_id is not null;

comment on table fundraising_events is
  'A fundraising event: a date, a place and a gallery, with no money target of its own (0312). Apart from appeals and projects on purpose; appeal_id and project_folder_id are optional links. Anon reads nothing here; the website stream adds the public views.';
comment on column fundraising_events.appeal_id is 'The appeal the event raised money for, when there is one. Money stays on the appeal and its designated donations; the event stores no amount.';
comment on column fundraising_events.project_folder_id is 'A project folder holding the day''s photos, when there is one. A link only: its photos are NOT the event''s gallery, which is fundraising_event_photos.';
comment on column fundraising_events.published is 'Shown on the public site once the website stream reads it. Never true while status is cancelled.';

create table if not exists fundraising_event_photos (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references fundraising_events (id) on delete cascade,
  attachment_id uuid not null references attachments (id) on delete cascade,
  position      smallint not null default 0 check (position >= 0),
  is_cover      boolean not null default false,
  -- A meme is a photo that is a meme. The staff meme library stays staff-only; a meme on an event is an uploaded copy.
  is_meme       boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (event_id, attachment_id)
);

create index if not exists fundraising_event_photos_event_idx on fundraising_event_photos (event_id, position);
create unique index if not exists fundraising_event_photos_one_cover on fundraising_event_photos (event_id) where is_cover;

comment on table fundraising_event_photos is
  'The gallery of an event (0312). Each row points at an attachments row with owner_type event and owner_id the event; the file is approved through the ordinary queue (photos.approve) before any public view shows it.';

create or replace function fundraising_events_stamp()
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
  if new.published and (tg_op = 'INSERT' or not old.published) then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;
revoke execute on function fundraising_events_stamp() from public, anon, authenticated;

drop trigger if exists fundraising_events_stamp on fundraising_events;
create trigger fundraising_events_stamp
  before insert or update on fundraising_events
  for each row execute function fundraising_events_stamp();

-- A gallery row may only point at an image attachment that belongs to its own event.
create or replace function fundraising_event_photos_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_att attachments;
begin
  select * into v_att from attachments where id = new.attachment_id;
  if v_att.id is null or v_att.owner_type::text <> 'event' or v_att.owner_id is distinct from new.event_id then
    raise exception 'An event can only show photos filed under that event';
  end if;
  if v_att.file_name is null or v_att.file_name !~* '\.(jpe?g|png|webp|heic|heif|gif)$' then
    raise exception 'Only image files can be shown on an event';
  end if;
  return new;
end;
$$;
revoke execute on function fundraising_event_photos_guard() from public, anon, authenticated;

drop trigger if exists fundraising_event_photos_guard on fundraising_event_photos;
create trigger fundraising_event_photos_guard
  before insert or update of event_id, attachment_id on fundraising_event_photos
  for each row execute function fundraising_event_photos_guard();

drop trigger if exists audit_fundraising_events on fundraising_events;
create trigger audit_fundraising_events
  after insert or update or delete on fundraising_events
  for each row execute function record_audit();

drop trigger if exists audit_fundraising_event_photos on fundraising_event_photos;
create trigger audit_fundraising_event_photos
  after insert or update or delete on fundraising_event_photos
  for each row execute function record_audit();

-- The Thai side, the same way appeals do it (0210).
insert into translatable_fields (table_name, column_name, tier) values
  ('fundraising_events', 'title', 'reviewed'),
  ('fundraising_events', 'summary', 'reviewed'),
  ('fundraising_events', 'description', 'reviewed'),
  ('fundraising_events', 'location', 'reviewed')
on conflict do nothing;

drop trigger if exists fundraising_events_queue_translations on fundraising_events;
create trigger fundraising_events_queue_translations
  after insert or update on fundraising_events
  for each row execute function queue_translations();
drop trigger if exists fundraising_events_drop_translations on fundraising_events;
create trigger fundraising_events_drop_translations
  after delete on fundraising_events
  for each row execute function drop_translations();

-- The activity and its card. A NEW activity, not a reused one: events.run is held by nothing else, so no existing card
-- (appeal.run, projects.publish) gives a stranger the right to write an event.
insert into permission_activities (key, kind, area, sort)
values ('events.run', 'yesno', 'management', 79)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('run_fundraising_events', 'events.run', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'run_fundraising_events', cf.feature_id from card_features cf where cf.card = 'run_appeals'
on conflict (card) do update set feature_id = excluded.feature_id;

alter table fundraising_events enable row level security;
alter table fundraising_event_photos enable row level security;

drop policy if exists fundraising_events_perm on fundraising_events;
create policy fundraising_events_perm on fundraising_events for all to authenticated
  using ((select has_permission('events.run')))
  with check ((select has_permission('events.run')));

drop policy if exists fundraising_event_photos_perm on fundraising_event_photos;
create policy fundraising_event_photos_perm on fundraising_event_photos for all to authenticated
  using ((select has_permission('events.run')))
  with check ((select has_permission('events.run')));

revoke all on fundraising_events from public, anon, authenticated;
grant select, insert, update, delete on fundraising_events to authenticated;
grant all on fundraising_events to service_role;

revoke all on fundraising_event_photos from public, anon, authenticated;
grant select, insert, update, delete on fundraising_event_photos to authenticated;
grant all on fundraising_event_photos to service_role;

-- An event photo waits for approval, exactly as a resident's does (0309). Only the INSERT branch changes: an 'event'
-- attachment is auto-approved for nobody except a session with no login or an approver (photos.approve). Everything else is
-- 0309 as it stood.
create or replace function attachments_approval_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if (new.owner_type::text <> 'resident' and new.owner_type::text <> 'event')
       or lower(btrim(coalesce(new.sub_folder, ''))) = 'medical'
       or auth.uid() is null
       or (new.owner_type::text = 'resident' and coalesce((select can_publish_resident_photos()), false))
       or coalesce((select can_approve_photos()), false) then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := null;
      new.approved_by := null;
    end if;
    return new;
  end if;

  if new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by then
    if auth.uid() is not null and not coalesce((select can_approve_photos()), false) then
      raise exception 'You do not have permission to approve a photo';
    end if;
    if new.approved_at is null then
      new.approved_by := null;
    elsif old.approved_at is null then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function attachments_approval_stamp() from public, anon, authenticated;

notify pgrst, 'reload schema';
