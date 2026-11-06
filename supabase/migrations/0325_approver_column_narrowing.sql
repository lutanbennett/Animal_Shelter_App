-- consumer: src/app/photos/approve/actions.ts, src/app/photos/approve/ProjectPhotoQueue.tsx
--
-- NARROW WHAT AN APPROVER CAN WRITE (backlog #p3k9w). 0314 (events) and 0316 (projects) gave the approving card
-- (can_approve_photos(), i.e. photos.approve) a ROW-level update on attachments so it could set approved_at. A row-level
-- update is not a column-level one: the same grant let an approver change caption, sort_order, phase, file_name,
-- sub_folder, owner_id and the rest, and the captions are published text on the public website.
--
-- SHAPE: a BEFORE UPDATE trigger, the repo's own precedent for this (attachments_approval_stamp, 0224..0318, already
-- refuses an approval change without the card). Not column-level GRANTs: those are per role and the table is shared by every
-- owner type and every card. Not a WITH CHECK comparing old to new: a policy cannot see OLD. The policy is left exactly as
-- 0316 wrote it, so who may touch a row is unchanged; only WHAT they may change on it is narrowed.
--
-- RULE, for owner_type 'event' and 'project' only: a login that holds the owning card (events.run / projects.photos) may
-- change anything, as before. A login that reaches the row ONLY through photos.approve may change just the four approval
-- columns (approved_at, approved_by, private_only_at, private_only_by; `approval` is generated from them). Any other
-- changed column is refused. Compared as jsonb, so a column added later is protected without editing this file.
-- No session user (service role / migrations) is not a login and is untouched. Admin passes through has_permission().
--
-- Re-runnable: create or replace function, drop trigger if exists.

create or replace function attachments_approver_columns_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owned boolean;
begin
  if auth.uid() is null or old.owner_type::text not in ('event', 'project') then
    return new;
  end if;

  v_owned := case old.owner_type::text
    when 'event' then coalesce((select has_permission('events.run')), false)
    else coalesce((select has_permission('projects.photos')), false)
  end;
  if v_owned then
    return new;
  end if;

  if (to_jsonb(new) - 'approved_at' - 'approved_by' - 'private_only_at' - 'private_only_by' - 'approval')
     is distinct from
     (to_jsonb(old) - 'approved_at' - 'approved_by' - 'private_only_at' - 'private_only_by' - 'approval') then
    raise exception 'An approver may only change a photo''s approval, not its caption or other details';
  end if;
  return new;
end;
$$;
revoke execute on function attachments_approver_columns_guard() from public, anon, authenticated;

drop trigger if exists attachments_approver_columns_guard on public.attachments;
create trigger attachments_approver_columns_guard
  before update on public.attachments
  for each row execute function attachments_approver_columns_guard();

notify pgrst, 'reload schema';
