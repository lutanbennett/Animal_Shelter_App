-- Fixed monthly outgoings (2026-09-29). Schema half only; the page that edits
-- them and the cashflow_forecast lines that read them are a separate PR.
--
--   fixed_outgoings   a short list of named monthly amounts in baht
--                     ("Salaries", "Rent", "Electricity", "Internet")
--
-- THIS IS NOT PAYROLL, AND IS BUILT SO IT CANNOT BECOME PAYROLL. Salaries is
-- one total line for the whole staff. There is deliberately no employee
-- record, no person foreign key, no pay rate, pay period, payslip or payment
-- history, and no column shaped to hold a name. Per-person pay is the most
-- sensitive data the app could hold, and the risk grows if it ever serves
-- several shelters (docs/decisions/2026-09-29-fixed-outgoings-not-payroll.md).
-- The row cap below is part of that: a table that refuses a 25th line cannot
-- be used as one row per employee, whatever a label says.
--
-- Amounts change from a date, not by history: starts_on / ends_on are the
-- first day of a month, either optional. "Rent rose from October" is the
-- old line ended in September and a new line starting in October. No history
-- table. Both are stored as a date on the 1st (checked) so the forecast can
-- compare whole months without pro-rating; a partial month is the forecast's
-- decision, not something the schema has to guess.
--
-- Access: admin and management, read and write. No anon, staff, vet or
-- volunteer. It is its own table and NOT columns on site_content, whose
-- `select using (true)` makes every column world-readable.
-- scripts/check-public-views.mjs asserts the anon refusal.
--
-- Written to be safely re-runnable.

create table if not exists fixed_outgoings (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  monthly_amount numeric(12,2) not null,
  note text,
  active boolean not null default true,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint fixed_outgoings_label_present check (length(btrim(label)) > 0),
  constraint fixed_outgoings_amount_not_negative check (monthly_amount >= 0),
  constraint fixed_outgoings_starts_first_of_month
    check (starts_on is null or extract(day from starts_on) = 1),
  constraint fixed_outgoings_ends_first_of_month
    check (ends_on is null or extract(day from ends_on) = 1),
  constraint fixed_outgoings_range_ordered
    check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

-- Two lines with the same label would double-count silently.
create unique index if not exists fixed_outgoings_label_key
  on fixed_outgoings (lower(btrim(label)));

comment on table fixed_outgoings is
  'Named fixed monthly outgoings for the cashflow forecast (Rent, Electricity, Salaries as ONE total line). Not payroll: nothing here identifies a person, and the table refuses more than 24 lines so it cannot hold one per employee. Admin and management only.';
comment on column fixed_outgoings.monthly_amount is
  'Baht per month, numeric(12,2), never negative. Show through formatBaht.';
comment on column fixed_outgoings.starts_on is
  'First day of the first month the amount applies; null = from the beginning. Always the 1st.';
comment on column fixed_outgoings.ends_on is
  'First day of the LAST month the amount applies (inclusive); null = open-ended. Always the 1st. A change of amount is one line ended and another started, not a history table.';

-- Row cap. Deliberately small; loosening it is a one-line migration.
create or replace function fixed_outgoings_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from fixed_outgoings) >= 24 then
    raise exception 'fixed_outgoings holds at most 24 lines: it is a short list of shelter costs, not a per-person pay register'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists fixed_outgoings_cap on fixed_outgoings;
create trigger fixed_outgoings_cap
  before insert on fixed_outgoings
  for each row execute function fixed_outgoings_cap();

drop trigger if exists fixed_outgoings_touch_updated_at on fixed_outgoings;
create trigger fixed_outgoings_touch_updated_at
  before insert or update on fixed_outgoings
  for each row execute function touch_updated_at();

alter table fixed_outgoings enable row level security;

drop policy if exists admin_all_fixed_outgoings on fixed_outgoings;
create policy admin_all_fixed_outgoings on fixed_outgoings
  for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
drop policy if exists management_all_fixed_outgoings on fixed_outgoings;
create policy management_all_fixed_outgoings on fixed_outgoings
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');

-- RLS already gives anon nothing (no policy names it); take the default
-- table grants away too.
revoke all on fixed_outgoings from anon;
-- Data API grant (check-migration-grants.mjs wants it in the creating file).
-- authenticated only reaches admin and management: those are the only policies.
grant select, insert, update, delete on fixed_outgoings to authenticated, service_role;
revoke execute on function fixed_outgoings_cap() from public, anon, authenticated;

notify pgrst, 'reload schema';
