-- consumer: src/lib/permissions/cards.ts, src/app/management/translations/page.tsx, src/app/management/translations/actions.ts, src/lib/translations/queries.ts
--
-- THE TRANSLATIONS CARD (Lutan, 2026-10-27: "Management will also do translations so a card is required for this").
-- translations.view and translations.manage were real activities that no card granted, so only Admin (outside the card system) could
-- triage translations. This adds the card and its grants in the SAME file, so there is never a card that does nothing:
-- private.works_with_translations() (0263) already opens translation_queue and translatable_fields to either activity.
--
-- NOT DONE HERE, ON PURPOSE: no role is given the card. Who holds it is an assignment made in Settings -> Who does what.
-- Nothing in this file names a role. Nothing is granted to Admin. No existing card's grants change. Re-runnable.

insert into card_grants (card, activity, level)
values
  ('translations', 'translations.view', 2),
  ('translations', 'translations.manage', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'translations', f.id from features f where f.key = 'website_public_pages'
on conflict (card) do nothing;
