-- consumer: none
--
-- SCHEMA half of backlog #7aev4: the THIRD approval answer. Until now attachments.approved_at gave two states,
-- NULL = waiting and a timestamp = approved, so "looked at and refused" was indistinguishable from "never opened"
-- and a refused photo came round the queue for ever. This adds "Private only" and a single three-valued column.
--
--   public_ok     approved_at is not null   (exactly the rows every public view already admits)
--   private_only  private_only_at is not null  (reviewed, refused; never on any public path)
--   NULL          neither                     (not reviewed)
--
-- DESIGN: approved_at KEEPS ITS MEANING (= Public ok), so every public view, is_public_drive_file(), the queue and
-- the existing app are untouched and nothing that is public today can leave the site. The back-fill is therefore
-- the identity: every row approved today IS Public ok and nothing becomes blank. A Private only photo has
-- approved_at null, so no view can show it. `approval` is generated from the two timestamps and cannot disagree.
--
-- NOT IN THIS FILE, on purpose: removing 0217's approve-on-save, and the ready_for_adoption -> is_public_visible
-- link. Both change what ships live and need the production counts in front of Lutan first (see the PR body).
--
-- Additive and re-runnable. To undo: restore 0316's attachments_approval_stamp(), drop the constraint, the
-- generated column and the two columns.

alter table public.attachments
  add column if not exists private_only_at timestamptz,
  add column if not exists private_only_by uuid references auth.users(id) on delete set null;

alter table public.attachments drop constraint if exists attachments_one_approval_answer;
alter table public.attachments
  add constraint attachments_one_approval_answer check (approved_at is null or private_only_at is null);

alter table public.attachments
  add column if not exists approval text
  generated always as (
    case when approved_at is not null then 'public_ok'
         when private_only_at is not null then 'private_only'
    end
  ) stored;

alter table public.attachments drop constraint if exists attachments_approval_values;
alter table public.attachments
  add constraint attachments_approval_values check (approval is null or approval in ('public_ok', 'private_only'));

comment on column public.attachments.approval is
  'Three-state review answer (0318): public_ok, private_only, or NULL = not reviewed. Generated from approved_at / private_only_at.';

-- The stamp: 0316's body, with Private only added. Insert behaviour is unchanged except that a caller can never
-- pre-set Private only. On update, a change to either answer needs can_approve_photos(), the database stamps who
-- and when, and the two answers exclude each other (choosing one clears the other).
create or replace function attachments_approval_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.private_only_at := null;
    new.private_only_by := null;
    if (new.owner_type::text not in ('resident', 'event')
        and not (new.owner_type::text = 'project' and coalesce(new.file_name, '') ~* '\.(jpe?g|png|webp|heic|heif|gif)$'))
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

  if new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by
     or new.private_only_at is distinct from old.private_only_at or new.private_only_by is distinct from old.private_only_by then
    if auth.uid() is not null and not coalesce((select can_approve_photos()), false) then
      raise exception 'You do not have permission to approve a photo';
    end if;

    if new.approved_at is not null and new.private_only_at is not null then
      raise exception 'A photo is either Public ok or Private only, not both';
    end if;

    if new.private_only_at is not null and old.private_only_at is null then
      -- newly refused: stamp it, and it is no longer approved
      new.private_only_at := now();
      new.private_only_by := auth.uid();
      new.approved_at := null;
      new.approved_by := null;
    elsif new.approved_at is not null and old.approved_at is null then
      -- newly approved: stamp it, and it is no longer refused
      new.approved_at := now();
      new.approved_by := auth.uid();
      new.private_only_at := null;
      new.private_only_by := null;
    else
      -- already in that state (timestamps are not rewritable) or being cleared back to not reviewed
      if new.approved_at is null then new.approved_by := null;
      else new.approved_at := old.approved_at; new.approved_by := old.approved_by; end if;
      if new.private_only_at is null then new.private_only_by := null;
      else new.private_only_at := old.private_only_at; new.private_only_by := old.private_only_by; end if;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function attachments_approval_stamp() from public, anon, authenticated;

notify pgrst, 'reload schema';
