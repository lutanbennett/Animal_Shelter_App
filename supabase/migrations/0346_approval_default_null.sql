-- consumer: src/app/text/approve/page.tsx, src/app/text/approve/actions.ts, scripts/check-photo-approval.mjs, scripts/check-adoption-media-approval.mjs, scripts/check-fundraising-events-schema.mjs
--
-- Backlog #7aev4, THIRD AND LAST HALF. docs/decisions/2026-11-09-text-approval-schema.md points 3, 4 and 6 are the specification.
--
-- 1. THE FLIP. text_approval now defaults to NULL (not reviewed) on the six tables that carry public text. A new record is hidden from the
--    website until someone holding text.approve reads it. ALTER ... SET DEFAULT changes the default only: it rewrites no row, so every
--    record that was public_ok stays public_ok and nothing leaves the site. (There is deliberately no UPDATE in this file.)
--    shelter_friends and shop_links keep public_ok: nothing reads their column (decision 2026-11-09, "Shelter Friends text and shop-link text need no flag").
--
-- 2. THE INSERT GUARD. 0345 guarded an UPDATE; an INSERT could not be guarded because the default was public_ok and looked like a value named
--    by the caller. With the default NULL, an INSERT that names public_ok or private_only is now refused unless the caller holds text.approve.
--    An INSERT that omits the column takes NULL and is unaffected. A caller with no auth.uid() (a migration, the service role) is not refused,
--    as in 0345. Admin passes inside has_permission(); no role is named.
--
-- 3. 0217's APPROVE-ON-SAVE IS REMOVED (specification point 6). attachments_approval_stamp() (last restated in 0318) used to approve a file on
--    insert when the session had no login, or the login could publish resident photos, or could approve photos. Those three clauses are gone: a
--    photo saved by anyone now waits in the photo queue. What is kept, because it was never about the website: a file whose owner is not a resident,
--    event or project image (blood tests, procedures ...), and a Medical-folder file. Script-written rows land blank and need the queue.
--    The UPDATE half is 0318's, unchanged.
--
-- Re-runnable. To undo: set the six defaults back to 'public_ok', restore 0345's text_approval_stamp() and 0318's attachments_approval_stamp().

alter table residents alter column text_approval set default null;
alter table adoption_updates alter column text_approval set default null;
alter table appeals alter column text_approval set default null;
alter table fundraising_events alter column text_approval set default null;
alter table project_folders alter column text_approval set default null;
alter table desexing_drives alter column text_approval set default null;

create or replace function text_approval_stamp()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_cols text[];
  v_col text;
  v_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    -- the INSERT guard: naming a state at all needs text.approve (omitting the column gives NULL and passes)
    if new.text_approval is not null and auth.uid() is not null
       and not coalesce((select has_permission('text.approve')), false) then
      raise exception 'You do not have permission to approve public text';
    end if;
    new.text_approval_by := case when new.text_approval is null then null else auth.uid() end;
    new.text_approval_at := case when new.text_approval is null then null else now() end;
    return new;
  end if;

  if new.text_approval is distinct from old.text_approval then
    if new.text_approval is not null and auth.uid() is not null
       and not coalesce((select has_permission('text.approve')), false) then
      raise exception 'You do not have permission to approve public text';
    end if;
    new.text_approval_by := case when new.text_approval is null then null else auth.uid() end;
    new.text_approval_at := case when new.text_approval is null then null else now() end;
    return new;
  end if;

  v_cols := case tg_table_name
    when 'residents' then array['bio','temperament_notes','past_story_notes','hook_line','ideal_home','good_with_dogs','good_with_cats','good_with_children','energy_level','breed_th','colour_th']
    when 'adoption_updates' then array['public_story','public_first_name']
    when 'appeals' then array['title','what_is_wrong','treatment_needed','cost_covers','outcome_note','social_links']
    when 'fundraising_events' then array['title','summary','description','location','social_links']
    when 'project_folders' then array['name','name_th','summary','location']
    when 'desexing_drives' then array['title','venue','venue_address','description','price_note','eligibility_note']
    else array[]::text[]
  end;
  foreach v_col in array v_cols loop
    if to_jsonb(new) -> v_col is distinct from to_jsonb(old) -> v_col then v_changed := true; exit; end if;
  end loop;

  if v_changed and old.text_approval is not null then
    new.text_approval := null;
    new.text_approval_by := null;
    new.text_approval_at := null;
  else
    new.text_approval_by := old.text_approval_by;
    new.text_approval_at := old.text_approval_at;
  end if;
  return new;
end $$;
revoke execute on function text_approval_stamp() from public, anon, authenticated;

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
    -- 0217's approve-on-save for a script, a publisher and an approver is gone (0346). Only files that are not website photos stay approved.
    if (new.owner_type::text not in ('resident', 'event')
        and not (new.owner_type::text = 'project' and coalesce(new.file_name, '') ~* '\.(jpe?g|png|webp|heic|heif|gif)$'))
       or lower(btrim(coalesce(new.sub_folder, ''))) = 'medical' then
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
      new.private_only_at := now();
      new.private_only_by := auth.uid();
      new.approved_at := null;
      new.approved_by := null;
    elsif new.approved_at is not null and old.approved_at is null then
      new.approved_at := now();
      new.approved_by := auth.uid();
      new.private_only_at := null;
      new.private_only_by := null;
    else
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
