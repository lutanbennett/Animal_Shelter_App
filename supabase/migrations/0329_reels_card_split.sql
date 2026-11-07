-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/reels/actions.ts, src/app/reels/page.tsx, src/app/reels/[id]/page.tsx, src/app/reels/[id]/ReelView.tsx, src/app/api/reels/start/route.ts, src/app/api/reels/finish/route.ts, src/app/api/residents/tag-search/route.ts
--
-- THE REELS HALF OF #i7qkz (Lutan, 2026-11-05: separate cards for adding memes and reels, allowing add and update, not delete or
-- publish). 0326 did the memes. Reels were left asking social.library, so a Reels card could not be held apart from a meme one.
-- They now have two activities of their own, the same shape as 0326:
--   social.reels         (level)  add a reel, change it, choose its residents, RECORD where it was posted. Read browses.
--   social.reels_manage  (yes/no) archive or restore a reel, delete a reel, take a post record off.
-- Publish means a path to the website and a reel has none (0322: Drive, never public, anon holds no grant), so DELETE and ARCHIVE
-- are what the add card lacks. Recording a post stays with the add card (his words: they can record where it was published).
--
-- reels and reel_residents had one for-all write policy, so a login at Edit could delete a reel row today; only the missing button
-- stopped it. Both become per command. reel_residents delete stays on social.reels because the change screen drops a resident link
-- when an edit removes a resident, which is changing a reel, not deleting one. social_shares: only the reel branch of each policy
-- moves; the attachment and meme branches are exactly as 0326 left them. The archive flag is an UPDATE a row policy cannot see, so a
-- BEFORE UPDATE trigger refuses a change to reels.archived without social.reels_manage (the 0326 memes_archive_guard shape).
--
-- CARDS (these rows equal src/lib/permissions/cards.ts cell for cell):
--   reel_library  social.reels edit + social.reels_manage + resident.who_and_where read   (everything the reels screens do)
--   reel_add      social.reels edit + resident.who_and_where read                         (add, change, record a post; no archive or delete)
--   reel_view     social.reels read                                                       (browse only; makes a Read-only login possible)
--
-- NO REGRESSION. Before this file the reels screens asked social.library, so whoever held a meme card could use reels. Each holder of
-- meme_library, meme_add or meme_view is given the matching reel card, so nobody loses the Reels screens. Lutan rebuilds the card
-- assignments himself later. Nothing is granted to Admin, which sits outside the card system. Additive and re-runnable.

create temp table pre_0329 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

insert into permission_activities (key, kind, area, sort)
values ('social.reels', 'level', 'management', 84),
       ('social.reels_manage', 'yesno', 'management', 85)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('reel_library', 'social.reels', 2),
       ('reel_library', 'social.reels_manage', 2),
       ('reel_library', 'resident.who_and_where', 1),
       ('reel_add', 'social.reels', 2),
       ('reel_add', 'resident.who_and_where', 1),
       ('reel_view', 'social.reels', 1)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select c.card, cf.feature_id from (values ('reel_library'), ('reel_add'), ('reel_view')) c(card)
  join card_features cf on cf.card = 'meme_library'
on conflict (card) do update set feature_id = excluded.feature_id;

insert into role_cards (role_id, card)
select distinct rc.role_id, m.reel
  from role_cards rc
  join (values ('meme_library', 'reel_library'), ('meme_add', 'reel_add'), ('meme_view', 'reel_view')) m(meme, reel) on m.meme = rc.card
on conflict do nothing;

-- reels: one policy per command
drop policy if exists reels_select_perm on reels;
drop policy if exists reels_write_perm on reels;
drop policy if exists reels_insert_perm on reels;
drop policy if exists reels_update_perm on reels;
drop policy if exists reels_delete_perm on reels;
create policy reels_select_perm on reels for select to authenticated
  using ((select has_permission('social.reels', 'read')));
create policy reels_insert_perm on reels for insert to authenticated
  with check ((select has_permission('social.reels')));
create policy reels_update_perm on reels for update to authenticated
  using ((select has_permission('social.reels')))
  with check ((select has_permission('social.reels')));
create policy reels_delete_perm on reels for delete to authenticated
  using ((select has_permission('social.reels_manage')));

-- reel_residents: one policy per command
drop policy if exists reel_residents_select_perm on reel_residents;
drop policy if exists reel_residents_write_perm on reel_residents;
drop policy if exists reel_residents_insert_perm on reel_residents;
drop policy if exists reel_residents_update_perm on reel_residents;
drop policy if exists reel_residents_delete_perm on reel_residents;
create policy reel_residents_select_perm on reel_residents for select to authenticated
  using ((select has_permission('social.reels', 'read')));
create policy reel_residents_insert_perm on reel_residents for insert to authenticated
  with check ((select has_permission('social.reels')));
create policy reel_residents_update_perm on reel_residents for update to authenticated
  using ((select has_permission('social.reels')))
  with check ((select has_permission('social.reels')));
create policy reel_residents_delete_perm on reel_residents for delete to authenticated
  using ((select has_permission('social.reels')));

-- social_shares: only the reel branch changes (memes as 0326 left them)
drop policy if exists social_shares_select_perm on social_shares;
drop policy if exists social_shares_insert_perm on social_shares;
drop policy if exists social_shares_update_perm on social_shares;
drop policy if exists social_shares_delete_perm on social_shares;

create policy social_shares_select_perm on social_shares for select to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('resident.record', 'read'))
      when 'meme' then (select has_permission('social.library', 'read'))
      when 'reel' then (select has_permission('social.reels', 'read'))
      else false
    end
  );

create policy social_shares_insert_perm on social_shares for insert to authenticated
  with check (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.reels'))
      else false
    end
  );

create policy social_shares_update_perm on social_shares for update to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.reels'))
      else false
    end
  )
  with check (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library'))
      when 'reel' then (select has_permission('social.reels'))
      else false
    end
  );

create policy social_shares_delete_perm on social_shares for delete to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library_manage'))
      when 'reel' then (select has_permission('social.reels_manage'))
      else false
    end
  );

-- the archive flag
create or replace function reels_archive_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.archived is distinct from old.archived
     and not coalesce((select has_permission('social.reels_manage')), false) then
    raise exception 'Archiving or restoring a reel needs the permission to manage the reels library' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function reels_archive_guard() from public, anon, authenticated;

drop trigger if exists reels_archive_guard on public.reels;
create trigger reels_archive_guard
  before update on public.reels
  for each row execute function reels_archive_guard();

do $report$
declare
  r record;
  lost text;
begin
  if exists (select 1 from public.card_grants where card in ('reel_add', 'reel_view') and activity = 'social.reels_manage') then
    raise exception '0329 an add or view reel card grants social.reels_manage, which it must never do';
  end if;
  if exists (select 1 from pg_policies where tablename in ('reels', 'reel_residents') and cmd = 'ALL') then
    raise exception '0329 a for-all policy is left on reels or reel_residents';
  end if;
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0329 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level >= p.level);
    if lost is not null then
      raise notice '0329 % | no longer: %', r.key, lost;
    end if;
  end loop;
end
$report$;

notify pgrst, 'reload schema';
