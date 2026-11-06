-- consumer: src/lib/permissions/cards.ts, src/lib/i18n/dictionaries/en.ts, src/app/projects/page.tsx
--
-- THE WRITE SIDE OF PROJECTS GETS A CARD. projects.folders at edit was granted by no card at all, so New folder, Rename, Move
-- and Delete on /projects were drawn for Admin only, and nobody had chosen that (backlog #wdjt0; Lutan, 2026-11-06: "gets a card").
-- docs/decisions/2026-11-06-ungranted-activities-cards.md is the paper for this file.
--
-- WHAT THIS FILE DOES: one card, project_folders, holding projects.folders at edit (level 2) and nothing else, filed under
-- Maintenance and projects. The row equals src/lib/permissions/cards.ts cell for cell (scripts/check-card-grants.mjs fails when
-- they differ), and the card count in scripts/check-cards-count.mjs moves to fifty in the same change.
--
-- WHAT IT DOES NOT DO, deliberately:
--   - no new activity: projects.folders already exists in permission_activities (level kind).
--   - no policy or function change: the project_folders policies (0149) already ask has_permission('projects.folders').
--   - projects.photos and projects.publish are NOT on the card; they stay their own activities.
--   - no role is given the card. Who holds it is assigned in Settings, Who does what.
--   - nothing is granted to Admin, which sits outside the card system.
-- Additive and re-runnable.

insert into card_grants (card, activity, level)
values ('project_folders', 'projects.folders', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'project_folders', f.id from features f where f.key = 'maintenance_and_projects'
on conflict (card) do update set feature_id = excluded.feature_id;

do $report$
begin
  if not exists (select 1 from public.card_grants
                  where card = 'project_folders' and activity = 'projects.folders' and level = 2) then
    raise exception '0323 the new card does not grant projects.folders at edit after this file ran';
  end if;
  if exists (select 1 from public.card_grants
              where card = 'project_folders' and activity <> 'projects.folders') then
    raise exception '0323 the new card grants something besides projects.folders, which it must never do';
  end if;
  if not exists (select 1 from public.card_features where card = 'project_folders') then
    raise exception '0323 the new card is not filed under a feature, so it would read Not yet sorted';
  end if;
end
$report$;

notify pgrst, 'reload schema';
