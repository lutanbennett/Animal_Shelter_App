-- consumer: none
--
-- Sponsorship drives for sick residents, the SCHEMA half (backlog, "Sponsorship drives for sick residents", Lutan
-- 2026-10-09; priority and the display style added 2026-10-15). The public pages are the next stream and the staff
-- side the one after, so NOTHING in src/ reads these objects on the day this merges and nobody can see or create an
-- appeal yet. The consumers will be src/app/appeals/ (public) and the resident page / Management (staff).
--
-- WHAT IS HERE
--   appeals              one drive: the resident, a title, what is wrong, the treatment, what the cost covers, the
--                        target in baht, an optional deadline, status, outcome note, display style, social links.
--   appeal_photos        which of the resident's photos the appeal shows: one cover, any number more, each with a
--                        "graphic" flag so the page can blur it behind a warning.
--   donations.designation_appeal_id   the appeal a gift was made for (designation 'appeal', allowed since 0168).
--   public_appeals       what anon reads: published appeals only, named columns, the raised figure as a SUM.
--   public_appeal_photos what anon reads of the photos, Medical-folder files excluded.
--   activity appeal.run  "Run a fundraising appeal" (yes/no). Admin only for now; delegable in Settings.
--
-- DECISION 1, WHICH GIFTS COUNT TOWARDS "RAISED": only gifts designated to THIS appeal (designation 'appeal' with
-- designation_appeal_id set). Gifts designated to the resident are NOT counted, even while an appeal is live.
-- Why: a resident gift might be for food, or for an earlier, finished treatment; counting it would put money on the
-- page that a donor did not give for this. The figure must be one a donor can check against their own gift. The cost
-- is that gifts recorded against the resident BEFORE the appeal exists (Chao Guay 2) must be re-designated to the
-- appeal by staff once it is created; that is one edit per gift and the staff half should offer it. Raised is the sum
-- of donation_lines.amount, in baht; an in-kind line has no amount and counts for nothing.
--
-- DECISION 2, OVER-RAISING: the schema allows raised to exceed the target; there is no cap and no check. The page
-- must say where the extra goes (the shelter's choice, stated on the page); that wording is the public half's job.
--
-- DECISION 3, MEDICAL PHOTOS: an appeal may show only a resident's NON-Medical photos. Enforced twice: a trigger
-- refuses to attach a photo that is not an image of this appeal's own resident or is filed under Medical (0101's
-- test: lower(btrim(coalesce(sub_folder,''))) = 'medical'), and public_appeal_photos / public_appeals re-check at
-- read time, so a photo refiled to Medical LATER disappears from the public site at once. The alternative, an
-- explicit per-photo "show on this appeal" override for Medical photos, was considered and NOT built.
--
-- WHAT NEVER REACHES ANON: no donor name, contact, note or method (the view carries a SUM and one timestamp);
-- created_by / updated_by; a draft; any appeal for a resident who is not public-visible.
--
-- THAI: title, what_is_wrong, treatment_needed, cost_covers and outcome_note go through the translations queue
-- (0056), like a bio.
--
-- Additive and re-runnable. To undo, in a new file: drop the two views, appeal_photos, appeals (cascade), the column
-- donations.designation_appeal_id, the activity row, the translatable_fields rows and their translations rows, and
-- restore is_public_drive_file() from 0206.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- https only, at most ten. The app validates with src/lib/links/validate.ts; this is the last line.
create or replace function appeal_links_ok(p_links text[])
returns boolean
language sql
immutable
as $$
  select coalesce(cardinality(p_links), 0) <= 10
     and not exists (
       select 1 from unnest(coalesce(p_links, '{}'::text[])) as u
        where u is null or u !~* '^https://[^[:space:]]+$'
     );
$$;

revoke execute on function appeal_links_ok(text[]) from public, anon;
grant execute on function appeal_links_ok(text[]) to authenticated, service_role;

create table if not exists appeals (
  id               uuid primary key default gen_random_uuid(),
  resident_id      uuid not null references residents (id) on delete restrict,
  title            text not null check (btrim(title) <> ''),
  what_is_wrong    text,
  treatment_needed text,
  cost_covers      text,
  -- Baht.
  target_amount    numeric(12, 2) not null check (target_amount > 0),
  deadline         date,
  status           text not null default 'draft' check (status in ('draft', 'live', 'funded', 'closed')),
  outcome_note     text,
  display_style    text not null default 'bar' check (display_style in ('bar', 'thermometer', 'gauge')),
  social_links     text[] not null default '{}' check (appeal_links_ok(social_links)),
  published        boolean not null default false,
  published_at     timestamptz,
  closed_at        timestamptz,
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now(),
  -- A draft is never public; the two columns cannot disagree.
  constraint appeals_draft_not_published check (not (published and status = 'draft')),
  constraint appeals_closed_has_outcome check (status <> 'closed' or (outcome_note is not null and btrim(outcome_note) <> ''))
);

