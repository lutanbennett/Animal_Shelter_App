-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/management/diets/page.tsx, src/app/management/medications/page.tsx, src/app/management/cashflow/page.tsx
--
-- THREE VIEW-ONLY CARDS FROM CARD REVIEW 2 (Lutan, 2026-10-28; docs/decisions/2026-10-28-forecast-and-cashflow-view-cards.md).
-- His answers made most of the proposed cards Admin tasks (the medicine list, the diet list and stock usage), which sit outside the card
-- system and need no card. What survives is the three pages a person may LOOK at without changing anything:
--   food_forecast      stock.diets        at read (1)  opens /management/diets
--   medicine_forecast  stock.medications  at read (1)  opens /management/medications
--   view_cashflow      reports.cashflow   at read (1)  opens /management/cashflow
-- The three page guards ask read in the same change (requirePermission defaults to edit, so a read card would otherwise open nothing),
-- and every control on those pages is drawn only at edit, which is the level its own action asks.
--
-- AND ONE NARROWING, answered in his words ("Keep dashboard and cashflow separate"): reports.cashflow comes OFF the dashboard card, so
-- View cashflow is the only card that grants it. The grant was inert for a dashboard holder (the cashflow guard asked edit; the card gave
-- read), and no file under src/app/management/dashboard/ reads the activity, so no dashboard panel changes.
--
-- The grants and the cards.ts definitions change in this one change so they never disagree (check-card-grants.mjs). The triggers of 0257
-- recompute every role's role_permissions from its cards when card_grants changes. Nothing here names a role, nothing is given to
-- Admin, and no role is given a new card: who holds each card is an assignment made in Settings -> Who does what. Re-runnable.

create temp table pre_0280 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

insert into card_grants (card, activity, level)
values
  ('food_forecast', 'stock.diets', 1),
  ('medicine_forecast', 'stock.medications', 1),
  ('view_cashflow', 'reports.cashflow', 1)
on conflict (card, activity) do update set level = excluded.level;

delete from card_grants where card = 'dashboard' and activity = 'reports.cashflow';

insert into card_features (card, feature_id)
select m.card, f.id
  from (values
    ('food_forecast', 'stock_and_purchasing'),
    ('medicine_forecast', 'stock_and_purchasing'),
    ('view_cashflow', 'finances_and_reports')
  ) as m(card, feature)
  join features f on f.key = m.feature
on conflict (card) do nothing;

notify pgrst, 'reload schema';

-- The record: what any role gained or lost by this file (only the dashboard narrowing can change a role, since no role holds a new card).
do $report$
declare
  r record;
  lost text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0280 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if lost is not null then
      raise notice '0280 % | no longer: %', r.key, lost;
    end if;
  end loop;
end
$report$;
