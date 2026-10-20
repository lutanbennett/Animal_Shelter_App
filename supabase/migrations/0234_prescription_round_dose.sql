-- consumer: none
--
-- Schema half of "prescription schedule: three round ticks plus a notes field"
-- (docs/decisions/2026-10-20-prescription-round-dose-schema.md). Lutan, 2026-10-04: a prescription
-- can give a different amount per round (2 in the morning, 1 in the evening), so the amount belongs
-- on prescription_rounds. Lutan, 2026-10-20: three rounds stay, no fourth; the FREQUENCY stays the
-- count of doses a day, the ticks say which rounds, and the existing prescriptions.notes (shipped in #770) carries what
-- does not fit ("give final tablet at midnight"). No new note column is needed.
--
-- Purely additive. prescriptions.dose_quantity and frequency_id stay exactly as they are and every
-- current reader keeps working. Nothing here makes the tick count the source of doses_per_day: a
-- 4x-daily prescription with three ticks must still read 4.
--
--   prescription_rounds.dose_quantity   amount given in that round; back-filled from the prescription
--
-- Until the form writes per-round amounts, two triggers keep the new column in step with the old one.
-- Written to be safely re-runnable.

alter table prescription_rounds
  add column if not exists dose_quantity numeric(10, 3);

alter table prescription_rounds drop constraint if exists prescription_rounds_dose_quantity_positive;
alter table prescription_rounds add constraint prescription_rounds_dose_quantity_positive
  check (dose_quantity is null or dose_quantity > 0);

comment on column prescription_rounds.dose_quantity is
  'Amount given in this round, in the medication''s unit. Null = not stated (as prescriptions.dose_quantity). Copied from the prescription when the round is ticked without an amount. Does NOT define how many doses a day: that is frequency.doses_per_day, because a fourth dose may exist only in prescriptions.notes.';

-- Back-fill: every round takes its prescription's single amount. Only those with none yet.
update prescription_rounds pr
   set dose_quantity = p.dose_quantity
  from prescriptions p
 where p.id = pr.prescription_id
   and pr.dose_quantity is null
   and p.dose_quantity is not null;

-- A round ticked without an amount takes the prescription's.
create or replace function prescription_rounds_default_dose()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.dose_quantity is null then
    select p.dose_quantity into new.dose_quantity from prescriptions p where p.id = new.prescription_id;
  end if;
  return new;
end;
$$;

drop trigger if exists prescription_rounds_default_dose on prescription_rounds;
create trigger prescription_rounds_default_dose
  before insert on prescription_rounds
  for each row execute function prescription_rounds_default_dose();

-- While the form still has one amount box, editing it carries to rounds that still held the old
-- amount; a round a person has set differently is left alone.
create or replace function prescriptions_carry_dose()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update prescription_rounds
     set dose_quantity = new.dose_quantity
   where prescription_id = new.id
     and dose_quantity is not distinct from old.dose_quantity;
  return null;
end;
$$;

drop trigger if exists prescriptions_carry_dose on prescriptions;
create trigger prescriptions_carry_dose
  after update of dose_quantity on prescriptions
  for each row
  when (old.dose_quantity is distinct from new.dose_quantity)
  execute function prescriptions_carry_dose();

revoke all on function prescription_rounds_default_dose(), prescriptions_carry_dose() from public, anon;

notify pgrst, 'reload schema';