create index if not exists appeals_resident_idx on appeals (resident_id);
create index if not exists appeals_public_idx on appeals (status) where published;

comment on table appeals is
  'One sponsorship drive for a sick resident (0210). Anon reads public_appeals, never this table. Raised is computed from donations designated to the appeal, not stored.';
comment on column appeals.target_amount is 'Baht, numeric(12,2). Raised may exceed it; the public page states where the extra goes.';
comment on column appeals.status is 'draft | live | funded | closed. closed requires an outcome_note.';
comment on column appeals.display_style is 'bar | thermometer | gauge. The public list always draws the compact bar.';
comment on column appeals.social_links is 'https:// links to the shelter''s own posts about this appeal (Facebook, Instagram, LINE). Validated by src/lib/links/validate.ts and appeal_links_ok().';
comment on column appeals.published is 'Shown on the public site. Never true while status is draft.';

create table if not exists appeal_photos (
  id            uuid primary key default gen_random_uuid(),
  appeal_id     uuid not null references appeals (id) on delete cascade,
  attachment_id uuid not null references attachments (id) on delete cascade,
  position      smallint not null default 0 check (position >= 0),
  is_cover      boolean not null default false,
  -- Distressing: the public page blurs it behind a warning.
  is_graphic    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (appeal_id, attachment_id)
);

create index if not exists appeal_photos_appeal_idx on appeal_photos (appeal_id, position);
create unique index if not exists appeal_photos_one_cover on appeal_photos (appeal_id) where is_cover;

comment on table appeal_photos is
  'The resident photos an appeal shows (0210). Only non-Medical image files of the appeal''s own resident; see appeal_photos_guard and public_appeal_photos.';

alter table donations add column if not exists designation_appeal_id uuid references appeals (id) on delete restrict;
create index if not exists donations_appeal_idx on donations (designation_appeal_id) where designation_appeal_id is not null;

-- NOT VALID: old rows are not re-checked, but every new or changed row must be consistent.
do $$ begin
  alter table donations add constraint donations_appeal_designation
    check ((designation = 'appeal') = (designation_appeal_id is not null)) not valid;
exception when duplicate_object then null; end $$;

comment on column donations.designation_appeal_id is
  'The appeal this gift was made for (0210). Set exactly when designation is appeal. Only these gifts count towards an appeal''s raised figure.';

-- ---------------------------------------------------------------------------
-- 2. Guards: stamps, and the Medical rule at write time
-- ---------------------------------------------------------------------------

create or replace function appeals_stamp()
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
  if new.status = 'closed' and (tg_op = 'INSERT' or old.status <> 'closed') then
    new.closed_at := coalesce(new.closed_at, now());
  end if;
  return new;
end;
$$;

revoke execute on function appeals_stamp() from public, anon, authenticated;

drop trigger if exists appeals_stamp on appeals;
create trigger appeals_stamp
  before insert or update on appeals
  for each row execute function appeals_stamp();

-- Security definer: the caller holds appeal.run, which does not necessarily let them read attachments.
create or replace function appeal_photos_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resident uuid;
  v_att attachments;
begin
  select resident_id into v_resident from appeals where id = new.appeal_id;
  select * into v_att from attachments where id = new.attachment_id;
  if v_att.id is null or v_att.owner_type <> 'resident' or v_att.owner_id is distinct from v_resident then
    raise exception 'An appeal can only show photos of its own resident';
  end if;
  if lower(btrim(coalesce(v_att.sub_folder, ''))) = 'medical' then
    raise exception 'A photo filed under Medical cannot be shown on an appeal';
  end if;
  if v_att.file_name is null or v_att.file_name !~* '\.(jpe?g|png|webp|heic|heif|gif)$' then
    raise exception 'Only image files can be shown on an appeal';
  end if;
  return new;
end;
$$;

revoke execute on function appeal_photos_guard() from public, anon, authenticated;

drop trigger if exists appeal_photos_guard on appeal_photos;
create trigger appeal_photos_guard
  before insert or update of appeal_id, attachment_id on appeal_photos
  for each row execute function appeal_photos_guard();

drop trigger if exists audit_appeals on appeals;
create trigger audit_appeals
  after insert or update or delete on appeals
  for each row execute function record_audit();

drop trigger if exists audit_appeal_photos on appeal_photos;
create trigger audit_appeal_photos
  after insert or update or delete on appeal_photos
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 3. The activity, and who may read and write
-- ---------------------------------------------------------------------------

insert into permission_activities (key, kind, area, sort)
values ('appeal.run', 'yesno', 'management', 63)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- No role_permissions row: Admin holds every cell without one (section 6, rule 1), and the card set is fixed, so
-- Management cannot be given this from a card. Delegating it is a Settings change or the staff half's decision.

alter table appeals enable row level security;
alter table appeal_photos enable row level security;

