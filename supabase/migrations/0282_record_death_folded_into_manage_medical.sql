-- consumer: src/lib/permissions/cards.ts
--
-- RETIRE "RECORD A DEATH" AND FOLD RECORDING A DEATH INTO MANAGE MEDICAL (Lutan, 2026-10-29: "B, fold it into the medical card").
-- SCHEMA HALF ONLY. The app half (cards.ts, the catalogue, the card walkthrough, the manual) is a separate change, so until it
-- lands check-card-grants.mjs reads red against this database. That is expected.
--
--   placement.death at edit (2) is granted by Manage medical (medical_records), the action card, as placement.hospital already is (0269).
--   The record_death card is DELETED, not left empty: a card that exists and grants nothing is forbidden ("no state in which a card does
--   nothing"). Deleting means its role_cards, grants, includes and feature link all go, the same shape as 0268's retirements.
--
-- The enclosure lookup the death form needs (facility.enclosures at read) still arrives: medical_records -> view_medical -> view_residents.
-- Nothing here names a role, nothing is given to Admin, and no role is given a card: whoever held record_death no longer does, and who
-- holds Manage medical is an assignment made in Settings -> Who does what. The triggers of 0257 recompute every role's
-- role_permissions from its cards. Re-runnable.

create temp table pre_0282 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

insert into card_grants (card, activity, level)
values ('medical_records', 'placement.death', 2)
on conflict (card, activity) do update set level = excluded.level;

delete from role_cards where card = 'record_death';
delete from card_grants where card = 'record_death';
delete from card_includes where card = 'record_death' or included_card = 'record_death';
delete from card_features where card = 'record_death';

notify pgrst, 'reload schema';

-- The record: what any role lost by this file (a holder of record_death only; no role gains anything).
do $report$
declare
  r record;
  lost text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0282 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if lost is not null then
      raise notice '0282 % | no longer: %', r.key, lost;
    end if;
  end loop;
end
$report$;
