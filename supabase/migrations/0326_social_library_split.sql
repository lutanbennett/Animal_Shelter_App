-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/app/memes/actions.ts, src/app/memes/[id]/page.tsx, src/app/memes/[id]/MemeView.tsx
--
-- SPLIT social.library FOR MEMES (backlog #i7qkz; Lutan, 2026-11-05: "No cards for adding Meme's and Reels ... should allow add
-- and update permissions, not delete or publish permissions"). The catalogue, the cards, the actions and this file land together
-- because check-cards-count and check-card-grants fail when a card is present in one place and absent from the other.
--
-- THE SPLIT. social.library (level) stays the ADD-AND-CHANGE activity: add a meme, change it, choose its residents, record where
-- it was posted. A new yes/no activity, social.library_manage, is the STRICTER one: archive or restore a meme, delete a meme, and
-- take a post record off. "Publish" means a path to the website and a meme has none (0223: anon holds no grant, no public view),
-- so DELETE is the only thing taken out. The app never deletes a meme, but memes_write_perm was for all, so a login at Edit could
-- delete a meme row today; only the missing button stopped it. That is the hole this closes.
--
-- RECORDING A POST STAYS WITH THE ADD CARD (Lutan: "they can record where it was published"). social_shares already has one policy
-- per command (0223/0322); insert and update for a meme stay on social.library. Only the meme branch of the DELETE policy moves to
-- social.library_manage, because removing a share record is a delete. The photo and reel branches are untouched: the Reels half
-- of the item is not built here and its screens still ask social.library.
--
-- THE ARCHIVE FLAG. Archiving is an UPDATE of memes.archived, and a row policy cannot see which column changed, so a BEFORE UPDATE
-- trigger (the 0325 shape) refuses a change to archived unless the login holds social.library_manage. No session user (service role,
-- migrations) is untouched. Admin passes through has_permission().
--
-- meme_residents: insert, update and delete stay on social.library. The change screen removes a resident link when an edit drops
-- a resident, which is changing a meme, not deleting one. Split per command so the intent is readable.
--
-- NO REGRESSION: the meme_library card gains social.library_manage, so everyone holding it keeps archive and remove. Two new cards:
-- meme_add (social.library edit and resident.who_and_where read) and meme_view (social.library read only). No role is given either.
-- Nothing is granted to Admin. Additive and re-runnable.

insert into permission_activities (key, kind, area, sort)
values ('social.library_manage', 'yesno', 'management', 83)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('meme_library', 'social.library_manage', 2),
       ('meme_add', 'social.library', 2),
       ('meme_add', 'resident.who_and_where', 1),
       ('meme_view', 'social.library', 1)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select c.card, cf.feature_id from (values ('meme_add'), ('meme_view')) c(card)
  join card_features cf on cf.card = 'meme_library'
on conflict (card) do update set feature_id = excluded.feature_id;

-- memes: one policy per command
drop policy if exists memes_write_perm on memes;
drop policy if exists memes_insert_perm on memes;
drop policy if exists memes_update_perm on memes;
drop policy if exists memes_delete_perm on memes;
create policy memes_insert_perm on memes for insert to authenticated
  with check ((select has_permission('social.library')));
create policy memes_update_perm on memes for update to authenticated
  using ((select has_permission('social.library')))
  with check ((select has_permission('social.library')));
create policy memes_delete_perm on memes for delete to authenticated
  using ((select has_permission('social.library_manage')));

-- meme_residents: one policy per command
drop policy if exists meme_residents_write_perm on meme_residents;
drop policy if exists meme_residents_insert_perm on meme_residents;
drop policy if exists meme_residents_update_perm on meme_residents;
drop policy if exists meme_residents_delete_perm on meme_residents;
create policy meme_residents_insert_perm on meme_residents for insert to authenticated
  with check ((select has_permission('social.library')));
create policy meme_residents_update_perm on meme_residents for update to authenticated
  using ((select has_permission('social.library')))
  with check ((select has_permission('social.library')));
create policy meme_residents_delete_perm on meme_residents for delete to authenticated
  using ((select has_permission('social.library')));

-- social_shares: only the meme branch of delete moves
drop policy if exists social_shares_delete_perm on social_shares;
create policy social_shares_delete_perm on social_shares for delete to authenticated
  using (
    case owner_type
      when 'attachment' then (select has_permission('photos.resident_manage'))
      when 'meme' then (select has_permission('social.library_manage'))
      when 'reel' then (select has_permission('social.library'))
      else false
    end
  );

-- the archive flag
create or replace function memes_archive_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.archived is distinct from old.archived
     and not coalesce((select has_permission('social.library_manage')), false) then
    raise exception 'Archiving or restoring a meme needs the permission to manage the social library' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function memes_archive_guard() from public, anon, authenticated;

drop trigger if exists memes_archive_guard on public.memes;
create trigger memes_archive_guard
  before update on public.memes
  for each row execute function memes_archive_guard();

do $report$
begin
  if not exists (select 1 from public.card_grants where card = 'meme_library' and activity = 'social.library_manage') then
    raise exception '0326 meme_library did not gain social.library_manage';
  end if;
  if exists (select 1 from public.card_grants where card in ('meme_add', 'meme_view') and activity = 'social.library_manage') then
    raise exception '0326 an add or view card grants social.library_manage, which it must never do';
  end if;
  if exists (select 1 from pg_policies where tablename in ('memes', 'meme_residents') and cmd = 'ALL') then
    raise exception '0326 a for-all policy is left on memes or meme_residents';
  end if;
end
$report$;

notify pgrst, 'reload schema';