drop policy if exists appeals_perm on appeals;
create policy appeals_perm on appeals for all to authenticated
  using ((select has_permission('appeal.run')))
  with check ((select has_permission('appeal.run')));

drop policy if exists appeal_photos_perm on appeal_photos;
create policy appeal_photos_perm on appeal_photos for all to authenticated
  using ((select has_permission('appeal.run')))
  with check ((select has_permission('appeal.run')));

revoke all on appeals from public, anon, authenticated;
grant select, insert, update, delete on appeals to authenticated;
grant all on appeals to service_role;

revoke all on appeal_photos from public, anon, authenticated;
grant select, insert, update, delete on appeal_photos to authenticated;
grant all on appeal_photos to service_role;

-- ---------------------------------------------------------------------------
-- 4. Thai through the translations queue
-- ---------------------------------------------------------------------------

insert into translatable_fields (table_name, column_name, tier) values
  ('appeals', 'title', 'reviewed'),
  ('appeals', 'what_is_wrong', 'reviewed'),
  ('appeals', 'treatment_needed', 'reviewed'),
  ('appeals', 'cost_covers', 'reviewed'),
  ('appeals', 'outcome_note', 'reviewed')
on conflict do nothing;

drop trigger if exists appeals_queue_translations on appeals;
create trigger appeals_queue_translations
  after insert or update on appeals
  for each row execute function queue_translations();
drop trigger if exists appeals_drop_translations on appeals;
create trigger appeals_drop_translations
  after delete on appeals
  for each row execute function drop_translations();

-- ---------------------------------------------------------------------------
-- 5. What anon reads
-- ---------------------------------------------------------------------------
-- Owner-run, so the WHERE clauses are the only thing between anon and a draft, a Medical photo or a donor.
-- private.* is schema-qualified (0082/0086: an unqualified name would bind to the gated copy).

create or replace view public_appeals as
select
  a.id,
  a.resident_id,
  r.name as resident_name,
  r.thai_name as resident_thai_name,
  r.species,
  a.title,
  a.what_is_wrong,
  a.treatment_needed,
  a.cost_covers,
  a.target_amount,
  coalesce((
    select sum(l.amount)
      from donations d
      join donation_lines l on l.donation_id = d.id
     where d.designation = 'appeal'
       and d.designation_appeal_id = a.id
  ), 0)::numeric(12, 2) as raised_amount,
  (select max(d.created_at) from donations d
    where d.designation = 'appeal' and d.designation_appeal_id = a.id) as raised_as_of,
  a.deadline,
  a.status,
  a.outcome_note,
  a.display_style,
  a.social_links,
  (select att.drive_file_id
     from appeal_photos p
     join attachments att on att.id = p.attachment_id
    where p.appeal_id = a.id and p.is_cover
      and att.owner_type = 'resident' and att.owner_id = a.resident_id
      and lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical'
      and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$') as cover_drive_file_id,
  coalesce((select p.is_graphic
     from appeal_photos p
    where p.appeal_id = a.id and p.is_cover), false) as cover_is_graphic,
  a.published_at,
  a.closed_at,
  private.approved_translations('appeals'::text, a.id) as translations
from appeals a
join residents r on r.id = a.resident_id
where a.published
  and a.status <> 'draft'
  and r.is_public_visible = true;

comment on view public_appeals is
  'Published appeals for the public site (0210). Owner-run. raised_amount is a SUM of gifts designated to the appeal: no donor, contact or note is ever selected.';

grant select on public_appeals to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeals from anon, authenticated;

create or replace view public_appeal_photos as
select
  p.id,
  p.appeal_id,
  att.drive_file_id,
  p.position,
  p.is_cover,
  p.is_graphic
from appeal_photos p
join appeals a on a.id = p.appeal_id
join residents r on r.id = a.resident_id
join attachments att on att.id = p.attachment_id
where a.published
  and a.status <> 'draft'
  and r.is_public_visible = true
  and att.owner_type = 'resident'
  and att.owner_id = a.resident_id
  and lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical'
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'
order by p.position, p.created_at;

comment on view public_appeal_photos is
  'Photos of published appeals (0210). Medical-folder files are excluded here as well as at write time, so a photo refiled to Medical leaves the site at once.';

grant select on public_appeal_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeal_photos from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. The photo proxy may serve an appeal's photos
-- ---------------------------------------------------------------------------
-- 0206's body with one more branch. Still invoker: it reads only the public views.
create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public_site_content where hero_drive_file_id = p_drive_file_id
      or donate_photo_drive_file_id = p_drive_file_id
      or foster_photo_drive_file_id = p_drive_file_id
      or volunteer_photo_drive_file_id = p_drive_file_id
      or about_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_projects where cover_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_profiles where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_recent_adoptions where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_cards where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_donation_channels where qr_drive_file_id = p_drive_file_id
    union all
    select 1 from public_appeal_photos where drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';
