-- consumer: src/lib/medication-list/load.ts, src/lib/rounds/suggest.ts
--
-- Rounds: the part of the day a dose or a meal belongs to (decisions/2026-10-04-medication-rounds.md).
-- Lutan, 2026-10-04: medication goes out in three rounds (Morning, Lunch, Evening), food in two
-- (Morning, Evening), and "twice a day" means a morning and an evening dose. `frequency` held a
-- count per day and no clock (roles paper §14); this adds the clock without touching the count.
--
--   rounds                   the vocabulary: three rows, flagged for medication and/or food.
--                            A lookup table, not an enum: an enum value cannot be added and used
--                            in one transaction (two files, decisions.md PR #50), and a fourth
--                            round later is then one insert and no migration pair.
--   frequency_rounds         which rounds a FREQUENCY gives its doses in. Per frequency row, not
--                            derived from doses_per_day at read time: "once daily" is genuinely
--                            ambiguous (morning or evening?) and Management edits the list.
--   resident_diet_rounds     which rounds a DIET gives its meals in. A separate table from the
--                            medication one because its subject, its rows and its policies differ
--                            (a diet is one resident's; a frequency is shared vocabulary).
--   frequency_round_status   the check that nothing is silently invisible: one row per frequency
--   resident_diet_round_status   and per current diet, saying ok / none / mismatch.
--
-- DEFAULTS, not derivation. Every frequency and every diet row gets a starting set of rounds:
--   per day  1 -> morning   2 -> morning + evening   3 or more -> morning + lunch + evening
--   interval (weekly, every other day, monthly...) -> morning, the round its one dose goes in
--   as needed -> none, on purpose: it is never scheduled
--   diet     1 meal -> morning   2 or more -> morning + evening
-- The defaults are written once per row (the back-fill below, and a trigger on insert and on a
-- change of schedule) and are an ordinary editable row from then on. A frequency that ends up with
-- the wrong number of rounds, or none where one is owed, shows in the status views; a screen
-- must show those doses under "no round set" and never drop them.
--
-- Whatever the clock suggests is the app's business (src/lib/rounds/suggest.ts, Asia/Bangkok);
-- the database stores no clock time on purpose, so there is nothing here to be wrong by seven
-- hours. The round is always the user's explicit choice; the clock only pre-selects.
--
-- Written to be safely re-runnable. To undo: drop the two views, the four triggers, the two join
-- tables and `rounds`, and the functions named below.

-- ---------------------------------------------------------------------------
-- 1. The vocabulary
-- ---------------------------------------------------------------------------
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  name_th text not null,
  sort_order integer not null unique,
  for_medication boolean not null default true,
  for_food boolean not null default false,
  constraint rounds_key_format check (key ~ '^[a-z][a-z_]*$'),
  constraint rounds_used check (for_medication or for_food)
);

comment on table rounds is
  'The parts of the day a dose or meal belongs to. Fixed vocabulary: morning, lunch, evening. for_medication / for_food say which of the two uses it. Holds no clock time; the app suggests a round from the Asia/Bangkok clock and the user chooses.';

insert into rounds (key, name, name_th, sort_order, for_medication, for_food) values
  ('morning', 'Morning', 'เช้า',     1, true, true),
  ('lunch',   'Lunch',   'กลางวัน',  2, true, false),
  ('evening', 'Evening', 'เย็น',     3, true, true)
on conflict (key) do nothing;

alter table rounds enable row level security;
drop policy if exists rounds_read on rounds;
create policy rounds_read on rounds for select to authenticated using (true);
drop policy if exists admin_all_rounds on rounds;
create policy admin_all_rounds on rounds for all to authenticated
  using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 2. The two mappings
-- ---------------------------------------------------------------------------
create table if not exists frequency_rounds (
  frequency_id uuid not null references frequency (id) on delete cascade,
  round_id uuid not null references rounds (id),
  primary key (frequency_id, round_id)
);
create index if not exists frequency_rounds_round_id_idx on frequency_rounds (round_id);

create table if not exists resident_diet_rounds (
  resident_diet_id uuid not null references resident_diets (id) on delete cascade,
  round_id uuid not null references rounds (id),
  primary key (resident_diet_id, round_id)
);
create index if not exists resident_diet_rounds_round_id_idx on resident_diet_rounds (round_id);

comment on table frequency_rounds is
  'The rounds a frequency gives its doses in. One row per round. Seeded from the frequency by default_frequency_round_keys() and editable by Management. A non-"as needed" frequency with none is flagged by frequency_round_status.';
comment on table resident_diet_rounds is
  'The rounds a diet gives its meals in (food has no lunch round). Seeded from meals_per_day by default_diet_round_keys(). A current diet with none is flagged by resident_diet_round_status.';

-- A round must be one the subject uses: no lunch for food, nothing unflagged for medication.
create or replace function check_round_applies()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select case TG_ARGV[0] when 'food' then for_food else for_medication end
    into v_ok from rounds where id = new.round_id;
  if not coalesce(v_ok, false) then
    raise exception 'That round is not used for %.', TG_ARGV[0];
  end if;
  return new;
end;
$$;

drop trigger if exists frequency_rounds_applies on frequency_rounds;
create trigger frequency_rounds_applies
  before insert or update on frequency_rounds
  for each row execute function check_round_applies('medication');

drop trigger if exists resident_diet_rounds_applies on resident_diet_rounds;
create trigger resident_diet_rounds_applies
  before insert or update on resident_diet_rounds
  for each row execute function check_round_applies('food');

-- ---------------------------------------------------------------------------
-- 3. Defaults
-- ---------------------------------------------------------------------------
create or replace function default_frequency_round_keys(
  p_doses_per_day integer, p_interval_count integer
)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case
    when p_doses_per_day is not null and p_doses_per_day >= 3 then array['morning', 'lunch', 'evening']
    when p_doses_per_day = 2 then array['morning', 'evening']
    when p_doses_per_day = 1 then array['morning']
    when p_interval_count is not null then array['morning']
    else array[]::text[]
  end;
$$;

create or replace function default_diet_round_keys(p_meals_per_day integer)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case when p_meals_per_day >= 2 then array['morning', 'evening'] else array['morning'] end;
$$;

revoke all on function default_frequency_round_keys(integer, integer), default_diet_round_keys(integer) from public, anon;
grant execute on function default_frequency_round_keys(integer, integer), default_diet_round_keys(integer) to authenticated, service_role;

-- Replace a frequency's rounds with the defaults. SECURITY DEFINER so that an inline add by staff
-- or a vet (0027) is not left roundless for lack of a write policy; it writes only default rows.
create or replace function reset_frequency_rounds(p_frequency_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from frequency_rounds where frequency_id = p_frequency_id;
  insert into frequency_rounds (frequency_id, round_id)
  select f.id, r.id
    from frequency f
    join rounds r on r.key = any (default_frequency_round_keys(f.doses_per_day, f.interval_count))
   where f.id = p_frequency_id;
end;
$$;

create or replace function reset_diet_rounds(p_diet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from resident_diet_rounds where resident_diet_id = p_diet_id;
  insert into resident_diet_rounds (resident_diet_id, round_id)
  select d.id, r.id
    from resident_diets d
    join rounds r on r.key = any (default_diet_round_keys(d.meals_per_day))
   where d.id = p_diet_id;
end;
$$;

revoke all on function reset_frequency_rounds(uuid), reset_diet_rounds(uuid) from public, anon;
grant execute on function reset_frequency_rounds(uuid), reset_diet_rounds(uuid) to authenticated, service_role;

create or replace function frequency_rounds_default_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform reset_frequency_rounds(new.id);
  return null;
end;
$$;

create or replace function diet_rounds_default_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform reset_diet_rounds(new.id);
  return null;
end;
$$;

-- A new row gets defaults; a changed schedule re-defaults, so the mapping cannot be left saying
-- "twice a day" for a frequency that is now once. A screen that lets a person pick rounds writes
-- them after the row, in the same action, and its choice stands.
drop trigger if exists frequency_default_rounds on frequency;
create trigger frequency_default_rounds
  after insert on frequency
  for each row execute function frequency_rounds_default_trigger();

drop trigger if exists frequency_default_rounds_on_change on frequency;
create trigger frequency_default_rounds_on_change
  after update of doses_per_day, interval_count, interval_unit on frequency
  for each row
  when (old.doses_per_day is distinct from new.doses_per_day
        or old.interval_count is distinct from new.interval_count)
  execute function frequency_rounds_default_trigger();

drop trigger if exists resident_diets_default_rounds on resident_diets;
create trigger resident_diets_default_rounds
  after insert on resident_diets
  for each row execute function diet_rounds_default_trigger();

drop trigger if exists resident_diets_default_rounds_on_change on resident_diets;
create trigger resident_diets_default_rounds_on_change
  after update of meals_per_day on resident_diets
  for each row
  when (old.meals_per_day is distinct from new.meals_per_day)
  execute function diet_rounds_default_trigger();

-- ---------------------------------------------------------------------------
-- 4. Back-fill: every existing row lands in a sensible round
-- ---------------------------------------------------------------------------
-- Only rows with no mapping yet, so a re-run never undoes a person's edit.
insert into frequency_rounds (frequency_id, round_id)
select f.id, r.id
  from frequency f
  join rounds r on r.key = any (default_frequency_round_keys(f.doses_per_day, f.interval_count))
 where not exists (select 1 from frequency_rounds fr where fr.frequency_id = f.id)
on conflict do nothing;

insert into resident_diet_rounds (resident_diet_id, round_id)
select d.id, r.id
  from resident_diets d
  join rounds r on r.key = any (default_diet_round_keys(d.meals_per_day))
 where not exists (select 1 from resident_diet_rounds dr where dr.resident_diet_id = d.id)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Access
-- ---------------------------------------------------------------------------
-- frequency_rounds follows frequency: whoever reads the frequency reads its rounds (nothing
-- sensitive in it), Management edits it as it edits the frequency list (0043).
alter table frequency_rounds enable row level security;

drop policy if exists frequency_rounds_read on frequency_rounds;
create policy frequency_rounds_read on frequency_rounds for select to authenticated
  using (
    current_user_role() in ('admin', 'management', 'staff', 'vet')
    or ((select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical()))
  );

drop policy if exists management_rw_frequency_rounds on frequency_rounds;
create policy management_rw_frequency_rounds on frequency_rounds for all to authenticated
  using (current_user_role() in ('admin', 'management'))
  with check (current_user_role() in ('admin', 'management'));

-- resident_diet_rounds follows the diet it belongs to: visible exactly when the diet row is, under
-- the diet's own policies (a vet still reads only their own clinic's residents).
alter table resident_diet_rounds enable row level security;

drop policy if exists resident_diet_rounds_read on resident_diet_rounds;
create policy resident_diet_rounds_read on resident_diet_rounds for select to authenticated
  using (exists (select 1 from resident_diets d where d.id = resident_diet_id));

drop policy if exists resident_diet_rounds_write on resident_diet_rounds;
create policy resident_diet_rounds_write on resident_diet_rounds for all to authenticated
  using (
    current_user_role() in ('admin', 'management', 'staff', 'vet')
    and exists (select 1 from resident_diets d where d.id = resident_diet_id)
  )
  with check (
    current_user_role() in ('admin', 'management', 'staff', 'vet')
    and exists (select 1 from resident_diets d where d.id = resident_diet_id)
  );

-- ---------------------------------------------------------------------------
-- 6. The check that nothing is silently invisible
-- ---------------------------------------------------------------------------
-- status:  ok        the number of rounds matches what the schedule owes
--          none      the schedule owes rounds and has none  -> its doses appear in no round
--          mismatch  some rounds, but not the number owed   -> too few or too many doses shown
-- owed: per day = doses_per_day, interval = 1, as needed = 0.
create or replace view frequency_round_status
with (security_invoker = true) as
select f.id as frequency_id,
       f.label,
       case when f.doses_per_day is not null then f.doses_per_day
            when f.interval_count is not null then 1
            else 0 end as rounds_owed,
       count(fr.round_id)::integer as round_count,
       case
         when count(fr.round_id) = case when f.doses_per_day is not null then f.doses_per_day
                                        when f.interval_count is not null then 1
                                        else 0 end then 'ok'
         when count(fr.round_id) = 0 then 'none'
         else 'mismatch'
       end as status
  from frequency f
  left join frequency_rounds fr on fr.frequency_id = f.id
 group by f.id, f.label, f.doses_per_day, f.interval_count;

create or replace view resident_diet_round_status
with (security_invoker = true) as
select d.id as resident_diet_id,
       d.resident_id,
       d.meals_per_day as rounds_owed,
       count(dr.round_id)::integer as round_count,
       case
         when count(dr.round_id) = d.meals_per_day then 'ok'
         when count(dr.round_id) = 0 then 'none'
         else 'mismatch'
       end as status
  from resident_diets d
  left join resident_diet_rounds dr on dr.resident_diet_id = d.id
 where d.end_date is null or d.end_date >= current_date
 group by d.id, d.resident_id, d.meals_per_day;

comment on view frequency_round_status is
  'One row per frequency: how many rounds it owes (doses_per_day, 1 for an interval, 0 for as needed), how many it has, and ok / none / mismatch. A screen shows none and mismatch rows as "no round set", never drops them.';
comment on view resident_diet_round_status is
  'The same check for each current diet against meals_per_day. Food has only two rounds, so a diet of three or more meals reads mismatch until it is edited.';

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------
revoke all on rounds, frequency_rounds, resident_diet_rounds,
              frequency_round_status, resident_diet_round_status from anon;
grant select, insert, update, delete on rounds, frequency_rounds, resident_diet_rounds to authenticated, service_role;
grant select on frequency_round_status, resident_diet_round_status to authenticated, service_role;

notify pgrst, 'reload schema';
