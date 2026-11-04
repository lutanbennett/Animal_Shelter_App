-- consumer: src/lib/photos/approval.ts, src/app/photos/approve/ApproveQueue.tsx, src/app/api/residents/[id]/photos/route.ts, src/app/api/residents/[id]/videos/finish/route.ts, scripts/check-adoption-media-approval.mjs
--
-- adoption-media-approval (backlog #7v6d0). Lutan, 2026-11-03: a photo or video on an adoption update SHOULD be approved,
-- photos and videos alike. attachments_approval_stamp (0217, last restated in 0224) approved on save any file with an
-- adoption_update_id, so sharing an update published its media with no approval step. This restates 0224's body with that
-- one condition removed. Every other path is untouched: non-resident owners, the Medical folder, a script with no login
-- (auth.uid() is null), and a login that may publish or approve are still approved on save. The approval UPDATE branch is
-- unchanged. public_adoption_updates (0303) already requires approved_at, so an unapproved file is absent from it.
--
-- Re-runnable: create or replace.

create or replace function attachments_approval_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner_type <> 'resident'
       or lower(btrim(coalesce(new.sub_folder, ''))) = 'medical'
       or auth.uid() is null
       or coalesce((select can_publish_resident_photos()), false)
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
