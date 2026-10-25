-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/catalogue.ts, src/lib/permissions/who-does-what.ts, src/app/admin/page.tsx, src/app/management/page.tsx, src/app/admin/who-does-what/page.tsx, src/app/admin/who-does-what/details/page.tsx
--
-- Settings -> Who does what is opened by a card (docs/decisions/2026-10-25-who-does-what-by-card.md). Until now the code asked for a
-- role NAMED 'management' (who-does-what.ts), which grants an ability without a card. Lutan, 2026-10-24: "The only thing that can give
-- permissions to do something in the system has to be a card."
--   * A new yes/no activity, roles.view: see the roles grid on Who does what. Editing stays Admin at 2-step and is not this.
--   * The card who_does_what requires it (card_grants).
--   * Management is given the card in the same change, so it keeps the page it has today. Admin is not given it: Admin opens the
--     page by the isAdmin short-circuit, outside the card system.
-- DEPLOY ORDER: the app and this migration go out TOGETHER. The app alone drops Management from the page; this alone adds a card
-- that nothing asks for.
-- Re-runnable: on conflict / where not exists.

insert into permission_activities (key, kind, area, sort)
values ('roles.view', 'yesno', 'settings', 68)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('who_does_what', 'roles.view', 2)
on conflict (card, activity) do update set level = excluded.level;

-- The card goes to the Management role last in its list. The role_cards trigger recomputes that role's cells.
insert into role_cards (role_id, card, position)
select r.id, 'who_does_what', coalesce((select max(rc.position) from role_cards rc where rc.role_id = r.id), 0) + 1
  from roles r
 where r.key = 'management'
   and not exists (select 1 from role_cards x where x.role_id = r.id and x.card = 'who_does_what');
