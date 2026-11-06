-- consumer: src/lib/permissions/cards.ts, src/lib/i18n/dictionaries/en.ts, src/lib/i18n/dictionaries/th.ts, scripts/check-cards-count.mjs
--
-- THE BILL CARDS BECOME ONE (backlog #ywn5r; Lutan, 2026-11-05: "that to me would be a single card"). Filing a bill is one job: the
-- inbox asks "What type of bill is this?" and the type decides the form. 0305 split it into three cards only because each new table
-- needed its own activity; a card may grant several activities, so the split was never required.
--
-- The `bills` card now grants maintenance.bills, maintenance.jobs (read), bills.utilities and bills.general. `utility_bills` and
-- `general_bills` are retired. `bill_sites` stays apart: administering the places, accounts and kinds is a different job.
--
-- NOTHING IS TAKEN FROM ANYONE. Whoever holds a retired card is moved onto `bills` first, so a holder keeps the activity it had.
-- Every holder of `bills` gains bills.utilities and bills.general. Nothing is given to Admin. Additive, then delete; re-runnable.

create temp table pre_0327 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

insert into card_grants (card, activity, level)
values ('bills', 'bills.utilities', 2),
       ('bills', 'bills.general', 2)
on conflict (card, activity) do update set level = excluded.level;

-- Anyone holding a retired card now holds Bills, which covers it.
insert into role_cards (role_id, card)
select distinct role_id, 'bills' from role_cards where card in ('utility_bills', 'general_bills')
on conflict do nothing;

delete from role_cards where card in ('utility_bills', 'general_bills');
delete from card_grants where card in ('utility_bills', 'general_bills');
delete from card_includes where card in ('utility_bills', 'general_bills') or included_card in ('utility_bills', 'general_bills');
delete from card_features where card in ('utility_bills', 'general_bills');

notify pgrst, 'reload schema';

do $report$
declare
  r record;
  lost text;
begin
  if (select count(*) from public.card_grants where card = 'bills') <> 4 then
    raise exception '0327 the bills card does not grant exactly its four activities';
  end if;
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0327 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level >= p.level);
    if lost is not null then
      raise notice '0327 % | no longer: %', r.key, lost;
    end if;
  end loop;
end
$report$;
