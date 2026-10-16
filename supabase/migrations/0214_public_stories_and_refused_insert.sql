-- consumer: scripts/check-public-views.mjs, src/lib/assistant/audit.ts
--
-- Two unrelated schema halves share this number only because a batch may carry
-- one migration. Neither reads the other.
--
-- ===========================================================================
-- Half A. Adoption success stories: the opt-in and public_adoption_updates.
-- ===========================================================================
-- Strangers on the internet read this view. An adopter agreed to share a photo
-- of their animal, not their surname, address, phone, email, or the note they
-- wrote to staff. So three NEW columns carry everything public, and the view
-- reads nothing else from adoption_updates:
--
--   share_publicly     the opt-in. NOT NULL DEFAULT false. Never backfilled:
--                      every existing row comes out of this file unpublishable.
--   public_story       the words the adopter agreed to publish, typed
--                      separately. `note` is written to staff and never goes
--                      public.
--   public_first_name  a first name, typed by hand, at most. Not read from
--                      contacts, so a surname can never leak through a join.
--
-- Column by column, adoption_updates: id (in: the key), resident_id (in: the
-- animal, itself gated by is_public_visible), received_on (OUT: ambiguous),
-- sender_contact_id (OUT: identifies a person), channel (OUT: internal),
-- note (OUT: written to staff), created_at/created_by (OUT: staff identity),
-- share_publicly (filter only), public_story (in), public_first_name (in).
-- attachments: drive_file_id only, never file_name or uploader.
--
-- A photo row per image of an opted-in update. Medical-folder files and
-- non-images are excluded here, as public_appeal_photos (0210) does. Deceased
-- animals are left out: a story about a death is not what the opt-in covered.
-- A column can be added later; a name that was public for a week cannot be
-- taken back.

alter table adoption_updates add column if not exists share_publicly boolean not null default false;
alter table adoption_updates add column if not exists public_story text;
alter table adoption_updates add column if not exists public_first_name text;

alter table adoption_updates drop constraint if exists adoption_updates_public_first_name_short;
alter table adoption_updates add constraint adoption_updates_public_first_name_short
  check (public_first_name is null or (char_length(btrim(public_first_name)) between 1 and 40
         and public_first_name !~ '[[:space:]]'));

comment on column adoption_updates.share_publicly is
  'Opt-in (0214). False unless a person ticked it after the adopter agreed. Never backfilled, never inferred.';
comment on column adoption_updates.public_story is
  'The words the adopter agreed to publish (0214). Separate from note, which is for staff and never public.';
comment on column adoption_updates.public_first_name is
  'First name only, typed by hand, one word (0214). Not read from contacts.';

create or replace view public_adoption_updates as
select
  u.id,
  u.resident_id,
  att.drive_file_id,
  u.public_story,
  u.public_first_name
from adoption_updates u
join residents r on r.id = u.resident_id
join attachments att on att.adoption_update_id = u.id
where u.share_publicly = true
  and r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) <> 'Deceased'
  and att.owner_type = 'resident'
  and lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical'
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'
order by u.received_on desc, att.uploaded_at;

comment on view public_adoption_updates is
  'Opted-in adoption updates for the public success-stories strip (0214): animal, photo, agreed words, first name. Nothing else.';

grant select on public_adoption_updates to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_adoption_updates from anon, authenticated;

-- ===========================================================================
-- Half B. A volunteer may insert only a 'refused' assistant_actions row, own.
-- ===========================================================================
-- 0150 asked assistant.record on the caller's own row. A volunteer holds
-- assistant.ask and not record, so a turned-away request left no audit row.
-- Insert now also allows: assistant.ask AND status = 'refused' AND own row.
-- Select is untouched (still record + own), so a volunteer cannot read any row,
-- not even their own. No other role gains anything: those holding record
-- already could insert. The client that writes the row is a later batch.

drop policy if exists assistant_actions_insert_perm on assistant_actions;
create policy assistant_actions_insert_perm on assistant_actions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (select has_permission('assistant.record'))
      or ((select has_permission('assistant.ask')) and status = 'refused')
    )
  );

notify pgrst, 'reload schema';
