-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/management/translations/page.tsx, src/lib/i18n/dictionaries/en.ts
--
-- A CARD THAT READS THE THAI QUEUE AND CANNOT CHANGE IT: view_translations holds translations.view and nothing
-- else. Until now the only cards touching the screen bundled translations.manage (translations) or
-- translations.propose (propose_translations), so no login could be asked to check the queue without also being
-- able to write to it. translations.view already exists as an activity, so there is no activity to add here.
-- docs/decisions/2026-11-02-view-translations-card.md is the paper, and it settles how this card reaches the screen:
-- routes.ts now opens /management/translations on translations.view, which all three cards hold.
--
-- WHAT THIS FILE DOES NOT DO: give the card to any role (Settings then Who does what), touch Admin (outside the
-- card system), or change any function. Additive and re-runnable. String literals carry no semicolon or double dash.

insert into card_grants (card, activity, level)
values ('view_translations', 'translations.view', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'view_translations', cf.feature_id from card_features cf where cf.card = 'translations'
on conflict (card) do update set feature_id = excluded.feature_id;

do $report$
begin
  if not exists (select 1 from public.card_grants
                  where card = 'view_translations' and activity = 'translations.view') then
    raise exception '0298 the new card does not grant translations.view after this file ran';
  end if;
  if exists (select 1 from public.card_grants
              where card = 'view_translations' and activity <> 'translations.view') then
    raise exception '0298 the new card grants something besides translations.view, which it must never do';
  end if;
end
$report$;

notify pgrst, 'reload schema';
