-- consumer: src/lib/medication-list/load.ts
--
-- The rounds a PRESCRIPTION is given in (decisions/2026-10-04-medication-rounds.md). Lutan's
-- whiteboard for adding a prescription is: medicine, "2 tablets", then Morning / Lunch / Evening
-- tick boxes, start date, end date. The person ticks the rounds; there is no frequency field. So
-- the rounds a dose goes out in belong to the prescription row, and 0137's frequency_rounds becomes
-- what it was always good for: the DEFAULT ticks when a frequency is chosen (and for every
-- prescription that already existed).
--
--   prescription_rounds        the truth the pick list and the medication list read
--   prescription_round_status  the same ok / none / mismatch check as 0137, per current prescription
--
-- A prescription with no frequency (as needed) owes no rounds. One with a frequency owes what the
-- frequency says (doses_per_day, or 1 for an interval): ticking two rounds on a "Once daily"
-- prescription reads mismatch until the form sets the frequency to match, which is the feature's
-- job and is flagged here rather than silently trusted.
--
-- Written to be safely re-runnable. To undo: drop the view, the two triggers and the table.

create table if not exists prescription_rounds (
  prescription_id uuid not null references prescriptions (id) on delete cascade,
  round_id uuid not null references rounds (id),
  primary key (prescription_id, round_id)
);
create index if not exists prescription_rounds_round_id_idx on prescription_rounds (round_id);

comment on table prescription_rounds is
  'The rounds this prescription''s dose is given in: the ticked Morning / Lunch / Evening boxes. Defaulted from frequency_rounds when the prescription is created or its frequency changes; a form that lets a person tick writes them after the row and its choice stands. A current prescription that owes rounds and has none is flagged by prescription_round_status.';

drop trigger if exists prescription_rounds_applies on prescription_rounds;
create trigger prescription_rounds_applies
  before insert or update on prescription_rounds
  for each row execute function check_round_applies('medication');

-- Defaults ------------------------------------------------------------------
create or replace function reset_prescription_rounds(p_prescription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from prescription_rounds where prescription_id = p_prescription_id;
  insert into prescription_rounds (prescription_id, round_id)
  select p.id, fr.round_id
    from prescriptions p
    join frequency_rounds fr on fr.frequency_id = p.frequency_id
   where p.id = p_prescription_id;
end;
$$;

revoke all on function reset_prescription_rounds(uuid) from public, anon;
grant execute on function reset_prescription_rounds(uuid) to authenticated, service_role;

create or replace function prescription_rounds_default_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform reset_prescription_rounds(new.id);
  return null;
end;
$$;

drop trigger if exists prescriptions_default_rounds on prescriptions;
create trigger prescriptions_default_rounds
  after insert on prescriptions
  for each row execute function prescription_rounds_default_trigger();

drop trigger if exists prescriptions_default_rounds_on_change on prescriptions;
create trigger prescriptions_default_rounds_on_change
  after update of frequency_id on prescriptions
  for each row
  when (old.frequency_id is distinct from new.frequency_id)
  execute function prescription_rounds_default_trigger();

-- Back-fill: every existing prescription takes its frequency's rounds. Only those with none yet,
-- so a re-run never undoes a person's tick.
insert into prescription_rounds (prescription_id, round_id)
select p.id, fr.round_id
  from prescriptions p
  join frequency_rounds fr on fr.frequency_id = p.frequency_id
 where not exists (select 1 from prescription_rounds pr where pr.prescription_id = p.id)
on conflict do nothing;

-- Access ----------------------------------------------------------------------
-- Visible exactly when the prescription is, under the prescription's own policies (the Head of
-- Medical's cell, a vet's own clinic, staff...). Written by those who write prescriptions.
alter table prescription_rounds enable row level security;

drop policy if exists prescription_rounds_read on prescription_rounds;
create policy prescription_rounds_read on prescription_rounds for select to authenticated
  using (exists (select 1 from prescriptions p where p.id = prescription_id));

drop policy if exists prescription_rounds_write on prescription_rounds;
create policy prescription_rounds_write on prescription_rounds for all to authenticated
  using (
    current_user_role() in ('admin', 'management', 'staff', 'vet')
    and exists (select 1 from prescriptions p where p.id = prescription_id)
  )
  with check (
    current_user_role() in ('admin', 'management', 'staff', 'vet')
    and exists (select 1 from prescriptions p where p.id = prescription_id)
  );

-- The check that nothing is silently invisible ----------------------------------
create or replace view prescription_round_status
with (security_invoker = true) as
select p.id as prescription_id,
       p.resident_id,
       o.owed as rounds_owed,
       count(pr.round_id)::integer as round_count,
       case
         when count(pr.round_id) = o.owed then 'ok'
         when count(pr.round_id) = 0 then 'none'
         else 'mismatch'
       end as status
  from prescriptions p
  left join frequency f on f.id = p.frequency_id
  cross join lateral (
    select case when f.doses_per_day is not null then f.doses_per_day
                when f.interval_count is not null then 1
                else 0 end as owed
  ) o
  left join prescription_rounds pr on pr.prescription_id = p.id
 where p.end_date is null or p.end_date >= current_date
 group by p.id, p.resident_id, o.owed;

comment on view prescription_round_status is
  'One row per current prescription: rounds owed by its frequency (doses_per_day, 1 for an interval, 0 for as needed or none), rounds ticked, and ok / none / mismatch. A screen shows none and mismatch as "no round set" rather than dropping the dose.';

revoke all on prescription_rounds, prescription_round_status from anon;
grant select, insert, update, delete on prescription_rounds to authenticated, service_role;
grant select on prescription_round_status to authenticated, service_role;

notify pgrst, 'reload schema';
