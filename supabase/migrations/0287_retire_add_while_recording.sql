-- consumer: src/lib/permissions/cards.ts, src/lib/permissions/fixed-for-now.ts, scripts/check-cards-count.mjs
--
-- RETIRE THE add_while_recording CARD (Lutan, 2026-10-30: "Missing medication added by admin only as part of system configuration").
-- The card granted reference.add_while_recording at edit (2), an insert right no screen ever drew a control for, so it was a card that does
-- nothing, which the card rule forbids. Deleted outright, the same shape as 0282: its role_cards, grants, includes and feature link all go.
--
-- THE ACTIVITY STAYS. reference.add_while_recording is still named by the medication, frequency and procedure_types policies (0148/0151) and
-- by the permission harness probes; retiring it means rewriting those and is a separate change. With no card granting it, it is inert.
-- Nothing names a role and nothing is given to Admin. The triggers of 0257 recompute every role's role_permissions from its cards. Re-runnable.

create temp table pre_0287 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

delete from role_cards where card = 'add_while_recording';
delete from card_grants where card = 'add_while_recording';
delete from card_includes where card = 'add_while_recording' or included_card = 'add_while_recording';
delete from card_features where card = 'add_while_recording';

notify pgrst, 'reload schema';

-- The record: what any role lost by this file.
do $report$
declare
  r record;
  lost text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0287 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if lost is not null then
      raise notice '0287 % | no longer: %', r.key, lost;
    end if;
  end loop;
end
$report$;
